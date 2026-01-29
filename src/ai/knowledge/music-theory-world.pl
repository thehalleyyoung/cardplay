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