%% music-theory-latin.pl - Latin American Music Theory KB
%%
%% Provides predicates for:
%% - Clave patterns and direction (C1862-C1863)
%% - Tumbao and montuno (C1864-C1866)
%% - Brazilian rhythms (C1871-C1880)
%% - Tango, flamenco, Andean (C1881-C1900)
%%
%% Depends on: music-theory.pl

%% ============================================================================
%% CLAVE PATTERNS (C1862-C1863)
%% ============================================================================

%% clave_pattern(+ClaveName, -Pattern, -Style)
%% The fundamental rhythmic key of Afro-Cuban music. (C1862)
%% Pattern expressed in 16th notes: 1=hit, 0=rest across 2 bars.
clave_pattern(son_3_2, [1,0,0,1,0,0,1,0,0,0,1,0,1,0,0,0], afro_cuban).
clave_pattern(son_2_3, [0,0,1,0,1,0,0,0,1,0,0,1,0,0,1,0], afro_cuban).
clave_pattern(rumba_3_2, [1,0,0,1,0,0,0,1,0,0,1,0,1,0,0,0], afro_cuban).
clave_pattern(rumba_2_3, [0,0,1,0,1,0,0,0,1,0,0,1,0,0,0,1], afro_cuban).
clave_pattern(bossa_nova, [1,0,0,1,0,0,1,0,0,0,1,0,0,1,0,0], brazilian).
clave_pattern(partido_alto, [0,0,1,0,0,0,1,0,1,0,0,1,0,0,1,0], brazilian).
clave_pattern(cascara, [1,0,1,0,1,1,0,1,0,1,0,1,1,0,1,0], afro_cuban).

%% clave_direction(+Pattern, -Direction, -Phrase)
%% Whether clave starts 3-side or 2-side. (C1863)
clave_direction(son_3_2, three_two, 'Three-side (strong) first, two-side second').
clave_direction(son_2_3, two_three, 'Two-side first, three-side (strong) second').
clave_direction(rumba_3_2, three_two, 'Rumba three-side first').
clave_direction(rumba_2_3, two_three, 'Rumba two-side first').
clave_direction(bossa_nova, three_two, 'Bossa nova forward clave').

%% ============================================================================
%% TUMBAO, MONTUNO & GUAJEO (C1864-C1866)
%% ============================================================================

%% tumbao_pattern(+Instrument, -Pattern, -ClaveRelation)
%% Bass and piano patterns that lock with clave. (C1864)
tumbao_pattern(bass, [rest,rest,rest,rest,rest,rest,rest,1,rest,rest,rest,rest,rest,rest,1,rest], anticipates_downbeat).
tumbao_pattern(conga, [open,rest,slap,rest,open,rest,tone,rest], alternating_open_slap).
tumbao_pattern(timbales, [rest,1,rest,1,rest,rest,1,rest,rest,1,rest,rest,rest,rest,1,1], cascara_shell).

%% montuno_pattern(+ChordType, -Pattern, -Style)
%% Piano montuno (guajeo) patterns. (C1865)
montuno_pattern(major, [root_5th, 3rd_root, 5th_3rd, root_5th], son_montuno).
montuno_pattern(minor, [root_b3rd, 5th_root, b3rd_5th, root_b3rd], son_montuno).
montuno_pattern(dominant7, [root_b7th, 3rd_root, 5th_3rd, b7th_5th], mambo).

%% guajeo_style(+Style, -RhythmicFeel, -HarmonicContent)
%% Named guajeo styles. (C1866)
guajeo_style(son, anticipated_bass, basic_triads).
guajeo_style(mambo, on_beat, extended_chords).
guajeo_style(cha_cha_cha, syncopated, triads_with_passing).
guajeo_style(salsa_moderna, complex_syncopation, jazz_voicings).

%% ============================================================================
%% CUBAN & SALSA FORMS (C1867-C1870)
%% ============================================================================

%% salsa_form(+FormName, -Sections, -Characteristics)
%% Song forms in salsa and Cuban music. (C1867)
salsa_form(salsa_standard, [intro, verse, pre_coro, coro, mambo, moña, coro_montuno, outro],
  [clave_based, horn_section, call_response_coro]).
salsa_form(son_montuno, [largo, montuno],
  [slow_intro_then_fast, improvisation_in_montuno]).
salsa_form(guaguanco, [diana, canto, montuno],
  [vocal_intro, rumba_rhythm, improvised_solo]).
salsa_form(timba, [intro, verse, coro, section_changes, bomba_section, despelote],
  [cuban_contemporary, complex_arrangements, gear_changes]).

%% mambo_section(+Type, -Characteristics, -Instrumentation)
%% The mambo section in salsa arrangements. (C1868)
mambo_section(moña, [repeated_horn_riff, building_intensity], [trumpets, trombones]).
mambo_section(mambo, [counterpoint_riffs, peak_energy], [full_horn_section]).
mambo_section(diablo, [climactic_riff, maximum_intensity], [tutti]).
mambo_section(special, [arranged_figure, contrast], [varied]).

%% ============================================================================
%% BRAZILIAN RHYTHMS (C1871-C1880)
%% ============================================================================

%% samba_pattern(+Instrument, -Pattern, -Style)
%% Samba rhythm patterns by instrument. (C1871)
samba_pattern(surdo_first, [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], marcação).
samba_pattern(surdo_second, [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], resposta).
samba_pattern(surdo_third, [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], cortador).
samba_pattern(tamborim, [1,0,1,1,0,1,1,0,1,0,0,1,0,1,0,1], teleco_teco).
samba_pattern(pandeiro, [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1], standard).
samba_pattern(agogo_samba, [1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0], two_tone).
samba_pattern(ganza, [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], continuous_shake).

%% bossa_nova_pattern(+Instrument, -Pattern, -Feel)
%% Bossa nova rhythmic patterns. (C1872)
bossa_nova_pattern(guitar, [bass,rest,chord,rest,bass,chord,rest,chord], joao_gilberto).
bossa_nova_pattern(drums, [kick_hihat,rest,hihat,rim,kick_hihat,rest,hihat,rest], brush_pattern).
bossa_nova_pattern(bass, [root,rest,rest,fifth,rest,root,rest,rest], walking_feel).

%% baiao_pattern(+Instrument, -Pattern, -Region)
%% Baião (Northeastern Brazil) rhythm patterns. (C1873)
baiao_pattern(zabumba, [dum,rest,pa,rest,dum,rest,rest,pa], standard).
baiao_pattern(triangle, [1,1,1,0,1,1,1,0], continuous_except_accent).
baiao_pattern(sanfona, melodic_lead, accordion_driven).

%% maracatu_pattern(+Part, -Pattern, -Style)
%% Maracatu (Recife) drumming patterns. (C1874)
maracatu_pattern(alfaia, [1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0], nação).
maracatu_pattern(gongue, [1,0,1,0,1,0,0,1,0,1,0,0], bell).
maracatu_pattern(caixa, [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], continuous_roll).
maracatu_pattern(abê, [1,0,1,0,1,0,1,0], shaker).

%% frevo_pattern(+Type, -Tempo, -Characteristics)
%% Frevo (Pernambuco carnival) patterns. (C1875)
frevo_pattern(frevo_de_rua, 160, [brass_heavy, march_derived, syncopated]).
frevo_pattern(frevo_canção, 130, [vocal, more_melodic, moderate_tempo]).
frevo_pattern(frevo_de_bloco, 140, [choral, string_section, lyrical]).

%% ============================================================================
%% TANGO (C1881-C1885)
%% ============================================================================

%% tango_rhythm(+PatternName, -Pattern, -Era)
%% Tango rhythmic patterns. (C1881)
tango_rhythm(habanera, [1,0,0,1,0,1,0,0], guardia_vieja).
tango_rhythm(marcato_cuatro, [1,0,1,0,1,0,1,0], classic).
tango_rhythm(sincopa, [0,1,0,1,0,0,1,0], golden_age).
tango_rhythm(tres_tres_dos, [1,0,0,1,0,0,1,0], nuevo_tango).
tango_rhythm(yumba, [1,0,0,0,1,0,0,0], pugliese).

%% bandoneon_technique(+Technique, -Description, -Effect)
%% Bandoneon playing techniques. (C1882)
bandoneon_technique(fuelle, 'Bellows expression', dynamic_control).
bandoneon_technique(staccato, 'Short articulation', rhythmic_drive).
bandoneon_technique(ligado, 'Legato phrasing', melodic_expression).
bandoneon_technique(arrastre, 'Dragging bellows', tango_signature_sound).
bandoneon_technique(rezongo, 'Low register drone', dark_atmosphere).

%% tango_form(+FormName, -Sections, -Characteristics)
%% Tango song structures. (C1883)
tango_form(classic_tango, [intro, a_section, b_section, a_return, coda], [ternary, melodic]).
tango_form(milonga, [verse, estribillo, verse, estribillo], [faster_2_4, playful]).
tango_form(vals_criollo, [a_section, b_section, a_return], [waltz_3_4, nostalgic]).
tango_form(nuevo_tango, [free_sections, through_composed], [piazzolla, classical_influence]).

%% ============================================================================
%% FLAMENCO (C1886-C1890)
%% ============================================================================

%% flamenco_compas(+PaloName, -Pattern, -Accents)
%% Flamenco compás (rhythmic cycle) patterns. (C1886)
flamenco_compas(solea, 12, [0,0,1,0,0,1,0,1,0,1,0,1]).     %% 3+3+2+2+2
flamenco_compas(buleria, 12, [0,0,1,0,0,1,0,1,0,1,0,1]).    %% Fast soleá
flamenco_compas(alegria, 12, [1,0,1,0,0,1,0,0,1,0,0,1]).    %% Different accent pattern
flamenco_compas(siguiriya, 12, [1,0,1,0,0,1,0,1,0,0,1,0]).  %% Unique deep flamenco
flamenco_compas(tangos, 4, [1,0,1,0]).                        %% 4/4 based
flamenco_compas(rumba, 4, [1,0,1,0]).                          %% 4/4 festive
flamenco_compas(fandango, 6, [1,0,0,1,0,0]).                  %% 3/4 based
flamenco_compas(tientos, 4, [1,0,1,0]).                        %% Slow tangos

%% palo_classification(+PaloName, -Family, -Mood)
%% Flamenco palo families and moods. (C1887)
palo_classification(solea, solea_family, deep_serious).
palo_classification(buleria, solea_family, festive_virtuosic).
palo_classification(alegria, cantiñas_family, joyful_elegant).
palo_classification(siguiriya, siguiriya_family, profound_tragic).
palo_classification(tangos, tangos_family, rhythmic_festive).
palo_classification(fandango, fandango_family, lyrical_expressive).
palo_classification(solea_por_buleria, solea_family, moderate_deep).
palo_classification(tientos, tangos_family, slow_sensual).
palo_classification(rumba, tangos_family, popular_festive).

%% flamenco_guitar_technique(+Technique, -Description, -Context)
%% Guitar techniques in flamenco. (C1888)
flamenco_guitar_technique(rasgueado, 'Rapid strumming with fanned fingers', rhythmic_drive).
flamenco_guitar_technique(picado, 'Alternating finger plucking', melodic_runs).
flamenco_guitar_technique(alzapua, 'Thumb technique: up-down-up', powerful_bass).
flamenco_guitar_technique(golpe, 'Tap on guitar body', percussive_accent).
flamenco_guitar_technique(tremolo, 'Rapid repeated notes', sustained_melody).
flamenco_guitar_technique(arpegio, 'Broken chord patterns', harmonic_texture).
flamenco_guitar_technique(ligado, 'Hammer-on/pull-off', fluid_ornament).

%% flamenco_harmony(+Context, -Progression, -Mode)
%% Harmonic patterns in flamenco. (C1889)
flamenco_harmony(andalusian_cadence, [am, g, f, e], phrygian).
flamenco_harmony(por_medio, [am, g, f, e], a_phrygian).
flamenco_harmony(por_arriba, [em, d, c, b], e_phrygian).
flamenco_harmony(major_mode, [c, f, g, c], major).
flamenco_harmony(buleria_modern, [am, g, f, e, bb, a], chromatic_phrygian).

%% ============================================================================
%% ANDEAN MUSIC (C1891-C1895)
%% ============================================================================

%% andean_scale(+ScaleName, -Intervals, -Region)
%% Andean scale systems. (C1891)
andean_scale(pentatonic_minor, [0, 3, 5, 7, 10], pan_andean).
andean_scale(pentatonic_major, [0, 2, 4, 7, 9], pan_andean).
andean_scale(tritonos, [0, 2, 3, 5, 7, 8, 10], andes).  %% Heptatonic variant

%% andean_instrument(+Instrument, -Family, -Range)
%% Andean instrument catalog. (C1892)
andean_instrument(quena, wind, [d4, d6]).
andean_instrument(siku, wind, [g3, g5]).
andean_instrument(charango, string, [e4, e6]).
andean_instrument(bombo, percussion, rhythmic_only).
andean_instrument(zampoña, wind, [c4, c6]).
andean_instrument(ronroco, string, [g3, g5]).

%% andean_form(+FormName, -Meter, -Characteristics)
%% Andean musical forms. (C1893)
andean_form(huayno, duple, [pentatonic, syncopated, festive]).
andean_form(sanjuanito, duple, [ecuadorian, binary, dance]).
andean_form(yaravi, slow_triple, [melancholic, lyrical, quechua]).
andean_form(carnavalito, fast_duple, [festive, community, circular_dance]).
andean_form(bailecito, waltz, [argentine_altiplano, creole_andean]).
andean_form(tinku, fast_duple, [potosi, powerful, ritual_combat_dance]).

%% ============================================================================
%% CARIBBEAN (C1896-C1900)
%% ============================================================================

%% reggae_pattern(+Instrument, -Pattern, -Style)
%% Reggae rhythmic patterns. (C1896)
reggae_pattern(guitar_skank, [0,1,0,1,0,1,0,1], offbeat_chords).
reggae_pattern(bass_one_drop, [0,0,0,0,0,0,1,0], one_drop).
reggae_pattern(drums_one_drop, [0,0,0,0,0,0,1,0], kick_on_three).
reggae_pattern(organ_bubble, [1,0,1,0,1,0,1,0], eighth_note_pulse).

%% calypso_pattern(+PatternType, -Rhythm, -Origin)
%% Calypso and Soca patterns. (C1897)
calypso_pattern(calypso_basic, [1,0,0,1,0,1,0,0], trinidad).
calypso_pattern(soca, [1,0,1,0,1,0,1,0], trinidad_modern).
calypso_pattern(power_soca, [1,1,1,0,1,1,1,0], high_energy).

%% cumbia_pattern(+Instrument, -Pattern, -Style)
%% Colombian cumbia patterns. (C1898)
cumbia_pattern(gaita, melodic_lead, traditional_wind).
cumbia_pattern(allegre, [1,0,1,1,0,1,1,0], lead_drum).
cumbia_pattern(llamador, [0,0,0,0,1,0,0,0], steady_pulse).
cumbia_pattern(guacharaca, [1,1,1,1,1,1,1,1], scraper_continuous).
cumbia_pattern(bass_electric, [1,0,0,0,1,0,0,0], modern_cumbia).

%% ============================================================================
%% ADDITIONAL LATIN PREDICATES (C1868-C1879)
%% ============================================================================

%% salsa_arrangement(+Intro, -Body, -Mambo, -Coda)
%% Salsa arrangement structure. (C1868)
salsa_arrangement(intro(horn_hits_4_bars), body(verse_chorus_coro, clave_based), mambo(horn_riffs_4_bar, high_energy), coda(breakdown_to_final_hit)).
salsa_arrangement(intro(piano_montuno_8_bars), body(son_montuno, pregon_coro), mambo(unison_figures, building), coda(rhythmic_break_tag)).

%% brazilian_rhythm(+StyleName, -Pattern, -Instruments)
%% Brazilian rhythm patterns. (C1869)
brazilian_rhythm(samba_de_roda, circular_dance_rhythm, [atabaque, pandeiro, agogo, viola]).
brazilian_rhythm(partido_alto, syncopated_samba, [pandeiro, surdo, tamborim, cavaquinho]).
brazilian_rhythm(samba_reggae, afro_bahian, [surdo_trio, repinique, timbales]).
brazilian_rhythm(forro, accordion_driven, [zabumba, triangle, sanfona]).
brazilian_rhythm(choro, instrumental_samba, [bandolim, cavaquinho, violao, pandeiro]).

%% Additional samba_pattern entries. (C1870)
samba_pattern(repinique, [1,0,1,0,1,1,0,1,0,1,1,0,1,0,1,0], conductor_drum).
samba_pattern(caixa, [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], snare_buzz_roll).
samba_pattern(chocalho, [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0], shaker_eighth_notes).

%% Additional bandoneon_technique entries. (C1876)
bandoneon_technique(fuelle, bellows_accent, dynamic_swell).
bandoneon_technique(staccato, button_release, sharp_detach).
bandoneon_technique(ligado, smooth_bellows, legato_phrase).
bandoneon_technique(arrastre, dragging_attack, tango_characteristic).

%% Additional cumbia_pattern entries. (C1877)
cumbia_pattern(accordion, melodic_riff, vallenato_style).
cumbia_pattern(guiro, scraping_pattern, mexican_cumbia).
cumbia_pattern(timbales, [1,0,0,1,1,0,0,1], cumbia_villera).

%% reggaeton_pattern(+Element, -Pattern, -Variation)
%% Reggaeton production patterns. (C1878)
reggaeton_pattern(dembow_beat, [kick,hat,snare,hat,kick,hat,snare,hat], classic).
reggaeton_pattern(synth_bass, [1,0,0,1,0,0,1,0], bounce_bass).
reggaeton_pattern(hi_hat, [1,1,1,1,1,1,1,1], continuous_sixteenths).
reggaeton_pattern(vocal_flow, syllabic_rap, spanish_flow).
reggaeton_pattern(perreo, [kick,0,snare,0,kick,kick,snare,0], dance_variant).

%% dembow_rhythm(+PatternType, -Pattern, -Usage)
%% Dembow rhythm variations. (C1879)
dembow_rhythm(classic, [kick,hat,snare,hat,kick,hat,snare,hat], reggaeton_standard).
dembow_rhythm(half_time, [kick,0,0,0,snare,0,0,0], slow_reggaeton).
dembow_rhythm(double_time, [kick,snare,kick,snare,kick,snare,kick,snare], fast_dembow).
dembow_rhythm(dancehall_origin, [kick,hat,snare,hat,0,hat,snare,hat], jamaican_roots).
dembow_rhythm(moombahton, [kick,0,snare,0,kick,0,snare,0], dutch_fusion).
