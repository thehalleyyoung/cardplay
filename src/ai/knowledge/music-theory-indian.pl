%% music-theory-indian.pl - Indian Classical Music Theory KB
%%
%% Provides predicates for:
%% - Raga system: scales, phrases, time theory (C1702-C1730)
%% - Tala system: rhythmic cycles, patterns (C1714-C1720)
%% - Performance structures: alapana, tanam, pallavi (C1721-C1726)
%% - Gamaka (ornaments) system (C1711-C1713)
%% - North-South comparison (C1741-C1748)
%%
%% Depends on: music-theory.pl

%% ============================================================================
%% RAGA DATABASE (C1702-C1710)
%% ============================================================================

%% raga_database(+RagaName, -Aroha, -Avaroha, -Vadi, -Samvadi)
%% Core raga definitions with ascending/descending scales and main notes. (C1702)

%% Major Hindustani ragas
raga_database(yaman, [s, r2, g2, m2, p, d2, n2, 'S'], ['S', n2, d2, p, m2, g2, r2, s], n2, g2).
raga_database(bhairav, [s, r1, g2, m1, p, d1, n2, 'S'], ['S', n2, d1, p, m1, g2, r1, s], d1, r1).
raga_database(bhairavi, [s, r1, g1, m1, p, d1, n1, 'S'], ['S', n1, d1, p, m1, g1, r1, s], m1, s).
raga_database(todi, [s, r1, g1, m2, p, d1, n2, 'S'], ['S', n2, d1, p, m2, g1, r1, s], d1, g1).
raga_database(marwa, [s, r1, g2, m2, d2, n2, 'S'], ['S', n2, d2, m2, g2, r1, s], d2, r1).
raga_database(poorvi, [s, r1, g2, m2, p, d1, n2, 'S'], ['S', n2, d1, p, m2, g2, r1, s], g2, n2).
raga_database(kafi, [s, r2, g1, m1, p, d2, n1, 'S'], ['S', n1, d2, p, m1, g1, r2, s], p, r2).
raga_database(bilawal, [s, r2, g2, m1, p, d2, n2, 'S'], ['S', n2, d2, p, m1, g2, r2, s], d2, g2).
raga_database(khamaj, [s, r2, g2, m1, p, d2, n1, 'S'], ['S', n1, d2, p, m1, g2, r2, s], g2, n1).
raga_database(kalyan, [s, r2, g2, m2, p, d2, n2, 'S'], ['S', n2, d2, p, m2, g2, r2, s], g2, n2).
raga_database(asavari, [s, r2, g1, m1, p, d1, n1, 'S'], ['S', n1, d1, p, m1, g1, r2, s], d1, g1).

%% Carnatic ragas (using melakarta system)
raga_database(shankarabharanam, [s, r2, g2, m1, p, d2, n2, 'S'], ['S', n2, d2, p, m1, g2, r2, s], p, r2).
raga_database(kalyani, [s, r2, g2, m2, p, d2, n2, 'S'], ['S', n2, d2, p, m2, g2, r2, s], p, r2).
raga_database(kharaharapriya, [s, r2, g1, m1, p, d2, n2, 'S'], ['S', n2, d2, p, m1, g1, r2, s], p, r2).
raga_database(harikambhoji, [s, r2, g2, m1, p, d2, n1, 'S'], ['S', n1, d2, p, m1, g2, r2, s], p, r2).
raga_database(todi_carnatic, [s, r1, g1, m2, p, d1, n2, 'S'], ['S', n2, d1, p, m2, g1, r1, s], p, g1).

%% raga_pakad(+RagaName, -CharacteristicPhrase)
%% The signature phrase that identifies a raga. (C1703)
raga_pakad(yaman, [n2, r2, g2, r2, s]).
raga_pakad(bhairav, [r1, g2, m1, p, d1]).
raga_pakad(bhairavi, [s, r1, g1, m1, p]).
raga_pakad(todi, [d1, s, r1, g1, m2]).
raga_pakad(kafi, [g1, m1, p, d2, n1, p]).
raga_pakad(khamaj, [g2, m1, p, n1, d2, p]).
raga_pakad(marwa, [r1, g2, m2, d2, n2]).
raga_pakad(kalyan, [n2, r2, g2, m2, p]).

%% raga_time_theory(+RagaName, +Prahar, -Appropriateness)
%% When a raga should be performed (prahar = 3-hour period). (C1704)
raga_time_theory(yaman, evening, ideal).
raga_time_theory(yaman, night, good).
raga_time_theory(yaman, morning, inappropriate).
raga_time_theory(bhairav, early_morning, ideal).
raga_time_theory(bhairav, morning, good).
raga_time_theory(bhairavi, any_time, ideal).  %% Exception: all-time raga
raga_time_theory(todi, late_morning, ideal).
raga_time_theory(marwa, sunset, ideal).
raga_time_theory(poorvi, sunset, ideal).
raga_time_theory(kafi, late_night, ideal).
raga_time_theory(khamaj, late_evening, ideal).
raga_time_theory(bilawal, morning, ideal).
raga_time_theory(kalyan, evening, ideal).

%% raga_season(+RagaName, -Season)
%% Seasonal associations of ragas. (C1705)
raga_season(megh, monsoon).
raga_season(malhar, monsoon).
raga_season(deepak, summer).
raga_season(hindol, spring).
raga_season(bahar, spring).
raga_season(basant, spring).
raga_season(_, all_seasons).  %% Most ragas have no seasonal restriction

%% raga_rasa(+RagaName, -DominantRasa)
%% The emotional essence (rasa) of a raga. (C1706)
raga_rasa(yaman, shringara).    %% love, beauty
raga_rasa(bhairav, shanta).     %% peace, devotion
raga_rasa(bhairavi, karuna).    %% compassion, pathos
raga_rasa(todi, karuna).        %% sadness, longing
raga_rasa(marwa, vira).         %% heroic
raga_rasa(kafi, shringara).     %% romantic
raga_rasa(khamaj, shringara).   %% sensual
raga_rasa(poorvi, shanta).      %% serenity
raga_rasa(bilawal, hasya).      %% joy, cheerful

%% raga_family(+RagaName, -Thaat)
%% Hindustani thaat classification. (C1707)
raga_family(yaman, kalyan).
raga_family(kalyan, kalyan).
raga_family(bhairav, bhairav).
raga_family(bhairavi, bhairavi).
raga_family(todi, todi).
raga_family(marwa, marwa).
raga_family(poorvi, poorvi).
raga_family(kafi, kafi).
raga_family(bilawal, bilawal).
raga_family(khamaj, khamaj).
raga_family(asavari, asavari).

%% thaat_scale(+ThaatName, -Swaras)
%% The 10 Hindustani thaats and their scales. (C1708)
thaat_scale(bilawal, [s, r2, g2, m1, p, d2, n2]).    %% = Ionian
thaat_scale(kalyan, [s, r2, g2, m2, p, d2, n2]).     %% = Lydian
thaat_scale(khamaj, [s, r2, g2, m1, p, d2, n1]).     %% = Mixolydian
thaat_scale(bhairav, [s, r1, g2, m1, p, d1, n2]).    %% Unique Indian
thaat_scale(kafi, [s, r2, g1, m1, p, d2, n1]).       %% = Dorian
thaat_scale(asavari, [s, r2, g1, m1, p, d1, n1]).    %% = Natural minor
thaat_scale(todi, [s, r1, g1, m2, p, d1, n2]).       %% Unique Indian
thaat_scale(purvi, [s, r1, g2, m2, p, d1, n2]).      %% Unique Indian
thaat_scale(marwa, [s, r1, g2, m2, p, d2, n2]).      %% Unique Indian (no P common)
thaat_scale(bhairavi, [s, r1, g1, m1, p, d1, n1]).   %% = Phrygian

%% melakarta_system(+MelaNumber, -Name, -Swaras)
%% Carnatic melakarta (parent scale) catalog. (C1709) — Selected entries.
melakarta_system(1, kanakangi, [s, r1, g1, m1, p, d1, n1]).
melakarta_system(15, mayamalavagowla, [s, r1, g2, m1, p, d1, n2]).
melakarta_system(22, kharaharapriya, [s, r2, g1, m1, p, d2, n2]).
melakarta_system(28, harikambhoji, [s, r2, g2, m1, p, d2, n1]).
melakarta_system(29, shankarabharanam, [s, r2, g2, m1, p, d2, n2]).
melakarta_system(36, chalanata, [s, r2, g2, m2, p, d1, n1]).
melakarta_system(65, kalyani, [s, r2, g2, m2, p, d2, n2]).
melakarta_system(72, rasikapriya, [s, r2, g2, m2, p, d2, n2]).

%% janya_raga(+JanyaRaga, -ParentMelakarta)
%% Derived (janya) ragas and their parent scales. (C1710)
janya_raga(mohanam, harikambhoji).    %% Pentatonic
janya_raga(hindolam, natabhairavi).
janya_raga(hamsadhwani, shankarabharanam).
janya_raga(abhogi, kharaharapriya).
janya_raga(revati, kanakangi).
janya_raga(amritavarshini, kalyani).
janya_raga(ragamalika, various).

%% ============================================================================
%% GAMAKA (ORNAMENT) SYSTEM (C1711-C1713)
%% ============================================================================

%% gamaka_type(+GamakaName, -Description, -Notation)
%% Types of Indian melodic ornaments. (C1711)
gamaka_type(kampita, 'Oscillation/shake between notes', '~').
gamaka_type(andolita, 'Gentle swing between notes', 'S').
gamaka_type(jaru, 'Slide from one note to another', '/').
gamaka_type(nokku, 'Stress/hammer-on', '^').
gamaka_type(odukkal, 'Deflection downward', 'v').
gamaka_type(orikkai, 'Specific ornamental slide', '~v').
gamaka_type(sphuritam, 'Grace note touch', ',').
gamaka_type(pratyahata, 'Bounce/rebound ornament', 'b').
gamaka_type(murki, 'Quick turn/gruppetto', 'm').
gamaka_type(meend, 'Continuous glide (Hindustani)', '---').
gamaka_type(kan, 'Grace note touch (Hindustani)', '.').
gamaka_type(krintan, 'Pull-off (sitar/sarod)', 'kr').

%% gamaka_for_swara(+RagaName, +Swara, -ApproprGamakas)
%% Which gamakas are appropriate for which swara in a raga. (C1712)
gamaka_for_swara(yaman, g2, [kampita, jaru, andolita]).
gamaka_for_swara(yaman, n2, [kampita, jaru]).
gamaka_for_swara(yaman, r2, [kampita]).
gamaka_for_swara(bhairav, r1, [andolita, kampita]).
gamaka_for_swara(bhairav, d1, [andolita, kampita]).
gamaka_for_swara(bhairavi, g1, [kampita, jaru, andolita, meend]).
gamaka_for_swara(bhairavi, d1, [kampita, andolita]).
gamaka_for_swara(todi, r1, [kampita, andolita]).
gamaka_for_swara(todi, d1, [jaru, andolita]).
gamaka_for_swara(_, _, [kampita]).  %% Default: kampita is always appropriate

%% gamaka_intensity(+Context, +RasaTarget, -GamakaLevel)
%% How densely to apply gamakas based on context and emotion. (C1713)
gamaka_intensity(alapana, karuna, dense).
gamaka_intensity(alapana, shringara, moderate).
gamaka_intensity(alapana, vira, sparse).
gamaka_intensity(tanam, _, moderate).
gamaka_intensity(kriti, karuna, moderate).
gamaka_intensity(kriti, hasya, sparse).
gamaka_intensity(kalpana_swara, _, sparse).
gamaka_intensity(fast_passage, _, sparse).

%% ============================================================================
%% TALA SYSTEM (C1714-C1720)
%% ============================================================================

%% tala_definition(+TalaName, -Angas, -Aksharas, -Jaatis)
%% Tala definitions: component parts, total beats, subdivisions. (C1714)

%% Carnatic suladi sapta talas
tala_definition(adi, [chatusra_laghu, drutam, drutam], 8, chatusra).
tala_definition(rupaka, [drutam, chatusra_laghu], 6, chatusra).
tala_definition(misra_chapu, [misra], 7, [3,2,2]).
tala_definition(khanda_chapu, [khanda], 5, [2,1,2]).
tala_definition(triputa, [chatusra_laghu, drutam, drutam], 7, tisra).

%% Hindustani talas
tala_definition(tintal, [vibhag4, vibhag4, vibhag4, vibhag4], 16, chatusra).
tala_definition(jhaptal, [vibhag2, vibhag3, vibhag2, vibhag3], 10, chatusra).
tala_definition(rupak_h, [vibhag3, vibhag2, vibhag2], 7, chatusra).
tala_definition(ektal, [vibhag4, vibhag4, vibhag4], 12, chatusra).
tala_definition(dadra, [vibhag3, vibhag3], 6, chatusra).
tala_definition(keherwa, [vibhag4, vibhag4], 8, chatusra).

%% tala_clap_pattern(+TalaName, -ClapWavePattern)
%% Clap/wave patterns for counting the tala. (C1715)
tala_clap_pattern(tintal, [clap, clap, wave, clap]).
tala_clap_pattern(jhaptal, [clap, wave, clap, wave]).
tala_clap_pattern(rupak_h, [wave, clap, clap]).
tala_clap_pattern(ektal, [clap, wave, clap, wave, clap, wave]).
tala_clap_pattern(dadra, [clap, wave]).
tala_clap_pattern(adi, [clap, finger_count, finger_count, finger_count, wave, wave]).

%% laya_type(+LayaName, -TempoMultiplier, -Description)
%% Tempo/speed levels in Indian music. (C1716)
laya_type(ati_vilambit, 0.25, 'Very slow — one note may span several seconds').
laya_type(vilambit, 0.5, 'Slow — spacious, contemplative').
laya_type(madhya, 1.0, 'Medium — natural walking pace').
laya_type(drut, 2.0, 'Fast — energetic, virtuosic').
laya_type(ati_drut, 4.0, 'Very fast — extremely rapid passages').

%% korvai_structure(+Pattern, -Repetitions, -Landing)
%% Korvai: a rhythmic composition that lands on sam after 3 repetitions. (C1718)
korvai_structure(Pattern, 3, sam) :-
  length(Pattern, _),
  %% Korvai must be playable 3 times and land on sam
  true.

%% tihai_calculation(+Pattern, +Gap, +Cycles, -ValidTihai)
%% Calculate whether a tihai (3-fold rhythmic cadence) lands on sam. (C1720)
tihai_calculation(Pattern, Gap, Cycles, tihai(Pattern, Gap, Total, Valid)) :-
  length(Pattern, PLen),
  Total is 3 * PLen + 2 * Gap,
  Remainder is Total mod Cycles,
  ( Remainder =:= 0 -> Valid = true
  ; Valid = false
  ).

%% ============================================================================
%% PERFORMANCE STRUCTURES (C1721-C1726)
%% ============================================================================

%% alapana_structure(+Phase, -Characteristics, -Duration)
%% The phases of an alapana (unmetered exploration). (C1721)
alapana_structure(invocation, [slow, lower_register, vadi_samvadi_focus], short).
alapana_structure(exploration, [expanding_range, all_swaras, gamakas_prominent], medium).
alapana_structure(development, [upper_register, fast_passages, virtuosic], long).
alapana_structure(conclusion, [return_to_sa, settling, summary], short).

%% tanam_pattern(+RagaName, -TanamType, -Pattern)
%% Tanam: rhythmic but un-metered patterns using ta-na-nam syllables. (C1722)
tanam_pattern(_, basic, [ta, na, nam, ta, na, nam]).
tanam_pattern(_, accelerating, [ta, nam, ta, nam, ta_na_nam]).
tanam_pattern(_, complex, [ta, na, nam, ta, nam, ta, na, nam]).

%% pallavi_structure(+Theme, -Development, -Return)
%% Pallavi: the theme in a concert performance. (C1723)
pallavi_structure(Theme, Development, Return) :-
  Development = [
    niraval(Theme),
    kalpana_swara,
    tani_avartanam,
    ragamalika
  ],
  Return = restate(Theme).

%% niraval_technique(+Line, -Variation, -Constraint)
%% Niraval: melodic variation while keeping lyrics/rhythm fixed. (C1724)
niraval_technique(Line, higher_octave, same_rhythm) :-
  Line \= [].
niraval_technique(Line, different_gamakas, same_swaras) :-
  Line \= [].
niraval_technique(Line, expanded_phrases, same_structure) :-
  Line \= [].

%% sangati_development(+Theme, +VariationNum, -Variation)
%% Sangati: gradual elaboration of a melodic line. (C1726)
sangati_development(Theme, 1, Theme).  %% First time: plain statement
sangati_development(Theme, 2, Variation) :-
  Variation = ornament(Theme, sparse_gamakas).
sangati_development(Theme, 3, Variation) :-
  Variation = ornament(Theme, moderate_gamakas).
sangati_development(Theme, N, Variation) :-
  N > 3,
  Variation = ornament(Theme, dense_gamakas_extended_range).

%% ============================================================================
%% NORTH-SOUTH COMPARISON (C1741-C1748)
%% ============================================================================

%% north_south_difference(+Concept, -Hindustani, -Carnatic)
%% Key differences between Hindustani and Carnatic systems. (C1741)
north_south_difference(classification, thaat_system_10, melakarta_system_72).
north_south_difference(ornaments, meend_gamak_taan, gamaka_16_types).
north_south_difference(rhythm, tabla_pakhawaj, mridangam_ghatam).
north_south_difference(voice, khayal_dhrupad, kriti_varnam).
north_south_difference(improvisation, alap_jod_jhala, alapana_tanam_pallavi).
north_south_difference(notation, bhatkhande, sargam_notation).

%% gharana_style(+GharanaName, -Characteristics, -Techniques)
%% Hindustani gharanas (schools). (C1742)
gharana_style(gwalior, [balanced, pure_raga, structured], [slow_khayal, layakari]).
gharana_style(agra, [power, dhrupad_influence, nom_tom], [meend, powerful_voice]).
gharana_style(jaipur_atrauli, [complex_ragas, rare_ragas, intricate], [detailed_alapana, unusual_ragas]).
gharana_style(kirana, [melody_centric, slow_development, emotion], [nyasa_emphasis, slow_khayal]).
gharana_style(patiala, [virtuosity, speed, brightness], [fast_taan, range_display]).

%% fusion_raga_mapping(+RagaName, -WesternMode, -Notes)
%% Mapping ragas to closest Western equivalents for fusion work. (C1744)
fusion_raga_mapping(yaman, lydian, [c, d, e, fsharp, g, a, b]).
fusion_raga_mapping(bilawal, ionian, [c, d, e, f, g, a, b]).
fusion_raga_mapping(khamaj, mixolydian, [c, d, e, f, g, a, bflat]).
fusion_raga_mapping(kafi, dorian, [c, d, eflat, f, g, a, bflat]).
fusion_raga_mapping(asavari, aeolian, [c, d, eflat, f, g, gsharp, bflat]).
fusion_raga_mapping(bhairavi, phrygian, [c, csharp, eflat, f, g, gsharp, bflat]).
fusion_raga_mapping(todi, none, [c, csharp, eflat, fsharp, g, gsharp, b]).  %% No Western equivalent

%% raga_chord_compatibility(+RagaName, -ChordType, -Compatibility)
%% Which Western chords work with a raga for fusion. (C1745)
raga_chord_compatibility(yaman, major7, high).
raga_chord_compatibility(yaman, dominant7_sharp11, high).
raga_chord_compatibility(kafi, minor7, high).
raga_chord_compatibility(kafi, dominant7, moderate).
raga_chord_compatibility(bhairavi, minor, high).
raga_chord_compatibility(bhairavi, diminished, moderate).
raga_chord_compatibility(khamaj, dominant7, high).
raga_chord_compatibility(bilawal, major, high).
raga_chord_compatibility(_, power_chord, moderate).  %% Power chords work with anything

%% ============================================================================
%% DETAILED INDIAN MUSIC PREDICATES (C627-C637)
%% ============================================================================

%% shruti_offset(+Raga, +Swara, -Cents)
%% Microtonal (shruti) offsets for specific swaras in ragas. (C627)
shruti_offset(yaman, ma, +22).        %% Tivra Ma is 22 cents sharp of ET F#
shruti_offset(bhairavi, re, -22).      %% Komal Re is 22 cents flat of ET Db
shruti_offset(bhairavi, ga, -22).      %% Komal Ga slightly flat
shruti_offset(bhairavi, dha, -22).     %% Komal Dha slightly flat
shruti_offset(bhairavi, ni, -22).      %% Komal Ni slightly flat
shruti_offset(todi, re, -30).          %% Ati-komal Re even flatter
shruti_offset(todi, ga, -20).          %% Komal Ga
shruti_offset(todi, dha, -25).         %% Komal Dha
shruti_offset(marwa, re, -30).         %% Komal Re very flat
shruti_offset(darbari, ga, -40).       %% Distinctive flat Ga of Darbari
shruti_offset(darbari, dha, -40).      %% Distinctive flat Dha of Darbari
shruti_offset(bilawal, _, 0).          %% Bilawal = natural major, no offsets
shruti_offset(khamaj, ni, -22).        %% Komal Ni
shruti_offset(purvi, re, -30).         %% Komal Re
shruti_offset(purvi, dha, -25).        %% Komal Dha

%% mridangam_phrase(+Context, -Phrase)
%% Mridangam (South Indian drum) syllable phrases. (C629)
mridangam_phrase(basic_theka, [tha, dhi, thom, nam, tha, dhi, thom, nam]).
mridangam_phrase(adi_tala_pattern, [tha, ka, dhi, mi, tha, ka, ja, nu]).
mridangam_phrase(chapu_7, [tha, dhi, thom, tha, ka, dhi, mi]).
mridangam_phrase(korvai_phrase, [tha, dhin, gi, na, thom, tha, dhin, gi, na, thom]).
mridangam_phrase(mora_phrase, [tha, ka, tha, ki, ta, tha, ka, tha, ki, ta]).
mridangam_phrase(fill, [tha, ri, ki, ta, tha, ka]).
mridangam_phrase(end_phrase, [tha, dhin, gi, na, thom]).

%% generate_korvai(+Tala, +NumCycles, +Pattern, -Korvai)
%% Generate a korvai (structured ending pattern). (C633)
generate_korvai(adi, 3, basic, korvai(
  phrase_3x([tha, dhin, gi, na, thom]),
  gap(beat(1)),
  phrase_3x([tha, dhin, gi, na, thom]),
  gap(half_beat),
  phrase_3x([tha, dhin, gi, na, thom]),
  ends_on(sam)
)).
generate_korvai(adi, 3, intermediate, korvai(
  phrase_3x([tha, ka, dhi, mi, tha, ka, ja, nu]),
  gap(beat(2)),
  phrase_3x([tha, ka, dhi, mi, tha, ka, ja, nu]),
  gap(beat(1)),
  phrase_3x([tha, ka, dhi, mi, tha, ka, ja, nu]),
  ends_on(sam)
)).
generate_korvai(rupak, 3, basic, korvai(
  phrase_3x([tha, dhi, thom]),
  gap(beat(1)),
  phrase_3x([tha, dhi, thom]),
  gap(half_beat),
  phrase_3x([tha, dhi, thom]),
  ends_on(sam)
)).

%% gamaka_to_midi(+Gamaka, +Notes, -BendEvents)
%% Convert gamaka ornaments to MIDI pitch bend events. (C637)
gamaka_to_midi(kampita, [NoteA], [bend_up(NoteA, 50, ms(100)), bend_down(NoteA, 0, ms(100)), repeat(3)]).
gamaka_to_midi(andolan, [NoteA], [slow_bend_up(NoteA, 30, ms(500)), slow_bend_down(NoteA, 0, ms(500))]).
gamaka_to_midi(meend, [NoteA, NoteB], [glide(NoteA, NoteB, ms(300))]).
gamaka_to_midi(gamaka_slide, [NoteA, NoteB], [fast_glide(NoteA, NoteB, ms(100))]).
gamaka_to_midi(kan_swar, [NoteA, NoteB], [grace_note(NoteA, ms(30)), sustain(NoteB)]).
gamaka_to_midi(jaru, [NoteA, NoteB], [slide_up(NoteA, NoteB, ms(200))]).
gamaka_to_midi(murki, [NoteA, NoteB, NoteC], [rapid_alternation(NoteA, NoteB, NoteC, ms_each(50))]).

%% ============================================================================
%% ADDITIONAL CARNATIC DETAIL PREDICATES (C1717-C1743)
%% ============================================================================

%% nadai_gati(+Name, -Subdivision, -Description)
%% Nadai/Gati — rhythmic subdivision types. (C1717)
nadai_gati(tisra, 3, triplet_subdivision).
nadai_gati(chatusra, 4, quadruplet_subdivision).
nadai_gati(khanda, 5, quintuplet_subdivision).
nadai_gati(misra, 7, septuplet_subdivision).
nadai_gati(sankirna, 9, nonuplet_subdivision).

%% mora_structure(+MoraType, -Pattern, -Resolution)
%% Mora (rhythmic cadential phrase) structures. (C1719)
mora_structure(sama_mora, three_identical_phrases, lands_on_sam).
mora_structure(vishama_mora, three_different_phrases, lands_on_sam).
mora_structure(simple_mora, short_repeated_unit, quick_resolution).
mora_structure(complex_mora, elaborate_with_gaps, extended_resolution).

%% kalpana_swara_rule(+Raga, +TalaPosition, -SwaraChoice)
%% Rules for kalpana swaram (improvised solfege). (C1725)
kalpana_swara_rule(shankarabharanam, sam, sa_or_pa).
kalpana_swara_rule(shankarabharanam, anga_start, any_raga_swara).
kalpana_swara_rule(kalyani, sam, sa_or_ga).
kalpana_swara_rule(kalyani, anga_start, emphasize_ma_sharp).
kalpana_swara_rule(todi, sam, sa_or_pa).
kalpana_swara_rule(todi, anga_start, ga_komal_emphasis).
kalpana_swara_rule(any_raga, eduppu, must_land_on_strong_beat).

%% bani_style(+BaniName, -Characteristics, -Techniques)
%% Bani (school/style) in Carnatic percussion. (C1743)
bani_style(thanjavur, mathematical_precision, [complex_korvais, tihai_structures, nadai_changes]).
bani_style(pudukkottai, melodic_drum, [tonal_variety, singing_quality, phrase_shaping]).
bani_style(mannargudi, powerful_projection, [strong_strokes, clarity, volume_control]).
bani_style(palani, balanced_blend, [mathematical_and_melodic, smooth_transitions]).
