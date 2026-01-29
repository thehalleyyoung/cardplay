%% music-theory-african.pl - African Music Theory KB
%%
%% Provides predicates for:
%% - Timeline/bell patterns (C1832-C1836)
%% - Polyrhythm & interlocking patterns (C1834, C1841-C1842)
%% - Call and response (C1837)
%% - Instrument tunings and scales (C1839-C1840)
%% - Popular styles: Highlife, Afrobeat, Soukous (C1845-C1847)
%%
%% Depends on: music-theory.pl

%% ============================================================================
%% TIMELINE / BELL PATTERNS (C1832-C1836)
%% ============================================================================

%% african_rhythm_timeline(+PatternName, -Timeline, -Tradition)
%% Standard timeline patterns (asymmetric rhythms as binary sequences). (C1832)
%% 1 = stroke, 0 = rest. Length determines cycle.
african_rhythm_timeline(standard_bell_12_8, [1,0,0,1,0,0,1,0,1,0,1,0], ewe).
african_rhythm_timeline(agbadza_bell, [1,0,1,0,1,0,0,1,0,1,0,0], ewe).
african_rhythm_timeline(gahu_bell, [1,0,0,1,0,0,1,0,0,1,0,1,0,0,0,0], ewe).
african_rhythm_timeline(bembe, [1,0,1,1,0,1,1,0,1,1,0,1], yoruba).
african_rhythm_timeline(son_clave, [1,0,0,1,0,0,1,0,0,0,1,0,1,0,0,0], afro_cuban).
african_rhythm_timeline(rumba_clave, [1,0,0,1,0,0,0,1,0,0,1,0,1,0,0,0], afro_cuban).
african_rhythm_timeline(tresillo, [1,0,0,1,0,0,1,0], west_african).
african_rhythm_timeline(cinquillo, [1,0,1,1,0,1,1,0], afro_caribbean).
african_rhythm_timeline(shiko, [1,0,0,0,1,0,1,0,0,0,1,0], yoruba).
african_rhythm_timeline(soukous_bell, [1,0,1,0,1,0,1,0,1,0,0,0], congolese).

%% bell_pattern(+PatternName, -Pattern, -Culture)
%% Named bell patterns with cultural origin. (C1833)
bell_pattern(agogo_standard, [high,low,low,high,low,high,low,high,low,low,high,low], yoruba).
bell_pattern(gankogui_ewe, [high,rest,rest,low,rest,rest,high,rest,low,rest,high,rest], ewe).
bell_pattern(dawuro, [high,rest,high,rest,high,rest,rest,high,rest,high,rest,rest], akan).
bell_pattern(atoke, [high,rest,rest,rest,high,rest,rest,rest], yoruba).

%% polyrhythm_layer(+Layer1, +Layer2, -Resultant, -PhaseRelation)
%% Common polyrhythmic relationships. (C1834)
polyrhythm_layer(3, 2, [1,0,1,0,1,0], hemiola).
polyrhythm_layer(4, 3, [1,0,0,1,0,0,1,0,0,1,0,0], cross_rhythm).
polyrhythm_layer(3, 4, [1,0,0,0,1,0,0,0,1,0,0,0], dotted_against_straight).
polyrhythm_layer(5, 4, [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], quintuplet_cross).
polyrhythm_layer(7, 4, result_7_4, septuplet_cross).
polyrhythm_layer(2, 3, [1,0,0,1,0,0], two_against_three).

%% cross_rhythm(+PatternA, +PatternB, -PerceptualDownbeat)
%% How two patterns create a composite feel. (C1835)
cross_rhythm([1,0,0,1,0,0], [1,0,1,0,1,0], ambiguous_downbeat).
cross_rhythm([1,0,0,0], [1,0,0], shifting_downbeat).
cross_rhythm([1,0,1,0,1,0,1,0], [1,0,0,1,0,0,1,0,0,1,0,0], compound_feel).

%% hemiola_pattern(+Pattern, -Level, -Duration)
%% Hemiola: 3-against-2 or 2-against-3 groupings. (C1836)
hemiola_pattern(three_over_two, metric, 6).
hemiola_pattern(two_over_three, metric, 6).
hemiola_pattern(sesquialtera, measure_level, 6).
hemiola_pattern(vertical, simultaneous, 6).
hemiola_pattern(horizontal, sequential, 12).

%% ============================================================================
%% CALL AND RESPONSE & FORMS (C1837-C1838)
%% ============================================================================

%% call_response_structure(+Call, -Response, -Relationship)
%% Call-and-response structural patterns. (C1837)
call_response_structure(leader_phrase, chorus_answer, antiphonal).
call_response_structure(solo_verse, group_refrain, strophic_response).
call_response_structure(drum_call, ensemble_answer, rhythmic_cue).
call_response_structure(vocal_improvisation, fixed_response, open_fixed).
call_response_structure(overlapping_call, overlapping_response, staggered).

%% cyclic_form(+Cycle, -Variations, -Development)
%% African cyclic/repetitive form structures. (C1838)
cyclic_form(basic_cycle, [repetition, subtle_variation], additive).
cyclic_form(layered_cycle, [new_part_each_repeat, building_texture], accumulative).
cyclic_form(spiral_form, [return_with_variation, gradually_evolving], processional).
cyclic_form(signal_based, [change_on_drum_signal, section_shifts], conductor_led).

%% ============================================================================
%% SCALES & TUNINGS (C1839-C1840)
%% ============================================================================

%% west_african_scale(+Tradition, +Instrument, -Scale)
%% Scale systems used by specific traditions/instruments. (C1839)
west_african_scale(mandinka, kora, [0, 2, 4, 7, 9]).          %% pentatonic major
west_african_scale(mandinka, balafon, [0, 3, 5, 7, 10]).      %% pentatonic minor
west_african_scale(dagbamba, gyil, [0, 2, 4, 7, 9]).          %% pentatonic (equi-heptatonic source)
west_african_scale(akan, fontomfrom, rhythmic_only).           %% drums - no pitch scale
west_african_scale(yoruba, dundun, [variable_pitch]).          %% talking drum - continuous pitch
west_african_scale(shona, mbira, [0, 2, 4, 5, 7, 9, 11]).    %% near-equidistant heptatonic
west_african_scale(ethiopian, krar, [0, 2, 4, 7, 9]).         %% pentatonic
west_african_scale(ethiopian, masenqo, [0, 2, 3, 5, 7, 8, 10]). %% tezeta minor

%% mbira_tuning(+TuningName, -Pitches, -Context)
%% Mbira dzavadzimu tuning systems. (C1840)
mbira_tuning(nyamaropa, [b3, c4, d4, e4, f4, g4, a4, b4], standard_shona).
mbira_tuning(mavembe, near_equidistant_7, ceremonial).
mbira_tuning(gandanga, slightly_sharp_tuning, modern).
mbira_tuning(chipendani, pentatonic, mouth_bow).

%% ============================================================================
%% INTERLOCKING & INHERENT PATTERNS (C1841-C1843)
%% ============================================================================

%% interlocking_pattern(+Part1, +Part2, -Combined)
%% Interlocking (hocketing) patterns common in African music. (C1841)
interlocking_pattern([1,0,1,0,1,0], [0,1,0,1,0,1], [1,1,1,1,1,1]).
interlocking_pattern([1,0,0,1,0,0], [0,1,0,0,1,0], [1,1,0,1,1,0]).
interlocking_pattern([1,0,0,0,1,0], [0,0,1,0,0,1], [1,0,1,0,1,1]).

%% inherent_pattern(+SourcePatterns, -PerceivedMelody, -Explanation)
%% Emergent melodies from interlocking patterns. (C1842)
inherent_pattern([pattern_a, pattern_b], emergent_melody,
  'Inherent patterns emerge from the composite of interlocking parts').
inherent_pattern([high_kora, low_kora], composite_melody,
  'Kora kumbengo creates melodic line from two interlocking hands').

%% participatory_discrepancy(+Timing, -Effect, -Cultural)
%% Intentional timing deviations that create groove. (C1843)
participatory_discrepancy(ahead_of_beat, drive_forward, ewe_drumming).
participatory_discrepancy(behind_beat, laid_back_groove, highlife).
participatory_discrepancy(variable_swing, organic_feel, all_traditions).
participatory_discrepancy(micro_timing, groove_definition, universal_african).

%% ============================================================================
%% POPULAR STYLES (C1845-C1847)
%% ============================================================================

%% highlife_pattern(+PatternType, -Rhythm, -Harmony)
%% Highlife music patterns (Ghana/Nigeria). (C1845)
highlife_pattern(guitar_ossia, [1,0,0,1,0,0,1,0], major_pentatonic).
highlife_pattern(bass_line, [1,0,0,0,1,0,0,0], root_fifth_octave).
highlife_pattern(horn_riff, syncopated_melody, i_iv_v).
highlife_pattern(rhythm_guitar, [1,0,1,0,1,0,1,0], muted_chords).

%% afrobeat_structure(+Section, -Function, -Characteristics)
%% Afrobeat (Fela Kuti) structure. (C1846)
afrobeat_structure(intro, build_groove, [drums_first, bass_enters, guitar_layers]).
afrobeat_structure(theme, main_melody, [horns_unison, call_response]).
afrobeat_structure(vocal, message, [political_lyrics, yoruba_english]).
afrobeat_structure(solo_section, improvisation, [tenor_sax, organ, guitar]).
afrobeat_structure(breakdown, strip_back, [drums_bass_only, rebuild_gradually]).
afrobeat_structure(outro, wind_down, [gradual_fade, drum_solo_possible]).

%% soukous_pattern(+GuitarPart, -Role, -Pattern)
%% Soukous / Congolese rumba guitar patterns. (C1847)
soukous_pattern(mi_compose, rhythm_guitar, [arpeggio, muted, steady]).
soukous_pattern(mi_solo, lead_guitar, [sebene, rapid_picking, high_register]).
soukous_pattern(bass, foundation, [root_fifth, syncopated, locked_with_drums]).
soukous_pattern(sebene, dance_section, [fast_interlocking, call_response_guitars]).

%% african_diaspora_connection(+AfricanPattern, +DiasporaGenre, -Relationship)
%% Connections between African music and diaspora styles. (C1857)
african_diaspora_connection(timeline_12_8, blues_shuffle, rhythmic_ancestor).
african_diaspora_connection(call_response, gospel, structural_ancestor).
african_diaspora_connection(polyrhythm, funk, layered_grooves).
african_diaspora_connection(tresillo, new_orleans_second_line, direct_retention).
african_diaspora_connection(griot_tradition, hip_hop, oral_storytelling).
african_diaspora_connection(cross_rhythm, jazz_swing, feel_ancestor).
african_diaspora_connection(bell_pattern, samba_surdo, adapted_timeline).
african_diaspora_connection(interlocking, minimalism, compositional_technique).

%% ============================================================================
%% GRIOT TRADITION (C1844)
%% ============================================================================

%% griot_tradition(+Element, -Role, -Technique)
%% Griot (West African oral tradition) elements. (C1844)
griot_tradition(storytelling, historical_preservation, recitation_with_accompaniment).
griot_tradition(praise_singing, social_function, melodic_improvisation).
griot_tradition(genealogy, lineage_keeper, rhythmic_chanting).
griot_tradition(kora_accompaniment, musical_foundation, ostinato_patterns).
griot_tradition(balafon_interludes, musical_punctuation, call_response_with_voice).
griot_tradition(satirical_song, social_commentary, humorous_melody).
griot_tradition(apprenticeship, knowledge_transmission, oral_learning).
