%% music-theory-east-asian.pl - East Asian Music Theory KB
%%
%% Provides predicates for:
%% - Chinese music theory (modes, scales, instruments) (C1792-C1800)
%% - Japanese music theory (scales, gagaku, instruments) (C1801-C1806)
%% - Korean music theory (modes, jangdan, instruments) (C1807-C1810)
%% - Shared East Asian concepts (C1811-C1826)
%%
%% Depends on: music-theory.pl

%% ============================================================================
%% CHINESE MUSIC THEORY (C1792-C1800)
%% ============================================================================

%% chinese_mode(+ModeName, +Gong, -PitchSet)
%% Chinese pentatonic modes (wusheng). (C1792)
chinese_mode(gong, c, [c, d, e, g, a]).        %% 宫 - "do" mode
chinese_mode(shang, d, [d, e, g, a, c]).        %% 商 - "re" mode
chinese_mode(jue, e, [e, g, a, c, d]).          %% 角 - "mi" mode
chinese_mode(zhi, g, [g, a, c, d, e]).          %% 徵 - "sol" mode
chinese_mode(yu, a, [a, c, d, e, g]).           %% 羽 - "la" mode

%% chinese_scale_system(+SystemName, -Derivation, -Scales)
%% Chinese scale systems. (C1793)
chinese_scale_system(wusheng, five_tone_pentatonic, [gong, shang, jue, zhi, yu]).
chinese_scale_system(qisheng, seven_tone_with_bian, [gong, shang, jue, bianzhi, zhi, yu, biangong]).
chinese_scale_system(yanyue, court_music_seven_tone, [gong, shang, jue, qingjue, zhi, yu, run]).
chinese_scale_system(twelve_lu, chromatic_pipes, [huangzhong, dalu, taicu, jiazhong, guxian, zhonglv,
  ruibin, linzhong, yize, nanlv, wuyi, yingzhong]).

%% yanyue_scale(+ScaleName, -Intervals)
%% Yanyue (banquet music) scales. (C1794)
yanyue_scale(zheng_gong, [0, 2, 4, 6, 7, 9, 11]).
yanyue_scale(xia_zhi, [0, 2, 4, 5, 7, 9, 10]).
yanyue_scale(gao_gong, [0, 2, 3, 5, 7, 9, 10]).
yanyue_scale(zhong_lv, [0, 1, 3, 5, 7, 8, 10]).

%% qupai_pattern(+QupaiName, -Structure, -Variations)
%% Qupai (labeled melodies) used as compositional templates. (C1795)
qupai_pattern(ba_ban, [head, body_8_phrases, tail], [hua_ban, man_ban, kuai_ban]).
qupai_pattern(lao_liu_ban, [six_phrase_structure, cadential_formula], [variation_by_region]).
qupai_pattern(mei_hua, [five_petal_structure, returning_theme], [kunqu, jingju]).
qupai_pattern(liu_yao_jin, [rolling_pattern, accelerating], [percussion_version, melodic_version]).

%% banshi_meter(+BanshiName, -BeatsPerBar, -Tempo)
%% Banshi (rhythmic-metric patterns) in Chinese opera. (C1796)
banshi_meter(man_ban, 4, slow).           %% Slow meter
banshi_meter(yuan_ban, 4, moderate).      %% Original meter
banshi_meter(kuai_ban, 1, fast).          %% Fast meter
banshi_meter(liu_shui, 2, flowing).       %% Flowing meter
banshi_meter(san_ban, free, rubato).      %% Free meter
banshi_meter(yao_ban, free, recitative).  %% Spoken-rhythm
banshi_meter(dao_ban, 4, very_slow).      %% Introduction meter

%% chinese_ornament(+OrnamentName, -Execution, -Context)
%% Chinese musical ornaments. (C1797)
chinese_ornament(hua_yin, grace_note_slide, melodic_decoration).
chinese_ornament(da_yin, hammer_on, string_instrument).
chinese_ornament(rou_yin, vibrato, sustained_notes).
chinese_ornament(hua_zhi, slide_between_notes, erhu_pipa).
chinese_ornament(bo_yin, tremolo, plucked_strings).
chinese_ornament(yan_yin, delayed_vibrato, guqin).
chinese_ornament(nao, trill_like, wind_instruments).

%% guqin_technique(+TechniqueName, -Notation, -Sound)
%% Guqin playing techniques. (C1798)
guqin_technique(tiao, right_hand_pluck_outward, bright_tone).
guqin_technique(mo, right_hand_pluck_inward, muted_tone).
guqin_technique(gou, right_hand_hook, medium_tone).
guqin_technique(ti, right_hand_flick, sharp_tone).
guqin_technique(fan_yin, harmonic, ethereal_bell_tone).
guqin_technique(an_yin, stopped_string, solid_tone).
guqin_technique(zou_yin, sliding_stopped, gliding_pitch).
guqin_technique(yin, vibrato_left_hand, wavering_tone).
guqin_technique(nao, fast_vibrato, trembling_tone).

%% pipa_technique(+TechniqueName, -Notation, -Sound)
%% Pipa playing techniques. (C1799)
pipa_technique(tan, forward_pluck, bright_attack).
pipa_technique(tiao, backward_pluck, softer_attack).
pipa_technique(lun_zhi, tremolo_roll, sustained_texture).
pipa_technique(sao, strum_outward, dramatic_sweep).
pipa_technique(fu, strum_inward, answering_sweep).
pipa_technique(kou, snap_string, percussive_accent).
pipa_technique(tui, push_string, pitch_bend_up).
pipa_technique(la, pull_string, pitch_bend_down).

%% erhu_technique(+TechniqueName, -Notation, -Sound)
%% Erhu playing techniques. (C1800)
erhu_technique(la_gong, long_bow, sustained_singing_tone).
erhu_technique(dun_gong, detached_bow, short_articulated).
erhu_technique(lian_gong, connected_bow, legato_passage).
erhu_technique(rou_xian, vibrato, expressive_wavering).
erhu_technique(hua_zhi, slide, glissando_between_notes).
erhu_technique(bo_xian, pizzicato, plucked_percussive).
erhu_technique(pa_yin, harmonic, high_ethereal).

%% ============================================================================
%% JAPANESE MUSIC THEORY (C1801-C1806)
%% ============================================================================

%% japanese_scale(+ScaleName, -Intervals, -Context)
%% Japanese scale systems. (C1801)
japanese_scale(miyako_bushi, [0, 1, 5, 7, 8], koto_shamisen).
japanese_scale(in_sen, [0, 1, 5, 7, 10], traditional_dark).
japanese_scale(yo, [0, 2, 5, 7, 9], folk_bright).
japanese_scale(ritsu, [0, 2, 5, 7, 9], gagaku_ritual).
japanese_scale(ryukyu, [0, 4, 5, 7, 11], okinawan).
japanese_scale(hirajoshi, [0, 2, 3, 7, 8], modern_koto).
japanese_scale(kumoi, [0, 2, 3, 7, 9], mountain_mode).
japanese_scale(iwato, [0, 1, 5, 6, 10], dark_ritual).

%% gagaku_mode(+ModeName, -Derivation, -Usage)
%% Gagaku (court music) modal system. (C1802)
gagaku_mode(ichikotsu, d_based_ryo, togaku_chinese_origin).
gagaku_mode(hyojo, e_based_ryo, togaku_solemn).
gagaku_mode(sojo, g_based_ryo, togaku_bright).
gagaku_mode(oshiki, a_based_ritsu, komagaku_korean_origin).
gagaku_mode(banshiki, b_based_ritsu, komagaku_melancholic).
gagaku_mode(taishiki, c_based_ritsu, rare_usage).

%% min_yo_scale(+RegionName, -Scale)
%% Min'yo (folk song) regional scales. (C1803)
min_yo_scale(okinawa, [0, 4, 5, 7, 11]).
min_yo_scale(tohoku, [0, 2, 5, 7, 9]).
min_yo_scale(kansai, [0, 1, 5, 7, 8]).
min_yo_scale(hokkaido_ainu, [0, 2, 4, 7, 9]).
min_yo_scale(kyushu, [0, 2, 3, 7, 8]).

%% shamisen_technique(+TechniqueName, -Notation, -Sound)
%% Shamisen playing techniques. (C1804)
shamisen_technique(sukui, upstroke, light_tone).
shamisen_technique(hajiki, left_hand_pluck, snapping_tone).
shamisen_technique(uchi, hammer_on, percussive_pitch).
shamisen_technique(suberi, slide, glissando).
shamisen_technique(sawari, buzzing_bridge, signature_buzz_tone).
shamisen_technique(tataki, striking_skin, percussive_accent).

%% shakuhachi_technique(+TechniqueName, -Notation, -Sound)
%% Shakuhachi (bamboo flute) techniques. (C1805)
shakuhachi_technique(meri, chin_down_blow, lowered_pitch_dark).
shakuhachi_technique(kari, chin_up_blow, raised_pitch_bright).
shakuhachi_technique(yuri, head_nodding, slow_vibrato).
shakuhachi_technique(nayashi, gradual_fade, decrescendo_to_silence).
shakuhachi_technique(mura_iki, breath_noise, breathy_attack).
shakuhachi_technique(koro_koro, flutter, rapid_alternation).
shakuhachi_technique(tamane, tongue_flutter, tremolo_effect).

%% koto_technique(+TechniqueName, -Notation, -Sound)
%% Koto playing techniques. (C1806)
koto_technique(sukui_zume, scooping_pluck, upward_bright).
koto_technique(oshi_de, pressing_bridge_left, pitch_bend_up).
koto_technique(hiki_iro, pull_after_pluck, pitch_bend_down).
koto_technique(shan, quick_glissando, sweeping_effect).
koto_technique(sararin, slow_glissando, gentle_cascade).
koto_technique(tremolo, rapid_plucking, sustained_shimmer).
koto_technique(pizzicato, left_hand_stop, muted_pluck).

%% ============================================================================
%% KOREAN MUSIC THEORY (C1807-C1810)
%% ============================================================================

%% korean_mode(+ModeName, -Context, -PitchSet)
%% Korean modal system. (C1807)
korean_mode(pyeongjo, peaceful_elegant, [hwang, tae, jung, im, nam]).
korean_mode(gyemyeonjo, sad_sorrowful, [hwang, jung, im, nam, hwang_octave]).
korean_mode(ujo, noble_bright, [hwang, tae, jung, nam, hwang_octave]).
korean_mode(bangyeomjo, folk_lively, [hwang, tae, jung, im, nam]).

%% jangdan_pattern(+JangdanName, -Pattern, -Instrument)
%% Jangdan (rhythmic patterns) in Korean music. (C1808)
jangdan_pattern(jungmori, [kung, duk, kung, duk, kung, duk, kung, duk, kung, duk, kung, duk], janggu).
jangdan_pattern(jungjungmori, [kung, duk, kung, duk, kung, duk, kung, duk], janggu).
jangdan_pattern(semachi, [kung, duk, kung, kung, duk, kung, duk, kung, kung], janggu).
jangdan_pattern(gutgeori, [kung, duk, kung, duk, kung, duk, kung, duk, kung, duk, kung, duk], janggu).
jangdan_pattern(jajinmori, [kung, duk, kung, kung, duk, kung, duk, kung, kung, duk, kung, duk], janggu).
jangdan_pattern(hwimori, [kung, duk, kung, duk], janggu).
jangdan_pattern(eotmori, [kung, duk, kung, duk, kung, duk, kung, duk, kung, duk], janggu).

%% sigimsae_ornament(+Type, -Execution, -Expression)
%% Sigimsae (Korean ornamental techniques). (C1809)
sigimsae_ornament(nonghyeon, string_vibrato, deep_emotional).
sigimsae_ornament(jeonseong, portamento, connecting_expression).
sigimsae_ornament(twegieum, grace_note, decorative_accent).
sigimsae_ornament(chucheon, bending_up, ascending_expression).
sigimsae_ornament(toesong, bending_down, descending_expression).
sigimsae_ornament(jeontoe, trill_like, oscillating_expression).

%% gayageum_technique(+TechniqueName, -Notation, -Sound)
%% Gayageum (Korean zither) techniques. (C1810)
gayageum_technique(tteuteungi, plucking_outward, clear_bright).
gayageum_technique(jitgi, pushing_string, pitch_bend).
gayageum_technique(nongghyeon, vibrato_bending, wavering_tone).
gayageum_technique(ttuigim, snapping, percussive_accent).
gayageum_technique(seulechigi, sweeping, cascading_sound).
gayageum_technique(damping, muting, percussive_stop).

%% ============================================================================
%% SHARED EAST ASIAN CONCEPTS (C1811-C1826)
%% ============================================================================

%% heterophony_rule(+MainPart, -DerivativePart, -Relationship)
%% How heterophonic texture works in East Asian ensemble. (C1811)
heterophony_rule(main_melody, ornamented_version, simultaneous_variation).
heterophony_rule(main_melody, simplified_version, skeleton_melody).
heterophony_rule(main_melody, rhythmic_variant, displaced_rhythm).
heterophony_rule(vocal_line, instrumental_shadow, following_with_fills).

%% breath_phrase_model(+Instrument, -BreathLength, -PhraseBoundary)
%% Breath-based phrasing in East Asian music. (C1812)
breath_phrase_model(shakuhachi, long_breath, note_fade_to_silence).
breath_phrase_model(xiao, moderate_breath, gentle_diminuendo).
breath_phrase_model(daegeum, long_breath, breath_noise_transition).
breath_phrase_model(sho_mouth_organ, continuous, aitake_cluster).

%% east_asian_form(+FormName, -Sections, -Development)
%% Formal structures common in East Asian music. (C1813)
east_asian_form(jo_ha_kyu, [jo(slow_introduction), ha(development_breaking), kyu(rapid_conclusion)], acceleration).
east_asian_form(sanjo, [jinyangjo(very_slow), jungmori(moderate), jungjungmori(moderately_fast), jajinmori(fast), hwimori(very_fast)], gradual_acceleration).
east_asian_form(qupai_form, [opening, body_variations, closing], variation_on_fixed_melody).
east_asian_form(dan_form, [dan_1, dan_2, dan_3, coda], sectional_with_tempo_change).
east_asian_form(sugiagari, [low_register_slow, middle_register_moderate, high_register_fast], ascending_progression).

%% heterophony_model(+MainMelody, -Variation, -Relationship)
%% Detailed heterophony modeling. (C1767)
heterophony_model(sustained_note, ornamented_note, temporal_decoration).
heterophony_model(stepwise_melody, grace_note_version, micro_ornamental).
heterophony_model(descending_phrase, ascending_variant, contrary_heterophony).
heterophony_model(any_melody, rhythmic_offset, temporal_displacement).
heterophony_model(vocal_melody, instrumental_echo, leader_follower).

%% pentatonic_variation_technique(+Base, -Technique, -Result)
%% Techniques for varying pentatonic melodies (shared across E. Asian). (C1825)
pentatonic_variation_technique(base_melody, modal_shift, same_notes_different_tonic).
pentatonic_variation_technique(base_melody, octave_displacement, register_variation).
pentatonic_variation_technique(base_melody, ornamental_filling, decorated_version).
pentatonic_variation_technique(base_melody, rhythmic_augmentation, stretched_version).
pentatonic_variation_technique(base_melody, inversion, mirror_melody).
pentatonic_variation_technique(base_melody, exchange_of_roles, new_instrument_lead).

%% east_west_fusion_rule(+EasternElement, +WesternHarmony, -Integration)
%% Rules for East-West musical fusion. (C1826)
east_west_fusion_rule(pentatonic_melody, triadic_harmony, harmonize_on_scale_degrees).
east_west_fusion_rule(heterophonic_texture, polyphonic_texture, hybrid_texture).
east_west_fusion_rule(breath_phrasing, metric_phrasing, flexible_barlines).
east_west_fusion_rule(microtonal_ornament, equal_temperament, pitch_bend_simulation).
east_west_fusion_rule(free_rhythm, strict_meter, rubato_sections).
east_west_fusion_rule(silk_string_timbre, steel_string_timbre, contrasting_timbres).
