# Music Theory Predicates Reference

This document describes all Prolog predicates available in the CardPlay music theory knowledge base.

## Overview

The music theory KB provides predicates for:
- Notes and intervals
- Scales and modes
- Chords and progressions
- Voice leading rules
- Harmonic functions and cadences
- Orchestration and texture
- Computational analysis helpers (PC profiles, key-finding, grouping)
- Galant schemata (schema patterns and matching)
- Film music helpers (mood → mode/device/role recommendations)
- World-music scaffolding (Carnatic/Celtic/Chinese starter predicates)

## Notes

### `note/1`
```prolog
note(NoteName).
```
True if NoteName is a valid chromatic note.

**Examples:**
- `note(c).` ✓
- `note(csharp).` ✓
- `note(dflat).` ✓

### `note_index/2`
```prolog
note_index(NoteName, Index).
```
Maps a note name to its semitone index (0-11, where C=0).

**Examples:**
- `note_index(c, 0).`
- `note_index(e, 4).`
- `note_index(csharp, 1).`

### `enharmonic/2`
```prolog
enharmonic(Note1, Note2).
```
True if Note1 and Note2 are enharmonic equivalents.

**Examples:**
- `enharmonic(csharp, dflat).` ✓
- `enharmonic(fsharp, gflat).` ✓

## Intervals

### `interval_semitones/2`
```prolog
interval_semitones(IntervalName, Semitones).
```
Maps interval name to semitone count.

**Interval Names:** `unison`, `minor_second`, `major_second`, `minor_third`, `major_third`, `perfect_fourth`, `tritone`, `perfect_fifth`, `minor_sixth`, `major_sixth`, `minor_seventh`, `major_seventh`, `octave`

### `interval/3`
```prolog
interval(Note1, Note2, IntervalName).
```
Determines the interval between two notes.

**Example:**
```prolog
?- interval(c, e, X).
X = major_third
```

### `note_distance/3`
```prolog
note_distance(Note1, Note2, Semitones).
```
Computes the ascending semitone distance between two notes (0-11).

**Example:**
```prolog
?- note_distance(c, g, D).
D = 7
```

### `invert_interval/2`
```prolog
invert_interval(Interval, Inverted).
```
Returns the inversion of an interval.

**Example:**
```prolog
?- invert_interval(major_third, X).
X = minor_sixth
```

### `consonance/2`
```prolog
consonance(IntervalName, Rating).
```
Rates an interval as `perfect`, `imperfect`, or `dissonant`.

## Scales

### `scale/2`
```prolog
scale(ScaleType, Pattern).
```
Defines a scale type with its semitone step pattern.

**Scale Types:** `major`, `natural_minor`, `harmonic_minor`, `melodic_minor`, `pentatonic_major`, `pentatonic_minor`, `blues`, `chromatic`, `whole_tone`, `ionian`, `dorian`, `phrygian`, `lydian`, `mixolydian`, `aeolian`, `locrian`

**Example:**
```prolog
?- scale(major, P).
P = [2, 2, 1, 2, 2, 2, 1]
```

### `scale_notes/3`
```prolog
scale_notes(Root, ScaleType, Notes).
```
Returns the list of notes in a scale.

**Example:**
```prolog
?- scale_notes(c, major, N).
N = [c, d, e, f, g, a, b]
```

### `in_scale/3`
```prolog
in_scale(Note, Root, ScaleType).
```
True if Note is in the given scale.

**Example:**
```prolog
?- in_scale(e, c, major).
true
```

### `mode/2`
```prolog
mode(ModeName, Quality).
```
Associates a mode with its quality (major/minor/diminished).

## Chords

### `chord/2`
```prolog
chord(ChordType, Intervals).
```
Defines a chord type with its intervals from root (in semitones).

**Chord Types:** `major`, `minor`, `diminished`, `augmented`, `sus2`, `sus4`, `major7`, `minor7`, `dominant7`, `diminished7`, `half_diminished7`, `major9`, `minor9`, `dominant9`, `add9`, `major11`, `minor11`, `dominant11`, `major13`, `minor13`, `dominant13`

**Example:**
```prolog
?- chord(major7, I).
I = [0, 4, 7, 11]
```

### `chord_tones/3`
```prolog
chord_tones(Root, ChordType, Notes).
```
Returns the notes in a chord.

**Example:**
```prolog
?- chord_tones(c, major, N).
N = [c, e, g]
```

### `chord_tone/3`
```prolog
chord_tone(Note, Root, ChordType).
```
True if Note is a chord tone.

### `chord_quality/2`
```prolog
chord_quality(ChordType, Quality).
```
Returns the quality (major/minor/diminished/augmented/dominant) of a chord type.

## Chord Progressions

### `progression/2`
```prolog
progression(Name, Steps).
```
Named chord progressions as lists of [degree, quality] pairs.

**Progression Names:** `pop_basic` (I-V-vi-IV), `jazz_ii_v_i`, `jazz_i_vi_ii_v`, `blues_12bar`, `canon`, `andalusian`, `axis`

### `diatonic_chord/3`
```prolog
diatonic_chord(ScaleType, Degree, Quality).
```

## Computational Music Theory (Extensions)

These predicates live in `cardplay/src/ai/knowledge/music-theory-computational.pl` and are loaded by `loadMusicTheoryKB`.

### `pc_profile_from_pcs/2`
```prolog
pc_profile_from_pcs(PitchClasses, Profile12).
```
Build a 12-bin pitch-class profile (PCP) from a list of pitch classes (0–11).

### `pc_profile_norm/2`
```prolog
pc_profile_norm(Profile12, Normalized12).
```
Normalize a profile so bins sum to 1.

### `ks_best_key/3`
```prolog
ks_best_key(Profile12, KeyRootPC, Mode).
```
Krumhansl–Schmuckler style key scoring (utility).

### `dft_phase_key_note/3`
```prolog
dft_phase_key_note(Profile12, TonicNote, Confidence).
```
Estimate tonic by matching the phase direction of the DFT k=1 component.

### `spiral_distance2/3`
```prolog
spiral_distance2(NoteA, NoteB, DistSquared).
```
Approximate tonal “distance” (squared) using a spiral-array-inspired embedding.

### `gttm_segment/3`
```prolog
gttm_segment(Events, Threshold0to100, Segments).
```
Heuristic grouping/segmentation for note events `evt(Start, Dur, MidiPitch)`.

## Galant Schemata (Extensions)

These predicates live in `cardplay/src/ai/knowledge/music-theory-galant.pl`.

### `galant_schema/1`
```prolog
galant_schema(Schema).
```

### `schema_pattern/3`
```prolog
schema_pattern(Schema, Role, Degrees).
```

### `match_galant_schema/3`
```prolog
match_galant_schema(DegreeSequence, Schema, Score).
```

## Film Music (Extensions)

These predicates live in `cardplay/src/ai/knowledge/music-theory-film.pl`.

### `film_mood/1`
```prolog
film_mood(Mood).
```

### `recommend_film_device/3`
```prolog
recommend_film_device(Mood, Device, Reasons).
```

## World Music (Extensions)

These predicates live in `cardplay/src/ai/knowledge/music-theory-world.pl`.

### Carnatic (starter)
```prolog
raga(Raga).
raga_arohana(Raga, Swaras).
raga_avarohana(Raga, Swaras).
raga_pcs(Raga, PitchClasses).
tala(Tala).
tala_cycle(Tala, Beats).
```

### Celtic (starter)
```prolog
celtic_tune_type(Type, meter(Num, Den)).
celtic_progression(Name, Degrees).
celtic_ornament(Ornament).
```

### Chinese (starter)
```prolog
chinese_pentatonic_mode(Mode, Steps).
chinese_mode_pcs(TonicNote, Mode, PitchClasses).
```
Returns the chord quality for a scale degree.

**Example:**
```prolog
?- diatonic_chord(major, 2, Q).
Q = minor
```

### `diatonic_chord_7th/3`
```prolog
diatonic_chord_7th(ScaleType, Degree, Quality).
```
Returns the 7th chord quality for a scale degree.

## Harmonic Functions

### `harmonic_function/2`
```prolog
harmonic_function(Degree, Function).
```
Maps scale degree to harmonic function: `tonic`, `subdominant`, or `dominant`.

**Example:**
```prolog
?- harmonic_function(5, F).
F = dominant
```

### `tension/2`
```prolog
tension(Degree, Level).
```
Returns tension level (0-5) for a scale degree.

### `cadence/2`
```prolog
cadence(Type, Chords).
```
Defines cadence types with their chord sequences.

**Cadence Types:** `authentic`, `perfect_authentic`, `imperfect_authentic`, `half`, `plagal`, `deceptive`

## Voice Leading

### `voice_leading_distance/3`
```prolog
voice_leading_distance(Note1, Note2, Distance).
```
Returns the minimum semitone distance for voice leading (0-6).

### `smooth_motion/2`
```prolog
smooth_motion(Note1, Note2).
```
True if voice motion is smooth (≤2 semitones).

### `good_voice_leading/4`
```prolog
good_voice_leading(Root1, Type1, Root2, Type2).
```
True if two chords have at least one common tone.

### `common_tone/2`
```prolog
common_tone(Notes1, Notes2).
```
True if the note lists share at least one note.

## Transposition

### `transpose/3`
```prolog
transpose(Note, Semitones, Result).
```
Transposes a note by the given number of semitones.

**Example:**
```prolog
?- transpose(c, 5, R).
R = f
```

## Advanced Harmony

### `borrowed_chord/3`
```prolog
borrowed_chord(Key, Degree, Quality).
```
Defines modal mixture / borrowed chords.

### `secondary_dominant/2`
```prolog
secondary_dominant(Target, Notes).
```
Defines secondary dominants (V/x chords).

### `tritone_substitution/3`
```prolog
tritone_substitution(OriginalRoot, OriginalType, SubRoot).
```
Returns the tritone substitution for a dominant chord.

### `chord_extension_compatible/3`
```prolog
chord_extension_compatible(ChordType, Extension, Compatibility).
```
Indicates if an extension (9, 11, 13) works with a chord type.

## Melody and Rhythm

### `melodic_contour/2`
```prolog
melodic_contour(Notes, Type).
```
Analyzes melody contour: `ascending`, `descending`, `arch`, `static`.

### `strong_beat/2`
```prolog
strong_beat(Beat, Meter).
```
True if Beat is a strong beat in the given meter.

### `weak_beat/2`
```prolog
weak_beat(Beat, Meter).
```
True if Beat is a weak beat.

### `phrase_type/2`
```prolog
phrase_type(Type, EndDegree).
```
Determines phrase type (`antecedent` or `consequent`) from ending degree.

## Orchestration

### `instrument_range/3`
```prolog
instrument_range(Instrument, LowMidi, HighMidi).
```
Defines MIDI note range for instruments.

**Instruments:** `piano`, `violin`, `viola`, `cello`, `bass`, `flute`, `oboe`, `clarinet`, `bassoon`, `trumpet`, `horn`, `trombone`, `tuba`, `soprano`, `alto`, `tenor`, `baritone`, `bass_voice`

### `register_suitable/2`
```prolog
register_suitable(Instrument, MidiNote).
```
True if the MIDI note is within the instrument's range.

### `texture/2`
```prolog
texture(Type, VoiceCount).
```
Defines texture types: `monophonic`, `homophonic`, `polyphonic`, `heterophonic`.

## Identification

### `identify_chord/3`
```prolog
identify_chord(Notes, Root, ChordType).
```
Identifies chord(s) from a list of notes.

### `identify_scale/3`
```prolog
identify_scale(Notes, Root, ScaleType).
```
Identifies scales that contain all given notes.

## Helper Predicates

### `suggest_next_chord/4`
```prolog
suggest_next_chord(CurrentDegree, CurrentQuality, NextDegree, NextQuality).
```
Suggests harmonically valid next chords based on functional progression.

## Spectral Music Predicates (C14)

### `harmonic_series/3`
```prolog
harmonic_series(Fundamental, NumPartials, PartialsList).
```
Generates the harmonic series for a given fundamental.

### `spectral_centroid/2`
```prolog
spectral_centroid(Spectrum, Centroid).
```
Calculates the spectral centroid (brightness) of a spectrum.

### `spectral_morphing/4`
```prolog
spectral_morphing(Spec1, Spec2, T, InterpolatedSpec).
```
Interpolates between two spectra at parameter T (0.0–1.0).

### `grisey_spectral_harmony/3`
```prolog
grisey_spectral_harmony(Fundamental, SpectralChord, Voicing).
```
Generates spectral harmonies following Grisey's techniques.

## Orchestration Predicates (C14)

### `orchestral_weight/3`
```prolog
orchestral_weight(Instrumentation, Dynamics, WeightScore).
```
Calculates orchestral weight for a given instrumentation and dynamics.

### `balance_check/3`
```prolog
balance_check(Voicing, Dynamics, BalanceIssues).
```
Checks orchestral balance and identifies masking issues.

### `parsimonious_voice_leading/3`
```prolog
parsimonious_voice_leading(Chord1, Chord2, VoiceLeading).
```
Finds minimal voice-leading path between two chords (neo-Riemannian).

## Film Scoring Predicates (C15)

### `emotional_arc/3`
```prolog
emotional_arc(SceneTimeline, EmotionCurve, MusicPlan).
```
Maps a scene timeline to an emotional arc and generates a music plan.

### `composer_style_match/3`
```prolog
composer_style_match(Cue, Composer, Similarity).
```
Matches a cue against known composer style profiles.

### `leitmotif_definition/3`
```prolog
leitmotif_definition(MotifId, Character, MusicalMaterial).
```
Defines leitmotif associations for characters/themes.

## World Music Predicates (C16)

### `raga_database/5`
```prolog
raga_database(RagaName, Aroha, Avaroha, Vadi, Samvadi).
```
Full raga database with ascending/descending scales and important notes.

### `maqam_definition/4`
```prolog
maqam_definition(MaqamName, Jins1, Jins2, Ghammaz).
```
Defines maqam structure with jins (tetrachord) components.

### `clave_pattern/3`
```prolog
clave_pattern(ClaveName, Pattern, Style).
```
Latin music clave patterns (son, rumba, bossa).

### `african_rhythm_timeline/3`
```prolog
african_rhythm_timeline(PatternName, Timeline, Tradition).
```
Sub-Saharan African bell patterns and timeline rhythms.

## Popular Music Predicates (C17)

### `rock_progression/3`
```prolog
rock_progression(ProgressionName, Numerals, Style).
```
Common rock chord progressions by style.

### `pop_chord_progression/3`
```prolog
pop_chord_progression(Name, Numerals, Era).
```
Pop chord progressions catalogued by era.

### `edm_arrangement/4`
```prolog
edm_arrangement(Intro, Build, Drop, Breakdown).
```
EDM arrangement structure patterns.

## Fusion Predicates (C18)

### `scale_compatibility/4`
```prolog
scale_compatibility(Scale1, Culture1, Scale2, Culture2, Compatibility).
```
Cross-cultural scale compatibility analysis.

### `fusion_genre/4`
```prolog
fusion_genre(GenreName, Culture1, Culture2, Characteristics).
```
Defines fusion genres bridging two cultural traditions.

## See Also

- [Computational Theory](./computational-theory.md) - GTTM, Spiral Array, DFT
- [Galant Schemata](./galant-schemata.md) - Schema library
- [Film Music](./film-music.md) - Film scoring predicates
- [Carnatic](./carnatic.md) - Indian classical music
- [Celtic](./celtic.md) - Celtic music theory
- [Chinese](./chinese.md) - Chinese music theory
- [Theory Decks](./theory-decks.md) - Deck templates
- [Prolog Syntax](./prolog-syntax.md) - Syntax conventions
- [Query Patterns](./query-patterns.md) - Common query patterns
- [Prolog Engine Choice](./prolog-engine-choice.md) - Engine documentation
