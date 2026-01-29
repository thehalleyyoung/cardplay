%% music-theory-arabic.pl - Arabic/Turkish/Persian Music Theory KB
%%
%% Provides predicates for:
%% - Maqam system: ajnas, modulation, sayr (C1752-C1757)
%% - Turkish makam and usul (C1761-C1762)
%% - Persian dastgah and radif (C1763-C1765)
%% - Rhythmic patterns (iqa) (C1759-C1760)
%% - Performance techniques and aesthetics (C1779-C1784)
%%
%% Depends on: music-theory.pl

%% ============================================================================
%% MAQAM SYSTEM — CORE (C1752-C1757)
%% ============================================================================

%% maqam_definition(+MaqamName, -Jins1, -Jins2, -Ghammaz)
%% Maqam = two ajnas (tetrachords/pentachords) joined at a pivot note. (C1752)
maqam_definition(bayati, jins_bayati, jins_nahawand, d).
maqam_definition(rast, jins_rast, jins_rast_upper, g).
maqam_definition(nahawand, jins_nahawand, jins_hijaz, g).
maqam_definition(hijaz, jins_hijaz, jins_rast_upper, g).
maqam_definition(hijaz_kar, jins_hijaz, jins_hijaz, g).
maqam_definition(saba, jins_saba, jins_hijaz, d).
maqam_definition(sikah, jins_sikah, jins_rast_upper, g).
maqam_definition(ajam, jins_ajam, jins_ajam_upper, g).
maqam_definition(kurd, jins_kurd, jins_nahawand, g).
maqam_definition(nakriz, jins_nakriz, jins_hijaz, g).
maqam_definition(jiharkah, jins_jiharkah, jins_rast_upper, g).
maqam_definition(suznak, jins_rast, jins_hijaz, g).
maqam_definition(nawa_athar, jins_nawa_athar, jins_nawa_athar, g).

%% jins_definition(+JinsName, -Intervals, -Size)
%% Jins (genus/tetrachord) — the building blocks of maqamat. (C1753)
%% Intervals in quarter-tones (24-TET): 2=semitone, 3=three-quarter, 4=whole
jins_definition(jins_rast, [4, 3, 3], tetrachord).
jins_definition(jins_rast_upper, [4, 3, 3], tetrachord).
jins_definition(jins_bayati, [3, 3, 4], tetrachord).
jins_definition(jins_nahawand, [4, 2, 4], tetrachord).
jins_definition(jins_hijaz, [2, 6, 2], tetrachord).
jins_definition(jins_saba, [3, 3, 2], trichord).
jins_definition(jins_sikah, [3, 4, 3], tetrachord).
jins_definition(jins_kurd, [2, 4, 4], tetrachord).
jins_definition(jins_ajam, [4, 4, 2], tetrachord).
jins_definition(jins_ajam_upper, [4, 4, 2], tetrachord).
jins_definition(jins_nakriz, [4, 2, 6], tetrachord).
jins_definition(jins_jiharkah, [4, 3, 3], tetrachord).
jins_definition(jins_nawa_athar, [4, 2, 6], tetrachord).

%% maqam_modulation(+FromMaqam, +ToMaqam, -PivotNote)
%% Common modulation paths between maqamat. (C1754)
maqam_modulation(rast, nahawand, g).
maqam_modulation(rast, bayati, d).
maqam_modulation(rast, sikah, e_half_flat).
maqam_modulation(bayati, rast, c).
maqam_modulation(bayati, saba, d).
maqam_modulation(bayati, hijaz, d).
maqam_modulation(nahawand, rast, c).
maqam_modulation(nahawand, hijaz, g).
maqam_modulation(hijaz, bayati, d).
maqam_modulation(hijaz, rast, c).
maqam_modulation(saba, bayati, d).
maqam_modulation(saba, hijaz, d).
maqam_modulation(sikah, rast, c).

%% maqam_family(+MaqamName, -FamilyName)
%% Group maqamat by their root jins. (C1755)
maqam_family(rast, rast_family).
maqam_family(suznak, rast_family).
maqam_family(jiharkah, rast_family).
maqam_family(bayati, bayati_family).
maqam_family(saba, bayati_family).
maqam_family(hijaz, hijaz_family).
maqam_family(hijaz_kar, hijaz_family).
maqam_family(nahawand, nahawand_family).
maqam_family(kurd, kurd_family).
maqam_family(ajam, ajam_family).
maqam_family(sikah, sikah_family).
maqam_family(nakriz, nakriz_family).

%% quarter_tone_notation(+NoteName, -CentsOffset)
%% Quarter-tone accidentals for Arabic microtonal pitches. (C1756)
quarter_tone_notation(e_half_flat, -50).   %% Sikah note
quarter_tone_notation(b_half_flat, -50).   %% Rast 7th degree
quarter_tone_notation(a_half_flat, -50).
quarter_tone_notation(f_half_sharp, 50).
quarter_tone_notation(c_half_sharp, 50).
quarter_tone_notation(e_natural, 0).
quarter_tone_notation(b_flat, -100).
quarter_tone_notation(f_sharp, 100).

%% sayr_convention(+MaqamName, -Phase, -Movement)
%% Melodic behavior convention (sayr) for a maqam. (C1757)
sayr_convention(rast, opening, ascending_from_tonic).
sayr_convention(rast, development, explore_upper_jins).
sayr_convention(rast, modulation, to_bayati_on_d).
sayr_convention(rast, conclusion, descend_to_tonic).
sayr_convention(bayati, opening, hover_around_tonic).
sayr_convention(bayati, development, descend_then_ascend).
sayr_convention(bayati, modulation, to_rast_on_c).
sayr_convention(bayati, conclusion, settle_on_tonic).
sayr_convention(hijaz, opening, leap_to_third).
sayr_convention(hijaz, development, augmented_second_emphasis).
sayr_convention(hijaz, conclusion, descend_to_tonic).
sayr_convention(saba, opening, narrow_range_around_tonic).
sayr_convention(saba, development, gradual_ascent).
sayr_convention(saba, conclusion, descend_chromatically).
sayr_convention(nahawand, opening, ascending_stepwise).
sayr_convention(nahawand, development, upper_register).
sayr_convention(nahawand, conclusion, cadence_to_tonic).

%% ============================================================================
%% TAQSIM & FORMS (C1758, C1768-C1769)
%% ============================================================================

%% taqsim_structure(+MaqamName, -Phase, -Characteristics)
%% Structure of taqsim (free improvisation). (C1758)
taqsim_structure(_, introduction, [low_register, slow, establish_tonic, sparse]).
taqsim_structure(_, exposition, [explore_lower_jins, gamakas, moderate]).
taqsim_structure(_, development, [upper_jins, modulation, virtuosic]).
taqsim_structure(_, climax, [highest_register, peak_emotion, intensity]).
taqsim_structure(_, conclusion, [return_to_tonic, qaraar, settling]).

%% arabic_form(+FormName, -Sections, -Characteristics)
%% Traditional Arabic musical forms. (C1768)
arabic_form(muwashshah, [dawr, khana, silsila], [andalusian_origin, complex_rhythm, vocal]).
arabic_form(qasida, [solo_vocal, oud_response, chorus], [poetry, emotional, classical]).
arabic_form(dawr, [madhhab, ghusn, tarannum], [egyptian, vocal_improv, maqam_exploration]).
arabic_form(sama_i, [khana1, taslim, khana2, taslim, khana3, taslim, khana4, taslim], [10_8_meter, instrumental]).
arabic_form(bashraf, [khana1, taslim, khana2, taslim, khana3, taslim, khana4, taslim], [variable_meter, instrumental]).
arabic_form(longa, [sections_a_b_c_d, saz], [fast_6_8, ottoman, dance]).

%% wasla_suite(+Maqam, -Pieces, -Order)
%% Traditional wasla suite structure. (C1769)
wasla_suite(Maqam, Pieces, traditional) :-
  Pieces = [
    taqsim(Maqam),
    muwashshah(Maqam),
    dawr(Maqam),
    qasida(Maqam),
    taqsim(modulated),
    layali(Maqam),
    mawwal(Maqam)
  ].

%% ============================================================================
%% RHYTHMIC PATTERNS — IQA (C1759-C1760)
%% ============================================================================

%% iqa_definition(+IqaName, -Pattern, -Accents)
%% Arabic rhythmic patterns using dum (low) and tak (high). (C1759)
iqa_definition(maqsum, [dum, tak, tak, dum, tak], [strong, weak, weak, medium, weak]).
iqa_definition(baladi, [dum, dum, tak, dum, tak], [strong, medium, weak, medium, weak]).
iqa_definition(saidi, [dum, tak, dum, dum, tak], [strong, weak, medium, strong, weak]).
iqa_definition(malfuf, [dum, tak, tak], [strong, weak, weak]).
iqa_definition(wahda, [dum, es, es, tak, es, es, tak, es], [strong, rest, rest, weak, rest, rest, weak, rest]).
iqa_definition(bambi, [dum, es, tak, es, dum, es, tak, tak], [strong, rest, weak, rest, medium, rest, weak, weak]).
iqa_definition(karachi, [dum, tak, es, tak, dum, es, tak, es], [strong, weak, rest, weak, medium, rest, weak, rest]).
iqa_definition(masmoudi_kabir, [dum, dum, es, es, tak, es, dum, es, tak, es], [strong, medium, rest, rest, weak, rest, medium, rest, weak, rest]).
iqa_definition(sama_i_thaqil, [dum, tak, dum, dum, tak, es, dum, tak, dum, tak], [strong, weak, medium, strong, weak, rest, medium, weak, medium, weak]).
iqa_definition(jurjina, [dum, tak, tak, dum, tak], [strong, weak, weak, medium, weak]).

%% iqa_family(+IqaName, -Family)
%% Group iqa'at by time signature feel. (C1760)
iqa_family(maqsum, duple_4_4).
iqa_family(baladi, duple_4_4).
iqa_family(saidi, duple_4_4).
iqa_family(malfuf, triple_2_4).
iqa_family(wahda, duple_4_4).
iqa_family(masmoudi_kabir, duple_8_4).
iqa_family(sama_i_thaqil, compound_10_8).
iqa_family(jurjina, compound_10_16).

%% ============================================================================
%% TURKISH MAKAM (C1761-C1762)
%% ============================================================================

%% turkish_makam(+MakamName, -Seyir, -Durak, -Guclu)
%% Turkish makam with seyir (melodic direction), durak (final), güçlü (dominant). (C1761)
turkish_makam(rast_tr, ascending, c, g).
turkish_makam(nihavend, descending, c, g).
turkish_makam(hicaz, ascending_descending, d, a).
turkish_makam(huseyni, ascending, d, a).
turkish_makam(karcigar, ascending_descending, d, a).
turkish_makam(segah_tr, ascending, e_half_flat, b_half_flat).
turkish_makam(saba_tr, ascending_descending, d, a).
turkish_makam(ussak, descending, d, a).
turkish_makam(kurdilihicazkar, descending, c, g).
turkish_makam(huzzam, ascending, e_half_flat, b_half_flat).
turkish_makam(beyati_araban, ascending_descending, d, a).

%% turkish_usul(+UsulName, -Pattern, -Strokes)
%% Turkish rhythmic patterns using düm (heavy) and tek (light). (C1762)
turkish_usul(duyek, [dum, tek, tek, dum, tek], 8).
turkish_usul(sofyan, [dum, tek, tek, dum, tek], 4).
turkish_usul(aksak, [dum, tek, dum, tek, tek, dum, tek, tek, tek], 9).
turkish_usul(turkaksagi, [dum, tek, tek, dum, tek, dum, tek], 7).
turkish_usul(curcuna, [dum, tek, dum, tek, tek, dum, tek, tek, tek, tek], 10).
turkish_usul(devrikebir, [dum, tek, tek, dum, tek, tek, dum, tek, dum, dum, tek, dum, tek, tek], 28).
turkish_usul(nim_sofyan, [dum, tek], 2).
turkish_usul(yuruk_semai, [dum, tek, tek, dum, tek, tek], 6).

%% ============================================================================
%% PERSIAN DASTGAH (C1763-C1765)
%% ============================================================================

%% persian_dastgah(+DastgahName, -Gushehs, -Structure)
%% Persian dastgah system: modal frameworks with ordered gushehs. (C1763)
persian_dastgah(shur, [daramad, kereshmeh, rohab, zanguleh, razavi, hoseyni], descending_emphasis).
persian_dastgah(mahur, [daramad, dad, delkash, khavaran, araqi], ascending_emphasis).
persian_dastgah(segah_p, [daramad, muyeh, mokhalef, hesar], neutral_third).
persian_dastgah(chahargah, [daramad, zabol, hesar, mokhalef, mansuri], augmented_second).
persian_dastgah(homayun, [daramad, chakavak, bidgani, feyli], major_minor_shift).
persian_dastgah(nava, [daramad, bayat_raje, nahoft, majlesi], modal_variety).
persian_dastgah(rast_panjgah, [daramad, naghme, zang_shotor, panjgah], bright_ascending).

%% radif_pattern(+DastgahName, +GushehName, -Pattern)
%% Radif: the repertoire of melodic models within each dastgah. (C1764)
radif_pattern(shur, daramad, [establish_tonic, explore_lower, emphasize_fifth]).
radif_pattern(shur, kereshmeh, [ornamental, playful, moderate_tempo]).
radif_pattern(shur, rohab, [expand_range, emotional_intensity]).
radif_pattern(mahur, daramad, [ascending_scale, bright_character]).
radif_pattern(segah_p, daramad, [neutral_third, gentle, contemplative]).

%% tahrir_ornament(+Type, -Execution, -Context)
%% Tahrir: vocal ornaments in Persian classical music. (C1765)
tahrir_ornament(tekye, rapid_onset, emphasis).
tahrir_ornament(gholoob, throat_catch, emotional_peak).
tahrir_ornament(eshare, gentle_grace_note, passing).
tahrir_ornament(shalal, trill_vibrato, sustained_notes).
tahrir_ornament(tarkib, compound_ornament, cadential).

%% ============================================================================
%% PERFORMANCE & AESTHETICS (C1779-C1784)
%% ============================================================================

%% microtonal_inflection(+Context, +Note, -Inflection)
%% Contextual pitch inflections in Arabic music. (C1766)
microtonal_inflection(ascending, e_half_flat, slightly_sharp).
microtonal_inflection(descending, e_half_flat, slightly_flat).
microtonal_inflection(emphasis, b_half_flat, neutral).
microtonal_inflection(cadence, _, flatten_slightly).
microtonal_inflection(ornament, _, variable).

%% oud_technique(+Technique, -Notation, -Execution)
%% Oud playing techniques. (C1779)
oud_technique(risha_down, 'd', right_hand_downstroke).
oud_technique(risha_up, 'u', right_hand_upstroke).
oud_technique(tremolo, 'tr', rapid_alternating_strokes).
oud_technique(rasgueado, 'ras', fan_stroke).
oud_technique(qarar, 'q', open_string_drone).
oud_technique(ajnas_slide, '/', left_hand_slide).
oud_technique(vibrato, '~', left_hand_oscillation).

%% qanun_technique(+Technique, -Notation, -Execution)
%% Qanun playing techniques. (C1780)
qanun_technique(mandal_switch, 'M', microtonal_lever_change).
qanun_technique(tremolo, 'tr', rapid_plucking).
qanun_technique(tril, 'T', ornamental_trill).
qanun_technique(glissando, '/', sweep_across_strings).

%% nay_technique(+Technique, -Notation, -Execution)
%% Nay (reed flute) playing techniques. (C1781)
nay_technique(nefes, 'N', breath_attack).
nay_technique(half_hole, 'hh', quarter_tone_production).
nay_technique(vibrato, '~', diaphragm_vibrato).
nay_technique(flutter, 'fl', tongue_flutter).
nay_technique(overblowing, 'ob', harmonic_register_shift).

%% tarab_aesthetic(+Element, -Role, -Effect)
%% Tarab: the ecstatic aesthetic experience in Arabic music. (C1782)
tarab_aesthetic(saltanah, performer_state, deep_emotional_connection).
tarab_aesthetic(audience_response, collective, verbal_encouragement_allah).
tarab_aesthetic(modulation, surprise, heightened_emotion).
tarab_aesthetic(repetition, building, gradual_intensification).
tarab_aesthetic(mawwal, vocal_improv, emotional_peak).
tarab_aesthetic(silence, contrast, anticipation_building).

%% maqam_emotion(+MaqamName, -AssociatedEmotions)
%% Emotional associations of maqamat. (C1784)
maqam_emotion(rast, [stability, joy, uprightness]).
maqam_emotion(bayati, [tenderness, nostalgia, longing]).
maqam_emotion(hijaz, [mysticism, spirituality, desert_feeling]).
maqam_emotion(saba, [grief, melancholy, deep_sorrow]).
maqam_emotion(nahawand, [romance, gentle_sadness, beauty]).
maqam_emotion(sikah, [meditation, contemplation, gentleness]).
maqam_emotion(ajam, [brightness, happiness, confidence]).
maqam_emotion(kurd, [modesty, softness, introspection]).

%% arabic_western_fusion(+ArabicElement, +WesternElement, -Integration)
%% Guidelines for Arabic-Western fusion. (C1785)
arabic_western_fusion(maqam_rast, major_scale, share_rast_tetrachord_use_quartertone_on_3rd).
arabic_western_fusion(maqam_bayati, dorian_mode, similar_feel_add_microtones).
arabic_western_fusion(maqam_hijaz, harmonic_minor, augmented_second_shared).
arabic_western_fusion(iqa_maqsum, four_four_time, align_dum_with_downbeat).
arabic_western_fusion(taqsim, jazz_solo, free_improvisation_over_maqam).
arabic_western_fusion(heterophony, counterpoint, parallel_variation_not_independence).

%% ============================================================================
%% ADDITIONAL ARABIC/MIDDLE EASTERN PREDICATES (C1767, C1783)
%% ============================================================================

%% heterophony_model(+MainMelody, -Variation, -Relationship)
%% Heterophony as practiced in Arabic ensemble music. (C1767 — also in east-asian)
%% NOTE: This predicate is shared with east-asian KB; both define instances.

%% saltanah_state(+MusicFeatures, -PerformerState, -AudienceResponse)
%% Saltanah — the ecstatic state in Arabic music performance. (C1783)
saltanah_state(perfect_maqam_execution, deep_concentration, attentive_silence).
saltanah_state(inspired_taqsim, flow_state, verbal_encouragement).
saltanah_state(peak_tarab_moment, ecstatic_release, audience_exclamations).
saltanah_state(unexpected_modulation, creative_inspiration, surprise_and_delight).
saltanah_state(return_to_qarar, resolution_satisfaction, collective_sigh).
