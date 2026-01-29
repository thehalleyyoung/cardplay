%% composition-patterns.pl - Compositional Pattern Knowledge Base for CardPlay AI
%% 
%% This Prolog knowledge base provides reasoning about:
%% - Music genres and their characteristics
%% - Arrangement structures and section ordering
%% - Rhythmic patterns (drums, bass, accompaniment)
%% - Compositional techniques and development rules
%%
%% Reference: cardplay2.md Part VII for algorithmic composition

%% ============================================================================
%% L132: GENRE DEFINITIONS
%% ============================================================================

%% genre/1 - All supported music genres
genre(lofi).
genre(house).
genre(techno).
genre(ambient).
genre(jazz).
genre(classical).
genre(rock).
genre(pop).
genre(rnb).
genre(hiphop).
genre(edm).
genre(drum_and_bass).
genre(dubstep).
genre(funk).
genre(soul).
genre(blues).
genre(country).
genre(folk).
genre(latin).
genre(reggae).
genre(metal).
genre(indie).
genre(synthwave).
genre(chillwave).
genre(trap).
genre(world).
genre(carnatic).
genre(cinematic).
genre(celtic).
genre(chinese).
genre(galant).

%% ============================================================================
%% L133: GENRE CHARACTERISTICS
%% ============================================================================

%% genre_characteristic/2 - Musical characteristics of each genre
genre_characteristic(lofi, relaxed).
genre_characteristic(lofi, nostalgic).
genre_characteristic(lofi, warm).
genre_characteristic(lofi, imperfect).
genre_characteristic(lofi, textured).

genre_characteristic(house, danceable).
genre_characteristic(house, four_on_floor).
genre_characteristic(house, groovy).
genre_characteristic(house, repetitive).

genre_characteristic(techno, mechanical).
genre_characteristic(techno, driving).
genre_characteristic(techno, minimalist).
genre_characteristic(techno, hypnotic).

genre_characteristic(ambient, atmospheric).
genre_characteristic(ambient, spacious).
genre_characteristic(ambient, textural).
genre_characteristic(ambient, meditative).
genre_characteristic(ambient, slow_evolving).

genre_characteristic(jazz, improvisational).
genre_characteristic(jazz, complex_harmony).
genre_characteristic(jazz, swing_feel).
genre_characteristic(jazz, expressive).
genre_characteristic(jazz, dynamic).

genre_characteristic(classical, formal).
genre_characteristic(classical, orchestral).
genre_characteristic(classical, thematic).
genre_characteristic(classical, dynamic).
genre_characteristic(classical, structured).

genre_characteristic(rock, energetic).
genre_characteristic(rock, guitar_driven).
genre_characteristic(rock, powerful).
genre_characteristic(rock, verse_chorus).

genre_characteristic(pop, catchy).
genre_characteristic(pop, hook_driven).
genre_characteristic(pop, accessible).
genre_characteristic(pop, verse_chorus).

genre_characteristic(hiphop, rhythmic).
genre_characteristic(hiphop, sample_based).
genre_characteristic(hiphop, groove_centric).
genre_characteristic(hiphop, layered).

genre_characteristic(trap, heavy_bass).
genre_characteristic(trap, hi_hat_rolls).
genre_characteristic(trap, eight08_kicks).
genre_characteristic(trap, atmospheric).

genre_characteristic(funk, syncopated).
genre_characteristic(funk, groove_centric).
genre_characteristic(funk, bass_heavy).
genre_characteristic(funk, rhythmic).

genre_characteristic(cinematic, epic).
genre_characteristic(cinematic, dynamic).
genre_characteristic(cinematic, orchestral).
genre_characteristic(cinematic, emotional).

genre_characteristic(celtic, modal).
genre_characteristic(celtic, dance_tunes).
genre_characteristic(celtic, ornamented).
genre_characteristic(celtic, aabb_form).
genre_characteristic(celtic, drone_based).

genre_characteristic(chinese, pentatonic).
genre_characteristic(chinese, heterophonic).
genre_characteristic(chinese, ornamented).
genre_characteristic(chinese, timbre_rich).

genre_characteristic(galant, schemata_driven).
genre_characteristic(galant, phrase_regular).
genre_characteristic(galant, cadential).
genre_characteristic(galant, classical_era).

%% ============================================================================
%% L134: GENRE TEMPO RANGES
%% ============================================================================

%% genre_tempo_range/3 - genre_tempo_range(Genre, MinBPM, MaxBPM)
genre_tempo_range(lofi, 60, 90).
genre_tempo_range(house, 118, 130).
genre_tempo_range(techno, 125, 150).
genre_tempo_range(ambient, 40, 100).
genre_tempo_range(jazz, 80, 200).
genre_tempo_range(classical, 40, 180).
genre_tempo_range(rock, 100, 160).
genre_tempo_range(pop, 90, 130).
genre_tempo_range(rnb, 60, 100).
genre_tempo_range(hiphop, 80, 115).
genre_tempo_range(edm, 120, 150).
genre_tempo_range(drum_and_bass, 160, 180).
genre_tempo_range(dubstep, 138, 142).
genre_tempo_range(funk, 95, 120).
genre_tempo_range(soul, 70, 110).
genre_tempo_range(blues, 60, 120).
genre_tempo_range(country, 80, 140).
genre_tempo_range(folk, 70, 130).
genre_tempo_range(latin, 90, 130).
genre_tempo_range(reggae, 60, 90).
genre_tempo_range(metal, 100, 200).
genre_tempo_range(indie, 90, 140).
genre_tempo_range(synthwave, 80, 120).
genre_tempo_range(chillwave, 70, 110).
genre_tempo_range(trap, 130, 170).
genre_tempo_range(carnatic, 60, 180).
genre_tempo_range(cinematic, 60, 160).
genre_tempo_range(celtic, 80, 150).
genre_tempo_range(chinese, 60, 160).
genre_tempo_range(galant, 60, 140).

%% ============================================================================
%% L135: GENRE TYPICAL INSTRUMENTS
%% ============================================================================

%% genre_typical_instruments/2 - genre_typical_instruments(Genre, InstrumentList)
genre_typical_instruments(lofi, [piano, rhodes, vinyl_crackle, drums, bass, pad]).
genre_typical_instruments(house, [kick, hihat, clap, bass, synth_stab, pad, vocal_chop]).
genre_typical_instruments(techno, [kick, hihat, synth_lead, bass, pad, fx]).
genre_typical_instruments(ambient, [pad, strings, bells, texture, drone, piano]).
genre_typical_instruments(jazz, [piano, upright_bass, drums, saxophone, trumpet, guitar]).
genre_typical_instruments(classical, [strings, woodwinds, brass, percussion, piano, harp]).
genre_typical_instruments(rock, [electric_guitar, bass_guitar, drums, vocals]).
genre_typical_instruments(pop, [synth, piano, drums, bass, vocals, strings]).
genre_typical_instruments(hiphop, [drums, bass_808, samples, synth, vocal]).
genre_typical_instruments(trap, [bass_808, hihat, snare, bells, strings, vocal]).
genre_typical_instruments(funk, [bass, drums, guitar, horns, organ, clavinet]).
genre_typical_instruments(cinematic, [orchestra, percussion, choir, synth, piano]).
genre_typical_instruments(celtic, [fiddle, flute, whistle, pipes, bodhran, harp, bouzouki, guitar]).
genre_typical_instruments(chinese, [erhu, dizi, guzheng, pipa, guqin, sheng, suona, gongs, percussion]).
genre_typical_instruments(galant, [strings, harpsichord, fortepiano, oboe, bassoon, horn]).

%% ============================================================================
%% L136: GENRE HARMONIC LANGUAGE
%% ============================================================================

%% genre_harmonic_language/2 - Typical harmonic style for genre
genre_harmonic_language(lofi, extended_chords).
genre_harmonic_language(lofi, jazz_voicings).
genre_harmonic_language(house, simple_triads).
genre_harmonic_language(house, modal).
genre_harmonic_language(techno, minimal_harmony).
genre_harmonic_language(techno, drone_based).
genre_harmonic_language(ambient, modal).
genre_harmonic_language(ambient, open_voicings).
genre_harmonic_language(jazz, complex_voicings).
genre_harmonic_language(jazz, extended_chords).
genre_harmonic_language(jazz, ii_v_i).
genre_harmonic_language(classical, functional_harmony).
genre_harmonic_language(classical, voice_leading).
genre_harmonic_language(rock, power_chords).
genre_harmonic_language(rock, simple_progressions).
genre_harmonic_language(pop, diatonic).
genre_harmonic_language(pop, four_chord).
genre_harmonic_language(hiphop, sampled).
genre_harmonic_language(hiphop, looped).
genre_harmonic_language(trap, minor_keys).
genre_harmonic_language(trap, dark_modes).
genre_harmonic_language(funk, seventh_chords).
genre_harmonic_language(funk, dominant_sevenths).
genre_harmonic_language(cinematic, modal_mixture).
genre_harmonic_language(cinematic, chromatic).
genre_harmonic_language(celtic, modal).
genre_harmonic_language(celtic, drone_based).
genre_harmonic_language(celtic, simple_progressions).
genre_harmonic_language(chinese, pentatonic).
genre_harmonic_language(chinese, modal).
genre_harmonic_language(chinese, heterophonic).
genre_harmonic_language(galant, functional_harmony).
genre_harmonic_language(galant, schemata).
genre_harmonic_language(galant, cadential_patterns).

%% ============================================================================
%% L137: GENRE RHYTHMIC FEEL
%% ============================================================================

%% genre_rhythmic_feel/2 - Rhythmic characteristics
genre_rhythmic_feel(lofi, relaxed_swing).
genre_rhythmic_feel(lofi, laid_back).
genre_rhythmic_feel(house, four_on_floor).
genre_rhythmic_feel(house, offbeat_hihat).
genre_rhythmic_feel(techno, driving).
genre_rhythmic_feel(techno, mechanical).
genre_rhythmic_feel(ambient, free_time).
genre_rhythmic_feel(ambient, pulse_based).
genre_rhythmic_feel(jazz, swing).
genre_rhythmic_feel(jazz, triplet_feel).
genre_rhythmic_feel(classical, strict_time).
genre_rhythmic_feel(classical, rubato).
genre_rhythmic_feel(rock, straight).
genre_rhythmic_feel(rock, backbeat).
genre_rhythmic_feel(pop, straight).
genre_rhythmic_feel(pop, danceable).
genre_rhythmic_feel(hiphop, boom_bap).
genre_rhythmic_feel(hiphop, syncopated).
genre_rhythmic_feel(trap, triplet_hihat).
genre_rhythmic_feel(trap, half_time).
genre_rhythmic_feel(funk, syncopated).
genre_rhythmic_feel(funk, sixteenth_note).
genre_rhythmic_feel(cinematic, free).
genre_rhythmic_feel(cinematic, marcato).
genre_rhythmic_feel(celtic, jig_reel_feel).
genre_rhythmic_feel(celtic, danceable).
genre_rhythmic_feel(chinese, free_rhythm).
genre_rhythmic_feel(chinese, flexible_time).
genre_rhythmic_feel(galant, strict_time).
genre_rhythmic_feel(galant, phrase_regular).

%% ============================================================================
%% L138: PHRASE LENGTHS
%% ============================================================================

%% phrase_length/2 - Typical phrase lengths in bars for each genre
phrase_length(lofi, 4).
phrase_length(lofi, 8).
phrase_length(house, 4).
phrase_length(house, 8).
phrase_length(house, 16).
phrase_length(techno, 4).
phrase_length(techno, 8).
phrase_length(techno, 16).
phrase_length(ambient, 8).
phrase_length(ambient, 16).
phrase_length(ambient, 32).
phrase_length(jazz, 4).
phrase_length(jazz, 8).
phrase_length(jazz, 12).
phrase_length(classical, 4).
phrase_length(classical, 8).
phrase_length(classical, 16).
phrase_length(rock, 4).
phrase_length(rock, 8).
phrase_length(pop, 4).
phrase_length(pop, 8).
phrase_length(hiphop, 4).
phrase_length(hiphop, 8).
phrase_length(trap, 4).
phrase_length(trap, 8).
phrase_length(funk, 4).
phrase_length(funk, 8).
phrase_length(cinematic, 4).
phrase_length(cinematic, 8).
phrase_length(cinematic, 16).
phrase_length(celtic, 8).
phrase_length(celtic, 16).
phrase_length(chinese, 4).
phrase_length(chinese, 8).
phrase_length(chinese, 16).
phrase_length(galant, 4).
phrase_length(galant, 8).

%% ============================================================================
%% L139: SECTION TYPES
%% ============================================================================

%% section_type/1 - All section types
section_type(intro).
section_type(verse).
section_type(pre_chorus).
section_type(chorus).
section_type(post_chorus).
section_type(bridge).
section_type(outro).
section_type(drop).
section_type(buildup).
section_type(breakdown).
section_type(solo).
section_type(interlude).
section_type(hook).
section_type(refrain).
section_type(coda).
section_type(development).
section_type(recapitulation).
section_type(exposition).
section_type(transition).
section_type(fill).

%% section_energy/2 - Typical energy level (1-10)
section_energy(intro, 3).
section_energy(verse, 5).
section_energy(pre_chorus, 6).
section_energy(chorus, 8).
section_energy(post_chorus, 7).
section_energy(bridge, 5).
section_energy(outro, 3).
section_energy(drop, 10).
section_energy(buildup, 7).
section_energy(breakdown, 4).
section_energy(solo, 7).
section_energy(interlude, 4).
section_energy(hook, 9).

%% ============================================================================
%% L140: SECTION ORDERING
%% ============================================================================

%% section_order/2 - Typical section orderings for genres
section_order(pop, [intro, verse, chorus, verse, chorus, bridge, chorus, outro]).
section_order(rock, [intro, verse, chorus, verse, chorus, solo, chorus, outro]).
section_order(jazz, [intro, head, solo, solo, head, outro]).
section_order(classical, [exposition, development, recapitulation, coda]).
section_order(house, [intro, buildup, drop, breakdown, buildup, drop, outro]).
section_order(techno, [intro, buildup, drop, breakdown, buildup, drop, outro]).
section_order(ambient, [intro, development, development, development, outro]).
section_order(lofi, [intro, verse, verse, bridge, verse, outro]).
section_order(hiphop, [intro, verse, hook, verse, hook, verse, hook, outro]).
section_order(trap, [intro, verse, hook, verse, hook, drop, outro]).
section_order(cinematic, [intro, buildup, climax, resolution, outro]).

%% valid_section_transition/2 - Which sections can follow which
valid_section_transition(intro, verse).
valid_section_transition(intro, chorus).
valid_section_transition(intro, buildup).
valid_section_transition(verse, verse).
valid_section_transition(verse, pre_chorus).
valid_section_transition(verse, chorus).
valid_section_transition(verse, hook).
valid_section_transition(pre_chorus, chorus).
valid_section_transition(chorus, verse).
valid_section_transition(chorus, bridge).
valid_section_transition(chorus, outro).
valid_section_transition(chorus, breakdown).
valid_section_transition(chorus, post_chorus).
valid_section_transition(post_chorus, verse).
valid_section_transition(bridge, chorus).
valid_section_transition(bridge, outro).
valid_section_transition(bridge, solo).
valid_section_transition(solo, chorus).
valid_section_transition(solo, verse).
valid_section_transition(buildup, drop).
valid_section_transition(buildup, chorus).
valid_section_transition(drop, breakdown).
valid_section_transition(drop, outro).
valid_section_transition(breakdown, buildup).
valid_section_transition(breakdown, verse).
valid_section_transition(hook, verse).
valid_section_transition(hook, outro).

%% ============================================================================
%% L141: ARRANGEMENT TEMPLATES
%% ============================================================================

%% arrangement_template/3 - arrangement_template(Genre, DurationBars, SectionList)
arrangement_template(pop, 64, [intro, verse, chorus, verse, chorus, bridge, chorus, outro]).
arrangement_template(pop, 128, [intro, verse, pre_chorus, chorus, verse, pre_chorus, chorus, bridge, chorus, chorus, outro]).
arrangement_template(rock, 80, [intro, verse, chorus, verse, chorus, solo, chorus, outro]).
arrangement_template(house, 128, [intro, buildup, drop, breakdown, buildup, drop, breakdown, outro]).
arrangement_template(house, 64, [intro, buildup, drop, breakdown, drop, outro]).
arrangement_template(techno, 128, [intro, buildup, drop, breakdown, buildup, drop, outro]).
arrangement_template(lofi, 64, [intro, verse, verse, bridge, verse, outro]).
arrangement_template(ambient, 128, [intro, development, development, outro]).
arrangement_template(hiphop, 96, [intro, verse, hook, verse, hook, verse, hook, outro]).
arrangement_template(trap, 80, [intro, verse, hook, verse, hook, drop, outro]).
arrangement_template(jazz, 64, [intro, head, solo, solo, head, outro]).
arrangement_template(cinematic, 96, [intro, buildup, climax, resolution, outro]).

%% ============================================================================
%% L142: ENERGY CURVES
%% ============================================================================

%% energy_curve/2 - Typical energy progression patterns
energy_curve(pop, [3, 5, 8, 5, 8, 5, 9, 3]).
energy_curve(rock, [4, 6, 8, 6, 8, 7, 9, 3]).
energy_curve(house, [2, 6, 10, 4, 8, 10, 4, 2]).
energy_curve(techno, [3, 7, 10, 5, 8, 10, 3]).
energy_curve(ambient, [2, 4, 5, 6, 5, 3]).
energy_curve(jazz, [4, 6, 7, 8, 6, 4]).
energy_curve(lofi, [3, 5, 5, 4, 5, 3]).
energy_curve(cinematic, [2, 6, 10, 5, 2]).
energy_curve(hiphop, [3, 6, 8, 6, 8, 6, 8, 3]).
energy_curve(trap, [3, 6, 9, 6, 9, 10, 2]).

%% ============================================================================
%% L143: DENSITY RULES
%% ============================================================================

%% density_rule/3 - density_rule(SectionType, DensityLevel, InstrumentCount)
%% DensityLevel: sparse, medium, dense
density_rule(intro, sparse, 2).
density_rule(intro, medium, 4).
density_rule(verse, medium, 4).
density_rule(verse, dense, 6).
density_rule(pre_chorus, medium, 5).
density_rule(chorus, dense, 8).
density_rule(bridge, sparse, 3).
density_rule(bridge, medium, 5).
density_rule(drop, dense, 8).
density_rule(breakdown, sparse, 2).
density_rule(breakdown, medium, 4).
density_rule(buildup, medium, 5).
density_rule(outro, sparse, 2).
density_rule(solo, medium, 5).

%% ============================================================================
%% L144: LAYERING RULES
%% ============================================================================

%% layer_add_rule/3 - When to add layers
%% layer_add_rule(SectionType, InstrumentType, Beat)
layer_add_rule(buildup, synth, 1).
layer_add_rule(buildup, percussion, 5).
layer_add_rule(buildup, bass, 9).
layer_add_rule(intro, pad, 1).
layer_add_rule(intro, melody, 5).
layer_add_rule(verse, bass, 1).
layer_add_rule(verse, drums, 1).
layer_add_rule(chorus, all, 1).

%% layer_remove_rule/3 - When to remove layers
layer_remove_rule(breakdown, drums, 1).
layer_remove_rule(breakdown, bass, 1).
layer_remove_rule(outro, melody, 9).
layer_remove_rule(outro, drums, 13).

%% ============================================================================
%% L145: CONTRAST RULES
%% ============================================================================

%% contrast_rule/2 - Ensures sufficient contrast between sections
contrast_rule(verse_to_chorus, [add_harmony, increase_density, raise_energy]).
contrast_rule(chorus_to_verse, [reduce_density, lower_energy]).
contrast_rule(buildup_to_drop, [add_bass, add_drums, maximum_energy]).
contrast_rule(drop_to_breakdown, [remove_drums, reduce_density, lower_energy]).
contrast_rule(verse_to_bridge, [change_key, reduce_instruments, new_melody]).

%% minimum_contrast/2 - Minimum number of changes between section types
minimum_contrast(verse, chorus, 3).
minimum_contrast(chorus, verse, 2).
minimum_contrast(buildup, drop, 4).
minimum_contrast(drop, breakdown, 3).

%% ============================================================================
%% L146: REPETITION RULES
%% ============================================================================

%% repetition_rule/2 - Acceptable repetition amounts
repetition_rule(max_identical_bars, 4).
repetition_rule(max_identical_sections, 2).
repetition_rule(variation_required_after, 8).
repetition_rule(hook_repeat_max, 4).
repetition_rule(verse_repeat_max, 3).

%% genre_repetition_tolerance/2 - How much repetition each genre allows
genre_repetition_tolerance(house, high).
genre_repetition_tolerance(techno, high).
genre_repetition_tolerance(ambient, high).
genre_repetition_tolerance(pop, medium).
genre_repetition_tolerance(rock, medium).
genre_repetition_tolerance(jazz, low).
genre_repetition_tolerance(classical, low).
genre_repetition_tolerance(lofi, medium).
genre_repetition_tolerance(hiphop, medium).

%% ============================================================================
%% L147: VARIATION TECHNIQUES
%% ============================================================================

%% variation_technique/2 - variation_technique(TechniqueId, Description)
variation_technique(sequence, repeat_pattern_at_different_pitch_level).
variation_technique(inversion, flip_interval_directions).
variation_technique(retrograde, play_melody_backwards).
variation_technique(augmentation, double_note_durations).
variation_technique(diminution, halve_note_durations).
variation_technique(fragmentation, use_only_part_of_motif).
variation_technique(extension, extend_phrase_with_additional_notes).
variation_technique(ornamentation, add_decorative_notes).
variation_technique(rhythmic_variation, change_rhythm_while_keeping_pitches).
variation_technique(harmonic_variation, change_underlying_harmony).
variation_technique(timbral_variation, change_instrument_or_sound).
variation_technique(dynamic_variation, change_volume_or_intensity).
variation_technique(register_shift, move_to_different_octave).

%% applicable_variation/2 - Which variations work for which genres
applicable_variation(classical, sequence).
applicable_variation(classical, inversion).
applicable_variation(classical, retrograde).
applicable_variation(classical, augmentation).
applicable_variation(classical, diminution).
applicable_variation(jazz, harmonic_variation).
applicable_variation(jazz, ornamentation).
applicable_variation(jazz, rhythmic_variation).
applicable_variation(pop, extension).
applicable_variation(pop, timbral_variation).
applicable_variation(house, fragmentation).
applicable_variation(house, timbral_variation).
applicable_variation(techno, fragmentation).
applicable_variation(techno, dynamic_variation).
applicable_variation(lofi, register_shift).
applicable_variation(lofi, ornamentation).
applicable_variation(hiphop, fragmentation).
applicable_variation(hiphop, harmonic_variation).

%% ============================================================================
%% L148: BASS PATTERNS
%% ============================================================================

%% bass_pattern/2 - Common bass patterns by genre
bass_pattern(house, root_octave).
bass_pattern(house, walking_bass).
bass_pattern(house, offbeat).
bass_pattern(techno, pulsing_root).
bass_pattern(techno, arpeggio).
bass_pattern(lofi, jazzy_walk).
bass_pattern(lofi, root_fifth).
bass_pattern(jazz, walking_bass).
bass_pattern(jazz, pedal_tone).
bass_pattern(rock, root_fifth_eighth).
bass_pattern(pop, root_fifth).
bass_pattern(hiphop, eight08_boom).
bass_pattern(trap, eight08_slides).
bass_pattern(funk, syncopated_slap).
bass_pattern(funk, octave_jumps).
bass_pattern(reggae, one_drop).

%% bass_pattern_steps/2 - Pattern definitions in scale degrees
bass_pattern_steps(root_octave, [1, 1, 1, 8]).
bass_pattern_steps(root_fifth, [1, 5, 1, 5]).
bass_pattern_steps(walking_bass, [1, 3, 5, 6]).
bass_pattern_steps(pulsing_root, [1, 1, 1, 1]).
bass_pattern_steps(offbeat, [rest, 1, rest, 1]).
bass_pattern_steps(arpeggio, [1, 3, 5, 3]).
bass_pattern_steps(jazzy_walk, [1, 2, 3, 5]).
bass_pattern_steps(root_fifth_eighth, [1, 5, 8, 5]).
bass_pattern_steps(eight08_boom, [1, rest, rest, rest]).
bass_pattern_steps(eight08_slides, [1, slide, rest, 1]).
bass_pattern_steps(syncopated_slap, [1, rest, 5, rest, 1, rest, 3, rest]).
bass_pattern_steps(one_drop, [rest, rest, rest, 1]).
bass_pattern_steps(pedal_tone, [1, 1, 1, 1]).
bass_pattern_steps(octave_jumps, [1, 8, 1, 8]).

%% ============================================================================
%% L149: DRUM PATTERNS
%% ============================================================================

%% drum_pattern/2 - Common drum patterns by genre
drum_pattern(house, four_on_floor).
drum_pattern(house, broken_beat).
drum_pattern(techno, driving_four).
drum_pattern(techno, minimal_beat).
drum_pattern(lofi, boom_bap).
drum_pattern(lofi, lazy_swing).
drum_pattern(hiphop, boom_bap).
drum_pattern(hiphop, trap_style).
drum_pattern(trap, trap_hihat).
drum_pattern(rock, standard_rock).
drum_pattern(pop, four_on_floor).
drum_pattern(jazz, swing_ride).
drum_pattern(jazz, brushes).
drum_pattern(funk, funky_drummer).
drum_pattern(reggae, one_drop_drums).
drum_pattern(drum_and_bass, breakbeat).

%% drum_pattern_hits/2 - Pattern definitions [kick, snare, hihat]
%% Format: beat subdivisions (1-16 for 16th notes in 4/4)
drum_pattern_hits(four_on_floor, [[1,5,9,13], [5,13], [1,3,5,7,9,11,13,15]]).
drum_pattern_hits(driving_four, [[1,5,9,13], [5,13], [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]]).
drum_pattern_hits(boom_bap, [[1,11], [5,13], [1,5,9,13]]).
drum_pattern_hits(lazy_swing, [[1,10], [5,13], [1,4,7,10,13]]).
drum_pattern_hits(standard_rock, [[1,9], [5,13], [1,3,5,7,9,11,13,15]]).
drum_pattern_hits(trap_hihat, [[1], [5,13], [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]]).
drum_pattern_hits(swing_ride, [[1,9], [5], [1,3,5,7,9,11,13]]).
drum_pattern_hits(funky_drummer, [[1,4,9,12], [5,13], [1,3,5,7,9,11,13,15]]).
drum_pattern_hits(one_drop_drums, [[9], [5,13], [1,5,9,13]]).
drum_pattern_hits(breakbeat, [[1,4,10,13], [5,11], [1,3,5,7,9,11,13,15]]).

%% ============================================================================
%% L150: CHORD RHYTHM (Harmonic Rhythm)
%% ============================================================================

%% chord_rhythm/2 - Typical chord change rates (changes per bar)
chord_rhythm(house, 0.5).       % Change every 2 bars
chord_rhythm(techno, 0.25).     % Change every 4 bars
chord_rhythm(ambient, 0.25).
chord_rhythm(lofi, 2).          % 2 chords per bar
chord_rhythm(jazz, 2).
chord_rhythm(pop, 1).           % 1 chord per bar
chord_rhythm(rock, 1).
chord_rhythm(hiphop, 1).
chord_rhythm(classical, 1).
chord_rhythm(funk, 2).
chord_rhythm(trap, 0.5).
chord_rhythm(cinematic, 0.5).

%% ============================================================================
%% L151: MELODIC RANGE
%% ============================================================================

%% melodic_range/3 - melodic_range(InstrumentType, LowNote, HighNote)
%% Notes as MIDI numbers
melodic_range(soprano_voice, 60, 84).
melodic_range(alto_voice, 53, 77).
melodic_range(tenor_voice, 48, 72).
melodic_range(bass_voice, 40, 64).
melodic_range(violin, 55, 96).
melodic_range(viola, 48, 84).
melodic_range(cello, 36, 72).
melodic_range(flute, 60, 96).
melodic_range(clarinet, 52, 88).
melodic_range(trumpet, 55, 82).
melodic_range(piano, 21, 108).
melodic_range(guitar, 40, 84).
melodic_range(bass_guitar, 28, 55).
melodic_range(synth_lead, 48, 84).
melodic_range(synth_bass, 24, 60).
melodic_range(rhodes, 48, 84).

%% ============================================================================
%% L152: COUNTERPOINT RULES
%% ============================================================================

%% counterpoint_rule/2 - Rules for independent melodic lines
counterpoint_rule(avoid_parallel_fifths, true).
counterpoint_rule(avoid_parallel_octaves, true).
counterpoint_rule(prefer_contrary_motion, true).
counterpoint_rule(max_leap_interval, 8).          % Octave
counterpoint_rule(resolve_dissonance, stepwise).
counterpoint_rule(approach_perfect_interval, oblique_or_contrary).
counterpoint_rule(voice_crossing, avoid).

%% species_counterpoint/2 - Classical species rules
species_counterpoint(first_species, note_against_note).
species_counterpoint(second_species, two_against_one).
species_counterpoint(third_species, four_against_one).
species_counterpoint(fourth_species, syncopation).
species_counterpoint(fifth_species, florid).

%% ============================================================================
%% L153: HARMONIC RHYTHM PATTERNS
%% ============================================================================

%% harmony_rhythm/2 - Harmonic rhythm patterns
harmony_rhythm(static, [1]).                      % Whole bar
harmony_rhythm(half_bar, [1, 3]).                 % Half notes
harmony_rhythm(quarter_bar, [1, 2, 3, 4]).        % Quarter notes
harmony_rhythm(syncopated, [1, 2.5, 4]).          % Syncopated changes
harmony_rhythm(pedal, [1]).                       % Static bass
harmony_rhythm(walking, [1, 2, 3, 4]).            % Walking changes

%% ============================================================================
%% L166-L173: ADVANCED COMPOSITION RULES
%% ============================================================================

%% L166: motif_development/2 - Rules for developing musical motifs
motif_development(repeat_with_variation, repeat_motif_with_small_changes).
motif_development(sequence, repeat_at_different_pitch_level).
motif_development(fragmentation, use_part_of_motif).
motif_development(extension, add_notes_to_end).
motif_development(interpolation, add_notes_in_middle).
motif_development(compression, shorten_note_values).
motif_development(expansion, lengthen_note_values).

%% L167: texture_transition/3 - Rules for smooth texture changes
texture_transition(monophonic, homophonic, gradual_add_voices).
texture_transition(homophonic, polyphonic, introduce_independence).
texture_transition(polyphonic, homophonic, unify_rhythm).
texture_transition(dense, sparse, gradual_remove).
texture_transition(sparse, dense, gradual_add).

%% L168: dynamic_contour/2 - Typical dynamic shapes
dynamic_contour(crescendo, [pp, p, mp, mf, f, ff]).
dynamic_contour(decrescendo, [ff, f, mf, mp, p, pp]).
dynamic_contour(swell, [p, mf, f, mf, p]).
dynamic_contour(terraced, [p, p, f, f, p, p]).
dynamic_contour(arch, [p, mf, f, mf, p]).
dynamic_contour(reverse_arch, [f, mf, p, mf, f]).

%% L169: articulation_pattern/2 - Articulation choices by genre
articulation_pattern(classical, [legato, staccato, tenuto, accent]).
articulation_pattern(jazz, [legato, ghost, accent, bend]).
articulation_pattern(rock, [accent, palm_mute, slide]).
articulation_pattern(funk, [staccato, ghost, accent]).
articulation_pattern(lofi, [legato, soft]).
articulation_pattern(electronic, [gate, slide, accent]).

%% L170: swing_feel/2 - Swing amount by genre (0.0 = straight, 0.67 = triplet)
swing_feel(jazz, 0.67).
swing_feel(lofi, 0.5).
swing_feel(blues, 0.67).
swing_feel(funk, 0.3).
swing_feel(hiphop, 0.4).
swing_feel(rock, 0.0).
swing_feel(pop, 0.0).
swing_feel(house, 0.0).
swing_feel(techno, 0.0).

%% L171: humanization_rule/3 - Rules for timing/velocity variation
humanization_rule(timing, lofi, 20).      % ms variation
humanization_rule(timing, jazz, 15).
humanization_rule(timing, electronic, 0).
humanization_rule(velocity, lofi, 20).    % velocity units
humanization_rule(velocity, jazz, 25).
humanization_rule(velocity, electronic, 5).

%% L172: fill_placement/2 - Where to place fills
fill_placement(every_4_bars, bar_4).
fill_placement(every_8_bars, bar_8).
fill_placement(before_section_change, last_bar).
fill_placement(before_chorus, pre_chorus_end).

%% L173: transition_technique/2 - Techniques for section transitions
transition_technique(riser, pitch_filter_sweep_up).
transition_technique(drop, silence_before_impact).
transition_technique(fill, drum_fill).
transition_technique(reverse_cymbal, reversed_crash).
transition_technique(filter_sweep, lowpass_filter_automation).
transition_technique(snare_roll, increasing_snare_density).
transition_technique(melodic_pickup, pickup_notes_into_new_section).
transition_technique(breath, brief_pause).

%% ============================================================================
%% QUERY HELPERS
%% ============================================================================

%% suggest_tempo/2 - Suggest a tempo for a genre
suggest_tempo(Genre, Tempo) :-
    genre_tempo_range(Genre, Min, Max),
    Tempo is (Min + Max) // 2.

%% suggest_arrangement/3 - Suggest arrangement for genre and length
suggest_arrangement(Genre, TargetLength, Sections) :-
    arrangement_template(Genre, TemplateLength, Sections),
    TemplateLength =< TargetLength,
    !.
suggest_arrangement(Genre, _, Sections) :-
    section_order(Genre, Sections).

%% suggest_next_section/3 - Suggest what section should come next
suggest_next_section(CurrentSection, Genre, NextSection) :-
    valid_section_transition(CurrentSection, NextSection),
    section_order(Genre, Order),
    member(NextSection, Order).

%% suggest_bass_pattern/2 - Suggest bass pattern for genre
suggest_bass_pattern(Genre, Pattern) :-
    bass_pattern(Genre, Pattern).

%% suggest_drum_pattern/2 - Suggest drum pattern for genre
suggest_drum_pattern(Genre, Pattern) :-
    drum_pattern(Genre, Pattern).

%% validate_section_sequence/2 - Check if section sequence is valid
validate_section_sequence([], valid).
validate_section_sequence([_], valid).
validate_section_sequence([S1, S2 | Rest], valid) :-
    valid_section_transition(S1, S2),
    validate_section_sequence([S2 | Rest], valid).
validate_section_sequence([S1, S2 | _], invalid(S1, S2)) :-
    \+ valid_section_transition(S1, S2).

%% genre_compatible/2 - Check if two genres are compatible for fusion
genre_compatible(G1, G2) :-
    genre_rhythmic_feel(G1, Feel),
    genre_rhythmic_feel(G2, Feel).

%% calculate_section_energy/2 - Get energy level for a section
calculate_section_energy(Section, Energy) :-
    section_energy(Section, Energy).

%% in_melodic_range/3 - Check if a note is in range for instrument
in_melodic_range(Instrument, Note, true) :-
    melodic_range(Instrument, Low, High),
    Note >= Low,
    Note =< High.
in_melodic_range(Instrument, Note, false) :-
    melodic_range(Instrument, Low, High),
    (Note < Low ; Note > High).
