%% music-theory-rock.pl - Rock Music Theory KB
%%
%% Provides predicates for:
%% - Power chords, riffs, progressions (C1902-C1916)
%% - Rock subgenres and styles (C1917-C1928)
%% - Guitar techniques and production (C1939-C1944)
%%
%% Depends on: music-theory.pl

%% ============================================================================
%% POWER CHORDS & PROGRESSIONS (C1902-C1906)
%% ============================================================================

%% power_chord(+Root, -Voicing, -Inversion)
%% Power chord voicings (root + 5th, no 3rd). (C1902)
power_chord(Root, [Root, Fifth], root_position) :-
  note_index(Root, I),
  FI is (I + 7) mod 12,
  pc_to_note_name(FI, Fifth).
power_chord(Root, [Root, Fifth, Octave], root_octave) :-
  note_index(Root, I),
  FI is (I + 7) mod 12,
  pc_to_note_name(FI, Fifth),
  Octave = Root.

%% rock_progression(+ProgressionName, -Numerals, -Style)
%% Common rock chord progressions. (C1903)
rock_progression('I-IV-V', [i, iv, v], blues_rock).
rock_progression('I-bVII-IV', [i, bvii, iv], classic_rock).
rock_progression('I-V-bVII-IV', [i, v, bvii, iv], rock_anthem).
rock_progression('i-bVI-bIII-bVII', [i, bvi, biii, bvii], aeolian).
rock_progression('i-bVII-bVI-V', [i, bvii, bvi, v], andalusian_rock).
rock_progression('I-IV-vi-V', [i, iv, vi, v], pop_rock).
rock_progression('I-bIII-IV', [i, biii, iv], grunge).
rock_progression('I-V-vi-IV', [i, v, vi, iv], four_chord_pop_rock).
rock_progression('i-iv-i-V', [i, iv, i, v], minor_rock).
rock_progression('I-II-IV-I', [i, ii_major, iv, i], lydian_rock).

%% blues_rock_scale(+Key, +ScaleType, -Notes)
%% Blues and rock scale variants. (C1904)
blues_rock_scale(Key, minor_pentatonic, Notes) :-
  note_index(Key, I),
  maplist(offset_pc(I), [0, 3, 5, 7, 10], PCs),
  maplist(pc_to_note_name, PCs, Notes).
blues_rock_scale(Key, major_pentatonic, Notes) :-
  note_index(Key, I),
  maplist(offset_pc(I), [0, 2, 4, 7, 9], PCs),
  maplist(pc_to_note_name, PCs, Notes).
blues_rock_scale(Key, blues, Notes) :-
  note_index(Key, I),
  maplist(offset_pc(I), [0, 3, 5, 6, 7, 10], PCs),
  maplist(pc_to_note_name, PCs, Notes).
blues_rock_scale(Key, dorian_blues, Notes) :-
  note_index(Key, I),
  maplist(offset_pc(I), [0, 2, 3, 5, 7, 9, 10], PCs),
  maplist(pc_to_note_name, PCs, Notes).

%% rock_riff_pattern(+RiffType, -Rhythm, -Contour)
%% Common rock riff archetypes. (C1906)
rock_riff_pattern(power_chord_chug, [eighth, eighth, eighth, eighth], repeated_root).
rock_riff_pattern(blues_lick, [eighth, eighth, quarter, eighth, eighth], pentatonic_descent).
rock_riff_pattern(palm_mute_gallop, [sixteenth, sixteenth, eighth], gallop_triplet).
rock_riff_pattern(open_string_pedal, [eighth, eighth, eighth, eighth], alternating_open).
rock_riff_pattern(octave_riff, [quarter, eighth, eighth], octave_jump).
rock_riff_pattern(chromatic_descent, [eighth, eighth, eighth, eighth], chromatic_down).

%% ============================================================================
%% GUITAR TECHNIQUES (C1907-C1909)
%% ============================================================================

%% guitar_technique_rock(+Technique, -Notation, -Sound)
%% Rock guitar techniques. (C1907)
guitar_technique_rock(palm_mute, 'PM', chunky_percussive).
guitar_technique_rock(bend, 'b', expressive_pitch_shift).
guitar_technique_rock(vibrato, '~', sustained_oscillation).
guitar_technique_rock(hammer_on, 'h', smooth_ascending).
guitar_technique_rock(pull_off, 'p', smooth_descending).
guitar_technique_rock(slide, '/', continuous_pitch_glide).
guitar_technique_rock(harmonic, '<>', bell_tone).
guitar_technique_rock(pinch_harmonic, '*', squealing_overtone).
guitar_technique_rock(tapping, 't', rapid_notes).
guitar_technique_rock(whammy_bar, 'w', pitch_dive).
guitar_technique_rock(tremolo_pick, 'tp', rapid_repeated).

%% rock_drum_pattern(+StyleName, -Pattern, -Feel)
%% Rock drumming patterns. (C1909)
rock_drum_pattern(basic_rock, [kick,hat,snare,hat,kick,kick,snare,hat], straight_eighth).
rock_drum_pattern(half_time, [kick,hat,hat,hat,snare,hat,hat,hat], spacious).
rock_drum_pattern(double_time, [kick,snare,kick,snare,kick,snare,kick,snare], driving).
rock_drum_pattern(shuffle, [kick,hat_trip,snare,hat_trip,kick,hat_trip,snare,hat_trip], swing).
rock_drum_pattern(blast_beat, [kick_snare,kick_snare,kick_snare,kick_snare], extreme_metal).
rock_drum_pattern(four_on_floor_rock, [kick,hat,kick_snare,hat,kick,hat,kick_snare,hat], dance_rock).

%% ============================================================================
%% SONG FORM & DYNAMICS (C1912-C1916)
%% ============================================================================

%% rock_song_form(+FormType, -Sections, -Variations)
%% Common rock song structures. (C1912)
rock_song_form(verse_chorus, [intro, verse, chorus, verse, chorus, solo, chorus, outro], standard).
rock_song_form(verse_chorus_bridge, [intro, verse, chorus, verse, chorus, bridge, chorus, outro], with_bridge).
rock_song_form(aaba, [a, a, b, a], classic_structure).
rock_song_form(through_composed, [section1, section2, section3, section4], progressive).
rock_song_form(riff_based, [intro_riff, verse_riff, chorus, verse_riff, chorus, solo, chorus], riff_driven).
rock_song_form(suite, [movement1, movement2, movement3], prog_rock).

%% rock_dynamics(+Section, -Level, -Texture)
%% Dynamic mapping for rock sections. (C1914)
rock_dynamics(intro, moderate, building).
rock_dynamics(verse, moderate, restrained).
rock_dynamics(pre_chorus, building, thickening).
rock_dynamics(chorus, loud, full).
rock_dynamics(bridge, varied, contrasting).
rock_dynamics(solo, loud, spotlight).
rock_dynamics(breakdown, quiet, stripped).
rock_dynamics(outro, varies, resolving).

%% truck_driver_modulation(+Interval, -Effect)
%% Key change up by a step for final chorus. (C1916)
truck_driver_modulation(1, dramatic_lift).  %% half step up
truck_driver_modulation(2, energetic_lift). %% whole step up
truck_driver_modulation(5, triumphant).     %% up a 4th

%% ============================================================================
%% ROCK SUBGENRES (C1917-C1928)
%% ============================================================================

%% rock_subgenre(+Subgenre, -Characteristics, -Examples)
%% Rock subgenre definitions. (C1917)
rock_subgenre(classic_rock, [blues_based, guitar_driven, verse_chorus, analog_production], [led_zeppelin, rolling_stones]).
rock_subgenre(hard_rock, [heavy_riffs, power_chords, high_energy, arena_sound], [ac_dc, van_halen]).
rock_subgenre(punk, [fast_tempo, simple_chords, short_songs, raw_production], [ramones, clash]).
rock_subgenre(alternative, [unconventional_structure, mixed_dynamics, indie_ethos], [radiohead, nirvana]).
rock_subgenre(indie, [lo_fi, jangly_guitars, introspective, diy], [the_smiths, arcade_fire]).
rock_subgenre(progressive, [complex_meters, long_forms, virtuosity, concept_albums], [yes, genesis, king_crimson]).
rock_subgenre(grunge, [heavy_distortion, angst_lyrics, dynamic_contrast, minor_keys], [nirvana, soundgarden]).

%% metal_subgenre(+Subgenre, -Features, -Techniques)
%% Metal subgenres. (C1923)
metal_subgenre(thrash, [fast_tempo, palm_muting, complex_riffs], [alternate_picking, double_bass]).
metal_subgenre(death, [growl_vocals, blast_beats, chromatic_riffs], [tremolo_picking, sweep]).
metal_subgenre(black, [tremolo_riffs, blast_beats, atmospheric], [high_pitched_screams]).
metal_subgenre(doom, [slow_tempo, heavy_riffs, dark_atmosphere], [downtuned, sustained]).
metal_subgenre(progressive_metal, [odd_meters, virtuosity, clean_and_heavy], [tapping, polyrhythm]).
metal_subgenre(djent, [low_tuning, polyrhythmic, staccato_riffs], [palm_muted_chug, extended_range]).

%% drop_tuning(+TuningName, -Notes, -Style)
%% Alternative guitar tunings. (C1925)
drop_tuning(standard, [e, a, d, g, b, e], general).
drop_tuning(drop_d, [d, a, d, g, b, e], rock_metal).
drop_tuning(drop_c, [c, g, c, f, a, d], heavy_metal).
drop_tuning(open_g, [d, g, d, g, b, d], blues_slide).
drop_tuning(open_d, [d, a, d, fsharp, a, d], folk_slide).
drop_tuning(dadgad, [d, a, d, g, a, d], celtic_ambient).
drop_tuning(drop_b, [b, fsharp, b, e, gsharp, csharp], extreme_metal).

%% rock_hook(+HookType, -Element, -Placement)
%% Rock song hooks. (C1942)
rock_hook(riff_hook, guitar_riff, intro_and_between_sections).
rock_hook(vocal_hook, chorus_melody, chorus_opening).
rock_hook(rhythmic_hook, drum_pattern, throughout).
rock_hook(lyric_hook, title_phrase, chorus_peak).

%% guitar_tone_chain(+Style, -Pedals, -AmpSettings)
%% Signal chain recommendations. (C1939)
guitar_tone_chain(classic_rock, [overdrive, reverb], [tube_amp, mid_gain, warm_eq]).
guitar_tone_chain(metal, [noise_gate, distortion, eq], [high_gain, scooped_mids, tight_low]).
guitar_tone_chain(indie, [chorus, delay, reverb], [clean_amp, bright_eq, moderate_volume]).
guitar_tone_chain(blues, [overdrive, reverb], [tube_amp, low_gain, warm]).
guitar_tone_chain(shoegaze, [fuzz, chorus, delay, reverb, reverb], [clean_amp, lots_of_space]).
