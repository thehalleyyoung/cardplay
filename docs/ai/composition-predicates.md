# Compositional Pattern Predicates Reference

This document provides a comprehensive reference for all Prolog predicates in the composition patterns knowledge base (`composition-patterns.pl`).

## Overview

The composition patterns knowledge base provides rule-based reasoning about:
- **Genres**: Music genre characteristics, tempo ranges, and instrumentation
- **Arrangements**: Section types, ordering, and templates
- **Patterns**: Drum and bass patterns for different genres
- **Techniques**: Variation and development techniques
- **Humanization**: Swing, timing, and velocity variations

## Genre Definitions (L132)

### `genre/1`

Declares available music genres.

```prolog
genre(GenreId).
```

**Available Genres:**
| Genre | Description |
|-------|-------------|
| `lofi` | Lo-fi hip hop, chill beats |
| `house` | House music, four-on-floor |
| `techno` | Techno, driving electronic |
| `ambient` | Ambient, atmospheric |
| `jazz` | Jazz, swing, complex harmony |
| `classical` | Classical, orchestral |
| `rock` | Rock, guitar-driven |
| `pop` | Pop, verse-chorus |
| `hiphop` | Hip-hop, boom-bap |
| `trap` | Trap, 808s and hi-hats |
| `funk` | Funk, syncopated grooves |
| `cinematic` | Film scores, epic |
| `celtic` | Celtic dance tunes, modal, ornamented |
| `chinese` | Chinese pentatonic/modal, heterophony |
| `galant` | 18th-century galant style, schemata-driven phrases |
| ... | And more |

## Genre Characteristics (L133-L137)

### `genre_characteristic/2`

Musical characteristics of each genre.

```prolog
genre_characteristic(Genre, Characteristic).
```

**Examples:**
```prolog
genre_characteristic(lofi, relaxed).
genre_characteristic(lofi, nostalgic).
genre_characteristic(house, danceable).
genre_characteristic(house, four_on_floor).
genre_characteristic(jazz, improvisational).
genre_characteristic(jazz, complex_harmony).
```

### `genre_tempo_range/3`

Tempo range for each genre.

```prolog
genre_tempo_range(Genre, MinBPM, MaxBPM).
```

**Examples:**
| Genre | Min BPM | Max BPM |
|-------|---------|---------|
| `lofi` | 60 | 90 |
| `house` | 118 | 130 |
| `techno` | 125 | 150 |
| `ambient` | 40 | 100 |
| `jazz` | 80 | 200 |
| `drum_and_bass` | 160 | 180 |
| `trap` | 130 | 170 |

### `genre_typical_instruments/2`

Instruments commonly used in each genre.

```prolog
genre_typical_instruments(Genre, InstrumentList).
```

**Examples:**
```prolog
genre_typical_instruments(lofi, [piano, rhodes, vinyl_crackle, drums, bass, pad]).
genre_typical_instruments(house, [kick, hihat, clap, bass, synth_stab, pad, vocal_chop]).
genre_typical_instruments(jazz, [piano, upright_bass, drums, saxophone, trumpet, guitar]).
```

### `genre_harmonic_language/2`

Harmonic style for each genre.

```prolog
genre_harmonic_language(Genre, HarmonyStyle).
```

**Harmony Styles:**
- `extended_chords` - 7ths, 9ths, 11ths, 13ths
- `jazz_voicings` - Open voicings, extensions
- `simple_triads` - Basic major/minor triads
- `power_chords` - Root and fifth only
- `modal` - Mode-based harmony
- `functional_harmony` - Traditional I-IV-V
- `ii_v_i` - Jazz progressions

### `genre_rhythmic_feel/2`

Rhythmic characteristics of each genre.

```prolog
genre_rhythmic_feel(Genre, RhythmType).
```

**Rhythm Types:**
- `four_on_floor` - Kick on every beat
- `swing` - Triplet feel
- `syncopated` - Off-beat emphasis
- `boom_bap` - Classic hip-hop feel
- `triplet_hihat` - Trap-style hi-hats
- `half_time` - Half-time feel

## Phrase and Section Structure (L138-L141)

### `phrase_length/2`

Typical phrase lengths in bars for each genre.

```prolog
phrase_length(Genre, Bars).
```

**Examples:**
```prolog
phrase_length(house, 4).
phrase_length(house, 8).
phrase_length(house, 16).
phrase_length(jazz, 4).
phrase_length(jazz, 8).
phrase_length(jazz, 12).   % For blues form
```

### `section_type/1`

All available section types.

```prolog
section_type(SectionType).
```

**Section Types:**
| Section | Description |
|---------|-------------|
| `intro` | Opening section |
| `verse` | Main lyrical/melodic section |
| `pre_chorus` | Build to chorus |
| `chorus` | Main hook section |
| `bridge` | Contrasting section |
| `outro` | Closing section |
| `drop` | Electronic music climax |
| `buildup` | Tension before drop |
| `breakdown` | Sparse, stripped-down |
| `solo` | Instrumental solo |
| `interlude` | Transitional section |

### `section_energy/2`

Energy level for each section type (1-10).

```prolog
section_energy(SectionType, EnergyLevel).
```

**Examples:**
```prolog
section_energy(intro, 3).
section_energy(verse, 5).
section_energy(chorus, 8).
section_energy(drop, 10).
section_energy(breakdown, 4).
```

### `section_order/2`

Typical section orderings for each genre.

```prolog
section_order(Genre, SectionList).
```

**Examples:**
```prolog
section_order(pop, [intro, verse, chorus, verse, chorus, bridge, chorus, outro]).
section_order(house, [intro, buildup, drop, breakdown, buildup, drop, outro]).
section_order(jazz, [intro, head, solo, solo, head, outro]).
```

### `valid_section_transition/2`

Valid transitions between sections.

```prolog
valid_section_transition(FromSection, ToSection).
```

**Examples:**
```prolog
valid_section_transition(intro, verse).
valid_section_transition(verse, chorus).
valid_section_transition(buildup, drop).
valid_section_transition(drop, breakdown).
```

### `arrangement_template/3`

Complete arrangement templates.

```prolog
arrangement_template(Genre, DurationBars, SectionList).
```

**Examples:**
```prolog
arrangement_template(pop, 64, [intro, verse, chorus, verse, chorus, bridge, chorus, outro]).
arrangement_template(house, 128, [intro, buildup, drop, breakdown, buildup, drop, breakdown, outro]).
```

## Energy and Density (L142-L144)

### `energy_curve/2`

Typical energy progression through sections.

```prolog
energy_curve(Genre, EnergyList).
```

**Examples:**
```prolog
energy_curve(pop, [3, 5, 8, 5, 8, 5, 9, 3]).
energy_curve(house, [2, 6, 10, 4, 8, 10, 4, 2]).
```

### `density_rule/3`

Instrument density by section.

```prolog
density_rule(SectionType, DensityLevel, InstrumentCount).
```

**Density Levels:** `sparse`, `medium`, `dense`

**Examples:**
```prolog
density_rule(intro, sparse, 2).
density_rule(verse, medium, 4).
density_rule(chorus, dense, 8).
density_rule(breakdown, sparse, 2).
```

### `layer_add_rule/3` and `layer_remove_rule/3`

When to add/remove layers.

```prolog
layer_add_rule(SectionType, InstrumentType, Beat).
layer_remove_rule(SectionType, InstrumentType, Beat).
```

## Contrast and Repetition (L145-L146)

### `contrast_rule/2`

Changes needed between sections.

```prolog
contrast_rule(TransitionType, ChangeList).
```

**Examples:**
```prolog
contrast_rule(verse_to_chorus, [add_harmony, increase_density, raise_energy]).
contrast_rule(buildup_to_drop, [add_bass, add_drums, maximum_energy]).
```

### `repetition_rule/2`

Acceptable repetition amounts.

```prolog
repetition_rule(RuleType, Value).
```

**Examples:**
```prolog
repetition_rule(max_identical_bars, 4).
repetition_rule(max_identical_sections, 2).
repetition_rule(variation_required_after, 8).
```

### `genre_repetition_tolerance/2`

How much repetition each genre allows.

```prolog
genre_repetition_tolerance(Genre, Level).
```

**Levels:** `low`, `medium`, `high`

```prolog
genre_repetition_tolerance(house, high).    % Loops are expected
genre_repetition_tolerance(jazz, low).      % Improvisation expected
genre_repetition_tolerance(pop, medium).
```

## Variation Techniques (L147)

### `variation_technique/2`

Available variation techniques.

```prolog
variation_technique(TechniqueId, Description).
```

**Techniques:**
| ID | Description |
|----|-------------|
| `sequence` | Repeat pattern at different pitch level |
| `inversion` | Flip interval directions |
| `retrograde` | Play melody backwards |
| `augmentation` | Double note durations |
| `diminution` | Halve note durations |
| `fragmentation` | Use only part of the motif |
| `ornamentation` | Add decorative notes |
| `harmonic_variation` | Change underlying harmony |
| `timbral_variation` | Change instrument or sound |

### `applicable_variation/2`

Which variations work for which genres.

```prolog
applicable_variation(Genre, TechniqueId).
```

**Examples:**
```prolog
applicable_variation(classical, sequence).
applicable_variation(classical, inversion).
applicable_variation(jazz, harmonic_variation).
applicable_variation(jazz, ornamentation).
```

## Bass Patterns (L148)

### `bass_pattern/2`

Common bass patterns by genre.

```prolog
bass_pattern(Genre, PatternId).
```

**Examples:**
```prolog
bass_pattern(house, root_octave).
bass_pattern(jazz, walking_bass).
bass_pattern(funk, syncopated_slap).
bass_pattern(trap, eight08_slides).
```

### `bass_pattern_steps/2`

Pattern definitions in scale degrees.

```prolog
bass_pattern_steps(PatternId, StepList).
```

**Examples:**
```prolog
bass_pattern_steps(root_octave, [1, 1, 1, 8]).
bass_pattern_steps(root_fifth, [1, 5, 1, 5]).
bass_pattern_steps(walking_bass, [1, 3, 5, 6]).
bass_pattern_steps(offbeat, [rest, 1, rest, 1]).
```

## Drum Patterns (L149)

### `drum_pattern/2`

Common drum patterns by genre.

```prolog
drum_pattern(Genre, PatternId).
```

**Examples:**
```prolog
drum_pattern(house, four_on_floor).
drum_pattern(lofi, boom_bap).
drum_pattern(jazz, swing_ride).
drum_pattern(funk, funky_drummer).
```

### `drum_pattern_hits/2`

Pattern definitions as hit positions.

```prolog
drum_pattern_hits(PatternId, [KickHits, SnareHits, HihatHits]).
```

**Format:** Lists of 16th note positions (1-16 in 4/4)

**Examples:**
```prolog
drum_pattern_hits(four_on_floor, [[1,5,9,13], [5,13], [1,3,5,7,9,11,13,15]]).
drum_pattern_hits(boom_bap, [[1,11], [5,13], [1,5,9,13]]).
```

## Harmonic Rhythm (L150, L153)

### `chord_rhythm/2`

Chord change rate per bar.

```prolog
chord_rhythm(Genre, ChangesPerBar).
```

**Examples:**
```prolog
chord_rhythm(house, 0.5).      % Change every 2 bars
chord_rhythm(jazz, 2).         % 2 changes per bar
chord_rhythm(pop, 1).          % 1 change per bar
```

### `harmony_rhythm/2`

Harmonic rhythm patterns.

```prolog
harmony_rhythm(PatternId, BeatList).
```

## Melodic Range (L151)

### `melodic_range/3`

Appropriate ranges for instruments (MIDI note numbers).

```prolog
melodic_range(Instrument, LowNote, HighNote).
```

**Examples:**
```prolog
melodic_range(violin, 55, 96).
melodic_range(piano, 21, 108).
melodic_range(bass_guitar, 28, 55).
melodic_range(synth_lead, 48, 84).
```

## Counterpoint (L152)

### `counterpoint_rule/2`

Rules for independent melodic lines.

```prolog
counterpoint_rule(RuleId, Value).
```

**Rules:**
- `avoid_parallel_fifths` - true
- `avoid_parallel_octaves` - true
- `prefer_contrary_motion` - true
- `max_leap_interval` - 8 (octave)
- `resolve_dissonance` - stepwise

## Advanced Composition (L166-L173)

### `motif_development/2`

Rules for developing musical motifs.

```prolog
motif_development(TechniqueId, Description).
```

### `texture_transition/3`

Rules for smooth texture changes.

```prolog
texture_transition(FromTexture, ToTexture, Technique).
```

### `dynamic_contour/2`

Typical dynamic shapes.

```prolog
dynamic_contour(ContourId, DynamicList).
```

### `articulation_pattern/2`

Articulation choices by genre.

```prolog
articulation_pattern(Genre, ArticulationList).
```

### `swing_feel/2`

Swing amount by genre (0.0 = straight, 0.67 = triplet).

```prolog
swing_feel(Genre, Amount).
```

**Examples:**
```prolog
swing_feel(jazz, 0.67).
swing_feel(lofi, 0.5).
swing_feel(rock, 0.0).
```

### `humanization_rule/3`

Timing and velocity variation rules.

```prolog
humanization_rule(ParamType, Genre, Amount).
```

**Examples:**
```prolog
humanization_rule(timing, lofi, 20).      % 20ms variation
humanization_rule(velocity, jazz, 25).    % 25 velocity units
humanization_rule(timing, electronic, 0). % No variation
```

### `transition_technique/2`

Techniques for section transitions.

```prolog
transition_technique(TechniqueId, Description).
```

**Techniques:**
- `riser` - Pitch/filter sweep up
- `drop` - Silence before impact
- `fill` - Drum fill
- `snare_roll` - Increasing snare density
- `filter_sweep` - Low-pass filter automation

## Query Helpers

### `suggest_tempo/2`

Suggest a tempo for a genre.

```prolog
suggest_tempo(Genre, Tempo).
```

### `suggest_arrangement/3`

Suggest arrangement for genre and length.

```prolog
suggest_arrangement(Genre, TargetLength, Sections).
```

### `suggest_next_section/3`

Suggest what section should come next.

```prolog
suggest_next_section(CurrentSection, Genre, NextSection).
```

### `validate_section_sequence/2`

Check if section sequence is valid.

```prolog
validate_section_sequence(SectionList, Result).
% Result: valid | invalid(S1, S2)
```

### `in_melodic_range/3`

Check if a note is in range for instrument.

```prolog
in_melodic_range(Instrument, MIDINote, Result).
% Result: true | false
```

## TypeScript API

The TypeScript wrappers in `composition-queries.ts` provide type-safe access:

```typescript
import {
  getAllGenres,
  getGenreInfo,
  suggestTempo,
  suggestArrangement,
  validateArrangement,
  suggestNextSection,
  suggestBassPattern,
  suggestDrumPattern,
  getVariationTechniques,
  getSwingFeel,
  getHumanizationParams
} from '@cardplay/ai/queries';

// Get genre information
const info = await getGenreInfo('lofi');
// { id: 'lofi', tempoRange: { min: 60, max: 90 }, characteristics: ['relaxed', ...], ... }

// Suggest arrangement
const sections = await suggestArrangement('house', 128);
// ['intro', 'buildup', 'drop', 'breakdown', 'buildup', 'drop', 'outro']

// Get drum patterns
const patterns = await suggestDrumPattern('techno');
// [{ id: 'driving_four', kicks: [1,5,9,13], snares: [5,13], hihats: [...] }]

// Get humanization parameters
const humanize = await getHumanizationParams('jazz');
// { timing: 15, velocity: 25 }
```

## See Also

- [Music Theory Predicates](./music-theory-predicates.md) - Music theory knowledge base
- [Board Predicates](./board-predicates.md) - Board and deck knowledge base
- [Prolog Syntax](./prolog-syntax.md) - CardPlay Prolog conventions
