%% music-theory-spectral.pl - Spectral Music & Computational Orchestration KB
%%
%% Provides predicates for:
%% - Spectral music analysis (C1451-C1475)
%% - Klangfarbenmelodie & timbre distribution (C1476-C1490)
%% - Orchestral balance & doubling theory (C1491-C1510)
%% - Set theory & pitch-class analysis (C1511-C1530)
%%
%% Depends on: music-theory.pl

%% ============================================================================
%% SPECTRAL MUSIC — HARMONIC SERIES & ANALYSIS (C1451-C1475)
%% ============================================================================

%% harmonic_series(+Fundamental, +NumPartials, -PartialsList)
%% Generate the first N partials of a harmonic series. (C1452)
harmonic_series(Fundamental, NumPartials, Partials) :-
  NumPartials > 0,
  numlist(1, NumPartials, Indices),
  maplist(make_partial(Fundamental), Indices, Partials).

make_partial(Fund, N, partial(N, Freq, Amp)) :-
  Freq is Fund * N,
  %% Natural rolloff: 1/n amplitude
  Amp is 1.0 / N.

%% partial_amplitude(+PartialNum, +Rolloff, -Amplitude)
%% Compute amplitude of Nth partial with given rolloff model. (C1453)
partial_amplitude(N, natural, Amp) :- Amp is 1.0 / N.
partial_amplitude(N, steep, Amp) :- Amp is 1.0 / (N * N).
partial_amplitude(N, bright, Amp) :- Amp is 1.0 / sqrt(N).
partial_amplitude(_, silent, 0.0).

%% inharmonic_spectrum(+Fundamental, +Stretch, -Partials)
%% Generate a stretched (inharmonic) spectrum, as in bells/metallic sounds. (C1454)
inharmonic_spectrum(Fund, Stretch, Partials) :-
  numlist(1, 16, Indices),
  maplist(make_inharmonic_partial(Fund, Stretch), Indices, Partials).

make_inharmonic_partial(Fund, Stretch, N, partial(N, Freq, Amp)) :-
  %% Stretched partial: f_n = f_1 * n^(1+stretch)
  Exp is 1.0 + Stretch,
  Freq is Fund * (N ** Exp),
  Amp is 1.0 / N.

%% spectral_centroid(+Spectrum, -Centroid)
%% Weighted mean frequency of a spectrum (brightness measure). (C1455)
spectral_centroid(Partials, Centroid) :-
  sum_weighted_freqs(Partials, 0, 0, WeightedSum, AmpSum),
  ( AmpSum > 0 -> Centroid is WeightedSum / AmpSum
  ; Centroid = 0
  ).

sum_weighted_freqs([], WS, AS, WS, AS).
sum_weighted_freqs([partial(_, Freq, Amp)|Rest], AccW, AccA, WS, AS) :-
  NewW is AccW + Freq * Amp,
  NewA is AccA + Amp,
  sum_weighted_freqs(Rest, NewW, NewA, WS, AS).

%% spectral_flux(+Spectrum1, +Spectrum2, -Flux)
%% Measure of spectral change between two frames. (C1456)
spectral_flux(Spec1, Spec2, Flux) :-
  maplist(get_partial_amp, Spec1, Amps1),
  maplist(get_partial_amp, Spec2, Amps2),
  pad_to_equal_length(Amps1, Amps2, A1Pad, A2Pad),
  sum_squared_diff(A1Pad, A2Pad, 0, SumSq),
  Flux is sqrt(SumSq).

get_partial_amp(partial(_, _, Amp), Amp).

pad_to_equal_length(A, B, AP, BP) :-
  length(A, LA), length(B, LB),
  Max is max(LA, LB),
  pad_list(A, Max, AP),
  pad_list(B, Max, BP).

pad_list(List, TargetLen, Padded) :-
  length(List, Len),
  ( Len >= TargetLen -> Padded = List
  ; Diff is TargetLen - Len,
    length(Zeros, Diff),
    maplist(=(0), Zeros),
    append(List, Zeros, Padded)
  ).

sum_squared_diff([], [], Acc, Acc).
sum_squared_diff([A|RA], [B|RB], Acc, Result) :-
  D is A - B,
  NewAcc is Acc + D * D,
  sum_squared_diff(RA, RB, NewAcc, Result).

%% spectral_rolloff(+Spectrum, +Threshold, -Frequency)
%% Frequency below which Threshold% of spectral energy lies. (C1457)
spectral_rolloff(Partials, Threshold, RolloffFreq) :-
  maplist(get_partial_amp, Partials, Amps),
  sum_list(Amps, TotalEnergy),
  Target is TotalEnergy * Threshold / 100,
  maplist(get_partial_freq, Partials, Freqs),
  pairs_keys_values(Pairs, Freqs, Amps),
  msort(Pairs, Sorted),
  find_rolloff(Sorted, 0, Target, RolloffFreq).

get_partial_freq(partial(_, Freq, _), Freq).

find_rolloff([], _, _, 0).
find_rolloff([Freq-Amp|Rest], Acc, Target, RolloffFreq) :-
  NewAcc is Acc + Amp,
  ( NewAcc >= Target -> RolloffFreq = Freq
  ; find_rolloff(Rest, NewAcc, Target, RolloffFreq)
  ).

%% instrument_spectrum_model(+Instrument, +Pitch, -Spectrum)
%% Simplified spectral models for common instruments. (C1459)
instrument_spectrum_model(violin, Pitch, Spectrum) :-
  harmonic_series(Pitch, 12, BasePartials),
  apply_rolloff(BasePartials, bright, Spectrum).
instrument_spectrum_model(flute, Pitch, Spectrum) :-
  harmonic_series(Pitch, 8, BasePartials),
  apply_rolloff(BasePartials, steep, Spectrum).
instrument_spectrum_model(clarinet, Pitch, Spectrum) :-
  %% Odd harmonics dominant
  harmonic_series(Pitch, 10, AllPartials),
  filter_odd_harmonics(AllPartials, Spectrum).
instrument_spectrum_model(oboe, Pitch, Spectrum) :-
  harmonic_series(Pitch, 14, BasePartials),
  apply_rolloff(BasePartials, natural, Spectrum).
instrument_spectrum_model(trumpet, Pitch, Spectrum) :-
  harmonic_series(Pitch, 10, BasePartials),
  apply_rolloff(BasePartials, bright, Spectrum).
instrument_spectrum_model(horn, Pitch, Spectrum) :-
  harmonic_series(Pitch, 12, BasePartials),
  apply_rolloff(BasePartials, natural, Spectrum).
instrument_spectrum_model(piano, Pitch, Spectrum) :-
  inharmonic_spectrum(Pitch, 0.01, Spectrum).
instrument_spectrum_model(bell, Pitch, Spectrum) :-
  inharmonic_spectrum(Pitch, 0.15, Spectrum).

apply_rolloff([], _, []).
apply_rolloff([partial(N, Freq, _)|Rest], Model, [partial(N, Freq, NewAmp)|RestOut]) :-
  partial_amplitude(N, Model, NewAmp),
  apply_rolloff(Rest, Model, RestOut).

filter_odd_harmonics([], []).
filter_odd_harmonics([partial(N, Freq, Amp)|Rest], Result) :-
  ( N mod 2 =:= 1 ->
    Result = [partial(N, Freq, Amp)|RestOut],
    filter_odd_harmonics(Rest, RestOut)
  ;
    %% Even harmonics at reduced amplitude
    ReducedAmp is Amp * 0.1,
    Result = [partial(N, Freq, ReducedAmp)|RestOut],
    filter_odd_harmonics(Rest, RestOut)
  ).

%% spectral_similarity(+Spectrum1, +Spectrum2, -Similarity)
%% Cosine similarity between two spectra (0-1). (C1461)
spectral_similarity(Spec1, Spec2, Similarity) :-
  maplist(get_partial_amp, Spec1, A1),
  maplist(get_partial_amp, Spec2, A2),
  pad_to_equal_length(A1, A2, P1, P2),
  dot_product(P1, P2, Dot),
  magnitude(P1, M1), magnitude(P2, M2),
  Denom is M1 * M2,
  ( Denom > 0 -> Similarity is Dot / Denom
  ; Similarity = 0
  ).

dot_product([], [], 0).
dot_product([A|RA], [B|RB], Dot) :-
  dot_product(RA, RB, Rest),
  Dot is A * B + Rest.

magnitude(List, Mag) :-
  dot_product(List, List, SumSq),
  Mag is sqrt(SumSq).

%% spectral_morphing(+Spec1, +Spec2, +T, -Interpolated)
%% Linear interpolation between two spectra at parameter T (0-1). (C1462)
spectral_morphing(Spec1, Spec2, T, Interpolated) :-
  T >= 0, T =< 1,
  maplist(morph_partial(T), Spec1, Spec2, Interpolated).

morph_partial(T, partial(N, F1, A1), partial(_, F2, A2), partial(N, Fi, Ai)) :-
  Fi is F1 * (1 - T) + F2 * T,
  Ai is A1 * (1 - T) + A2 * T.

%% grisey_spectral_harmony(+Fundamental, -SpectralChord, -Voicing)
%% Derive a Grisey-style spectral chord from a fundamental. (C1463)
grisey_spectral_harmony(Fund, SpectralChord, Voicing) :-
  harmonic_series(Fund, 16, Partials),
  %% Select partials 1,2,3,5,7,8,9,11,13 (prime-weighted selection)
  SelectedIndices = [1, 2, 3, 5, 7, 8, 9, 11, 13],
  include(partial_in_set(SelectedIndices), Partials, SelectedPartials),
  maplist(partial_to_midi, SelectedPartials, MidiNotes),
  SpectralChord = spectral_chord(Fund, MidiNotes),
  Voicing = partials_voicing(SelectedIndices).

partial_in_set(Set, partial(N, _, _)) :- member(N, Set).

partial_to_midi(partial(_, Freq, _), Midi) :-
  Midi is round(69 + 12 * log(Freq / 440) / log(2)).

%% spectral_to_pitch_class(+Spectrum, +Tolerance, -PitchClasses)
%% Round spectral partials to nearest pitch classes within tolerance (cents). (C1465)
spectral_to_pitch_class(Partials, Tolerance, PCs) :-
  maplist(partial_to_pc(Tolerance), Partials, RawPCs),
  exclude(==(none), RawPCs, ValidPCs),
  sort(ValidPCs, PCs).

partial_to_pc(Tolerance, partial(_, Freq, _), PC) :-
  ( Freq > 0 ->
    MidiExact is 69 + 12 * log(Freq / 440) / log(2),
    MidiRounded is round(MidiExact),
    Deviation is abs(MidiExact - MidiRounded) * 100,
    ( Deviation =< Tolerance -> PC is MidiRounded mod 12
    ; PC = none
    )
  ; PC = none
  ).

%% ============================================================================
%% KLANGFARBENMELODIE & TIMBRE DISTRIBUTION (C1476-C1490)
%% ============================================================================

%% klangfarben_melody(+Melody, +InstrumentSeq, -Result)
%% Distribute melody notes across timbres (Schoenberg technique). (C1476)
klangfarben_melody([], [], []).
klangfarben_melody([Note|RN], [Instr|RI], [assigned(Note, Instr)|RR]) :-
  klangfarben_melody(RN, RI, RR).

%% timbre_transition_cost(+Instr1, +Instr2, -Cost)
%% Cost of transitioning between instruments (0=same, higher=more jarring). (C1477)
timbre_transition_cost(X, X, 0) :- !.
timbre_transition_cost(I1, I2, Cost) :-
  instrument_family(I1, F1),
  instrument_family(I2, F2),
  ( F1 == F2 -> Cost = 1    %% Same family
  ; Cost = 3                  %% Different family
  ).

instrument_family(violin, strings).
instrument_family(viola, strings).
instrument_family(cello, strings).
instrument_family(contrabass, strings).
instrument_family(flute, woodwinds).
instrument_family(oboe, woodwinds).
instrument_family(clarinet, woodwinds).
instrument_family(bassoon, woodwinds).
instrument_family(trumpet, brass).
instrument_family(horn, brass).
instrument_family(trombone, brass).
instrument_family(tuba, brass).
instrument_family(piano, keyboard).
instrument_family(celesta, keyboard).
instrument_family(harp, plucked).
instrument_family(guitar, plucked).
instrument_family(timpani, percussion).
instrument_family(xylophone, percussion).
instrument_family(vibraphone, percussion).
instrument_family(marimba, percussion).

%% instrument_register_sweet_spot(+Instrument, -LowNote, -HighNote)
%% MIDI note range where instrument sounds best. (C1479)
instrument_register_sweet_spot(violin, 55, 93).     %% G3-A6
instrument_register_sweet_spot(viola, 48, 81).       %% C3-A5
instrument_register_sweet_spot(cello, 36, 72).       %% C2-C5
instrument_register_sweet_spot(contrabass, 28, 55).  %% E1-G3
instrument_register_sweet_spot(flute, 60, 96).       %% C4-C7
instrument_register_sweet_spot(oboe, 58, 86).        %% Bb3-D6
instrument_register_sweet_spot(clarinet, 50, 91).    %% D3-G6
instrument_register_sweet_spot(bassoon, 34, 72).     %% Bb1-C5
instrument_register_sweet_spot(trumpet, 52, 82).     %% E3-Bb5
instrument_register_sweet_spot(horn, 36, 77).        %% C2-F5
instrument_register_sweet_spot(trombone, 34, 72).    %% Bb1-C5
instrument_register_sweet_spot(tuba, 24, 60).        %% C1-C4
instrument_register_sweet_spot(piano, 21, 108).      %% A0-C8
instrument_register_sweet_spot(harp, 24, 103).       %% C1-G7
instrument_register_sweet_spot(timpani, 36, 55).     %% C2-G3
instrument_register_sweet_spot(xylophone, 65, 108).  %% F4-C8
instrument_register_sweet_spot(vibraphone, 53, 89).  %% F3-F6
instrument_register_sweet_spot(marimba, 36, 96).     %% C2-C7

%% instrument_dynamic_range(+Instrument, -SoftestDb, -LoudestDb)
%% Dynamic range in approximate dB. (C1480)
instrument_dynamic_range(violin, 35, 95).
instrument_dynamic_range(viola, 35, 90).
instrument_dynamic_range(cello, 35, 92).
instrument_dynamic_range(contrabass, 38, 88).
instrument_dynamic_range(flute, 50, 90).
instrument_dynamic_range(oboe, 45, 92).
instrument_dynamic_range(clarinet, 30, 95).
instrument_dynamic_range(bassoon, 40, 88).
instrument_dynamic_range(trumpet, 45, 100).
instrument_dynamic_range(horn, 38, 95).
instrument_dynamic_range(trombone, 42, 100).
instrument_dynamic_range(tuba, 40, 95).
instrument_dynamic_range(piano, 30, 100).

%% instrument_attack_profile(+Instrument, -AttackMs, -AttackShape)
%% How quickly instrument speaks. (C1481)
instrument_attack_profile(violin, 80, smooth).
instrument_attack_profile(viola, 90, smooth).
instrument_attack_profile(cello, 100, smooth).
instrument_attack_profile(contrabass, 120, smooth).
instrument_attack_profile(flute, 40, gentle).
instrument_attack_profile(oboe, 25, crisp).
instrument_attack_profile(clarinet, 30, gentle).
instrument_attack_profile(bassoon, 50, warm).
instrument_attack_profile(trumpet, 15, sharp).
instrument_attack_profile(horn, 60, round).
instrument_attack_profile(trombone, 20, sharp).
instrument_attack_profile(tuba, 70, round).
instrument_attack_profile(piano, 5, percussive).
instrument_attack_profile(harp, 10, percussive).
instrument_attack_profile(timpani, 8, percussive).
instrument_attack_profile(xylophone, 3, percussive).

%% instrument_blend_factor(+Instr1, +Instr2, -BlendQuality)
%% How well two instruments blend (0-10). (C1482)
instrument_blend_factor(flute, violin, 9).
instrument_blend_factor(oboe, clarinet, 7).
instrument_blend_factor(flute, oboe, 6).
instrument_blend_factor(clarinet, cello, 8).
instrument_blend_factor(horn, cello, 9).
instrument_blend_factor(trumpet, oboe, 5).
instrument_blend_factor(violin, viola, 9).
instrument_blend_factor(viola, cello, 9).
instrument_blend_factor(trumpet, trombone, 7).
instrument_blend_factor(horn, trumpet, 6).
instrument_blend_factor(flute, clarinet, 8).
instrument_blend_factor(bassoon, horn, 8).
instrument_blend_factor(bassoon, cello, 8).
instrument_blend_factor(tuba, contrabass, 7).
%% Symmetric: if not found, try reverse
instrument_blend_factor(A, B, Q) :-
  A @> B,
  instrument_blend_factor(B, A, Q).
%% Same instrument: perfect blend
instrument_blend_factor(X, X, 10) :- !.

%% hocket_pattern(+Melody, +NumVoices, -HocketResult)
%% Split melody into alternating instruments (hocket technique). (C1484)
hocket_pattern(Melody, NumVoices, Result) :-
  distribute_round_robin(Melody, NumVoices, 0, Result).

distribute_round_robin([], _, _, []).
distribute_round_robin([Note|Rest], NV, Idx, [assigned(Note, Voice)|RestR]) :-
  Voice is (Idx mod NV) + 1,
  NextIdx is Idx + 1,
  distribute_round_robin(Rest, NV, NextIdx, RestR).

%% compound_melody_analysis(+Melody, -Voices, -VoiceAssignment)
%% Analyze compound melody to separate implied voice streams. (C1485)
compound_melody_analysis([], [], []).
compound_melody_analysis([Note|Rest], Voices, Assignment) :-
  %% Simple heuristic: large leaps indicate voice crossing
  compound_separate(Rest, Note, [], [], Voices, Assignment).

compound_separate([], LastNote, Upper, Lower, [upper(Upper2), lower(Lower2)], []) :-
  ( LastNote >= 60 ->
    reverse([LastNote|Upper], Upper2), reverse(Lower, Lower2)
  ; reverse(Upper, Upper2), reverse([LastNote|Lower], Lower2)
  ).
compound_separate([Next|Rest], Prev, Upper, Lower, Voices, [assign(Prev, Stream)|RA]) :-
  Interval is abs(Next - Prev),
  ( Interval > 7 ->
    %% Large leap: assign prev to one stream, next starts the other
    ( Prev >= Next ->
      Stream = upper,
      compound_separate(Rest, Next, [Prev|Upper], Lower, Voices, RA)
    ; Stream = lower,
      compound_separate(Rest, Next, Upper, [Prev|Lower], Voices, RA)
    )
  ;
    %% Small interval: same stream
    ( Prev >= 60 -> Stream = upper,
      compound_separate(Rest, Next, [Prev|Upper], Lower, Voices, RA)
    ; Stream = lower,
      compound_separate(Rest, Next, Upper, [Prev|Lower], Voices, RA)
    )
  ).

%% ============================================================================
%% ORCHESTRAL BALANCE & DOUBLING THEORY (C1491-C1510)
%% ============================================================================

%% orchestral_weight(+Instrumentation, +Dynamics, -WeightScore)
%% Compute the "weight" of a given instrumentation at a dynamic level. (C1494)
orchestral_weight(Instruments, Dynamic, Weight) :-
  dynamic_multiplier(Dynamic, Mult),
  maplist(instrument_weight, Instruments, Weights),
  sum_list(Weights, RawWeight),
  Weight is RawWeight * Mult.

instrument_weight(violin, 2).
instrument_weight(viola, 2).
instrument_weight(cello, 3).
instrument_weight(contrabass, 4).
instrument_weight(flute, 2).
instrument_weight(oboe, 3).
instrument_weight(clarinet, 2).
instrument_weight(bassoon, 3).
instrument_weight(trumpet, 5).
instrument_weight(horn, 4).
instrument_weight(trombone, 5).
instrument_weight(tuba, 6).
instrument_weight(piano, 4).
instrument_weight(timpani, 5).

dynamic_multiplier(ppp, 0.2).
dynamic_multiplier(pp, 0.35).
dynamic_multiplier(p, 0.5).
dynamic_multiplier(mp, 0.7).
dynamic_multiplier(mf, 0.85).
dynamic_multiplier(f, 1.0).
dynamic_multiplier(ff, 1.3).
dynamic_multiplier(fff, 1.6).

%% balance_check(+Voicing, +Dynamics, -BalanceIssues)
%% Check for balance issues in orchestral writing. (C1495)
balance_check(Voicing, Dynamics, Issues) :-
  check_masking(Voicing, MaskingIssues),
  check_weight_imbalance(Voicing, Dynamics, WeightIssues),
  append(MaskingIssues, WeightIssues, Issues).

check_masking([], []).
check_masking([_], []).
check_masking([voice(I1, N1)|Rest], Issues) :-
  check_against_all(I1, N1, Rest, PairIssues),
  check_masking(Rest, RestIssues),
  append(PairIssues, RestIssues, Issues).

check_against_all(_, _, [], []).
check_against_all(I1, N1, [voice(I2, N2)|Rest], Issues) :-
  masking_risk(I1, I2, N1, N2, Risk),
  check_against_all(I1, N1, Rest, RestIssues),
  ( Risk > 5 ->
    Issues = [masking(I1, I2, Risk)|RestIssues]
  ; Issues = RestIssues
  ).

%% masking_risk(+Voice1Instr, +Voice2Instr, +Note1, +Note2, -Risk)
%% Assess masking risk between two voices (0-10). (C1501)
masking_risk(I1, I2, N1, N2, Risk) :-
  instrument_family(I1, F1),
  instrument_family(I2, F2),
  Interval is abs(N1 - N2),
  ( F1 == F2, Interval < 5 -> Risk = 8
  ; F1 == F2, Interval < 12 -> Risk = 5
  ; Interval < 3 -> Risk = 6
  ; Risk = 2
  ).

check_weight_imbalance(_, _, []).  %% Simplified for now

%% doubling_effectiveness(+Primary, +Secondary, +Interval, -Score)
%% How effective is doubling Primary with Secondary at given interval? (C1496)
doubling_effectiveness(Primary, Secondary, unison, Score) :-
  instrument_blend_factor(Primary, Secondary, Blend),
  Score is Blend.
doubling_effectiveness(Primary, Secondary, octave, Score) :-
  instrument_blend_factor(Primary, Secondary, Blend),
  Score is Blend * 0.9.  %% Octave slightly less blended
doubling_effectiveness(_, _, third, 5).  %% Thirds add color but less reinforcement
doubling_effectiveness(_, _, sixth, 4).

%% optimal_spacing(+Chord, +Instruments, -SpacingResult)
%% Recommend optimal spacing for a chord given instruments. (C1502)
optimal_spacing(Chord, Instruments, SpacingResult) :-
  length(Instruments, N),
  chord_tones_extended(Chord, N, Notes),
  pairs_keys_values(Pairs, Instruments, Notes),
  SpacingResult = spacing(Pairs).

chord_tones_extended(chord(Root, Type), N, Notes) :-
  ( N =< 4 ->
    chord_tones_basic(chord(Root, Type), Notes)
  ;
    %% Add extensions for larger ensembles
    chord_tones_basic(chord(Root, Type), Base),
    length(Base, BLen),
    Extra is N - BLen,
    %% Double lower voices
    length(Doubles, Extra),
    append(Base, Doubles, Notes)
  ).

chord_tones_basic(chord(Root, major), [Root, Third, Fifth]) :-
  note_index(Root, I),
  T is (I + 4) mod 12, F is (I + 7) mod 12,
  pc_to_note_name(T, Third), pc_to_note_name(F, Fifth).
chord_tones_basic(chord(Root, minor), [Root, Third, Fifth]) :-
  note_index(Root, I),
  T is (I + 3) mod 12, F is (I + 7) mod 12,
  pc_to_note_name(T, Third), pc_to_note_name(F, Fifth).
chord_tones_basic(chord(Root, _), [Root]).  %% Fallback

%% ============================================================================
%% SET THEORY & PITCH-CLASS ANALYSIS (C1511-C1530)
%% ============================================================================

%% pitch_class_set(+Notes, -PCSet)
%% Convert notes to a sorted pitch-class set (mod 12). (C1511)
pitch_class_set(Notes, PCSet) :-
  maplist(note_to_pc, Notes, RawPCs),
  sort(RawPCs, PCSet).

note_to_pc(Note, PC) :-
  ( number(Note) -> PC is Note mod 12
  ; note_index(Note, PC)
  ).

%% forte_number(+PCSet, -ForteNumber)
%% Look up the Forte catalog number for a pitch-class set. (C1512)
%% Subset of the most commonly referenced sets.
forte_number([0,1,2], '3-1').
forte_number([0,1,3], '3-2').
forte_number([0,1,4], '3-3').
forte_number([0,1,5], '3-4').
forte_number([0,1,6], '3-5').
forte_number([0,2,4], '3-6').
forte_number([0,2,5], '3-7').
forte_number([0,2,6], '3-8').
forte_number([0,2,7], '3-9').
forte_number([0,3,6], '3-10').
forte_number([0,3,7], '3-11').
forte_number([0,4,8], '3-12').
%% Tetrachords
forte_number([0,1,2,3], '4-1').
forte_number([0,1,2,4], '4-2').
forte_number([0,1,3,4], '4-3').
forte_number([0,1,2,5], '4-4').
forte_number([0,1,2,6], '4-5').
forte_number([0,1,2,7], '4-6').
forte_number([0,1,4,5], '4-7').
forte_number([0,1,5,6], '4-8').
forte_number([0,1,6,7], '4-9').
forte_number([0,2,3,5], '4-10').
forte_number([0,1,3,5], '4-11').
forte_number([0,2,3,6], '4-12').
forte_number([0,1,3,6], '4-13').
forte_number([0,2,3,7], '4-14').
forte_number([0,1,4,6], '4-15').
forte_number([0,1,5,7], '4-16').
forte_number([0,3,4,7], '4-17').
forte_number([0,1,4,7], '4-18').
forte_number([0,1,4,8], '4-19').
forte_number([0,1,5,8], '4-20').
forte_number([0,2,4,6], '4-21').
forte_number([0,2,4,7], '4-22').
forte_number([0,2,5,7], '4-23').
forte_number([0,2,4,8], '4-24').
forte_number([0,2,6,8], '4-25').
forte_number([0,3,5,8], '4-26').
forte_number([0,2,5,8], '4-27').
forte_number([0,3,6,9], '4-28').
%% Pentachords (selected)
forte_number([0,1,2,3,4], '5-1').
forte_number([0,1,3,5,6], '5-7').
forte_number([0,2,3,4,7], '5-11').
forte_number([0,1,3,5,7], '5-24').
forte_number([0,2,4,5,7], '5-23').
forte_number([0,1,3,4,6], '5-10').
forte_number([0,2,3,5,7], '5-35'). %% pentatonic
%% Hexachords (selected)
forte_number([0,1,2,3,4,5], '6-1').
forte_number([0,2,4,5,7,9], '6-32'). %% major scale subset
forte_number([0,1,3,5,7,9], '6-33').
forte_number([0,2,4,6,8,10], '6-35'). %% whole-tone
forte_number([0,1,2,6,7,8], '6-7').

%% interval_vector(+PCSet, -IntervalVector)
%% Six-element vector counting interval classes 1-6. (C1513)
interval_vector(PCSet, Vector) :-
  findall(IC, (
    member(A, PCSet), member(B, PCSet),
    A < B,
    Diff is B - A,
    IC is min(Diff, 12 - Diff)
  ), ICs),
  count_ics(ICs, [0,0,0,0,0,0], Vector).

count_ics([], Vec, Vec).
count_ics([IC|Rest], Acc, Vec) :-
  IC >= 1, IC =< 6,
  Idx is IC - 1,
  nth0(Idx, Acc, OldVal),
  NewVal is OldVal + 1,
  replace_nth0(Idx, Acc, NewVal, NewAcc),
  count_ics(Rest, NewAcc, Vec).

replace_nth0(0, [_|T], Val, [Val|T]) :- !.
replace_nth0(N, [H|T], Val, [H|T2]) :-
  N > 0, N1 is N - 1,
  replace_nth0(N1, T, Val, T2).

%% set_class_normal_form(+PCSet, -NormalForm)
%% Find the most compact rotation of a PC set. (C1514)
set_class_normal_form(PCSet, NormalForm) :-
  sort(PCSet, Sorted),
  all_rotations(Sorted, Rotations),
  maplist(normalize_rotation, Rotations, Normalized),
  msort(Normalized, [NormalForm|_]).

all_rotations(List, Rotations) :-
  length(List, N),
  numlist(0, N, Idxs),  %% N+1 but we handle below
  NMinus1 is N - 1,
  numlist(0, NMinus1, ValidIdxs),
  maplist(rotate_by(List), ValidIdxs, Rotations).

rotate_by(List, N, Rotated) :-
  length(Front, N),
  append(Front, Back, List),
  append(Back, Front, Rotated).

normalize_rotation(Rotation, Normalized) :-
  Rotation = [First|_],
  maplist(subtract_mod12(First), Rotation, Normalized).

subtract_mod12(Base, Note, Result) :-
  Result is (Note - Base + 12) mod 12.

%% set_class_prime_form(+PCSet, -PrimeForm)
%% Compute Forte prime form (normal form of set and its inversion). (C1515)
set_class_prime_form(PCSet, PrimeForm) :-
  set_class_normal_form(PCSet, NF1),
  maplist(invert_pc, PCSet, Inverted),
  set_class_normal_form(Inverted, NF2),
  ( NF1 @=< NF2 -> PrimeForm = NF1
  ; PrimeForm = NF2
  ).

invert_pc(PC, Inv) :- Inv is (12 - PC) mod 12.

%% set_transposition(+PCSet, +N, -TransposedSet)
%% Transpose a PC set by N semitones. (C1516)
set_transposition(PCSet, N, Transposed) :-
  maplist(transpose_pc(N), PCSet, Raw),
  sort(Raw, Transposed).

transpose_pc(N, PC, TPC) :- TPC is (PC + N) mod 12.

%% set_inversion(+PCSet, +Axis, -InvertedSet)
%% Invert a PC set around an axis. (C1517)
set_inversion(PCSet, Axis, Inverted) :-
  maplist(invert_around(Axis), PCSet, Raw),
  sort(Raw, Inverted).

invert_around(Axis, PC, Inv) :- Inv is (2 * Axis - PC + 12) mod 12.

%% set_complement(+PCSet, -Complement)
%% The complement of a PC set (all PCs not in the set). (C1518)
set_complement(PCSet, Complement) :-
  numlist(0, 11, All),
  subtract(All, PCSet, Complement).

%% z_relation(+PCSet1, +PCSet2)
%% Two sets are Z-related if they share interval vectors but aren't transposition/inversion related. (C1519)
z_relation(Set1, Set2) :-
  interval_vector(Set1, V),
  interval_vector(Set2, V),
  \+ sets_equivalent(Set1, Set2).

sets_equivalent(Set1, Set2) :-
  ( member(N, [0,1,2,3,4,5,6,7,8,9,10,11]),
    set_transposition(Set1, N, T),
    T == Set2
  ) ; (
    member(N, [0,1,2,3,4,5,6,7,8,9,10,11]),
    set_transposition(Set1, N, T),
    set_inversion(T, 0, I),
    I == Set2
  ).

%% subset_relation(+PCSet, +SuperSet, -IsSubset)
%% Check whether PCSet is a subset of SuperSet. (C1520)
subset_relation(PCSet, SuperSet, true) :-
  subset(PCSet, SuperSet), !.
subset_relation(_, _, false).

%% common_tones_under_transposition(+PCSet, +N, -CommonTones, -Count)
%% Find common tones when transposing a set by N. (C1521)
common_tones_under_transposition(PCSet, N, CommonTones, Count) :-
  set_transposition(PCSet, N, Transposed),
  intersection(PCSet, Transposed, CommonTones),
  length(CommonTones, Count).

%% neo_riemannian_plr(+Triad, +Operation, -ResultTriad)
%% Apply P, L, or R neo-Riemannian transformations. (C1523)
neo_riemannian_plr(triad(Root, major), p, triad(Root, minor)).
neo_riemannian_plr(triad(Root, minor), p, triad(Root, major)).
neo_riemannian_plr(triad(Root, major), l, triad(NewRoot, minor)) :-
  note_index(Root, I),
  NRI is (I + 4) mod 12,
  pc_to_note_name(NRI, NewRoot).
neo_riemannian_plr(triad(Root, minor), l, triad(NewRoot, major)) :-
  note_index(Root, I),
  NRI is (I + 8) mod 12,
  pc_to_note_name(NRI, NewRoot).
neo_riemannian_plr(triad(Root, major), r, triad(NewRoot, minor)) :-
  note_index(Root, I),
  NRI is (I + 9) mod 12,
  pc_to_note_name(NRI, NewRoot).
neo_riemannian_plr(triad(Root, minor), r, triad(NewRoot, major)) :-
  note_index(Root, I),
  NRI is (I + 3) mod 12,
  pc_to_note_name(NRI, NewRoot).

%% tonnetz_distance(+Chord1, +Chord2, -Distance)
%% Compute distance on the Tonnetz (number of PLR operations). (C1524)
tonnetz_distance(C, C, 0) :- !.
tonnetz_distance(C1, C2, Distance) :-
  bfs_tonnetz([path(C1, [])], C2, [], Distance).

bfs_tonnetz([], _, _, -1) :- !.  %% Not reachable
bfs_tonnetz([path(Current, Ops)|_], Target, _, Distance) :-
  Current == Target, !,
  length(Ops, Distance).
bfs_tonnetz([path(Current, Ops)|Rest], Target, Visited, Distance) :-
  length(Ops, Depth),
  ( Depth >= 6 ->
    %% Limit search depth
    bfs_tonnetz(Rest, Target, Visited, Distance)
  ;
    findall(path(Next, [Op|Ops]),
      (member(Op, [p, l, r]),
       neo_riemannian_plr(Current, Op, Next),
       \+ member(Next, Visited)),
      NewPaths),
    append(Rest, NewPaths, Queue),
    bfs_tonnetz(Queue, Target, [Current|Visited], Distance)
  ).

%% parsimonious_voice_leading(+Chord1, +Chord2, -VoiceLeading)
%% Find minimal voice leading between two chords. (C1525)
parsimonious_voice_leading(triad(R1, T1), triad(R2, T2), VoiceLeading) :-
  triad_notes(R1, T1, Notes1),
  triad_notes(R2, T2, Notes2),
  find_min_vl(Notes1, Notes2, VoiceLeading).

triad_notes(Root, major, [R, T, F]) :-
  note_index(Root, I),
  R is I, T is (I + 4) mod 12, F is (I + 7) mod 12.
triad_notes(Root, minor, [R, T, F]) :-
  note_index(Root, I),
  R is I, T is (I + 3) mod 12, F is (I + 7) mod 12.

find_min_vl(Notes1, Notes2, vl(Moves, TotalMotion)) :-
  %% Simple greedy: match each note to nearest target
  maplist(find_nearest(Notes2), Notes1, Moves),
  maplist(move_distance, Moves, Dists),
  sum_list(Dists, TotalMotion).

find_nearest(Targets, Note, move(Note, Nearest, Dist)) :-
  maplist(pc_distance(Note), Targets, Dists),
  min_list(Dists, MinDist),
  nth0(Idx, Dists, MinDist),
  nth0(Idx, Targets, Nearest),
  Dist = MinDist.

move_distance(move(_, _, D), D).

pc_distance(A, B, Dist) :-
  D is abs(A - B),
  Dist is min(D, 12 - D).

%% ============================================================================
%% ADDITIONAL SPECTRAL PREDICATES (C1458-C1493)
%% ============================================================================

%% mfcc_coefficients(+Spectrum, +NumCoeffs, -MFCCs)
%% Mel-frequency cepstral coefficients for timbre analysis. (C1458)
mfcc_coefficients(bright_spectrum, 13, [high_c0, low_c1, moderate_c2, low_c3, low_c4,
  low_c5, low_c6, low_c7, low_c8, low_c9, low_c10, low_c11, low_c12]).
mfcc_coefficients(dark_spectrum, 13, [low_c0, high_c1, low_c2, moderate_c3, low_c4,
  low_c5, low_c6, low_c7, low_c8, low_c9, low_c10, low_c11, low_c12]).
mfcc_coefficients(vocal_spectrum, 13, [moderate_c0, moderate_c1, high_c2, moderate_c3, high_c4,
  low_c5, low_c6, low_c7, low_c8, low_c9, low_c10, low_c11, low_c12]).

%% additive_synthesis_target(+TargetSpectrum, -Instruments, -Assignment)
%% Assign instruments to approximate a target spectrum. (C1460)
additive_synthesis_target(harmonic_rich, [strings, brass, woodwinds],
  [strings(fundamentals_and_low_partials), brass(mid_partials), woodwinds(high_partials)]).
additive_synthesis_target(inharmonic, [percussion, piano, prepared_piano],
  [percussion(noise_component), piano(quasi_harmonic), prepared_piano(inharmonic_partials)]).
additive_synthesis_target(bell_like, [vibraphone, celesta, harp],
  [vibraphone(fundamental), celesta(upper_partials), harp(attack_transient)]).

%% murail_spectral_process(+SourceSpec, -Transform, -ResultSpec)
%% Tristan Murail's spectral compositional processes. (C1464)
murail_spectral_process(harmonic_series, compression, narrowed_interval_spectrum).
murail_spectral_process(harmonic_series, expansion, widened_interval_spectrum).
murail_spectral_process(harmonic_series, frequency_shift, inharmonic_spectrum).
murail_spectral_process(bell_spectrum, ring_modulation, sum_and_difference_tones).
murail_spectral_process(vocal_formant, spectral_interpolation, morphed_formant).
murail_spectral_process(any_spectrum, filtering, partial_spectrum).

%% pitch_class_to_spectral(+PitchClasses, +Fundamental, -Spectrum)
%% Convert pitch-class set back to spectral representation. (C1466)
pitch_class_to_spectral([0, 4, 7], c2, [c2_fundamental, e4_5th_partial, g4_6th_partial]).
pitch_class_to_spectral([0, 3, 7], c2, [c2_fundamental, eb4_approx_partial, g4_6th_partial]).
pitch_class_to_spectral([0, 2, 4, 5, 7, 9, 11], c1, full_harmonic_approximation).

%% section_blend_matrix(+InstrumentList, -BlendMatrix)
%% Blend quality matrix for an instrument combination. (C1483)
section_blend_matrix([flute, oboe], [blend(flute, oboe, moderate)]).
section_blend_matrix([flute, clarinet], [blend(flute, clarinet, good)]).
section_blend_matrix([violin, viola], [blend(violin, viola, excellent)]).
section_blend_matrix([trumpet, trombone], [blend(trumpet, trombone, good)]).
section_blend_matrix([oboe, clarinet], [blend(oboe, clarinet, moderate)]).
section_blend_matrix([violin, cello], [blend(violin, cello, excellent)]).
section_blend_matrix([flute, violin], [blend(flute, violin, good)]).
section_blend_matrix([horn, cello], [blend(horn, cello, excellent)]).

%% adler_doubling_rule(+Melody, +Dynamics, +Texture, -Doubling)
%% Samuel Adler's doubling guidelines for orchestration. (C1493)
adler_doubling_rule(high_melody, piano, thin, single_instrument).
adler_doubling_rule(high_melody, forte, thick, octave_doubling_with_brightness).
adler_doubling_rule(low_melody, any_dynamic, any, avoid_close_doubling_below_c3).
adler_doubling_rule(middle_melody, mezzo_forte, moderate, unison_doubling_different_timbre).
adler_doubling_rule(bass_line, forte, tutti, double_at_octave_below).
adler_doubling_rule(inner_voice, piano, chamber, no_doubling_needed).
adler_doubling_rule(any_melody, fortissimo, climactic, full_section_doubling).

%% ============================================================================
%% ORCHESTRAL BALANCE & SEPARATION (C1498-C1503)
%% ============================================================================

%% masking_risk(+Instrument1, +Instrument2, +Register, -Risk)
%% Additional masking risk predicates. (C1498)
masking_risk(trumpet, oboe, same_register, high).
masking_risk(trombone, cello, same_register, moderate).
masking_risk(flute, violin, high_register, moderate).
masking_risk(clarinet, viola, middle_register, high).
masking_risk(horn, bassoon, low_middle_register, moderate).
masking_risk(piccolo, anything, high_register, low).  %% Piccolo cuts through

%% optimal_spacing(+RegisterRange, -Instruments, -Spacing)
%% Additional optimal spacing rules. (C1499)
optimal_spacing(wide, full_orchestra, open_voicing_wider_at_bottom).
optimal_spacing(narrow, chamber, close_voicing_any_register).
optimal_spacing(graduated, full_orchestra, wider_intervals_in_bass_closer_in_treble).

%% foreground_background_separation(+Score, -Foreground, -Background)
%% Separating foreground/background elements. (C1500)
foreground_background_separation(melody_and_accompaniment, melody_instrument, sustained_harmony).
foreground_background_separation(counterpoint, primary_line, secondary_lines).
foreground_background_separation(textural, emerging_melody, background_texture).
foreground_background_separation(rhythmic, accented_pattern, unaccented_pattern).

%% kennan_grantham_rule(+Situation, -Rule, -Recommendation)
%% Kennan-Grantham orchestration rules. (C1503)
kennan_grantham_rule(doubling_at_octave, safe_always, doubles_well_at_any_dynamic).
kennan_grantham_rule(doubling_at_unison, blend_critical, same_family_preferred).
kennan_grantham_rule(low_register_spacing, open_intervals, avoid_seconds_below_c3).
kennan_grantham_rule(crossing_voices, avoid_in_homophony, acceptable_in_counterpoint).
kennan_grantham_rule(extreme_register, use_sparingly, special_effect_only).
kennan_grantham_rule(tutti_balance, brass_dominates, reduce_brass_for_balance).

%% ============================================================================
%% SET-THEORETIC TRANSFORMATIONAL NETWORKS (C1522)
%% ============================================================================

%% transformational_network(+SetSequence, -Operations, -Network)
%% Transformational analysis of set-class sequences. (C1522)
transformational_network([set_a, set_b], [transposition(n)], t_network).
transformational_network([set_a, set_b], [inversion(n)], i_network).
transformational_network([major, minor, major], [p, l, p], plr_network).
transformational_network([c_major, a_minor, f_major], [r, l], rl_chain).
transformational_network([c_major, ab_major, e_major], [lp, lp], hexatonic_cycle).

%% ============================================================================
%% COMPUTATIONAL ORCHESTRATION (C1531-C1540)
%% ============================================================================

%% ircam_orchidea_model(+TargetSound, -Instruments, -Solution)
%% IRCAM Orchidea-style orchestration model. (C1531)
ircam_orchidea_model(bright_harmonic, [flute, oboe, violin_harmonic], additive_spectral_match).
ircam_orchidea_model(dark_sustained, [bass_clarinet, cello, contrabassoon], low_spectral_blend).
ircam_orchidea_model(percussive_attack, [pizz_violin, marimba, harp], transient_match).
ircam_orchidea_model(evolving_texture, [flute_multiphonic, cello_sul_pont, vibraphone_bow], spectral_morphing).

%% orchestration_search_space(+Constraints, +NumInstr, -SearchSpace)
%% Define search space for orchestration. (C1532)
orchestration_search_space(standard_orchestra, 4, medium_search).
orchestration_search_space(standard_orchestra, 8, large_search).
orchestration_search_space(extended_orchestra, 4, large_search).
orchestration_search_space(chamber, 3, small_search).

%% constraint_satisfaction_orchestration(+Constraints, +Pool, -Assignment)
%% Constraint satisfaction for orchestration. (C1533)
constraint_satisfaction_orchestration([bright, sustained, blend_well], woodwinds, [flute, clarinet, oboe]).
constraint_satisfaction_orchestration([dark, powerful, low], brass, [trombone, tuba, bass_trombone]).
constraint_satisfaction_orchestration([warm, legato, middle], strings, [viola, cello, violin_2]).

%% genetic_orchestration(+Target, +Population, +Generations, -Best)
%% Genetic algorithm approach to orchestration. (C1534)
genetic_orchestration(target_spectrum, random_assignments, 100, best_fitness_assignment).
genetic_orchestration(target_timbre, seeded_population, 50, converged_assignment).

%% neural_timbre_embedding(+Sound, +Model, -Embedding)
%% Neural network timbre embedding. (C1535)
neural_timbre_embedding(violin_sustain, timbral_cnn, vector_128d).
neural_timbre_embedding(flute_attack, timbral_cnn, vector_128d).
neural_timbre_embedding(trumpet_mf, timbral_cnn, vector_128d).

%% timbre_space_distance(+Embedding1, +Embedding2, -Distance)
%% Distance in timbre embedding space. (C1536)
timbre_space_distance(violin_emb, viola_emb, 0.15).
timbre_space_distance(violin_emb, trumpet_emb, 0.72).
timbre_space_distance(flute_emb, clarinet_emb, 0.35).
timbre_space_distance(oboe_emb, english_horn_emb, 0.18).

%% orchestration_fitness(+Assignment, +Target, -FitnessScore)
%% Fitness function for orchestration search. (C1537)
orchestration_fitness(good_blend, target_spectrum, 0.92).
orchestration_fitness(poor_blend, target_spectrum, 0.34).
orchestration_fitness(approximate, target_spectrum, 0.71).

%% multi_objective_orchestration(+Targets, +Weights, +Pool, -Pareto)
%% Multi-objective orchestration optimization. (C1538)
multi_objective_orchestration([spectral_match, playability], [0.7, 0.3], standard_pool, pareto_front_solutions).
multi_objective_orchestration([blend, contrast, range], [0.4, 0.3, 0.3], full_pool, pareto_front_solutions).

%% style_transfer_orchestration(+Source, +TargetStyle, +Pool, -Result)
%% Style transfer for orchestration. (C1539)
style_transfer_orchestration(piano_score, ravel_style, standard_orchestra, colorful_doublings_and_solos).
style_transfer_orchestration(piano_score, beethoven_style, classical_orchestra, functional_section_writing).
style_transfer_orchestration(piano_score, debussy_style, impressionist_orchestra, divided_strings_and_winds).

%% reduction_to_orchestration(+PianoScore, +Style, -FullScore)
%% Piano reduction to full orchestration. (C1540)
reduction_to_orchestration(two_hand_piano, romantic, full_romantic_orchestra).
reduction_to_orchestration(two_hand_piano, classical, classical_period_orchestra).
reduction_to_orchestration(two_hand_piano, film, modern_film_orchestra).
