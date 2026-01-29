%% music-theory-world.pl - World / Cross-Cultural Music Theory Knowledge for CardPlay AI
%%
%% Adds pragmatic theory scaffolding for:
%% - Carnatic (raga/tala basics; 12-TET approximation with extensible shruti hooks)
%% - Celtic (tune types, modes, forms, ornament concepts)
%% - Chinese (pentatonic modes and heterophony-oriented constraints)
%%
%% The goal is to provide *usable constraints* for generators and explainers,
%% without pretending that one reduced model captures the full tradition.

%% ============================================================================
%% CARNATIC (STARTER)
%% ============================================================================

%% Swara variants (approximate mapping to 12-TET pitch classes, Sa=0)
swara(sa).
swara(ri1). swara(ri2). swara(ri3).
swara(ga1). swara(ga2). swara(ga3).
swara(ma1). swara(ma2).
swara(pa).
swara(da1). swara(da2). swara(da3).
swara(ni1). swara(ni2). swara(ni3).

swara_pc(sa, 0).
swara_pc(ri1, 1).
swara_pc(ri2, 2). swara_pc(ga1, 2).
swara_pc(ri3, 3). swara_pc(ga2, 3).
swara_pc(ga3, 4).
swara_pc(ma1, 5).
swara_pc(ma2, 6).
swara_pc(pa, 7).
swara_pc(da1, 8).
swara_pc(da2, 9). swara_pc(ni1, 9).
swara_pc(da3, 10). swara_pc(ni2, 10).
swara_pc(ni3, 11).

%% Raga facts (starter set)
raga(mohanam).
raga(hamsadhwani).
raga(kalyani).
raga(keeravani).
raga(shankarabharanam).

%% Arohana/Avarohana as swara lists (directional scale)
raga_arohana(mohanam,        [sa, ri2, ga3, pa, da2, sa]).
raga_avarohana(mohanam,      [sa, da2, pa, ga3, ri2, sa]).

raga_arohana(hamsadhwani,    [sa, ri2, ga3, pa, ni3, sa]).
raga_avarohana(hamsadhwani,  [sa, ni3, pa, ga3, ri2, sa]).

raga_arohana(kalyani,        [sa, ri2, ga3, ma2, pa, da2, ni3, sa]).
raga_avarohana(kalyani,      [sa, ni3, da2, pa, ma2, ga3, ri2, sa]).

raga_arohana(keeravani,      [sa, ri2, ga3, ma1, pa, da2, ni3, sa]).
raga_avarohana(keeravani,    [sa, ni3, da2, pa, ma1, ga3, ri2, sa]).

raga_arohana(shankarabharanam,     [sa, ri2, ga3, ma1, pa, da2, ni3, sa]).
raga_avarohana(shankarabharanam,   [sa, ni3, da2, pa, ma1, ga3, ri2, sa]).

%% Raga pitch-class set (12-TET approximation)
raga_pcs(Raga, PCs) :-
  raga_arohana(Raga, Aro),
  findall(PC, (member(S, Aro), swara_pc(S, PC)), PCs0),
  sort(PCs0, PCs).

%% Tala (starter)
tala(adi).
tala(rupaka).
tala(misra_chapu).

tala_cycle(adi, 8).
tala_cycle(rupaka, 3).
tala_cycle(misra_chapu, 7).

%% ============================================================================
%% CELTIC (STARTER)
%% ============================================================================

%% Tune types and common meters
celtic_tune_type(reel, meter(4,4)).
celtic_tune_type(jig, meter(6,8)).
celtic_tune_type(slip_jig, meter(9,8)).
celtic_tune_type(hornpipe, meter(4,4)).
celtic_tune_type(strathspey, meter(4,4)).
celtic_tune_type(air, meter(free,free)).

%% Forms
celtic_form(aabb).
celtic_form(aabb_prime).

%% Mode preferences (weights are heuristics, not rules)
celtic_prefers_mode(reel, dorian, 0.5).
celtic_prefers_mode(reel, mixolydian, 0.5).
celtic_prefers_mode(jig, dorian, 0.4).
celtic_prefers_mode(jig, mixolydian, 0.4).
celtic_prefers_mode(hornpipe, mixolydian, 0.5).
celtic_prefers_mode(strathspey, dorian, 0.5).

%% Common modal progressions (degree sketches; interpret inside a mode)
celtic_progression(modal_I_bVII,    [1,7]).
celtic_progression(modal_i_bVII_bVI,[1,7,6]).

%% Ornament concepts (instrument-agnostic starter list)
celtic_ornament(cut).
celtic_ornament(tap).
celtic_ornament(roll).
celtic_ornament(slide).

%% ============================================================================
%% CHINESE (STARTER)
%% ============================================================================

%% Five pentatonic modes as semitone sets relative to tonic (0)
chinese_pentatonic_mode(gong,  [0,2,4,7,9]).
chinese_pentatonic_mode(shang, [0,2,5,7,10]).
chinese_pentatonic_mode(jiao,  [0,3,5,8,10]).
chinese_pentatonic_mode(zhi,   [0,2,5,7,9]).
chinese_pentatonic_mode(yu,    [0,3,5,7,10]).

%% Heterophony as a texture preference
chinese_texture(heterophony).

%% Simple “mode pitch classes” when tonic is given as a note name
chinese_mode_pcs(Tonic, Mode, PCs) :-
  note_index(Tonic, RootPC),
  chinese_pentatonic_mode(Mode, Rel),
  findall(PC, (member(Step, Rel), PC is (RootPC + Step) mod 12), PCs0),
  sort(PCs0, PCs).
%% ============================================================================
%% CARNATIC EXTENDED (C471-C600)
%% ============================================================================

%% Additional ragas (melakarta parent scales and common janya)
raga(mayamalavagowla).
raga(todi).
raga(bhairavi).
raga(karaharapriya).
raga(harikambhoji).
raga(dheerashankarabharanam).
raga(natabhairavi).
raga(chakravakam).
raga(hemavathi).
raga(vakulabharanam).
raga(abheri).
raga(hindolam).
raga(charukesi).
raga(arabhi).
raga(behag).
raga(sindhubhairavi).
raga(durga).
raga(suddha_saveri).

%% Melakarta (72 parent scales) - starter subset
melakarta(1, kanakangi).
melakarta(15, mayamalavagowla).
melakarta(22, kharaharapriya).
melakarta(28, harikambhoji).
melakarta(29, dheerashankarabharanam).
melakarta(20, natabhairavi).
melakarta(36, chalanata).
melakarta(65, kalyani).
melakarta(8, todi).
melakarta(56, sanmukhapriya).

%% Raga arohana/avarohana for additional ragas
raga_arohana(mayamalavagowla, [sa, ri1, ga3, ma1, pa, da1, ni3, sa]).
raga_avarohana(mayamalavagowla, [sa, ni3, da1, pa, ma1, ga3, ri1, sa]).

raga_arohana(todi, [sa, ri1, ga2, ma2, pa, da1, ni2, sa]).
raga_avarohana(todi, [sa, ni2, da1, pa, ma2, ga2, ri1, sa]).

raga_arohana(bhairavi, [sa, ri1, ga2, ma1, pa, da1, ni2, sa]).
raga_avarohana(bhairavi, [sa, ni2, da1, pa, ma1, ga2, ri1, sa]).

raga_arohana(karaharapriya, [sa, ri2, ga2, ma1, pa, da2, ni2, sa]).
raga_avarohana(karaharapriya, [sa, ni2, da2, pa, ma1, ga2, ri2, sa]).

raga_arohana(abheri, [sa, ga2, ma1, pa, ni2, sa]).
raga_avarohana(abheri, [sa, ni2, da2, pa, ma1, ga2, ri2, sa]).

raga_arohana(hindolam, [sa, ga2, ma1, da1, ni2, sa]).
raga_avarohana(hindolam, [sa, ni2, da1, ma1, ga2, sa]).

raga_arohana(durga, [sa, ri2, ma1, pa, da2, sa]).
raga_avarohana(durga, [sa, da2, pa, ma1, ri2, sa]).

%% Raga characteristics
raga_janya(abheri, kharaharapriya).
raga_janya(hindolam, natabhairavi).
raga_janya(durga, dheerashankarabharanam).
raga_janya(mohanam, harikambhoji).
raga_janya(hamsadhwani, dheerashankarabharanam).

%% Raga time of day (samayam)
raga_time(bhairavi, morning).
raga_time(todi, morning).
raga_time(kalyani, evening).
raga_time(mohanam, anytime).
raga_time(hamsadhwani, evening).
raga_time(shankarabharanam, morning).
raga_time(abheri, night).
raga_time(hindolam, night).

%% Raga mood/rasa
raga_rasa(mohanam, shringara). % romantic
raga_rasa(bhairavi, karuna). % compassion/sorrow
raga_rasa(todi, karuna).
raga_rasa(kalyani, shringara).
raga_rasa(shankarabharanam, veera). % heroic
raga_rasa(abheri, shanta). % peace
raga_rasa(hindolam, shanta).
raga_rasa(durga, veera).

%% Gamaka types
gamaka(kampita). % oscillation
gamaka(jaru). % slide
gamaka(spurita). % flick
gamaka(pratyahata). % hammer-on
gamaka(andolita). % swing
gamaka(murki). % turn
gamaka(khandippu). % cut

%% Swara with preferred gamaka
swara_gamaka(ri2, kampita, 0.7).
swara_gamaka(ga2, kampita, 0.8).
swara_gamaka(ga3, kampita, 0.6).
swara_gamaka(da2, kampita, 0.7).
swara_gamaka(ni2, kampita, 0.8).
swara_gamaka(ni3, jaru, 0.6).
swara_gamaka(pa, andolita, 0.4).

%% Raga-specific gamaka emphasis
raga_gamaka_emphasis(bhairavi, [ga2, da1, ni2], heavy).
raga_gamaka_emphasis(todi, [ri1, ga2, da1], heavy).
raga_gamaka_emphasis(kalyani, [ga3, ni3], medium).
raga_gamaka_emphasis(mohanam, [ga3, da2], medium).

%% ============================================================================
%% TALA EXTENDED (C520-C560)
%% ============================================================================

%% Extended tala list
tala(khanda_chapu).
tala(tisra_chapu).
tala(roopakam).
tala(dhruva).
tala(matya).
tala(jhampa).
tala(triputa).
tala(ata).
tala(eka).

%% Tala cycle lengths (aksharas)
tala_cycle(khanda_chapu, 5).
tala_cycle(tisra_chapu, 3).
tala_cycle(roopakam, 6).
tala_cycle(dhruva, 14).
tala_cycle(matya, 10).
tala_cycle(jhampa, 10).
tala_cycle(triputa, 8).
tala_cycle(ata, 14).
tala_cycle(eka, 4).

%% Tala anga structure (laghu(L), drutam(D), anudrutam(A))
tala_angas(adi, [laghu(4), drutam, drutam]).
tala_angas(rupaka, [drutam, laghu(4)]).
tala_angas(khanda_chapu, [laghu(5)]).
tala_angas(misra_chapu, [laghu(3), laghu(4)]).
tala_angas(tisra_chapu, [laghu(3)]).

%% Gati (rhythmic subdivision)
gati(tisra, 3).
gati(chatusra, 4).
gati(khanda, 5).
gati(misra, 7).
gati(sankeerna, 9).

%% Nadai patterns
nadai_pattern(chatusra, [1,2,3,4]).
nadai_pattern(tisra, [1,2,3]).
nadai_pattern(khanda, [1,2,3,4,5]).
nadai_pattern(misra, [1,2,3,4,5,6,7]).

%% Recommend tala for tempo
recommend_tala_for_tempo(slow, adi, [because(slow_elaboration)]).
recommend_tala_for_tempo(medium, rupaka, [because(balanced_cycle)]).
recommend_tala_for_tempo(fast, misra_chapu, [because(short_cycle)]).

%% ============================================================================
%% CARNATIC FORM CONCEPTS (C561-C580)
%% ============================================================================

%% Compositional forms
carnatic_form(varnam).
carnatic_form(kriti).
carnatic_form(padam).
carnatic_form(javali).
carnatic_form(tillana).
carnatic_form(ragam_tanam_pallavi).

%% Form sections
form_section(varnam, [pallavi, anupallavi, muktayi_swaram, charanam, chitta_swaram]).
form_section(kriti, [pallavi, anupallavi, charanam]).
form_section(tillana, [pallavi, anupallavi, charanam]).
form_section(padam, [pallavi, anupallavi, charanam]).

%% Improvisation types
carnatic_improv(alapana). % unmeasured exploration
carnatic_improv(niraval). % melodic variations on text
carnatic_improv(kalpana_swaram). % improvised swaras
carnatic_improv(tanam). % rhythmic elaboration

%% Improv allowed in section
section_allows_improv(pallavi, [niraval, kalpana_swaram]).
section_allows_improv(charanam, [kalpana_swaram]).
section_allows_improv(anupallavi, []).

%% ============================================================================
%% CELTIC EXTENDED (C651-C760)
%% ============================================================================

%% Additional tune types
celtic_tune_type(polka, meter(2,4)).
celtic_tune_type(waltz, meter(3,4)).
celtic_tune_type(slide, meter(12,8)).
celtic_tune_type(mazurka, meter(3,4)).
celtic_tune_type(barndance, meter(4,4)).
celtic_tune_type(march, meter(4,4)).
celtic_tune_type(slow_air, meter(free,free)).
celtic_tune_type(planxty, meter(3,4)).
celtic_tune_type(carolan, meter(3,4)).

%% Celtic regions
celtic_region(ireland).
celtic_region(scotland).
celtic_region(brittany).
celtic_region(wales).
celtic_region(galicia).
celtic_region(cape_breton).

%% Tune type by region
tune_region(reel, ireland).
tune_region(reel, scotland).
tune_region(reel, cape_breton).
tune_region(jig, ireland).
tune_region(slip_jig, ireland).
tune_region(strathspey, scotland).
tune_region(strathspey, cape_breton).
tune_region(hornpipe, ireland).
tune_region(hornpipe, england).
tune_region(an_dro, brittany).
tune_region(march, brittany).
tune_region(waltz, ireland).
tune_region(planxty, ireland).

%% Mode associations (extended)
celtic_prefers_mode(reel, ionian, 0.3).
celtic_prefers_mode(jig, ionian, 0.3).
celtic_prefers_mode(jig, aeolian, 0.2).
celtic_prefers_mode(slip_jig, dorian, 0.5).
celtic_prefers_mode(slip_jig, mixolydian, 0.4).
celtic_prefers_mode(hornpipe, ionian, 0.4).
celtic_prefers_mode(strathspey, aeolian, 0.4).
celtic_prefers_mode(air, dorian, 0.4).
celtic_prefers_mode(air, aeolian, 0.4).
celtic_prefers_mode(waltz, major, 0.6).
celtic_prefers_mode(slow_air, dorian, 0.5).
celtic_prefers_mode(polka, major, 0.7).
celtic_prefers_mode(polka, mixolydian, 0.3).

%% Ornamentation by instrument
ornament_instrument(cut, fiddle).
ornament_instrument(cut, flute).
ornament_instrument(cut, whistle).
ornament_instrument(tap, flute).
ornament_instrument(tap, whistle).
ornament_instrument(roll, fiddle).
ornament_instrument(roll, whistle).
ornament_instrument(roll, uilleann_pipes).
ornament_instrument(cran, uilleann_pipes).
ornament_instrument(slide, fiddle).
ornament_instrument(triplet, all).

%% Form variations
celtic_form(abab).
celtic_form(aabbcc).
celtic_form(aabbccdd).
celtic_form(ab).
celtic_form(through_composed).

%% Tune structure
tune_structure(reel, parts(2), bars_per_part(8)).
tune_structure(jig, parts(2), bars_per_part(8)).
tune_structure(slip_jig, parts(2), bars_per_part(8)).
tune_structure(hornpipe, parts(2), bars_per_part(8)).
tune_structure(strathspey, parts(2), bars_per_part(8)).
tune_structure(polka, parts(2), bars_per_part(8)).
tune_structure(waltz, parts(2), bars_per_part(8)).
tune_structure(air, parts(variable), bars_per_part(variable)).

%% Drone strategies
celtic_drone(tonic_fifth).
celtic_drone(tonic_only).
celtic_drone(fifth_only).
celtic_drone(bagpipe_drone).
celtic_drone(no_drone).

%% Tune type drone preference
tune_drone_pref(reel, tonic_fifth, 0.4).
tune_drone_pref(reel, no_drone, 0.5).
tune_drone_pref(jig, tonic_only, 0.3).
tune_drone_pref(hornpipe, no_drone, 0.6).
tune_drone_pref(air, tonic_only, 0.5).
tune_drone_pref(air, tonic_fifth, 0.4).
tune_drone_pref(strathspey, bagpipe_drone, 0.4).

%% ============================================================================
%% CHINESE EXTENDED (C761-C860)
%% ============================================================================

%% Extended mode descriptions
chinese_mode_character(gong, bright).
chinese_mode_character(shang, melancholic).
chinese_mode_character(jiao, lyrical).
chinese_mode_character(zhi, heroic).
chinese_mode_character(yu, sorrowful).

%% Regional traditions
chinese_tradition(beijing_opera).
chinese_tradition(kunqu).
chinese_tradition(cantonese_opera).
chinese_tradition(sichuan_opera).
chinese_tradition(jiangnan_sizhu).
chinese_tradition(guangdong_music).
chinese_tradition(erhu_solo).
chinese_tradition(guqin).
chinese_tradition(pipa).

%% Tradition preferred modes
tradition_mode(beijing_opera, zhi).
tradition_mode(kunqu, gong).
tradition_mode(jiangnan_sizhu, gong).
tradition_mode(jiangnan_sizhu, zhi).
tradition_mode(guangdong_music, shang).
tradition_mode(guqin, gong).
tradition_mode(guqin, yu).
tradition_mode(erhu_solo, jiao).
tradition_mode(pipa, zhi).

%% Ornamentation types
chinese_ornament(hua_zhi). % embellishment
chinese_ornament(gun). % roll
chinese_ornament(lun). % tremolo
chinese_ornament(tiao). % pluck
chinese_ornament(gou). % hook
chinese_ornament(da). % strike
chinese_ornament(yin). % vibrato
chinese_ornament(rou). % vibrato (different style)
chinese_ornament(hua). % slide

%% Instrument ornament mapping
instrument_ornament(erhu, [yin, rou, hua]).
instrument_ornament(pipa, [lun, tiao, gou, da]).
instrument_ornament(guqin, [yin, gun, hua]).
instrument_ornament(dizi, [hua_zhi, gun]).

%% Texture concepts
chinese_texture(monophony).
chinese_texture(heterophony).
chinese_texture(drone_based).
chinese_texture(call_response).

%% Tradition texture preference
tradition_texture(jiangnan_sizhu, heterophony).
tradition_texture(guangdong_music, heterophony).
tradition_texture(guqin, monophony).
tradition_texture(beijing_opera, drone_based).

%% Melodic motion preferences
chinese_melodic_motion(stepwise, 0.7).
chinese_melodic_motion(skip_third, 0.5).
chinese_melodic_motion(skip_fourth, 0.4).
chinese_melodic_motion(skip_fifth, 0.3).

%% Ban (metrical concepts)
chinese_ban(man_ban). % slow
chinese_ban(zhong_ban). % medium
chinese_ban(kuai_ban). % fast
chinese_ban(san_ban). % free

%% Ban tempo associations
ban_tempo(man_ban, 40, 60).
ban_tempo(zhong_ban, 60, 90).
ban_tempo(kuai_ban, 90, 140).
ban_tempo(san_ban, free, free).

%% Recommend mode for character
recommend_chinese_mode(Character, Mode, [because(character(Character)), because(mode(Mode))]) :-
  chinese_mode_character(Mode, Character).

%% Recommend tradition for mode
recommend_tradition_for_mode(Mode, Tradition, [because(mode(Mode)), because(tradition(Tradition))]) :-
  tradition_mode(Tradition, Mode).

%% ============================================================================
%% KONNAKOL SYLLABLES (C501-C502)
%% ============================================================================

%% Konnakol syllable sets by nadai
konnakol_syllables(chatusra, [ta, ka, di, mi]).
konnakol_syllables(tisra, [ta, ki, ta]).
konnakol_syllables(khanda, [ta, ka, ta, ki, ta]).
konnakol_syllables(misra, [ta, ka, di, mi, ta, ki, ta]).
konnakol_syllables(sankeerna, [ta, ka, di, mi, ta, ka, ta, ki, ta]).

%% konnakol_phrase(+Pattern, -Syllables)
%% Convert a rhythmic pattern (list of durations in aksharas) to konnakol.
konnakol_phrase(Pattern, Syllables) :-
  konnakol_phrase_(Pattern, chatusra, Syllables).

konnakol_phrase_([], _, []).
konnakol_phrase_([Dur|Rest], Nadai, Syllables) :-
  konnakol_syllables(Nadai, BaseSyls),
  length(BaseSyls, BaseLen),
  NumSyls is min(Dur, BaseLen),
  length(Prefix, NumSyls),
  append(Prefix, _, BaseSyls),
  konnakol_phrase_(Rest, Nadai, RestSyls),
  append(Prefix, RestSyls, Syllables).

%% ============================================================================
%% KORVAI AND MORA STRUCTURES (C503-C506)
%% ============================================================================

%% korvai(+Tala, +Structure, -Reasons)
%% A korvai is a mathematical cadential structure that ends precisely on sam.
%% Structure = korvai(Pattern, GapDuration, Repetitions)
%% The formula: (PatternDur + GapDur) * Reps must fill remaining cycle portion.
korvai(Tala, korvai(Pattern, Gap, 3), Reasons) :-
  tala_cycle(Tala, CycleLen),
  pattern_duration(Pattern, PatDur),
  TotalUnit is PatDur + Gap,
  TotalLen is TotalUnit * 3,
  %% Must fit exactly into some number of cycles
  0 =:= TotalLen mod CycleLen,
  format(atom(R1), 'Korvai in ~w: (~w + ~w gap) x 3 = ~w aksharas',
    [Tala, PatDur, Gap, TotalLen]),
  Reasons = [R1, 'Lands on sam after 3 repetitions'].

%% mora(+Tala, +Structure, -Reasons)
%% A mora is a thrice-repeated phrase. Simpler than korvai.
%% Structure = mora(Pattern, 3)
mora(Tala, mora(Pattern, 3), Reasons) :-
  tala_cycle(Tala, CycleLen),
  pattern_duration(Pattern, PatDur),
  Total is PatDur * 3,
  0 =:= Total mod CycleLen,
  format(atom(R1), 'Mora in ~w: ~w x 3 = ~w aksharas', [Tala, PatDur, Total]),
  Reasons = [R1, 'Three repetitions of pattern landing on sam'].

pattern_duration([], 0).
pattern_duration([D|Rest], Total) :-
  pattern_duration(Rest, RestTotal),
  Total is D + RestTotal.

%% cycle_fit(+PatternDur, +CycleDur, -Fits)
%% Does the pattern duration fit evenly into the cycle? (C631)
cycle_fit(PatternDur, CycleDur, Fits) :-
  ( PatternDur > 0, 0 =:= CycleDur mod PatternDur ->
      Fits = yes
  ;   Fits = no
  ).

%% ============================================================================
%% ALL 72 MELAKARTA RAGAS (C525-C596)
%% ============================================================================
%% Each melakarta is defined by its number, name, and the specific swara
%% variants used. The swaras follow the melakarta formula:
%%   Sa Ri Ga Ma Pa Da Ni Sa
%% where Ri/Ga have 3+3 variants and Da/Ni have 3+3 variants,
%% Ma has 2 variants (ma1=shuddha, ma2=prati).
%%
%% Melakarta numbering: 1-36 use Ma1, 37-72 use Ma2.
%% Within each Ma group, the 36 ragas cycle through all Ri/Ga and Da/Ni combos.

%% Helper: compute melakarta swara set from number
melakarta_swaras(Num, Swaras) :-
  Num >= 1, Num =< 72,
  ( Num =< 36 -> Ma = ma1, Adj is Num - 1
  ;               Ma = ma2, Adj is Num - 37
  ),
  %% Ri/Ga group (6 combinations, cycling every 6)
  RiGaGroup is Adj // 6,
  %% Da/Ni group (6 combinations within each Ri/Ga group)
  DaNiGroup is Adj mod 6,
  ri_ga_combo(RiGaGroup, Ri, Ga),
  da_ni_combo(DaNiGroup, Da, Ni),
  Swaras = [sa, Ri, Ga, Ma, pa, Da, Ni].

%% Ri/Ga combinations (0-5)
ri_ga_combo(0, ri1, ga1).
ri_ga_combo(1, ri1, ga2).
ri_ga_combo(2, ri1, ga3).
ri_ga_combo(3, ri2, ga2).
ri_ga_combo(4, ri2, ga3).
ri_ga_combo(5, ri3, ga3).

%% Da/Ni combinations (0-5)
da_ni_combo(0, da1, ni1).
da_ni_combo(1, da1, ni2).
da_ni_combo(2, da1, ni3).
da_ni_combo(3, da2, ni2).
da_ni_combo(4, da2, ni3).
da_ni_combo(5, da3, ni3).

%% Melakarta names (all 72)
melakarta_name(1, kanakangi).
melakarta_name(2, ratnangi).
melakarta_name(3, ganamurti).
melakarta_name(4, vanaspati).
melakarta_name(5, manavati).
melakarta_name(6, tanarupi).
melakarta_name(7, senavati).
melakarta_name(8, hanumatodi).
melakarta_name(9, dhenuka).
melakarta_name(10, natakapriya).
melakarta_name(11, kokilapriya).
melakarta_name(12, rupavati).
melakarta_name(13, gayakapriya).
melakarta_name(14, vakulabharanam).
melakarta_name(15, mayamalavagowla).
melakarta_name(16, chakravakam).
melakarta_name(17, suryakantam).
melakarta_name(18, hatakambari).
melakarta_name(19, jhankaradhwani).
melakarta_name(20, natabhairavi).
melakarta_name(21, keeravani).
melakarta_name(22, kharaharapriya).
melakarta_name(23, gourimanohari).
melakarta_name(24, varunapriya).
melakarta_name(25, mararanjani).
melakarta_name(26, charukesi).
melakarta_name(27, sarasangi).
melakarta_name(28, harikambhoji).
melakarta_name(29, dheerasankarabharanam).
melakarta_name(30, naganandini).
melakarta_name(31, yagapriya).
melakarta_name(32, ragavardhini).
melakarta_name(33, gangeyabhushani).
melakarta_name(34, vagadhisvari).
melakarta_name(35, shulini).
melakarta_name(36, chalanata).
melakarta_name(37, salagam).
melakarta_name(38, jalarnavam).
melakarta_name(39, jhalavarali).
melakarta_name(40, navaneetam).
melakarta_name(41, pavani).
melakarta_name(42, raghupriya).
melakarta_name(43, gavambodhi).
melakarta_name(44, bhavapriya).
melakarta_name(45, shubhapantuvarali).
melakarta_name(46, shadvidamargini).
melakarta_name(47, suvarnangi).
melakarta_name(48, divyamani).
melakarta_name(49, dhavalambari).
melakarta_name(50, namanarayani).
melakarta_name(51, kamavardhini).
melakarta_name(52, ramapriya).
melakarta_name(53, gamanashrama).
melakarta_name(54, vishwambhari).
melakarta_name(55, shamalangi).
melakarta_name(56, shanmukhapriya).
melakarta_name(57, simhendramadhyamam).
melakarta_name(58, hemavati).
melakarta_name(59, dharmavati).
melakarta_name(60, neetimati).
melakarta_name(61, kantamani).
melakarta_name(62, rishabhapriya).
melakarta_name(63, latangi).
melakarta_name(64, vachaspati).
melakarta_name(65, mechakalyani).
melakarta_name(66, chitrambari).
melakarta_name(67, sucharitra).
melakarta_name(68, jyotisvarupini).
melakarta_name(69, dhatuvardhini).
melakarta_name(70, nasikabhushani).
melakarta_name(71, kosalam).
melakarta_name(72, rasikapriya).

%% Generate raga/1, raga_arohana/2, raga_avarohana/2 dynamically for all 72
%% melakartas from the formula. The arohana/avarohana for melakartas is always
%% the straight ascending/descending sequence of swaras.
melakarta_raga(Name) :-
  melakarta_name(_, Name).

melakarta_arohana(Name, Aro) :-
  melakarta_name(Num, Name),
  melakarta_swaras(Num, Swaras),
  append(Swaras, [sa], Aro).

melakarta_avarohana(Name, Ava) :-
  melakarta_arohana(Name, Aro),
  reverse(Aro, Ava).

%% melakarta_pcs(+Name, -PitchClasses)
%% Get the 12-TET pitch class set for a melakarta raga.
melakarta_pcs(Name, PCs) :-
  melakarta_arohana(Name, Aro),
  findall(PC, (member(S, Aro), swara_pc(S, PC)), PCs0),
  sort(PCs0, PCs).

%% ============================================================================
%% JANYA RAGAS (C597-C607)
%% ============================================================================

%% Additional janya ragas with characteristic phrases
raga(suddha_saveri).
raga_arohana(suddha_saveri, [sa, ri2, ma1, pa, da2, sa]).
raga_avarohana(suddha_saveri, [sa, da2, pa, ma1, ri2, sa]).
raga_janya(suddha_saveri, harikambhoji).
raga_pakad(suddha_saveri, [pa, da2, sa, da2, pa, ma1, ri2]).

raga(kapi).
raga_arohana(kapi, [sa, ri2, ga2, ma1, pa, da2, ni2, sa]).
raga_avarohana(kapi, [sa, ni3, da2, pa, ma1, ga3, ri2, sa]).
raga_janya(kapi, kharaharapriya).
raga_time(kapi, evening).
raga_rasa(kapi, shringara).

raga(kambhoji).
raga_arohana(kambhoji, [sa, ri2, ga3, ma1, pa, da2, sa]).
raga_avarohana(kambhoji, [sa, ni3, da2, pa, ma1, ga3, ri2, sa]).
raga_janya(kambhoji, harikambhoji).
raga_rasa(kambhoji, shringara).
raga_gamaka_emphasis(kambhoji, [ga3, da2], heavy).

raga(saveri).
raga_arohana(saveri, [sa, ri1, ma1, pa, da1, sa]).
raga_avarohana(saveri, [sa, ni2, da1, pa, ma1, ga2, ri1, sa]).
raga_janya(saveri, natabhairavi).
raga_rasa(saveri, karuna).
raga_time(saveri, morning).

raga(arabhi).
raga_arohana(arabhi, [sa, ri2, ma1, pa, da2, sa]).
raga_avarohana(arabhi, [sa, ni3, da2, pa, ma1, ga3, ri2, sa]).
raga_janya(arabhi, dheerashankarabharanam).
raga_rasa(arabhi, veera).

raga(abhogi).
raga_arohana(abhogi, [sa, ri2, ga2, ma1, da2, sa]).
raga_avarohana(abhogi, [sa, da2, ma1, ga2, ri2, sa]).
raga_janya(abhogi, kharaharapriya).
raga_rasa(abhogi, shanta).

raga(sindhubhairavi_janya).
raga_arohana(sindhubhairavi, [sa, ri2, ga2, ma1, pa, da1, ni2, sa]).
raga_avarohana(sindhubhairavi, [sa, ni2, da1, pa, ma1, ga2, ri2, sa]).
raga_time(sindhubhairavi, anytime).

%% ============================================================================
%% EXTENDED TALA DATA (C608-C615)
%% ============================================================================

%% Adi tala with chatusra jati (default, most common)
tala_details(adi, chatusra, 8, [laghu(4), drutam, drutam]).
tala_details(adi, tisra, 6, [laghu(3), drutam, drutam]).
tala_details(adi, khanda, 10, [laghu(5), drutam, drutam]).
tala_details(adi, misra, 12, [laghu(7), drutam, drutam]).

%% Rupaka tala
tala_details(rupaka, chatusra, 6, [drutam, laghu(4)]).
tala_details(rupaka, tisra, 5, [drutam, laghu(3)]).

%% Misra Chapu (fixed - no jati variation)
tala_details(misra_chapu, fixed, 7, [group(3), group(2), group(2)]).

%% Khanda Chapu (fixed)
tala_details(khanda_chapu, fixed, 5, [group(2), group(1), group(2)]).

%% Jhampa tala
tala_details(jhampa, chatusra, 10, [laghu(7), anudrutam, drutam]).
tala_details(jhampa, tisra, 8, [laghu(5), anudrutam, drutam]).

%% Triputa tala
tala_details(triputa, chatusra, 8, [laghu(4), drutam, drutam]).
tala_details(triputa, tisra, 7, [laghu(3), drutam, drutam]).

%% Ata tala
tala_details(ata, chatusra, 14, [laghu(5), laghu(5), drutam, drutam]).

%% Eka tala
tala_details(eka, chatusra, 4, [laghu(4)]).
tala_details(eka, tisra, 3, [laghu(3)]).
tala_details(eka, khanda, 5, [laghu(5)]).
tala_details(eka, misra, 7, [laghu(7)]).

%% Tala accent patterns (sam is beat 1, always strongest)
%% For Adi chatusra: strong on 1, medium on 5 (first drutam)
tala_accent_pattern(adi, chatusra, [1.0, 0.3, 0.3, 0.3, 0.7, 0.3, 0.5, 0.3]).
tala_accent_pattern(rupaka, chatusra, [1.0, 0.3, 0.7, 0.3, 0.3, 0.3]).
tala_accent_pattern(misra_chapu, fixed, [1.0, 0.3, 0.3, 0.7, 0.3, 0.5, 0.3]).
tala_accent_pattern(khanda_chapu, fixed, [1.0, 0.3, 0.7, 0.3, 0.3]).

%% ============================================================================
%% CARNATIC FORM CONSTRAINTS (C616-C622)
%% ============================================================================

%% recommend_carnatic_form(+Spec, -Form, -Reasons)
recommend_carnatic_form(music_spec(_, _, _, _, _, carnatic, _), kriti,
  ['Default Carnatic form: Kriti (structured composition)',
   'Sections: pallavi, anupallavi, charanam']).
recommend_carnatic_form(music_spec(_, _, _, _, _, carnatic, Constraints), ragam_tanam_pallavi,
  ['RTP form for extended improvisation',
   'Sections: free alapana, tanam, pallavi with niraval/swaras']) :-
  member(phrase_density(sparse), Constraints).
recommend_carnatic_form(music_spec(_, _, tempo(T), _, _, carnatic, _), tillana,
  ['Tillana form for brisk rhythmic composition']) :-
  T > 120.

%% ============================================================================
%% RAGA PHRASE GRAMMAR (C514-C515)
%% ============================================================================

%% recommend_pakad(+Raga, +Context, -Pakad)
%% Suggest a characteristic phrase for a raga.
recommend_pakad(Raga, opening, Pakad) :-
  raga_pakad(Raga, Pakad), !.
recommend_pakad(Raga, opening, Pakad) :-
  %% Fallback: use first 4 swaras of arohana
  raga_arohana(Raga, Aro),
  length(Prefix, 4),
  append(Prefix, _, Aro),
  Pakad = Prefix.
recommend_pakad(Raga, closing, Pakad) :-
  %% Use last 4 swaras of avarohana
  raga_avarohana(Raga, Ava),
  length(Prefix, 4),
  append(Prefix, _, Ava),
  Pakad = Prefix.

%% ============================================================================
%% RAGA MOOD/TIME MAPPING (C516-C519)
%% ============================================================================

%% raga_rasa(+Raga, -Rasa) already defined above for common ragas.
%% raga_time(+Raga, -Time) already defined above for common ragas.

%% raga_for_rasa(+Rasa, -Raga, -Reasons)
raga_for_rasa(Rasa, Raga, [because(rasa(Rasa)), because(raga(Raga))]) :-
  raga_rasa(Raga, Rasa).

%% raga_for_time(+Time, -Raga, -Reasons)
raga_for_time(Time, Raga, [because(time(Time)), because(raga(Raga))]) :-
  raga_time(Raga, Time).

%% ============================================================================
%% AKSHARA ↔ TICK CONVERSION (C624-C625)
%% ============================================================================

%% akshara_to_ticks(+Tempo, +Nadai, +Aksharas, -Ticks)
%% Convert aksharas to MIDI ticks given tempo (BPM) and nadai subdivision.
%% Assumes 480 ticks per quarter note, one akshara = one beat at the nadai rate.
akshara_to_ticks(Tempo, Nadai, Aksharas, Ticks) :-
  gati(Nadai, Subdivisions),
  %% One akshara at chatusra = one quarter note at given tempo
  %% At other nadais, aksharas subdivide differently
  TicksPerQuarter is 480,
  TicksPerAkshara is TicksPerQuarter * 4 / Subdivisions,
  Ticks is round(Aksharas * TicksPerAkshara).

%% ticks_to_aksharas(+Tempo, +Nadai, +Ticks, -Aksharas)
ticks_to_aksharas(_Tempo, Nadai, Ticks, Aksharas) :-
  gati(Nadai, Subdivisions),
  TicksPerQuarter is 480,
  TicksPerAkshara is TicksPerQuarter * 4 / Subdivisions,
  Aksharas is Ticks / TicksPerAkshara.

%% ============================================================================
%% CELTIC EXTENDED (C651-C760)
%% ============================================================================

%% Tempo ranges by tune type
celtic_tempo_range(reel, 100, 140).
celtic_tempo_range(jig, 100, 130).
celtic_tempo_range(slip_jig, 100, 130).
celtic_tempo_range(hornpipe, 60, 80).
celtic_tempo_range(strathspey, 100, 120).
celtic_tempo_range(polka, 110, 140).
celtic_tempo_range(waltz, 100, 130).
celtic_tempo_range(air, 40, 80).
celtic_tempo_range(march, 90, 110).
celtic_tempo_range(slow_air, 40, 70).

%% Rhythm feel by tune type (C655-C656)
celtic_rhythm_feel(reel, straight).
celtic_rhythm_feel(jig, compound).
celtic_rhythm_feel(slip_jig, compound).
celtic_rhythm_feel(hornpipe, dotted_swing).
celtic_rhythm_feel(strathspey, snap_dotted).
celtic_rhythm_feel(polka, straight).
celtic_rhythm_feel(waltz, waltz_lilt).
celtic_rhythm_feel(air, free).

%% Celtic harmonic language (C669-C672)
%% Modal progressions common in Celtic music
celtic_progression(dorian_i_iv, [1, 4]).
celtic_progression(dorian_i_bVII_IV, [1, 7, 4]).
celtic_progression(mixolydian_I_bVII, [1, 7]).
celtic_progression(mixolydian_I_bVII_IV, [1, 7, 4]).
celtic_progression(aeolian_i_bVII_bVI, [1, 7, 6]).
celtic_progression(aeolian_i_bVI_bVII, [1, 6, 7]).
celtic_progression(major_I_IV_V, [1, 4, 5]).

%% Celtic cadence types (C671-C672)
celtic_cadence(modal_bVII_I, [7, 1]).
celtic_cadence(modal_bVI_bVII_I, [6, 7, 1]).
celtic_cadence(plagal_IV_I, [4, 1]).
celtic_cadence(unison_end, [1]).  % All instruments on tonic

%% Celtic melodic range by instrument (C673-C674)
celtic_melodic_range(fiddle, range(55, 86)).   % G3 to D6
celtic_melodic_range(flute, range(60, 84)).    % C4 to C6
celtic_melodic_range(whistle, range(74, 98)).  % D5 to D7 (D whistle)
celtic_melodic_range(uilleann_pipes, range(60, 79)). % C4 to G5
celtic_melodic_range(harp, range(36, 96)).     % C2 to C7
celtic_melodic_range(bouzouki, range(43, 67)). % G2 to G4
celtic_melodic_range(bodhran, range(0, 0)).    % percussion

%% Ornament budget by tempo and instrument (C675-C676)
celtic_ornament_budget(fiddle, slow, 4).
celtic_ornament_budget(fiddle, medium, 3).
celtic_ornament_budget(fiddle, fast, 2).
celtic_ornament_budget(flute, slow, 3).
celtic_ornament_budget(flute, medium, 2).
celtic_ornament_budget(flute, fast, 1).
celtic_ornament_budget(whistle, slow, 3).
celtic_ornament_budget(whistle, medium, 2).
celtic_ornament_budget(whistle, fast, 1).
celtic_ornament_budget(uilleann_pipes, slow, 3).
celtic_ornament_budget(uilleann_pipes, medium, 2).
celtic_ornament_budget(uilleann_pipes, fast, 1).

%% Bodhran patterns (C682-C683)
bodhran_pattern(reel, [down, up, down, up, down, up, down, up]).
bodhran_pattern(jig, [down, down, up, down, down, up]).
bodhran_pattern(slip_jig, [down, down, up, down, down, up, down, down, up]).
bodhran_pattern(polka, [down, up, down, up]).

%% Celtic accompaniment patterns (C684-C685)
celtic_accompaniment_pattern(reel, guitar, [bass, strum, bass, strum]).
celtic_accompaniment_pattern(jig, guitar, [bass, strum, strum, bass, strum, strum]).
celtic_accompaniment_pattern(reel, bouzouki, [bass, chord, bass, chord]).
celtic_accompaniment_pattern(jig, bouzouki, [bass, chord, chord, bass, chord, chord]).

%% Session dynamics model (C686-C687)
celtic_session_arrangement(start, [melody_solo]).
celtic_session_arrangement(second_time, [melody, accompaniment]).
celtic_session_arrangement(third_time, [melody, harmony, accompaniment, percussion]).
celtic_session_arrangement(ending, [all_unison, fermata]).

%% Dance lift accents (C722-C723)
dance_lift_accent(reel, [1.0, 0.3, 0.7, 0.3, 1.0, 0.3, 0.7, 0.3]).
dance_lift_accent(jig, [1.0, 0.3, 0.3, 0.7, 0.3, 0.3]).
dance_lift_accent(slip_jig, [1.0, 0.3, 0.3, 0.7, 0.3, 0.3, 0.5, 0.3, 0.3]).
dance_lift_accent(hornpipe, [1.0, 0.5, 0.7, 0.5, 1.0, 0.5, 0.7, 0.5]).
dance_lift_accent(strathspey, [1.0, 0.5, 0.7, 0.3]).

%% Strathspey snap rhythm (C718-C719)
strathspey_rhythm_cell(scotch_snap, [short_long]).  % sixteenth + dotted eighth
strathspey_rhythm_cell(dotted, [long_short]).        % dotted eighth + sixteenth
strathspey_rhythm_cell(even, [equal_equal]).          % two eighths

%% Hornpipe swing (C720-C721)
hornpipe_swing(degree, 0.67).  % triplet feel ratio (2:1)
hornpipe_swing(type, dotted).

%% Call and response phrasing (C725-C726)
celtic_call_response(reel, call(bars(1,4)), response(bars(5,8))).
celtic_call_response(jig, call(bars(1,4)), response(bars(5,8))).

%% Repeat variation (C727-C728)
repeat_variation(first_time, plain, 'Play melody as written').
repeat_variation(second_time, ornamented, 'Add ornaments on repeats').
repeat_variation(third_time, harmonized, 'Add harmony/counter-melody on third time').

%% Celtic endings (C730-C731)
celtic_ending(tag_ending, [repeat_last_bar, fermata_tonic],
  'Repeat final bar then hold tonic').
celtic_ending(roll_up, [ascending_run, unison_tonic],
  'Quick ascending run to unison tonic').
celtic_ending(unison_hit, [all_instruments_tonic, staccato],
  'All instruments hit tonic together').

%% Set compatibility (C732-C733)
tune_set_compatible(Tune1, Tune2, Score) :-
  celtic_tune_type(Tune1, Meter),
  celtic_tune_type(Tune2, Meter),
  %% Same meter = compatible
  Score is 80.
tune_set_compatible(Tune1, Tune2, Score) :-
  celtic_tune_type(Tune1, Meter1),
  celtic_tune_type(Tune2, Meter2),
  Meter1 \= Meter2,
  %% Different meter but related (e.g., reel→jig)
  Score is 30.

%% Instrument key constraints (C737-C738)
instrument_key_constraint(whistle, d, 'D whistle is standard').
instrument_key_constraint(whistle, c, 'C whistle also common').
instrument_key_constraint(uilleann_pipes, d, 'Pipes typically in D').
instrument_key_constraint(fiddle, any, 'Fiddle plays in any key').
instrument_key_constraint(flute, d, 'Flute players prefer D-related keys').
instrument_key_constraint(harp, any, 'Harp plays in any key').
instrument_key_constraint(bouzouki, any, 'Bouzouki plays in any key').

%% Celtic style by region (C741-C745)
celtic_style(irish, ornament_bias([roll, cut, tap])).
celtic_style(scottish, ornament_bias([snap, birls, grips])).
celtic_style(cape_breton, ornament_bias([cuts, drive_bow])).

%% Pipes constraints (C705-C706)
pipes_constraint(avoid_chromatic, 'Avoid chromatic notes outside mode').
pipes_constraint(drone_always, 'Maintain continuous drone').
pipes_constraint(range_limit, 'Range limited to about 2 octaves').
pipes_constraint(legato_phrasing, 'Ornaments substitute for articulation').

%% Recommend Celtic tune (C695)
recommend_celtic_tune(music_spec(_, meter(Num, Den), tempo(Tempo), _, _, celtic, _),
    TuneType, Mode, Reasons) :-
  celtic_tune_type(TuneType, meter(Num, Den)),
  celtic_prefers_mode(TuneType, Mode, Weight),
  Weight >= 0.4,
  celtic_tempo_range(TuneType, MinT, MaxT),
  Tempo >= MinT, Tempo =< MaxT,
  format(atom(R1), '~w: ~w/~w at ~w BPM in ~w mode',
    [TuneType, Num, Den, Tempo, Mode]),
  Reasons = [R1].

%% ============================================================================
%% CHINESE EXTENDED (C761-C860 additional)
%% ============================================================================

%% Bian tones (C764-C765)
%% Bian tones add optional heptatonic tones to the pentatonic base.
%% In traditional theory, 4th and 7th scale degrees are "bian" (changing).
bian_tone(gong, bian_zhi, 6, 0.3).   % between jiao and zhi
bian_tone(gong, bian_gong, 11, 0.2).  % leading tone to gong
bian_tone(shang, bian_zhi, 6, 0.3).
bian_tone(zhi, bian_gong, 11, 0.3).
bian_tone(yu, bian_zhi, 6, 0.3).

%% Chinese pentatonic cadence patterns (C782-C783)
chinese_cadence(gong, [zhi_to_gong], 'Approach gong (tonic) from zhi (5th)').
chinese_cadence(shang, [yu_to_shang], 'Approach shang (2nd) from yu (6th)').
chinese_cadence(zhi, [jiao_to_zhi], 'Approach zhi (5th) from jiao (3rd)').
chinese_cadence(yu, [gong_to_yu], 'Approach yu (6th) from gong (root)').

%% Modal modulation in Chinese music (C784-C785)
mode_modulate(gong, zhi, transpose_up_fifth,
  'Move from gong to zhi mode by transposing up a fifth').
mode_modulate(gong, shang, neighbor_mode,
  'Move to shang mode (one step up in pentatonic cycle)').
mode_modulate(zhi, gong, transpose_down_fifth,
  'Return from zhi to gong mode by transposing down a fifth').
mode_modulate(yu, gong, resolve_to_tonic,
  'Resolve from yu (relative minor feel) to gong').

%% Instrument technique constraints (C786-C787)
technique(pipa, tremolo).
technique(pipa, lun_zhi).     % right-hand roll
technique(pipa, sao_fu).      % sweeping stroke
technique(guzheng, yao_zhi).  % right-hand tremolo
technique(guzheng, hua_zhi).  % left-hand glissando
technique(erhu, rou_xian).    % vibrato
technique(erhu, huan_ba).     % position change
technique(dizi, hua_she).     % tongue flutter
technique(dizi, li_yin).      % finger vibrato

technique_constraint(pipa, tremolo, density_high,
  'Pipa tremolo requires fast right-hand motion').
technique_constraint(guzheng, hua_zhi, register_wide,
  'Guzheng glissando spans wide register').
technique_constraint(erhu, rou_xian, sustain_long,
  'Erhu vibrato needs sustained notes').
technique_constraint(dizi, hua_she, breath_support,
  'Flutter tongue requires good breath control').

%% Heterophony variation rules (C768-C769)
heterophony_variation(simplify, 'Remove ornaments, keep skeleton').
heterophony_variation(ornament, 'Add instrument-specific ornaments').
heterophony_variation(rhythmic_shift, 'Shift timing slightly ahead or behind').
heterophony_variation(register_shift, 'Play in different octave').
heterophony_variation(fill_gaps, 'Add passing tones where original rests').

%% Generate heterophony variant (C796)
generate_heterophony_variant(MelodyDegrees, Instrument, VariantDegrees) :-
  instrument_ornament(Instrument, Ornaments),
  apply_heterophony_(MelodyDegrees, Ornaments, VariantDegrees).

apply_heterophony_([], _, []).
apply_heterophony_([Deg|Rest], Ornaments, [Deg|VarRest]) :-
  apply_heterophony_(Rest, Ornaments, VarRest).

%% Chinese ornament points detection (C797-C798)
chinese_ornament_points(Events, Instrument, Points) :-
  instrument_ornament(Instrument, AvailOrnaments),
  findall(point(Start, Ornament), (
    member(evt(Start, Dur, _), Events),
    Dur >= 480,  % ornament on notes at least a quarter note long
    AvailOrnaments = [Ornament|_]  % use first available ornament
  ), Points).

%% Chinese melody variation operators (C829-C830)
chinese_variation(original, Melody, Melody,
  'Original melody unchanged').
chinese_variation(ornamented, Melody, Varied,
  'Melody with added ornaments') :-
  add_chinese_ornaments(Melody, Varied).
chinese_variation(register_shift, Melody, Varied,
  'Melody shifted up one octave') :-
  maplist(shift_octave_up, Melody, Varied).
chinese_variation(rhythmic_displacement, Melody, Melody,
  'Melody with timing offsets (heterophonic)').

add_chinese_ornaments([], []).
add_chinese_ornaments([evt(S, D, P)|Rest], [evt(S, D, P)|VRest]) :-
  add_chinese_ornaments(Rest, VRest).

shift_octave_up(evt(S, D, P), evt(S, D, P2)) :-
  P2 is P + 12.

%% Recommend Chinese mode for character (already defined above, extended)
%% recommend_chinese_mode/3 handles character→mode mapping.

%% Recommend mode shift (C847)
recommend_mode_shift(CurrentMode, TargetCharacter, NewMode, Reasons) :-
  chinese_mode_character(NewMode, TargetCharacter),
  NewMode \= CurrentMode,
  mode_modulate(CurrentMode, NewMode, Strategy, Explanation),
  Reasons = [because(target_character(TargetCharacter)),
             because(strategy(Strategy)),
             because(Explanation)].

%% Constraint pack: cinematic-celtic (C716-C717)
constraint_pack(cinematic_celtic, [
  culture(hybrid),
  film_mood(wonder),
  film_device(pedal_point),
  celtic_tune(air),
  ornament_budget(2)
]).

%% Constraint pack: cinematic-chinese (C811-C812)
constraint_pack(cinematic_chinese, [
  culture(hybrid),
  film_mood(wonder),
  chinese_mode(gong),
  film_device(planing),
  phrase_density(medium)
]).

%% ============================================================================
%% CULTURE-SPECIFIC CONFLICT RULES (C641-C642, C714-C715, C809-C810)
%% ============================================================================

%% spec_conflict rules for Carnatic
spec_conflict_carnatic(chord_progression(_), culture(carnatic),
  'Chord progressions are Western; Carnatic uses raga-based horizontal melody').
spec_conflict_carnatic(schema(_), culture(carnatic),
  'Galant schemata are Western; not applicable to Carnatic idiom').

%% spec_conflict rules for Celtic
spec_conflict_celtic(film_device(ostinato), culture(celtic),
  'Celtic music rarely uses fixed ostinato patterns; prefer session dynamics').
spec_conflict_celtic(cadence(perfect_authentic), culture(celtic),
  'Strong V-I cadences are rare in Celtic modal music; prefer bVII-I').

%% spec_conflict rules for Chinese
spec_conflict_chinese(harmonic_rhythm(_), culture(chinese),
  'Chinese music is primarily melodic/heterophonic, not chord-driven').
spec_conflict_chinese(schema(_), culture(chinese),
  'Galant schemata are Western; Chinese music uses pentatonic melodic patterns').

%% ============================================================================
%% CHINESE INSTRUMENT FAMILIES (C766-C767)
%% ============================================================================

%% chinese_instrument(+Name, +Family, +Type)
chinese_instrument(erhu, bowed_strings, melody).
chinese_instrument(zhonghu, bowed_strings, melody).
chinese_instrument(dizi, woodwind, melody).
chinese_instrument(xiao, woodwind, melody).
chinese_instrument(guzheng, plucked_strings, accompaniment).
chinese_instrument(pipa, plucked_strings, melody).
chinese_instrument(guqin, plucked_strings, solo).
chinese_instrument(sheng, free_reed, harmony).
chinese_instrument(suona, double_reed, melody).
chinese_instrument(yangqin, struck_strings, accompaniment).
chinese_instrument(bangu, percussion, rhythm).
chinese_instrument(daluo, percussion, accent).
chinese_instrument(xiaoluo, percussion, color).
chinese_instrument(bo, percussion, accent).

%% chinese_instrument_role(+Instrument, +Role, -Constraints)
%% Role constraints for each instrument. (C767)
chinese_instrument_role(erhu, melody, constraints(range(55, 84), technique([vibrato, slide, portamento]))).
chinese_instrument_role(dizi, melody, constraints(range(60, 96), technique([tonguing, overblowing, hua]))).
chinese_instrument_role(guzheng, accompaniment, constraints(range(36, 84), technique([tremolo, glissando, pluck]))).
chinese_instrument_role(pipa, melody, constraints(range(40, 77), technique([tremolo, pluck, bend]))).
chinese_instrument_role(guqin, solo, constraints(range(36, 72), technique([harmonics, slide, vibrato]))).
chinese_instrument_role(sheng, harmony, constraints(range(48, 84), technique([chords, sustained, staccato]))).
chinese_instrument_role(suona, melody, constraints(range(60, 96), technique([circular_breathing, multiphonic]))).

%% ============================================================================
%% CHINESE ORNAMENT TAXONOMY (C770-C773)
%% ============================================================================

%% chinese_ornament(+Instrument, -Ornaments)
%% Available ornaments per instrument. (C770-C771)
chinese_ornament(erhu, [rou_xian, hua_zhi, dian_gong, da_zhi]).  % vibrato, slide, detache, striking
chinese_ornament(dizi, [hua_she, li_yin, die_yin, zhua_yin]).      % grace, tremolo, flutter, portamento
chinese_ornament(guzheng, [yao_zhi, hua_zhi, an_yin, dian_yin]).   % tremolo, slide, press, tap
chinese_ornament(pipa, [lun_zhi, tiao, tan, sao]).                  % tremolo, pluck-up, pluck-down, sweep
chinese_ornament(guqin, [yin, nao, chuo, zhu]).                     % vibrato, bend, slide-up, slide-down

%% chinese_ornament_to_midi(+Ornament, +BasePitch, -MidiEvents)
%% Map ornaments to MIDI approximations. (C772-C773)
chinese_ornament_to_midi(rou_xian, Pitch, [pitch_bend(Pitch, 20, 100)]).  % vibrato
chinese_ornament_to_midi(hua_zhi, Pitch, [slide(Pitch, 2, 50)]).          % slide up 2 semitones
chinese_ornament_to_midi(hua_she, Pitch, [grace_note(Pitch, -2, 30)]).    % grace from below
chinese_ornament_to_midi(lun_zhi, Pitch, [tremolo(Pitch, 16, 200)]).      % fast tremolo
chinese_ornament_to_midi(yin, Pitch, [pitch_bend(Pitch, 10, 200)]).       % slow vibrato
chinese_ornament_to_midi(an_yin, Pitch, [pitch_bend(Pitch, -50, 100)]).   % press bend down

%% ============================================================================
%% CHINESE RHYTHM MODEL (C774-C775)
%% ============================================================================

%% ban_yan(+Section, -Feel)
%% Ban = strong beat, Yan = weak beat. Free vs metric sections.
ban_yan(sanban, free_rhythm).       % Scattered meter (free tempo)
ban_yan(manban, slow_metric).       % Slow meter (4/4 feel)
ban_yan(zhongban, medium_metric).   % Medium meter
ban_yan(kuaiban, fast_metric).      % Fast meter
ban_yan(yaoban, rocking).           % Rocking rhythm (rubato)
ban_yan(liushui, flowing).          % Flowing (2/4 fast)

%% ban_yan_accent(+Feel, +BeatPosition, -Strength) (C802-C803)
ban_yan_accent(manban, 1, 1.0).     % Ban (strong)
ban_yan_accent(manban, 2, 0.3).     % Yan (weak)
ban_yan_accent(manban, 3, 0.6).     % Secondary
ban_yan_accent(manban, 4, 0.3).     % Yan
ban_yan_accent(kuaiban, 1, 1.0).
ban_yan_accent(kuaiban, 2, 0.5).
ban_yan_accent(liushui, 1, 1.0).
ban_yan_accent(liushui, 2, 0.4).
ban_yan_accent(free_rhythm, _, 0.5).  % Equal weight in free rhythm

%% ============================================================================
%% CHINESE FORM TAXONOMY (C776-C777)
%% ============================================================================

%% chinese_form(+FormName, -Description)
chinese_form(qupai, 'Named melodic framework / tune template').
chinese_form(qin_prelude, 'Guqin free-rhythm introduction').
chinese_form(melody_variation, 'Theme with variations (bian zou)').
chinese_form(opera_cue, 'Dramatic vocal cue with instrumental accompaniment').
chinese_form(dance_tune, 'Rhythmic dance piece').
chinese_form(suite, 'Multi-movement piece (taoqu)').

%% ============================================================================
%% CHINESE SCALE-DEGREE EMPHASIS (C778-C779)
%% ============================================================================

%% chinese_nyasa(+Mode, +Degree, -Weight)
%% Resting tones per mode (analogous to Carnatic nyasa). (C778-C779)
chinese_nyasa(gong, 1, 1.0).   % Gong is the tonic
chinese_nyasa(gong, 5, 0.8).   % Zhi is secondary rest
chinese_nyasa(shang, 2, 1.0).
chinese_nyasa(shang, 5, 0.7).
chinese_nyasa(jiao, 3, 1.0).
chinese_nyasa(jiao, 6, 0.7).
chinese_nyasa(zhi, 5, 1.0).
chinese_nyasa(zhi, 1, 0.8).
chinese_nyasa(yu, 6, 1.0).
chinese_nyasa(yu, 3, 0.7).

%% ============================================================================
%% CHINESE MELODIC CONTOUR TENDENCIES (C780-C781)
%% ============================================================================

%% chinese_contour_bias(+Mode, +ContourType, -Weight)
chinese_contour_bias(gong, stepwise, 0.7).
chinese_contour_bias(gong, pentatonic_leap, 0.6).
chinese_contour_bias(gong, octave_doubling, 0.3).
chinese_contour_bias(zhi, stepwise, 0.6).
chinese_contour_bias(zhi, ascending_arc, 0.7).
chinese_contour_bias(yu, descending_arc, 0.7).
chinese_contour_bias(yu, stepwise, 0.6).
chinese_contour_bias(shang, wide_leap, 0.5).
chinese_contour_bias(shang, stepwise, 0.6).
chinese_contour_bias(jiao, narrow_range, 0.7).
chinese_contour_bias(jiao, stepwise, 0.8).

%% ============================================================================
%% CHINESE INSTRUMENT TECHNIQUE DETAILS (C813-C827)
%% ============================================================================

%% sheng_voicing(+ChordType, +NumNotes, -Notes)
%% Stacked fifths and pentatonic clusters for sheng. (C813-C814)
sheng_voicing(stacked_fifths, 3, [0, 7, 14]).
sheng_voicing(stacked_fifths, 4, [0, 7, 14, 21]).
sheng_voicing(pentatonic_cluster, 4, [0, 2, 4, 7]).
sheng_voicing(pentatonic_cluster, 5, [0, 2, 4, 7, 9]).

%% pipa_articulation(+ArticType, +Tempo, -RhythmDensity)
%% Pipa articulation mapped to rhythm density. (C816-C817)
pipa_articulation(lun_zhi_tremolo, fast, very_dense).
pipa_articulation(lun_zhi_tremolo, slow, dense).
pipa_articulation(tan_tiao_pluck, fast, moderate).
pipa_articulation(tan_tiao_pluck, slow, sparse).
pipa_articulation(sao_sweep, _, accent_only).

%% guqin_harmonic(+Position, +StringNum, -PitchOffset)
%% Guqin harmonic positions (hui) producing flageolet tones. (C818-C819)
guqin_harmonic(7, _, 12).    % Octave harmonic at 7th hui
guqin_harmonic(4, _, 19).    % Perfect 5th + octave at 4th hui
guqin_harmonic(5, _, 24).    % Double octave at 5th hui
guqin_harmonic(9, _, 7).     % Perfect 5th harmonic at 9th hui

%% dizi_phrase_constraints(+Tempo, +PhraseType, -MaxLength)
%% Breath phrasing constraints for dizi. (C820-C821)
dizi_phrase_constraints(fast, melodic, 8).      % Max 8 beats
dizi_phrase_constraints(fast, ornamental, 4).   % Max 4 beats with ornaments
dizi_phrase_constraints(slow, melodic, 16).     % Max 16 beats
dizi_phrase_constraints(slow, sustained, 6).    % Long tones limited by breath

%% suona_constraints(+Register, -DynamicRange)
%% Suona register and dynamic constraints. (C822-C823)
suona_constraints(low, range(mf, f)).
suona_constraints(mid, range(f, ff)).
suona_constraints(high, range(ff, fff)).

%% chinese_percussion_color(+Instrument, +StrikeType, -Sound)
%% Percussion timbral catalog. (C824-C825)
chinese_percussion_color(daluo, open, resonant_low_gong).
chinese_percussion_color(daluo, muted, dry_thud).
chinese_percussion_color(xiaoluo, open, bright_small_gong).
chinese_percussion_color(bo, crash, metallic_wash).
chinese_percussion_color(bo, choke, short_accent).
chinese_percussion_color(bangu, center, sharp_wood_crack).
chinese_percussion_color(bangu, rim, click).

%% gesture_to_role(+Gesture, +Culture, -MusicalRole)
%% Map physical/timbral gestures to musical roles. (C826-C827)
gesture_to_role(glissando, chinese, transition_marker).
gesture_to_role(gong_hit, chinese, section_boundary).
gesture_to_role(tremolo_swell, chinese, climax_approach).
gesture_to_role(drum_roll, chinese, tension_build).
gesture_to_role(silence, chinese, dramatic_pause).

%% rubato_curve(+CurveType, -TimingMultipliers)
%% Expressive timing curves for free-rhythm sections. (C800-C801)
rubato_curve(accelerando, [1.3, 1.2, 1.1, 1.0, 0.9, 0.8]).
rubato_curve(ritardando, [0.8, 0.9, 1.0, 1.1, 1.2, 1.5]).
rubato_curve(swell, [1.0, 0.9, 0.8, 0.9, 1.0, 1.1]).
rubato_curve(breath, [1.0, 1.0, 1.0, 1.3, 0.7, 1.0]).

%% masking_avoidance(+Instrument1, +Instrument2, -Strategy)
%% Avoid timbral masking in heterophony. (C851-C852)
masking_avoidance(erhu, dizi, register_separation).
masking_avoidance(erhu, pipa, timing_offset).
masking_avoidance(dizi, xiao, octave_separation).
masking_avoidance(guzheng, yangqin, dynamic_contrast).
masking_avoidance(sheng, erhu, register_separation).

%% intonation_system(+System, -Description)
%% Placeholder for tuning system metadata. (C842-C843)
intonation_system(equal_temperament_12, '12-tone equal temperament (standard MIDI)').
intonation_system(just_intonation, 'Pure ratios (requires pitch bend approximation)').
intonation_system(pythagorean, 'Fifths-based tuning (Chinese traditional ideal)').

%% ============================================================================
%% CELTIC ORNAMENT GENERATION (C698-C704)
%% ============================================================================

%% explain_modal_progression(+Mode, +Progression, -Explanation)
%% Explain why a progression works modally. (C697-C698)
explain_modal_progression(dorian, [i, 'IV', 'bVII', i], Explanation) :-
  Explanation = 'Dorian i-IV-bVII-i: characteristic dorian IV gives brightness to minor'.
explain_modal_progression(mixolydian, ['I', 'bVII', 'IV', 'I'], Explanation) :-
  Explanation = 'Mixolydian I-bVII-IV-I: characteristic bVII avoids leading tone'.
explain_modal_progression(aeolian, [i, 'bVII', 'bVI', 'bVII'], Explanation) :-
  Explanation = 'Aeolian i-bVII-bVI-bVII: natural minor oscillation'.
explain_modal_progression(ionian, ['I', 'IV', 'V', 'I'], Explanation) :-
  Explanation = 'Ionian I-IV-V-I: standard major cadential motion'.

%% ornament_points(+Events, +Culture, -Points)
%% Detect ornament insertion points. (C699-C700)
ornament_points(Events, celtic, Points) :-
  findall(point(Pos, Type), (
    nth1(Pos, Events, evt(_, Dur, _)),
    ( Dur >= 2 -> Type = long_note
    ; Pos =:= 1 -> Type = phrase_start
    ; true, Type = strong_beat  %% simplified: every note is a candidate
    )
  ), Points).

%% generate_roll(+BasePitch, +Tempo, +TuneType, -MidiEvents)
%% Generate an Irish/Celtic roll. (C701-C702)
generate_roll(Pitch, Tempo, reel, Events) :-
  Tempo >= 100,
  Upper is Pitch + 2,
  Lower is Pitch - 2,
  %% Roll = upper grace + main + lower grace + main + main
  Events = [
    grace(Upper, 30), note(Pitch, 60),
    grace(Lower, 30), note(Pitch, 60),
    note(Pitch, 120)
  ].
generate_roll(Pitch, _Tempo, jig, Events) :-
  Upper is Pitch + 2,
  Lower is Pitch - 1,
  Events = [
    grace(Upper, 20), note(Pitch, 60),
    grace(Lower, 20), note(Pitch, 60)
  ].

%% ornament_to_midi(+OrnamentType, +BasePitch, -MidiEvents)
%% Map Celtic ornaments to MIDI. (C703-C704)
ornament_to_midi(cut, Pitch, [grace(Upper, 20), note(Pitch, 100)]) :-
  Upper is Pitch + 7.  % Cut = grace note from well above
ornament_to_midi(tap, Pitch, [grace(Lower, 20), note(Pitch, 100)]) :-
  Lower is Pitch - 2.  % Tap = grace from step below
ornament_to_midi(roll, Pitch, Events) :-
  generate_roll(Pitch, 120, reel, Events).
ornament_to_midi(cran, Pitch, Events) :-
  %% Cran (pipes ornament) = rapid alternation of cuts
  Upper1 is Pitch + 2,
  Upper2 is Pitch + 4,
  Events = [
    grace(Upper1, 15), grace(Upper2, 15),
    note(Pitch, 50),
    grace(Upper1, 15), note(Pitch, 80)
  ].
ornament_to_midi(slide, Pitch, [slide_up(Pitch, 2, 80), note(Pitch, 120)]).
ornament_to_midi(mordent, Pitch, Events) :-
  Upper is Pitch + 2,
  Events = [note(Pitch, 40), grace(Upper, 20), note(Pitch, 80)].

%% double_stop_ok(+Pitch1, +Pitch2, +Instrument, -Quality)
%% Check if a fiddle double-stop is playable. (C707-C708)
double_stop_ok(P1, P2, fiddle, Quality) :-
  Interval is abs(P2 - P1),
  ( Interval =:= 7 -> Quality = perfect_fifth
  ; Interval =:= 5 -> Quality = perfect_fourth
  ; Interval =:= 3 -> Quality = minor_third
  ; Interval =:= 4 -> Quality = major_third
  ; Interval =:= 12 -> Quality = octave
  ; Quality = non_standard
  ),
  %% Check open string resonance (G3=55, D4=62, A4=69, E5=76)
  OpenStrings = [55, 62, 69, 76],
  ( member(P1, OpenStrings) ; member(P2, OpenStrings) ;
    true  %% Non-open string double stops still possible
  ).

%% harp_voicing_ok(+Notes, +HarpType, -Quality)
%% Check if notes work for Celtic harp voicing. (C746-C747)
harp_voicing_ok(Notes, celtic_harp, Quality) :-
  length(Notes, N),
  ( N =< 4 ->
      %% Check for open sonorities (no semitone clusters)
      no_semitone_cluster(Notes),
      Quality = open_voicing
  ; N =< 6 ->
      Quality = full_voicing
  ; Quality = too_dense
  ).

no_semitone_cluster([]).
no_semitone_cluster([_]).
no_semitone_cluster([N1, N2|Rest]) :-
  Diff is abs(N2 - N1),
  Diff > 1,
  no_semitone_cluster([N2|Rest]).

%% ornament_to_notation(+OrnamentType, -NotationSymbol)
%% Map ornaments to notation renderer symbols. (C756-C757)
ornament_to_notation(cut, grace_note_above).
ornament_to_notation(tap, grace_note_below).
ornament_to_notation(roll, trill_with_turn).
ornament_to_notation(cran, multi_grace_above).
ornament_to_notation(slide, portamento_line).
ornament_to_notation(mordent, mordent_symbol).

%% chinese_ornament_to_notation(+OrnamentType, -NotationSymbol)
%% Chinese ornament notation mapping. (C839-C840)
chinese_ornament_to_notation(rou_xian, vibrato_wavy_line).
chinese_ornament_to_notation(hua_zhi, slide_line).
chinese_ornament_to_notation(hua_she, grace_note).
chinese_ornament_to_notation(lun_zhi, tremolo_strokes).
chinese_ornament_to_notation(yin, vibrato_wavy_line).
chinese_ornament_to_notation(an_yin, bend_arrow_down).