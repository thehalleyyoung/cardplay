%% music-theory-fusion.pl - Cross-Cultural & Fusion Theory KB
%%
%% Provides predicates for:
%% - Scale & rhythm compatibility across cultures (C2052-C2053)
%% - Cultural element weighting & authenticity (C2054-C2055)
%% - Fusion genre definitions (C2056-C2060)
%% - Microtonality & translation in fusion (C2061-C2066)
%% - Universal musical concepts (C2076-C2083)
%% - Cross-cultural emotion & form mapping (C2081-C2082)
%%
%% Depends on: music-theory.pl, music-theory-indian.pl, music-theory-arabic.pl,
%%             music-theory-african.pl, music-theory-latin.pl

%% ============================================================================
%% SCALE & RHYTHM COMPATIBILITY (C2052-C2053)
%% ============================================================================

%% scale_compatibility(+Scale1, +Culture1, +Scale2, +Culture2, -Compatibility)
%% Measures how well two scales from different cultures can be combined. (C2052)
scale_compatibility(pentatonic_major, western, bilawal, indian, high).
scale_compatibility(pentatonic_minor, western, kafi, indian, high).
scale_compatibility(major, western, rast, arabic, moderate).
scale_compatibility(phrygian, western, hijaz, arabic, high).
scale_compatibility(dorian, western, kafi, indian, high).
scale_compatibility(lydian, western, yaman, indian, very_high).
scale_compatibility(mixolydian, western, khamaj, indian, high).
scale_compatibility(harmonic_minor, western, nahawand, arabic, very_high).
scale_compatibility(double_harmonic, western, hijaz_kar, arabic, very_high).
scale_compatibility(pentatonic_major, western, pentatonic_mandinka, african, high).
scale_compatibility(blues_scale, western, pentatonic_minor_mandinka, african, moderate).
scale_compatibility(major, western, major_son, latin, very_high).
scale_compatibility(minor, western, minor_tango, latin, very_high).
scale_compatibility(rast, arabic, bilawal, indian, high).
scale_compatibility(hijaz, arabic, bhairav, indian, very_high).
scale_compatibility(bayati, arabic, kafi, indian, moderate).

%% rhythm_fusion_rule(+Rhythm1, +Rhythm2, -FusionType, -Result)
%% Rules for combining rhythms from different traditions. (C2053)
rhythm_fusion_rule(four_four, tintal, overlay, aligned_strong_beats).
rhythm_fusion_rule(four_four, son_clave, clave_grid, syncopated_western).
rhythm_fusion_rule(twelve_eight, standard_bell, timeline_pulse, african_compound).
rhythm_fusion_rule(waltz, rupak, polymetric, three_over_seven).
rhythm_fusion_rule(backbeat, tresillo, hybrid_groove, latin_rock).
rhythm_fusion_rule(shuffle, bembe_bell, swung_timeline, blues_yoruba).
rhythm_fusion_rule(four_four, adi_tala, cyclic_grid, konnakol_beats).
rhythm_fusion_rule(breakbeat, tabla_theka, fusion_loop, indo_electronic).
rhythm_fusion_rule(bossa_pattern, samba_surdo, layered_brazilian, full_brazilian).
rhythm_fusion_rule(reggae_one_drop, maqsum, middle_eastern_reggae, dub_arabic).
rhythm_fusion_rule(four_on_floor, dhol_pattern, bhangra_edm, punjabi_electronic).
rhythm_fusion_rule(flamenco_compas, rumba_clave, rumba_fusion, spanish_cuban).

%% ============================================================================
%% CULTURAL ELEMENT WEIGHTING (C2054-C2055)
%% ============================================================================

%% cultural_element_weight(+Element, +Culture, -Authenticity)
%% How central an element is to a culture's music identity. (C2054)
cultural_element_weight(raga_system, indian, essential).
cultural_element_weight(tala_system, indian, essential).
cultural_element_weight(gamaka_ornaments, indian, very_high).
cultural_element_weight(drone, indian, high).
cultural_element_weight(improvisation, indian, very_high).
cultural_element_weight(maqam_system, arabic, essential).
cultural_element_weight(quarter_tones, arabic, very_high).
cultural_element_weight(taqsim, arabic, very_high).
cultural_element_weight(iqa_rhythm, arabic, high).
cultural_element_weight(tarab_aesthetic, arabic, essential).
cultural_element_weight(polyrhythm, african, essential).
cultural_element_weight(timeline_pattern, african, very_high).
cultural_element_weight(call_response, african, very_high).
cultural_element_weight(interlocking, african, high).
cultural_element_weight(drum_language, african, high).
cultural_element_weight(clave, latin, essential).
cultural_element_weight(syncopation, latin, very_high).
cultural_element_weight(tumbao, latin, high).
cultural_element_weight(montuno, latin, high).
cultural_element_weight(backbeat, western_pop, essential).
cultural_element_weight(chord_progression, western_pop, very_high).
cultural_element_weight(verse_chorus_form, western_pop, high).
cultural_element_weight(functional_harmony, western_classical, essential).
cultural_element_weight(counterpoint, western_classical, very_high).
cultural_element_weight(orchestration, western_classical, high).
cultural_element_weight(swing_feel, jazz, essential).
cultural_element_weight(blue_notes, jazz, very_high).
cultural_element_weight(chord_extensions, jazz, very_high).
cultural_element_weight(improvisation, jazz, essential).

%% appropriation_vs_appreciation(+Usage, +Context, -Assessment)
%% Guidance on respectful cultural fusion. (C2055)
appropriation_vs_appreciation(surface_borrowing, commercial, caution_needed).
appropriation_vs_appreciation(deep_study, collaborative, appreciation).
appropriation_vs_appreciation(collaboration_with_practitioners, any, appreciation).
appropriation_vs_appreciation(credit_and_context, any, respectful).
appropriation_vs_appreciation(stereotyping, any, appropriation).
appropriation_vs_appreciation(sacred_elements, commercial, inappropriate).
appropriation_vs_appreciation(sacred_elements, educational, context_dependent).
appropriation_vs_appreciation(traditional_melody, original_arrangement, transformative).
appropriation_vs_appreciation(structural_influence, new_composition, common_practice).
appropriation_vs_appreciation(instrument_adoption, any, generally_positive).

%% ============================================================================
%% FUSION GENRE DEFINITIONS (C2056-C2060)
%% ============================================================================

%% fusion_genre(+GenreName, +Culture1, +Culture2, -Characteristics)
%% Named fusion genres with their cultural sources. (C2056)
fusion_genre(indo_jazz, indian, jazz, [raga_harmony, tala_swing, improv_exchange]).
fusion_genre(afrobeat, african, funk, [yoruba_rhythm, jazz_horns, political_lyrics]).
fusion_genre(bossa_nova, brazilian, jazz, [samba_rhythm, jazz_harmony, intimate_vocal]).
fusion_genre(flamenco_jazz, spanish, jazz, [compas_feel, jazz_voicings, duende]).
fusion_genre(ethio_jazz, ethiopian, jazz, [pentatonic_melody, jazz_arrangement, unique_scales]).
fusion_genre(celtic_fusion, irish, rock, [modal_melody, driving_rhythm, trad_instruments]).
fusion_genre(rai, north_african, pop, [arabic_melody, electronic_production, youth_culture]).
fusion_genre(qawwali_fusion, sufi_pakistani, electronic, [ecstatic_vocal, beats, devotional]).
fusion_genre(bhangra_pop, punjabi, pop, [dhol_rhythm, synth_bass, celebratory]).
fusion_genre(reggaeton, caribbean, hip_hop, [dembow_rhythm, rap_flow, latin_melody]).
fusion_genre(kpop, korean, western_pop, [precision_production, group_dynamics, genre_blending]).
fusion_genre(afro_cuban_jazz, cuban, jazz, [clave_foundation, jazz_harmony, montuno]).
fusion_genre(desert_blues, west_african, blues, [pentatonic_guitar, hypnotic_rhythm, griot_tradition]).
fusion_genre(gamelan_ambient, javanese, ambient, [metalophone_timbre, cyclic_structure, spatial]).

%% world_beat(+Element, +WesternTreatment, -Result)
%% How traditional elements are treated in "world beat" music. (C2057)
world_beat(tabla_loop, sampled_and_looped, rhythmic_texture).
world_beat(sitar_riff, harmonized_with_chords, melodic_hook).
world_beat(kora_pattern, multitracked, layered_texture).
world_beat(oud_melody, autotuned_and_quantized, pop_melody).
world_beat(djembe_pattern, layered_with_kit, hybrid_drums).
world_beat(throat_singing, ambient_backdrop, textural_pad).
world_beat(gamelan_sample, pitched_and_sliced, melodic_fragment).
world_beat(didgeridoo_drone, bass_layer, sub_foundation).

%% ethno_jazz(+TraditionElement, +JazzElement, -Integration)
%% How traditional elements integrate with jazz. (C2058)
ethno_jazz(raga_melody, jazz_reharmonization, modal_jazz_fusion).
ethno_jazz(maqam_improvisation, jazz_rhythm_section, taqsim_over_changes).
ethno_jazz(african_polyrhythm, jazz_harmony, groove_based_jazz).
ethno_jazz(flamenco_cante, jazz_voicings, andalusian_jazz).
ethno_jazz(brazilian_rhythm, jazz_melody, brazilian_jazz).
ethno_jazz(balkan_meter, jazz_improv, odd_meter_jazz).
ethno_jazz(klezmer_ornament, jazz_solo, jewish_jazz).

%% global_pop(+LocalElement, +PopElement, -Commercial)
%% How local elements enter global pop music. (C2059)
global_pop(reggaeton_dembow, four_four_grid, latin_pop_hit).
global_pop(afrobeats_groove, pop_melody, afro_pop).
global_pop(kpop_choreography, western_production, global_idol).
global_pop(bollywood_melody, edm_drop, desi_pop).
global_pop(reggae_rhythm, pop_chord, tropical_pop).
global_pop(dancehall_riddim, hip_hop_flow, caribbean_pop).
global_pop(arab_maqam, auto_tune, arabic_pop).

%% ambient_world(+TraditionalSource, +ElectronicTreatment, -Mood)
%% Traditional sounds in ambient/electronic contexts. (C2060)
ambient_world(tibetan_bowls, reverb_and_delay, meditative).
ambient_world(shakuhachi, granular_processing, contemplative).
ambient_world(oud_improvisation, looped_and_layered, hypnotic).
ambient_world(mbira, reversed_and_stretched, dreamlike).
ambient_world(throat_singing, spectral_freeze, otherworldly).
ambient_world(gamelan, time_stretched, crystalline).
ambient_world(kora, delay_feedback, cascading).
ambient_world(nay_flute, convolution_reverb, spatial).

%% ============================================================================
%% MICROTONALITY & TRANSLATION (C2061-C2066)
%% ============================================================================

%% microtonality_in_fusion(+Source, +Approximation, -Compromise)
%% How microtonal systems are handled in fusion contexts. (C2061)
microtonality_in_fusion(arabic_quarter_tones, equal_temperament, lose_inflection).
microtonality_in_fusion(arabic_quarter_tones, pitch_bend, close_approximation).
microtonality_in_fusion(arabic_quarter_tones, custom_tuning, authentic_but_limited).
microtonality_in_fusion(indian_shruti, equal_temperament, simplified).
microtonality_in_fusion(indian_shruti, just_intonation, mathematically_close).
microtonality_in_fusion(indian_shruti, gamaka_simulation, expressive_compromise).
microtonality_in_fusion(turkish_comma, equal_temperament, westernized).
microtonality_in_fusion(turkish_comma, tet(53), close_match).
microtonality_in_fusion(african_equiheptatonic, equal_temperament, near_match).
microtonality_in_fusion(gamelan_pelog, equal_temperament, significant_loss).
microtonality_in_fusion(gamelan_slendro, equal_temperament, moderate_loss).
microtonality_in_fusion(blues_inflection, pitch_bend, authentic).

%% rhythm_translation(+Original, +Target, -Adaptation)
%% How rhythmic patterns translate between contexts. (C2062)
rhythm_translation(son_clave, rock_beat, syncopated_rock).
rhythm_translation(adi_tala_8, four_four, truncated_or_extended).
rhythm_translation(twelve_eight_bell, four_four_shuffle, swing_approximation).
rhythm_translation(flamenco_12, four_four, accent_pattern_only).
rhythm_translation(tabla_theka, drum_kit, kick_snare_mapping).
rhythm_translation(tresillo, electronic_grid, quantized_syncopation).
rhythm_translation(gahu_16, four_four, simplified_timeline).

%% instrumentation_fusion(+TraditionalInstr, +WesternInstr, -Blend)
%% How traditional and western instruments combine. (C2063)
instrumentation_fusion(sitar, electric_guitar, sympathetic_strings_vs_sustain).
instrumentation_fusion(tabla, drum_kit, complementary_timbres).
instrumentation_fusion(oud, acoustic_guitar, similar_register_blend).
instrumentation_fusion(kora, harp, arpeggiated_blend).
instrumentation_fusion(nay, flute, breath_tone_blend).
instrumentation_fusion(erhu, violin, similar_range_contrast).
instrumentation_fusion(djembe, cajon, percussion_dialogue).
instrumentation_fusion(mbira, vibraphone, bell_tone_blend).
instrumentation_fusion(shakuhachi, clarinet, breath_contrast).
instrumentation_fusion(bandoneon, accordion, reed_family_blend).
instrumentation_fusion(sarangi, cello, bowed_string_blend).
instrumentation_fusion(qanun, piano, plucked_vs_hammered).

%% timbre_cultural_marker(+Timbre, +Culture, -Strength)
%% How strongly a timbre signals a specific culture. (C2064)
timbre_cultural_marker(sitar_buzz, indian, very_strong).
timbre_cultural_marker(tabla_bayan, indian, strong).
timbre_cultural_marker(oud_pluck, arabic, strong).
timbre_cultural_marker(nay_breath, arabic, very_strong).
timbre_cultural_marker(kora_bell, west_african, strong).
timbre_cultural_marker(djembe_slap, west_african, strong).
timbre_cultural_marker(steel_drum, caribbean, very_strong).
timbre_cultural_marker(bandoneon_squeeze, argentine, very_strong).
timbre_cultural_marker(flamenco_rasgueado, spanish, very_strong).
timbre_cultural_marker(shamisen_sawari, japanese, very_strong).
timbre_cultural_marker(gamelan_gong, javanese, very_strong).
timbre_cultural_marker(throat_singing, central_asian, very_strong).
timbre_cultural_marker(didgeridoo_drone, australian, very_strong).
timbre_cultural_marker(bagpipe_chanter, celtic, very_strong).

%% melodic_cultural_marker(+MelodicFeature, +Culture, -Strength)
%% Melodic features that signal cultural origin. (C2065)
melodic_cultural_marker(gamaka_ornament, indian, very_strong).
melodic_cultural_marker(raga_phrase_shape, indian, strong).
melodic_cultural_marker(maqam_sayr, arabic, very_strong).
melodic_cultural_marker(quarter_tone_inflection, arabic, strong).
melodic_cultural_marker(pentatonic_call_response, west_african, moderate).
melodic_cultural_marker(blue_note_bend, african_american, strong).
melodic_cultural_marker(yodel_interval, alpine, very_strong).
melodic_cultural_marker(melismatic_ornament, middle_eastern, strong).
melodic_cultural_marker(sean_nos_ornament, irish, strong).
melodic_cultural_marker(cante_jondo_melisma, spanish, strong).
melodic_cultural_marker(pentatonic_descending, east_asian, moderate).
melodic_cultural_marker(chromatic_passing, western_classical, moderate).

%% harmonic_cultural_marker(+HarmonicFeature, +Culture, -Strength)
%% Harmonic features that signal cultural origin. (C2066)
harmonic_cultural_marker(drone_fifth, indian, strong).
harmonic_cultural_marker(functional_ii_v_i, jazz, very_strong).
harmonic_cultural_marker(parallel_fourths, medieval_european, strong).
harmonic_cultural_marker(power_chords, rock, strong).
harmonic_cultural_marker(quartal_voicing, modern_jazz, moderate).
harmonic_cultural_marker(phrygian_cadence, spanish, strong).
harmonic_cultural_marker(plagal_cadence, gospel, moderate).
harmonic_cultural_marker(tonic_dominant_only, folk, moderate).
harmonic_cultural_marker(chromatic_mediants, romantic, strong).
harmonic_cultural_marker(whole_tone_harmony, impressionist, strong).
harmonic_cultural_marker(cluster_harmony, twentieth_century, moderate).

%% ============================================================================
%% UNIVERSAL MUSICAL CONCEPTS (C2076-C2083)
%% ============================================================================

%% all_cultures_scale_mapping(+UnifiedPitch, -CultureMappings)
%% Maps a pitch concept across cultures. (C2076)
all_cultures_scale_mapping(tonic, [western(do), indian(sa), arabic(rast_base), solfege(do)]).
all_cultures_scale_mapping(second, [western(re), indian(re), arabic(duga), solfege(re)]).
all_cultures_scale_mapping(third, [western(mi), indian(ga), arabic(busalik), solfege(mi)]).
all_cultures_scale_mapping(fourth, [western(fa), indian(ma), arabic(jaharka), solfege(fa)]).
all_cultures_scale_mapping(fifth, [western(sol), indian(pa), arabic(nawa), solfege(sol)]).
all_cultures_scale_mapping(sixth, [western(la), indian(dha), arabic(husayni), solfege(la)]).
all_cultures_scale_mapping(seventh, [western(ti), indian(ni), arabic(awj), solfege(si)]).

%% universal_rhythm_grid(+Subdivision, -CultureMappings)
%% Maps rhythmic concepts across cultures. (C2077)
universal_rhythm_grid(binary, [western(common_time), indian(sama), african(two_feel), latin(marcha)]).
universal_rhythm_grid(ternary, [western(compound), indian(tisra), african(twelve_eight), latin(bembe)]).
universal_rhythm_grid(quintuple, [western(five_four), indian(khanda), african(rare), latin(rare)]).
universal_rhythm_grid(septuple, [western(seven_four), indian(misra), african(asymmetric), latin(rare)]).
universal_rhythm_grid(additive, [western(bartok), indian(tala_additive), african(timeline), latin(compas)]).

%% cross_cultural_cadence(+Function, -Realizations, -Cultures)
%% How cadential function manifests across cultures. (C2078)
cross_cultural_cadence(conclusion, [western(v_i), indian(sa_return), arabic(qarar), african(rhythmic_resolution)], universal).
cross_cultural_cadence(half_close, [western(i_v), indian(pa_emphasis), arabic(ghammaz), african(timeline_midpoint)], widespread).
cross_cultural_cadence(deceptive, [western(v_vi), indian(unexpected_raga_turn), arabic(modulation), african(pattern_shift)], western_primarily).
cross_cultural_cadence(plagal, [western(iv_i), indian(ma_sa), arabic(subdominant_tonic), african(call_answer)], western_primarily).

%% global_ornament_library(+OrnamentType, -Cultures, -Variations)
%% Ornaments found across multiple cultures. (C2079)
global_ornament_library(trill, [western, indian, arabic, turkish], [measured_trill, unmeasured_trill, mordent, kampita, shakl]).
global_ornament_library(slide, [western, indian, arabic, blues], [glissando, meend, glide, portamento, bend]).
global_ornament_library(turn, [western, indian, turkish, celtic], [gruppetto, khatka, cevirmeli, roll]).
global_ornament_library(grace_note, [western, indian, arabic, irish], [acciaccatura, kan_swar, tik, cut]).
global_ornament_library(vibrato, [western, indian, japanese, arabic], [periodic, andolan, yuri, tremolo_like]).
global_ornament_library(tremolo, [western, japanese, mandolin], [bowed_tremolo, yuri, plucked_tremolo]).

%% texture_palette_global(+Texture, -Cultures, -Examples)
%% Textural concepts across cultures. (C2080)
texture_palette_global(monophony, [gregorian, indian_vocal, arabic_taqsim, japanese_shakuhachi], single_line).
texture_palette_global(heterophony, [middle_eastern, southeast_asian, irish_trad], simultaneous_variation).
texture_palette_global(drone_based, [indian, scottish, hurdy_gurdy], sustained_pitch_foundation).
texture_palette_global(interlocking, [african, balinese_kecak, andean_siku], complementary_parts).
texture_palette_global(polyphony, [western_classical, pygmy, georgian], independent_voices).
texture_palette_global(call_response, [african, gospel, sea_shanty, work_song], leader_group).
texture_palette_global(stratified, [javanese_gamelan, orchestral, big_band], layered_roles).

%% emotion_cross_cultural(+Emotion, +WesternRealization, -OtherRealizations)
%% How emotions are expressed musically across cultures. (C2081)
emotion_cross_cultural(joy, major_key_fast_tempo, [indian(raga_bilawal_drut), arabic(maqam_ajam), african(fast_polyrhythm), latin(salsa_tempo)]).
emotion_cross_cultural(sadness, minor_key_slow_tempo, [indian(raga_todi_vilambit), arabic(maqam_saba), african(slow_lament), latin(tango_lento)]).
emotion_cross_cultural(devotion, sustained_harmony, [indian(bhajan_drone), arabic(sufi_dhikr), african(spiritual_call), latin(gospel_coro)]).
emotion_cross_cultural(heroism, brass_fanfare_major, [indian(raga_darbari_alap), arabic(martial_maqam), african(praise_song), latin(corrido_bold)]).
emotion_cross_cultural(longing, suspended_harmony, [indian(raga_yaman_evening), arabic(maqam_bayati_plaintive), african(highlife_nostalgic), latin(saudade_bossa)]).
emotion_cross_cultural(celebration, rhythmic_energy, [indian(dhun_fast), arabic(dabke_rhythm), african(percussion_ensemble), latin(carnival_samba)]).

%% form_cross_cultural(+FormPrinciple, +WesternVersion, -Others)
%% How structural principles manifest across cultures. (C2082)
form_cross_cultural(repetition_with_variation, theme_and_variations, [indian(sangati), arabic(taqsim_development), african(cyclic_variation), latin(son_montuno)]).
form_cross_cultural(statement_departure_return, sonata_form, [indian(alap_jor_jhala), arabic(wasla_suite), african(signal_based), latin(verse_chorus)]).
form_cross_cultural(additive_process, minimalism, [indian(layakari), arabic(rhythmic_augmentation), african(layered_entry), latin(descarga_build)]).
form_cross_cultural(free_to_structured, fantasia, [indian(alap_to_gat), arabic(taqsim_to_composed), african(drum_call_to_dance), latin(improvisacion_to_clave)]).
form_cross_cultural(cyclic, rondo, [indian(tala_cycle), arabic(rhythmic_mode_cycle), african(timeline_cycle), latin(clave_cycle)]).

%% compositional_tool_universal(+Tool, +WesternName, -Equivalents)
%% Universal compositional techniques across cultures. (C2083)
compositional_tool_universal(repetition, ostinato, [indian(tala_theka), african(timeline_pattern), latin(clave_montuno), arabic(rhythmic_mode)]).
compositional_tool_universal(ornamentation, embellishment, [indian(gamaka), arabic(tahrir), celtic(cran), jazz(bebop_ornament)]).
compositional_tool_universal(improvisation, cadenza, [indian(alap_improv), arabic(taqsim), jazz(solo), flamenco(cante_libre)]).
compositional_tool_universal(call_response, antiphon, [african(leader_chorus), gospel(preacher_congregation), latin(coro_pregon), work_song(caller_group)]).
compositional_tool_universal(tension_resolution, dissonance_consonance, [indian(vivadi_samvadi), arabic(tension_qarar), jazz(tritone_resolution), classical(dominant_tonic)]).
compositional_tool_universal(mode_change, modulation, [indian(raga_change), arabic(maqam_modulation), jazz(key_change), film(scene_transition)]).
