%% music-theory-edm.pl - Electronic Dance Music Theory KB
%%
%% Provides predicates for:
%% - Beat patterns and arrangement (C2002-C2006)
%% - Synthesis and sound design (C2007-C2014)
%% - EDM subgenres (C2015-C2025)
%% - Production techniques (C2036-C2041)
%%
%% Depends on: music-theory.pl

%% ============================================================================
%% BEAT PATTERNS & ARRANGEMENT (C2002-C2006)
%% ============================================================================

%% four_on_floor(+Tempo, -Subgenre, -Variations)
%% The foundational four-on-the-floor kick pattern. (C2002)
four_on_floor(128, house, [kick_every_quarter, hi_hat_offbeat, clap_on_2_4]).
four_on_floor(130, techno, [kick_every_quarter, hi_hat_every_eighth, sparse_percussion]).
four_on_floor(138, trance, [kick_every_quarter, hi_hat_offbeat, ride_every_eighth]).
four_on_floor(126, deep_house, [kick_every_quarter, shaker_sixteenths, subtle_percussion]).
four_on_floor(124, disco_house, [kick_every_quarter, open_hi_hat_offbeat, congas]).

%% breakbeat_pattern(+PatternName, -Pattern, -Genre)
%% Breakbeat patterns (non-4/4 or syncopated kicks). (C2003)
breakbeat_pattern(amen_break, [kick,hat,snare,hat,kick_hat,hat,snare_kick,hat], drum_and_bass).
breakbeat_pattern(think_break, [kick,hat,snare,hat,kick,snare,hat,hat], hip_hop).
breakbeat_pattern(funky_drummer, [kick,hat,snare,hat,kick,hat_snare,hat,kick], funk_breaks).
breakbeat_pattern(two_step, [kick,rest,snare,rest,rest,kick,snare,rest], uk_garage).
breakbeat_pattern(halftime, [kick,rest,rest,rest,snare,rest,rest,rest], halftime_dnb).

%% edm_arrangement(+Intro, -Build, -Drop, -Breakdown)
%% Standard EDM arrangement structure. (C2004)
edm_arrangement(intro(16_bars, minimal), build(8_bars, adding_layers), drop(16_bars, full_energy), breakdown(8_bars, stripped_back)).
edm_arrangement(intro(8_bars, ambient), build(16_bars, rising_tension), drop(32_bars, peak), breakdown(16_bars, melodic)).

%% drop_types(+DropType, -Characteristics, -Genre)
%% Types of "drops" in EDM. (C2005)
drop_types(bass_drop, [heavy_sub_bass, kick_returns, full_frequency], dubstep).
drop_types(melodic_drop, [synth_melody, chord_progression, euphoric], trance).
drop_types(rhythmic_drop, [groove_focused, percussion_heavy, hypnotic], techno).
drop_types(vocal_drop, [chopped_vocals, melodic_hooks, catchy], future_bass).
drop_types(minimal_drop, [subtle_change, groove_shift, understated], minimal_techno).
drop_types(hard_drop, [distorted_bass, aggressive, maximum_impact], hard_style).

%% buildup_techniques(+Technique, -Duration, -Intensity)
%% How to build tension before a drop. (C2006)
buildup_techniques(snare_roll, '4-8 bars', high).
buildup_techniques(filter_sweep, '8-16 bars', moderate_to_high).
buildup_techniques(rising_noise, '4-8 bars', high).
buildup_techniques(pitch_riser, '2-4 bars', very_high).
buildup_techniques(reverse_cymbal, '1-2 bars', moderate).
buildup_techniques(vocal_chant, '4-8 bars', moderate).
buildup_techniques(silence, '1 bar', maximum_anticipation).

%% ============================================================================
%% SYNTHESIS & SOUND DESIGN (C2007-C2014)
%% ============================================================================

%% riser_design(+RiserType, -Parameters, -Effect)
%% Sound design for risers/transitions. (C2007)
riser_design(white_noise, [low_pass_filter, rising_cutoff, long_attack], standard_build).
riser_design(pitch_riser, [saw_wave, pitch_env_up, reverb_tail], dramatic_lift).
riser_design(reverse_crash, [reversed_audio, fade_in, eq_sweep], transitional).
riser_design(shepard_tone, [layered_octaves, continuous_ascent, psychoacoustic], infinite_rise).

%% sidechain_compression(+Source, -Target, -Settings)
%% Sidechain compression for pumping effect. (C2008)
sidechain_compression(kick, bass, [ratio_4_1, attack_fast, release_medium, threshold_neg6]).
sidechain_compression(kick, pad, [ratio_8_1, attack_fast, release_slow, threshold_neg10]).
sidechain_compression(ghost_kick, everything, [ratio_4_1, attack_fast, release_quarter_note]).

%% synth_bass_type(+BassType, -Synthesis, -Genre)
%% Types of synthesizer bass sounds. (C2009)
synth_bass_type(sub_bass, [sine_wave, low_pass_filter, sub_frequencies], all_edm).
synth_bass_type(reese_bass, [detuned_saws, phaser_comb_filter, movement], drum_and_bass).
synth_bass_type(acid_bass, [303_saw_or_square, resonant_filter, accent_slide], acid_house).
synth_bass_type(wobble_bass, [low_pass_filter, lfo_modulation, rhythmic], dubstep).
synth_bass_type(neuro_bass, [fm_synthesis, distortion, complex_modulation], neurofunk).
synth_bass_type(pluck_bass, [short_envelope, filter_decay, percussive], future_bass).

%% supersaw_stack(+Voices, -Detune, -Width)
%% Supersaw synthesis for EDM chords. (C2011)
supersaw_stack(3, slight, narrow).
supersaw_stack(5, moderate, medium).
supersaw_stack(7, wide, full_stereo).
supersaw_stack(9, very_wide, massive).

%% edm_chord_voicing(+ChordType, -Voicing, -Texture)
%% EDM-specific chord voicings. (C2012)
edm_chord_voicing(major, [root, fifth, octave, tenth], anthem_voicing).
edm_chord_voicing(minor, [root, fifth, octave, minor_tenth], dark_anthem).
edm_chord_voicing(sus2, [root, second, fifth, octave], open_texture).
edm_chord_voicing(add9, [root, third, fifth, ninth], bright_modern).
edm_chord_voicing(power, [root, fifth, octave], bass_heavy).

%% pad_texture(+PadType, -Movement, -Warmth)
%% Pad synthesizer types. (C2014)
pad_texture(analog, slow_filter_sweep, warm).
pad_texture(digital, shimmer, bright).
pad_texture(granular, evolving_texture, complex).
pad_texture(vocal, formant_morph, human).
pad_texture(string, layered_ensemble, orchestral).

%% ============================================================================
%% EDM SUBGENRES (C2015-C2025)
%% ============================================================================

%% edm_subgenre(+GenreName, -BPM, -Characteristics)
%% EDM subgenre catalog. (C2015)
edm_subgenre(house, range(118, 130), [four_on_floor, vocal_hooks, groove_focused]).
edm_subgenre(techno, range(125, 150), [repetitive, hypnotic, minimal_vocals]).
edm_subgenre(trance, range(128, 150), [melodic, euphoric, long_builds]).
edm_subgenre(dubstep, range(138, 142), [half_time_feel, wobble_bass, heavy_drops]).
edm_subgenre(drum_and_bass, range(160, 180), [breakbeats, heavy_bass, fast_tempo]).
edm_subgenre(future_bass, range(130, 170), [lush_chords, vocal_chops, melodic]).
edm_subgenre(ambient, range(60, 100), [atmospheric, textural, no_beats]).
edm_subgenre(hardstyle, range(150, 160), [distorted_kick, reverse_bass, euphoric]).
edm_subgenre(lo_fi_house, range(110, 125), [warm, nostalgic, vinyl_texture]).

%% house_style(+Substyle, -Features, -Artists)
%% House music substyles. (C2016)
house_style(deep_house, [mellow_groove, jazzy_chords, subtle_vocals], [larry_heard, kerri_chandler]).
house_style(progressive_house, [building_energy, long_arrangement, melodic], [sasha, deadmau5]).
house_style(tech_house, [techno_influenced, minimal, groove_focused], [fisher, green_velvet]).
house_style(acid_house, [303_bassline, squelchy_filter, hypnotic], [phuture, dj_pierre]).
house_style(afro_house, [african_rhythms, percussion_heavy, organic], [black_coffee]).

%% techno_style(+Substyle, -Features, -Artists)
%% Techno substyles. (C2017)
techno_style(detroit, [soulful, melodic, futuristic], [juan_atkins, derrick_may]).
techno_style(berlin, [dark, industrial, minimal], [ben_klock, marcel_dettmann]).
techno_style(acid_techno, [303_bassline, raw, energetic], [hardfloor]).
techno_style(minimal, [stripped_back, micro_variations, hypnotic], [richie_hawtin]).
techno_style(industrial, [harsh, noise_elements, aggressive], [ansome, perc]).

%% lo_fi_aesthetic(+Element, -Processing, -Mood)
%% Lo-fi production aesthetic elements. (C2022)
lo_fi_aesthetic(vinyl_crackle, [noise_layer, subtle_hiss], nostalgic).
lo_fi_aesthetic(tape_wobble, [pitch_modulation, slow_flutter], dreamy).
lo_fi_aesthetic(bitcrushed, [sample_rate_reduction, aliasing], retro).
lo_fi_aesthetic(warm_filter, [low_pass, slight_saturation], cozy).
lo_fi_aesthetic(rain_ambience, [field_recording, background_layer], relaxing).

%% ============================================================================
%% EDM PRODUCTION TECHNIQUES (C2036-C2041)
%% ============================================================================

%% edm_automation(+Parameter, -Curve, -Musical)
%% Common automation curves in EDM production. (C2036)
edm_automation(filter_cutoff, rising_exponential, build_intensity).
edm_automation(reverb_size, increasing_linear, spaciousness_build).
edm_automation(volume, s_curve, smooth_transition).
edm_automation(pitch, linear_up, riser_effect).
edm_automation(distortion, step_up_at_drop, impact).

%% filter_sweep(+FilterType, -Direction, -Duration)
%% Filter sweep designs. (C2037)
filter_sweep(low_pass, rising, '8 bars').
filter_sweep(high_pass, falling, '4 bars').
filter_sweep(band_pass, peak_sweep, '16 bars').
filter_sweep(notch, wobble, '2 bars').

%% impact_sound(+ImpactType, -Processing, -Placement)
%% Impact/hit sounds for transitions. (C2038)
impact_sound(sub_boom, [sine_pitch_drop, long_reverb, compression], downbeat_of_drop).
impact_sound(clap_burst, [layered_claps, short_reverb, eq_boost], pre_drop).
impact_sound(noise_hit, [white_noise_burst, fast_decay, filter], transition).
impact_sound(orchestral_hit, [tutti_stab, large_reverb, eq], dramatic_moment).

%% vocal_chop(+Source, -Processing, -Rhythm)
%% Vocal chop techniques. (C2040)
vocal_chop(syllable, [pitch_shift, reverse, stutter], rhythmic_pattern).
vocal_chop(vowel, [formant_shift, granular, sustain], pad_texture).
vocal_chop(phrase, [slice, rearrange, effect], melodic_riff).
vocal_chop(breath, [amplify, layer, space], atmospheric).
