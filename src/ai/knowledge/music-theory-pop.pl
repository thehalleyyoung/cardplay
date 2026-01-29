%% music-theory-pop.pl - Pop Music Theory KB
%%
%% Provides predicates for:
%% - Pop chord progressions and hooks (C1952-C1966)
%% - Song form and production (C1957-C1976)
%% - Pop subgenres and eras (C1967-C1976)
%%
%% Depends on: music-theory.pl

%% ============================================================================
%% POP CHORD PROGRESSIONS (C1952-C1954)
%% ============================================================================

%% pop_chord_progression(+Name, -Numerals, -Era)
%% Named pop progressions with era context. (C1952)
pop_chord_progression('I-V-vi-IV', [i, v, vi, iv], universal).
pop_chord_progression('vi-IV-I-V', [vi, iv, i, v], modern_pop).
pop_chord_progression('I-vi-IV-V', [i, vi, iv, v], fifties_doo_wop).
pop_chord_progression('I-IV-vi-V', [i, iv, vi, v], contemporary).
pop_chord_progression('ii-V-I', [ii, v, i], jazz_influenced).
pop_chord_progression('I-iii-IV-V', [i, iii, iv, v], classic_pop).
pop_chord_progression('I-V-vi-iii-IV-I-IV-V', [i, v, vi, iii, iv, i, iv, v], pachelbel_pop).
pop_chord_progression('vi-V-IV-V', [vi, v, iv, v], emotional_pop).
pop_chord_progression('I-bVII-IV-I', [i, bvii, iv, i], mixolydian_pop).

%% four_chord_song(+Progression, -Examples)
%% The ubiquitous four-chord pattern and famous uses. (C1953)
four_chord_song([i, v, vi, iv], axis_of_awesome).
four_chord_song([vi, iv, i, v], someone_like_you).
four_chord_song([i, iv, vi, v], let_it_be).

%% pop_melody_contour(+ContourType, -Characteristics, -Effect)
%% Pop melody shape archetypes. (C1954)
pop_melody_contour(arch, [ascending_start, peak_in_middle, descending_end], satisfying).
pop_melody_contour(ascending, [builds_upward, reaches_high_note, climactic], energizing).
pop_melody_contour(descending, [starts_high, settles_down, resolving], calming).
pop_melody_contour(zigzag, [alternating_direction, wide_intervals, attention_grabbing], exciting).
pop_melody_contour(flat, [repeated_note, rhythmic_focus, speech_like], hypnotic).
pop_melody_contour(hook_shape, [distinctive_interval, memorable_turn, signature], catchy).

%% ============================================================================
%% HOOKS & EARWORMS (C1955-C1966)
%% ============================================================================

%% hook_placement(+HookType, -Location, -Repetition)
%% Where hooks appear in pop songs. (C1955)
hook_placement(title_hook, chorus_first_line, 4_to_8_times).
hook_placement(instrumental_hook, intro_and_between, throughout).
hook_placement(rhythmic_hook, groove, constant).
hook_placement(production_hook, signature_sound, throughout).
hook_placement(background_hook, counter_melody, chorus).

%% earworm_characteristics(+Feature, -Importance)
%% What makes a melody stick in your head. (C1956)
earworm_characteristics(simple_intervals, high).
earworm_characteristics(repetition, high).
earworm_characteristics(unexpected_turn, moderate).
earworm_characteristics(singable_range, high).
earworm_characteristics(rhythmic_syncopation, moderate).
earworm_characteristics(syllabic_setting, moderate).
earworm_characteristics(rising_pitch, moderate).

%% millennial_whoop(+Pattern, -Examples)
%% The "millennial whoop" melodic pattern. (C1966)
millennial_whoop(fifth_to_third_alternation, common_2010s_pop).

%% ============================================================================
%% POP SONG FORM (C1957-C1960)
%% ============================================================================

%% pop_song_form(+FormType, -Sections, -Modern)
%% Pop song structures. (C1957)
pop_song_form(standard, [intro, verse, pre_chorus, chorus, verse, pre_chorus, chorus, bridge, chorus, outro], classic).
pop_song_form(modern_minimal, [intro, verse, chorus, verse, chorus, bridge, chorus], streamlined).
pop_song_form(edm_influenced, [intro, verse, build, drop, verse, build, drop, bridge, final_drop], post_2015).
pop_song_form(hip_hop_pop, [intro, verse, hook, verse, hook, verse, hook, outro], rap_influenced).
pop_song_form(ballad, [intro, verse, verse, chorus, verse, chorus, bridge, final_chorus], emotional).

%% prechorus_function(+Harmonic, -Melodic, -Energy)
%% The pre-chorus role in pop songwriting. (C1958)
prechorus_function(dominant_preparation, rising_melody, building).
prechorus_function(relative_minor, tension_melody, anticipating).
prechorus_function(chromatic_ascent, step_up, escalating).
prechorus_function(rhythmic_shift, staccato_to_legato, transitioning).

%% drop_section(+BuildUp, -Drop, -Release)
%% Pop/EDM-influenced drop section. (C1960)
drop_section(filter_sweep_up, full_frequency_impact, bass_and_beat_hit).
drop_section(snare_roll, beat_drop, synth_blast).
drop_section(vocal_build, instrumental_drop, hook_payoff).
drop_section(silence, everything_at_once, maximum_impact).

%% ============================================================================
%% POP PRODUCTION & STYLE (C1961-C1976)
%% ============================================================================

%% pop_production_element(+Element, -Era, -Usage)
%% Production elements by era. (C1961)
pop_production_element(wall_of_sound, sixties, layered_instruments).
pop_production_element(synthesizer, eighties, lead_and_pad).
pop_production_element(sampling, nineties, loops_and_hits).
pop_production_element(autotune, two_thousands, pitch_and_effect).
pop_production_element(vocal_chop, twenty_tens, rhythmic_texture).
pop_production_element(lo_fi_processing, twenty_twenties, warm_imperfect).

%% vocal_production(+Technique, -Era, -Effect)
%% Vocal production techniques. (C1962)
vocal_production(double_tracking, sixties, thickness).
vocal_production(vocoder, seventies, robotic).
vocal_production(gated_reverb, eighties, big_drums_also_vocals).
vocal_production(stacking, nineties, choir_effect).
vocal_production(autotune, two_thousands, pitch_perfect_or_effect).
vocal_production(whisper_vocal, twenty_tens, intimate).
vocal_production(vocal_fry, twenty_twenties, breathy_texture).

%% pop_beat_pattern(+Era, -Pattern, -Producer)
%% Beat patterns characteristic of different pop eras. (C1967)
pop_beat_pattern(motown, [kick,hat,snare,hat,kick,hat,snare,hat], classic_soul).
pop_beat_pattern(disco, [kick,kick,kick,kick,hat_open,hat,hat_open,hat], four_on_floor).
pop_beat_pattern(eighties, [kick,hat,snare,hat,kick,kick,snare,hat], gated_reverb).
pop_beat_pattern(nineties, [kick,hat,snare,hat,kick,hat,snare,hat], programmed).
pop_beat_pattern(trap_pop, [kick,hat_hat_hat,snare,hat_hat,kick,hat_hat_hat,snare,hat], hi_hat_rolls).
pop_beat_pattern(reggaeton_pop, [kick,hat,snare_kick,hat,kick,hat,snare,hat], dembow).

%% kpop_structure(+Element, -Characteristics, -Influence)
%% K-pop structural elements. (C1971)
kpop_structure(hook, [multiple_hooks_per_song, genre_switching], maximalist).
kpop_structure(rap_verse, [integrated_rap_section, contrast], hip_hop_influence).
kpop_structure(dance_break, [instrumental_section, choreography_sync], performance_oriented).
kpop_structure(key_change, [dramatic_modulation, final_chorus], emotional_peak).
kpop_structure(adlib, [vocal_runs, belting, improvisation], r_and_b_influence).

%% pop_key_convention(+Era, -KeyPreferences, -Reasons)
%% Key preferences in pop music by era. (C1974)
pop_key_convention(classical_pop, [c_major, g_major, f_major], guitar_piano_friendly).
pop_key_convention(modern_pop, [c_major, g_major, a_minor, e_minor], singable_range).
pop_key_convention(r_and_b_pop, [eb_major, ab_major, bb_major], vocal_warmth).
pop_key_convention(edm_pop, [a_minor, f_minor, c_minor], dark_electronic).

%% pop_tempo_range(+Era, -TempoRange, -Feel)
%% Tempo trends in pop by era. (C1975)
pop_tempo_range(sixties, range(100, 140), moderate_to_fast).
pop_tempo_range(disco, range(110, 130), dance_groove).
pop_tempo_range(eighties, range(100, 130), synth_driven).
pop_tempo_range(nineties, range(80, 130), varied).
pop_tempo_range(two_thousands, range(80, 140), wide_range).
pop_tempo_range(streaming_era, range(80, 110), slower_trend).
