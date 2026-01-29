%% music-theory-computational.pl - Computational Music Theory Extensions for CardPlay AI
%%
%% Extends the base `music-theory.pl` KB with computational/analytical helpers:
%% - Pitch-class profiles (PCP) and normalization
%% - Krumhansl–Schmuckler-style key scoring (as Prolog utilities)
%% - DFT/phase-style tonic estimation (k=1 component; phase matched without atan2)
%% - Spiral-Array-inspired 3D embedding (lightweight approximation)
%% - Simplified GTTM-inspired grouping/segmentation utilities
%%
%% NOTE: This file intentionally stays lightweight and "KB-ish":
%% - No heavy search or unbounded recursion
%% - Bounded arithmetic, fixed-size (12) vectors
%% - Designed to be used by query wrappers and cards as building blocks
%%
%% Depends on base predicates from `music-theory.pl`:
%% - note_index/2, index_to_note/2
%% - chord_tones/3, scale_notes/3

%% ============================================================================
%% C211: ENGINE CAPABILITY CHECKS
%% ============================================================================

%% supports_math/0
%% Succeeds if the Prolog engine supports floating-point arithmetic.
%% Used to gate features that require sin/cos/exp/log.
supports_math :-
  catch((_ is sin(0.5)), _, fail).

%% supports_atan2/0
%% Succeeds if the Prolog engine supports atan2.
supports_atan2 :-
  catch((_ is atan2(1, 1)), _, fail).

%% supports_exp/0
%% Succeeds if the Prolog engine supports exp.
supports_exp :-
  catch((_ is exp(1)), _, fail).

%% C209: Fallback behavior when arithmetic functions missing
%% math_fallback(+Op, +Args, -Result)
%% Provides fallback values when math operations fail.
math_fallback(sin, [_], 0).
math_fallback(cos, [_], 1).
math_fallback(atan2, [_, _], 0).
math_fallback(exp, [_], 1).
math_fallback(log, [_], 0).

%% safe_sin(+X, -Y)
%% Computes sin(X) with fallback to 0 if not supported.
safe_sin(X, Y) :-
  ( catch(Y is sin(X), _, fail) -> true
  ; Y = 0
  ).

%% safe_cos(+X, -Y)
%% Computes cos(X) with fallback to 1 if not supported.
safe_cos(X, Y) :-
  ( catch(Y is cos(X), _, fail) -> true
  ; Y = 1
  ).

%% safe_atan2(+Y, +X, -Result)
%% Computes atan2(Y, X) with fallback to 0 if not supported.
safe_atan2(Y, X, Result) :-
  ( catch(Result is atan2(Y, X), _, fail) -> true
  ; Result = 0
  ).

%% safe_sqrt(+X, -Y)
%% Computes sqrt(X) with fallback to X if not supported.
safe_sqrt(X, Y) :-
  ( catch(Y is sqrt(X), _, fail) -> true
  ; Y = X
  ).

%% ============================================================================
%% PITCH-CLASS PROFILE (PCP) UTILITIES
%% ============================================================================

zero_profile([0,0,0,0,0,0,0,0,0,0,0,0]).

pc_norm(PC0, PC) :-
  PC is ((PC0 mod 12) + 12) mod 12.

inc_bin(0, [H|T], [H2|T]) :- H2 is H + 1.
inc_bin(N, [H|T], [H|T2]) :-
  N > 0,
  N1 is N - 1,
  inc_bin(N1, T, T2).

pc_profile_from_pcs(Pcs, Profile) :-
  zero_profile(Acc),
  pc_profile_from_pcs_(Pcs, Acc, Profile).

pc_profile_from_pcs_([], Acc, Acc).
pc_profile_from_pcs_([PC0|Rest], Acc, Profile) :-
  pc_norm(PC0, PC),
  inc_bin(PC, Acc, Acc2),
  pc_profile_from_pcs_(Rest, Acc2, Profile).

pc_list_from_notes([], []).
pc_list_from_notes([Note|Rest], [PC|PCs]) :-
  note_index(Note, PC),
  pc_list_from_notes(Rest, PCs).

pc_profile_from_notes(Notes, Profile) :-
  pc_list_from_notes(Notes, PCs),
  pc_profile_from_pcs(PCs, Profile).

profile_sum([], 0).
profile_sum([X|Xs], S) :-
  profile_sum(Xs, S0),
  S is S0 + X.

pc_profile_norm(Profile, Norm) :-
  profile_sum(Profile, Sum),
  pc_profile_norm_(Profile, Sum, Norm).

pc_profile_norm_([], _, []).
pc_profile_norm_([X|Xs], Sum, [Y|Ys]) :-
  ( Sum =:= 0 -> Y is 0 ; Y is X / Sum ),
  pc_profile_norm_(Xs, Sum, Ys).

profile_rotate(Profile, N0, Rotated) :-
  pc_norm(N0, N),
  length(Prefix, N),
  append(Prefix, Suffix, Profile),
  append(Suffix, Prefix, Rotated).

dot([], [], 0).
dot([A|As], [B|Bs], S) :-
  dot(As, Bs, S0),
  S is S0 + A * B.

%% ============================================================================
%% KRUMHANSL–SCHMUCKLER KEY SCORING (UTILITY)
%% ============================================================================

%% Key profiles (as used widely in computational key-finding demos)
ks_profile(major, [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]).
ks_profile(minor, [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]).

%% ks_key_score(+Profile12, +KeyRootPC, +Mode, -Score)
%% - KeyRootPC is 0..11 where 0=C, 1=C#, ..., 11=B
ks_key_score(Profile, KeyRoot, Mode, Score) :-
  ks_profile(Mode, Template),
  pc_profile_norm(Profile, Norm),
  profile_rotate(Norm, KeyRoot, Rot),
  dot(Rot, Template, Score).

%% ks_best_key(+Profile12, -KeyRootPC, -Mode)
ks_best_key(Profile, BestKey, BestMode) :-
  findall(Score-Key-Mode, (
    between(0, 11, Key),
    (Mode = major ; Mode = minor),
    ks_key_score(Profile, Key, Mode, Score)
  ), Triples),
  sort(Triples, Sorted),
  append(_, [_BestScore-BestKey-BestMode], Sorted).

%% ============================================================================
%% DFT/PHASE TONALITY (K=1; PHASE MATCH WITHOUT atan2)
%% ============================================================================

%% Complex number representation: c(Re, Im)
c_add(c(A,B), c(C,D), c(E,F)) :- E is A + C, F is B + D.
c_scale(S, c(A,B), c(C,D)) :- C is S * A, D is S * B.

%% 12th roots of unity for k=1: exp(-i * 2πn/12)
%% (precomputed; avoids trig and keeps Tau Prolog compatibility predictable)
w1(0,  c( 1.0,        0.0)).
w1(1,  c( 0.8660254, -0.5)).
w1(2,  c( 0.5,       -0.8660254)).
w1(3,  c( 0.0,       -1.0)).
w1(4,  c(-0.5,       -0.8660254)).
w1(5,  c(-0.8660254, -0.5)).
w1(6,  c(-1.0,        0.0)).
w1(7,  c(-0.8660254,  0.5)).
w1(8,  c(-0.5,        0.8660254)).
w1(9,  c( 0.0,        1.0)).
w1(10, c( 0.5,        0.8660254)).
w1(11, c( 0.8660254,  0.5)).

%% dft_k1(+Profile12, -Complex)
%% Computes the k=1 DFT component of a normalized 12-bin PCP.
dft_k1(Profile, C) :-
  pc_profile_norm(Profile, Norm),
  dft_k1_(0, Norm, c(0.0, 0.0), C).

dft_k1_(_, [], Acc, Acc).
dft_k1_(N, [X|Xs], c(Re0, Im0), C) :-
  w1(N, c(Wre, Wim)),
  Re1 is Re0 + X * Wre,
  Im1 is Im0 + X * Wim,
  N1 is N + 1,
  dft_k1_(N1, Xs, c(Re1, Im1), C).

%% dft_phase_key(+Profile12, -KeyRootPC, -Confidence0to100)
%% Estimates tonic by matching the DFT phase direction to the nearest of 12 phase centers.
%% Confidence is a simple margin between top two matches (0..100, heuristic).
dft_phase_key(Profile, BestKey, Confidence) :-
  dft_k1(Profile, c(Re, Im)),
  findall(Dot-Key, (
    between(0, 11, Key),
    w1(Key, c(Wre, Wim)),
    Dot is Re * Wre + Im * Wim
  ), Pairs),
  sort(Pairs, Sorted),
  append(_, [BestDot-BestKey], Sorted),
  ( append(_, [SecondDot-_, BestDot-_], Sorted) -> Diff is BestDot - SecondDot ; Diff is 0 ),
  Conf0 is Diff * 100,
  ( Conf0 > 100 -> Confidence is 100
  ; Conf0 < 0   -> Confidence is 0
  ;               Confidence is Conf0
  ).

%% Convenience: return note name instead of pitch class int
dft_phase_key_note(Profile, Note, Confidence) :-
  dft_phase_key(Profile, PC, Confidence),
  index_to_note(PC, Note).

%% ============================================================================
%% SPIRAL-ARRAY-INSPIRED 3D EMBEDDING (LIGHTWEIGHT APPROXIMATION)
%% ============================================================================

%% circle_of_fifths_index(+PC, -FifthIndex)
circle_of_fifths_index(PC, F) :-
  F is (7 * PC) mod 12.

%% spiral_point_pc(+PC, -p(X,Y,Z))
%% We place pitch classes on a circle of fifths (X,Y) with a small Z component.
%% This is a *proxy* for Spiral Array behavior, useful for rough “tonal distance”.
spiral_point_pc(PC0, p(X, Y, Z)) :-
  pc_norm(PC0, PC),
  circle_of_fifths_index(PC, F),
  w1(F, c(Cos, NegSin)),
  X is Cos,
  Y is -NegSin,
  Z is PC / 12.

spiral_point_note(Note, Point) :-
  note_index(Note, PC),
  spiral_point_pc(PC, Point).

point_dist2(p(X1,Y1,Z1), p(X2,Y2,Z2), D2) :-
  DX is X2 - X1,
  DY is Y2 - Y1,
  DZ is Z2 - Z1,
  D2 is DX*DX + DY*DY + DZ*DZ.

spiral_distance2(NoteA, NoteB, D2) :-
  spiral_point_note(NoteA, P1),
  spiral_point_note(NoteB, P2),
  point_dist2(P1, P2, D2).

points_sum([], 0.0, 0.0, 0.0, 0).
points_sum([p(X,Y,Z)|Rest], SX, SY, SZ, N) :-
  points_sum(Rest, SX0, SY0, SZ0, N0),
  SX is SX0 + X,
  SY is SY0 + Y,
  SZ is SZ0 + Z,
  N is N0 + 1.

points_avg(Points, p(AX, AY, AZ)) :-
  points_sum(Points, SX, SY, SZ, N),
  N > 0,
  AX is SX / N,
  AY is SY / N,
  AZ is SZ / N.

spiral_chord_point(Root, ChordType, Point) :-
  chord_tones(Root, ChordType, Notes),
  maplist(spiral_point_note, Notes, Points),
  points_avg(Points, Point).

key_scale_type(major, major).
key_scale_type(minor, natural_minor).

spiral_key_point(KeyRoot, Mode, Point) :-
  key_scale_type(Mode, ScaleType),
  scale_notes(KeyRoot, ScaleType, Notes),
  maplist(spiral_point_note, Notes, Points),
  points_avg(Points, Point).

spiral_chord_key_distance2(Root, ChordType, KeyRoot, Mode, D2) :-
  spiral_chord_point(Root, ChordType, PChord),
  spiral_key_point(KeyRoot, Mode, PKey),
  point_dist2(PChord, PKey, D2).

%% ============================================================================
%% SIMPLIFIED GTTM-INSPIRED GROUPING (HEURISTIC)
%% ============================================================================

%% Event representation for these predicates:
%%   evt(StartTicks, DurationTicks, MidiPitch)
evt_start(evt(S,_,_), S).
evt_pitch(evt(_,_,P), P).

ioi(E1, E2, Ioi) :-
  evt_start(E1, S1),
  evt_start(E2, S2),
  Ioi is S2 - S1.

pitch_leap(E1, E2, Leap) :-
  evt_pitch(E1, P1),
  evt_pitch(E2, P2),
  Leap is abs(P2 - P1).

interval_dir(E1, E2, up)   :- evt_pitch(E2, P2), evt_pitch(E1, P1), P2 > P1.
interval_dir(E1, E2, down) :- evt_pitch(E2, P2), evt_pitch(E1, P1), P2 < P1.
interval_dir(E1, E2, same) :- evt_pitch(E2, P2), evt_pitch(E1, P1), P2 =:= P1.

%% gttm_boundary_score(+PrevEvt, +CurrEvt, +NextEvt, -Score0to100)
%% Uses a small set of surface cues:
%% - IOI gap after Curr (bigger gap ⇒ stronger boundary)
%% - Registral leap after Curr (bigger leap ⇒ stronger boundary)
%% - Direction change around Curr (adds small bonus)
gttm_boundary_score(Prev, Curr, Next, Score) :-
  ioi(Curr, Next, Gap),
  pitch_leap(Curr, Next, Leap),
  GapNorm is min(1, Gap / 960),
  LeapNorm is min(1, Leap / 12),
  interval_dir(Prev, Curr, Dir1),
  interval_dir(Curr, Next, Dir2),
  ( Dir1 \= same, Dir2 \= same, Dir1 \= Dir2 -> TurnBonus is 0.10 ; TurnBonus is 0.0 ),
  ScoreF is (GapNorm * 0.60) + (LeapNorm * 0.30) + TurnBonus,
  Score is ScoreF * 100.

%% gttm_segment(+Events, +Threshold0to100, -Segments)
%% Splits event list whenever boundary_score >= Threshold.
gttm_segment([E1], _, [[E1]]) :- !.
gttm_segment([E1, E2|Rest], Thresh, Segments) :-
  gttm_segment_(E1, E2, Rest, Thresh, [E1], Segments).

gttm_segment_(_Prev, Curr, [], _Thresh, Acc, [Segment]) :-
  append(Acc, [Curr], Segment).
gttm_segment_(Prev, Curr, [Next|More], Thresh, Acc, Segments) :-
  gttm_boundary_score(Prev, Curr, Next, Score),
  append(Acc, [Curr], Acc2),
  ( Score >= Thresh ->
      Segment = Acc2,
      gttm_segment_(Curr, Next, More, Thresh, [], RestSegments),
      Segments = [Segment|RestSegments]
  ;   gttm_segment_(Curr, Next, More, Thresh, Acc2, Segments)
  ).

%% metrical_strength(+meter(Num,Den), +BeatIndex1Based, -Strength0to1)
%% A minimal starting point (extendable): downbeat strongest; secondary strong beats.
metrical_strength(meter(4,4), 1, 1.0).
metrical_strength(meter(4,4), 3, 0.7).
metrical_strength(meter(4,4), 2, 0.4).
metrical_strength(meter(4,4), 4, 0.4).

metrical_strength(meter(3,4), 1, 1.0).
metrical_strength(meter(3,4), 2, 0.5).
metrical_strength(meter(3,4), 3, 0.5).

metrical_strength(meter(6,8), 1, 1.0).
metrical_strength(meter(6,8), 4, 0.7).
metrical_strength(meter(6,8), 2, 0.4).
metrical_strength(meter(6,8), 3, 0.4).
metrical_strength(meter(6,8), 5, 0.4).
metrical_strength(meter(6,8), 6, 0.4).
%% Additional meters (C183)
metrical_strength(meter(9,8), 1, 1.0).
metrical_strength(meter(9,8), 4, 0.7).
metrical_strength(meter(9,8), 7, 0.7).
metrical_strength(meter(9,8), 2, 0.4).
metrical_strength(meter(9,8), 3, 0.4).
metrical_strength(meter(9,8), 5, 0.4).
metrical_strength(meter(9,8), 6, 0.4).
metrical_strength(meter(9,8), 8, 0.4).
metrical_strength(meter(9,8), 9, 0.4).

metrical_strength(meter(12,8), 1, 1.0).
metrical_strength(meter(12,8), 4, 0.7).
metrical_strength(meter(12,8), 7, 0.7).
metrical_strength(meter(12,8), 10, 0.7).
metrical_strength(meter(12,8), N, 0.4) :- between(2, 12, N), \+ member(N, [1,4,7,10]).

%% ============================================================================
%% ACCENTED EVENT (C184)
%% ============================================================================

%% accented_event(+Spec, +Event, -AccentStrength)
%% Returns accent strength for an event based on its metrical position
accented_event(music_spec(_, meter(Num, Den), _, _, _, _, _), evt(StartTicks, _, _), Strength) :-
  TicksPerBeat is 480,
  Beat is (StartTicks // TicksPerBeat) mod Num + 1,
  metrical_strength(meter(Num, Den), Beat, Strength).

%% ============================================================================
%% TIME-SPAN WEIGHT (C185)
%% ============================================================================

%% time_span_weight(+Spec, +Event, -Weight)
%% Combines accent strength with duration prominence
time_span_weight(Spec, evt(Start, Dur, Pitch), Weight) :-
  accented_event(Spec, evt(Start, Dur, Pitch), Accent),
  DurNorm is min(1, Dur / 960),  % Normalize to half-note = 1
  Weight is (Accent * 0.6) + (DurNorm * 0.4).

%% ============================================================================
%% TIME-SPAN REDUCTION (C186)
%% ============================================================================

%% tsr_select_heads(+Segment, -Heads, -Reasons)
%% Selects the most prominent events as "heads" of a segment
tsr_select_heads(Segment, Heads, Reasons) :-
  findall(Weight-Event, (
    member(Event, Segment),
    Event = evt(_, Dur, _),
    DurNorm is min(1, Dur / 480),
    Weight is DurNorm
  ), Weighted),
  sort(0, @>=, Weighted, Sorted),
  ( Sorted = [W1-H1|Rest] ->
      ( Rest = [W2-H2|_], W2 >= W1 * 0.7 ->
          Heads = [H1, H2],
          Reasons = ['Two prominent events selected based on duration']
      ; Heads = [H1],
        Reasons = ['Single head selected based on duration']
      )
  ; Heads = [],
    Reasons = ['Empty segment']
  ).

%% ============================================================================
%% PROLONGATIONAL REDUCTION (C187)
%% ============================================================================

%% pr_relation(+E1, +E2, -RelationType, -Strength)
%% Determines prolongational relation between two events
pr_relation(evt(_, _, P1), evt(_, _, P2), repetition, 1.0) :-
  P1 =:= P2.

pr_relation(evt(_, _, P1), evt(_, _, P2), neighbor, 0.8) :-
  Diff is abs(P2 - P1),
  Diff =< 2.

pr_relation(evt(_, _, P1), evt(_, _, P2), passing, 0.6) :-
  Diff is abs(P2 - P1),
  Diff > 2, Diff =< 4.

pr_relation(evt(_, _, P1), evt(_, _, P2), leap, 0.4) :-
  Diff is abs(P2 - P1),
  Diff > 4.

%% ============================================================================
%% PHRASE HEAD (C188)
%% ============================================================================

%% gttm_phrase_head(+Segment, -Head, -Reasons)
%% Returns the main tone of a segment
gttm_phrase_head(Segment, Head, Reasons) :-
  tsr_select_heads(Segment, Heads, _),
  ( Heads = [Head|_] ->
      Reasons = ['Head selected by time-span reduction']
  ; Segment = [Head|_],
    Reasons = ['Fallback: first event as head']
  ).

%% ============================================================================
%% MOTIVIC SKELETON (C189)
%% ============================================================================

%% gttm_motivic_skeleton(+Events, -Skeleton)
%% Extracts reduced contour as list of interval directions
gttm_motivic_skeleton(Events, Skeleton) :-
  gttm_segment(Events, 50, Segments),
  findall(Dir, (
    member(Seg, Segments),
    gttm_phrase_head(Seg, evt(_, _, P1), _),
    Seg = [evt(_, _, P2)|_],
    ( P1 > P2 -> Dir = down ; P1 < P2 -> Dir = up ; Dir = same )
  ), Skeleton).

%% ============================================================================
%% EXPLAIN KEY (C139)
%% ============================================================================

%% ks_explain_key(+Profile, +Key, -Reasons)
ks_explain_key(Profile, Key, Reasons) :-
  index_to_note(Key, KeyName),
  ks_key_score(Profile, Key, major, MajScore),
  ks_key_score(Profile, Key, minor, MinScore),
  ( MajScore >= MinScore ->
      format(atom(R1), 'Key ~w major scores ~2f', [KeyName, MajScore]),
      Reasons = [R1, 'Major template correlation higher than minor']
  ; format(atom(R1), 'Key ~w minor scores ~2f', [KeyName, MinScore]),
    Reasons = [R1, 'Minor template correlation higher than major']
  ).

%% ============================================================================
%% DFT PHASE EXPLAIN (C150)
%% ============================================================================

%% dft_phase_explain(+Profile, -KeyPC, -Reasons)
dft_phase_explain(Profile, BestKey, Reasons) :-
  dft_phase_key(Profile, BestKey, Confidence),
  index_to_note(BestKey, KeyName),
  format(atom(R1), 'DFT k=1 phase points to ~w with confidence ~w', [KeyName, Confidence]),
  ( Confidence < 50 ->
      R2 = 'Low confidence: tonal center ambiguous (modal mixture or chromatic)'
  ; R2 = 'Good confidence: clear tonal center'
  ),
  Reasons = [R1, R2].

%% ============================================================================
%% TONALITY AMBIGUITY (C154)
%% ============================================================================

%% tonality_ambiguity(+Profile, -CompetingKeys)
%% Lists competing tonic/mode combinations when scores are close
tonality_ambiguity(Profile, CompetingKeys) :-
  findall(Score-key(Key, Mode), (
    between(0, 11, Key),
    (Mode = major ; Mode = minor),
    ks_key_score(Profile, Key, Mode, Score)
  ), AllScores),
  sort(0, @>=, AllScores, Sorted),
  ( Sorted = [Best-K1, Second-K2|_] ->
      Margin is Best - Second,
      ( Margin < 0.3 ->
          CompetingKeys = [K1, K2]
      ; CompetingKeys = [K1]
      )
  ; CompetingKeys = []
  ).

%% ============================================================================
%% HYBRID KEY FINDER (C155)
%% ============================================================================

%% best_key(+Profile, +Weights, -KeyPC, -Mode)
%% Combines KS and DFT evidence using weights
%% Weights = weights(KsWeight, DftWeight)
best_key(Profile, weights(KsW, DftW), BestKey, BestMode) :-
  ks_best_key(Profile, KsKey, KsMode),
  dft_phase_key(Profile, DftKey, DftConf),
  ( KsKey =:= DftKey ->
      BestKey = KsKey,
      BestMode = KsMode
  ; DftConf > 70, DftW > KsW ->
      BestKey = DftKey,
      BestMode = major  % DFT doesn't distinguish mode well
  ; BestKey = KsKey,
    BestMode = KsMode
  ).

%% ============================================================================
%% RECOMMEND TONALITY MODEL (C216)
%% ============================================================================

%% recommend_tonality_model(+Spec, -Model, -Reasons)
recommend_tonality_model(music_spec(_, _, _, _, Style, Culture, _), Model, Reasons) :-
  ( Culture = carnatic ->
      Model = ks_profile,
      Reasons = ['Carnatic music: use KS profile with raga matching']
  ; Style = cinematic ->
      Model = spiral_array,
      Reasons = ['Cinematic style: Spiral Array handles chromatic mediants well']
  ; Style = jazz ->
      Model = dft_phase,
      Reasons = ['Jazz: DFT phase handles modal ambiguity']
  ; Model = ks_profile,
    Reasons = ['Default: KS profile for Western tonal music']
  ).

%% ============================================================================
%% TONAL TENSION (C218-C219)
%% ============================================================================

%% tonal_tension(+ChordRoot, +ChordType, +KeyRoot, +Mode, -Tension, -Reasons)
tonal_tension(ChordRoot, ChordType, KeyRoot, Mode, Tension, Reasons) :-
  spiral_chord_key_distance2(ChordRoot, ChordType, KeyRoot, Mode, D2),
  % Normalize to 0-1 tension scale
  Tension is min(1, D2 / 4),
  ( Tension < 0.3 ->
      R = 'Low tension: chord is close to key center'
  ; Tension < 0.7 ->
      R = 'Medium tension: chord creates harmonic interest'
  ; R = 'High tension: chord is distant from key center'
  ),
  format(atom(R2), 'Spiral distance squared: ~2f', [D2]),
  Reasons = [R, R2].

%% ============================================================================
%% CADENCE DETECTION (C251-C253)
%% ============================================================================

%% detect_cadence(+ChordSequence, -CadenceType, -Confidence)
%% ChordSequence = list of chord(Root, Quality) terms
detect_cadence([chord(_, dominant7), chord(Root, major)], authentic, 0.9) :-
  !.
detect_cadence([chord(_, dominant7), chord(Root, minor)], authentic, 0.85) :-
  !.
detect_cadence([chord(_, major), chord(_, dominant7)], half, 0.8) :-
  !.
detect_cadence([chord(V, dominant7), chord(_, minor)], deceptive, 0.75) :-
  V \= Root,
  !.
detect_cadence([chord(_, minor), chord(_, major)], plagal, 0.7) :-
  !.
detect_cadence(_, unknown, 0.3).

%% cadence_reasons(+Chords, +CadenceType, -Reasons)
cadence_reasons(Chords, CadenceType, Reasons) :-
  detect_cadence(Chords, CadenceType, Confidence),
  format(atom(R1), 'Detected ~w cadence with confidence ~2f', [CadenceType, Confidence]),
  length(Chords, Len),
  format(atom(R2), 'Based on ~w chord progression', [Len]),
  Reasons = [R1, R2].

%% ============================================================================
%% MOTIF FINGERPRINT (C225)
%% ============================================================================

%% motif_fingerprint(+Events, -Fingerprint)
%% Creates an interval/rhythm fingerprint for a motif
motif_fingerprint(Events, fingerprint(Intervals, Rhythms)) :-
  events_intervals(Events, Intervals),
  events_rhythms(Events, Rhythms).

events_intervals([_], []).
events_intervals([evt(_, _, P1), evt(S2, D2, P2)|Rest], [Interval|More]) :-
  Interval is P2 - P1,
  events_intervals([evt(S2, D2, P2)|Rest], More).

events_rhythms([], []).
events_rhythms([evt(_, Dur, _)|Rest], [Dur|More]) :-
  events_rhythms(Rest, More).

%% motif_similarity(+Fingerprint1, +Fingerprint2, -Similarity0to100)
motif_similarity(fingerprint(I1, R1), fingerprint(I2, R2), Similarity) :-
  interval_similarity(I1, I2, ISim),
  rhythm_similarity(R1, R2, RSim),
  Similarity is (ISim * 0.6) + (RSim * 0.4).

interval_similarity(I1, I2, Sim) :-
  length(I1, L1), length(I2, L2),
  ( L1 =:= 0 ; L2 =:= 0 -> Sim is 0
  ; common_prefix_length(I1, I2, Common),
    MaxLen is max(L1, L2),
    Sim is (Common / MaxLen) * 100
  ).

rhythm_similarity(R1, R2, Sim) :-
  length(R1, L1), length(R2, L2),
  ( L1 =:= 0 ; L2 =:= 0 -> Sim is 0
  ; rhythm_match_count(R1, R2, 0, Count),
    MaxLen is max(L1, L2),
    Sim is (Count / MaxLen) * 100
  ).

common_prefix_length([], _, 0).
common_prefix_length(_, [], 0).
common_prefix_length([X|Xs], [Y|Ys], Len) :-
  ( X =:= Y ->
      common_prefix_length(Xs, Ys, Rest),
      Len is Rest + 1
  ; Len is 0
  ).

rhythm_match_count([], _, Acc, Acc).
rhythm_match_count(_, [], Acc, Acc).
rhythm_match_count([D1|R1], [D2|R2], Acc, Count) :-
  Tolerance is D1 * 0.2,
  ( abs(D1 - D2) =< Tolerance ->
      Acc1 is Acc + 1
  ; Acc1 is Acc
  ),
  rhythm_match_count(R1, R2, Acc1, Count).

%% ============================================================================
%% WINDOWED TONALITY (C243-C246)
%% ============================================================================

%% segment_key(+SegmentEvents, +Model, -Key, -Confidence)
segment_key(Events, ks_profile, Key, Confidence) :-
  events_to_pcs(Events, PCs),
  pc_profile_from_pcs(PCs, Profile),
  ks_best_key(Profile, Key, _Mode),
  % Calculate confidence from score spread
  Confidence is 70.  % Placeholder

segment_key(Events, dft_phase, Key, Confidence) :-
  events_to_pcs(Events, PCs),
  pc_profile_from_pcs(PCs, Profile),
  dft_phase_key(Profile, Key, Confidence).

events_to_pcs([], []).
events_to_pcs([evt(_, _, Pitch)|Rest], [PC|PCs]) :-
  PC is Pitch mod 12,
  events_to_pcs(Rest, PCs).

%% detect_modulations(+Segments, -Modulations)
%% Returns list of modulation(Position, FromKey, ToKey)
detect_modulations(Segments, Modulations) :-
  detect_modulations_(Segments, 1, none, Modulations).

detect_modulations_([], _, _, []).
detect_modulations_([Seg|Rest], Pos, PrevKey, Mods) :-
  segment_key(Seg, ks_profile, Key, _),
  NextPos is Pos + 1,
  ( PrevKey \= none, PrevKey \= Key ->
      Mods = [modulation(Pos, PrevKey, Key)|MoreMods],
      detect_modulations_(Rest, NextPos, Key, MoreMods)
  ; detect_modulations_(Rest, NextPos, Key, Mods)
  ).

%% ============================================================================
%% WEIGHTED PITCH-CLASS PROFILE (C134)
%% ============================================================================

%% pc_profile_weighted(+WeightedNotes, +WeightType, -Profile)
%% WeightedNotes = list of wn(Pitch, Duration, Velocity) terms
%% WeightType = duration | velocity | combined
%%
%% Instead of counting each note once, weights each pitch-class by
%% the specified metric. This gives more accurate key detection for
%% passages where long or loud notes are more harmonically significant.

pc_profile_weighted(WeightedNotes, WeightType, Profile) :-
  zero_profile(Acc),
  pc_profile_weighted_(WeightedNotes, WeightType, Acc, Profile).

pc_profile_weighted_([], _, Acc, Acc).
pc_profile_weighted_([wn(Pitch, Dur, Vel)|Rest], WeightType, Acc, Profile) :-
  PC is Pitch mod 12,
  weight_value(WeightType, Dur, Vel, W),
  add_weight_at(PC, W, Acc, Acc2),
  pc_profile_weighted_(Rest, WeightType, Acc2, Profile).

weight_value(duration, Dur, _, W) :- W is Dur / 480.  % quarter=1.0
weight_value(velocity, _, Vel, W) :- W is Vel / 127.
weight_value(combined, Dur, Vel, W) :- W is (Dur / 480) * (Vel / 127).

add_weight_at(0, W, [H|T], [H2|T]) :- H2 is H + W.
add_weight_at(N, W, [H|T], [H|T2]) :-
  N > 0,
  N1 is N - 1,
  add_weight_at(N1, W, T, T2).

%% ============================================================================
%% DFT BIN / PHASE PREDICATES (C144-C147)
%% ============================================================================

%% dft_bin(+Profile, +K, -Complex, -Magnitude)
%% Compute the K-th DFT bin of a normalized 12-bin profile.
%% Returns both the complex value and its magnitude.
dft_bin(Profile, K, c(Re, Im), Magnitude) :-
  pc_profile_norm(Profile, Norm),
  dft_bin_(0, K, Norm, c(0.0, 0.0), c(Re, Im)),
  Magnitude is sqrt(Re * Re + Im * Im).

dft_bin_(_, _, [], Acc, Acc).
dft_bin_(N, K, [X|Xs], c(Re0, Im0), Result) :-
  Angle is -2 * 3.14159265358979 * K * N / 12,
  CosA is cos(Angle),
  SinA is sin(Angle),
  Re1 is Re0 + X * CosA,
  Im1 is Im0 + X * SinA,
  N1 is N + 1,
  dft_bin_(N1, K, Xs, c(Re1, Im1), Result).

%% dft_phase_bin(+Profile, +K, -PhaseRadians)
%% Extract the phase angle of the K-th DFT bin.
%% Uses atan2(Im, Re); returns radians in (-π, π].
dft_phase_bin(Profile, K, Phase) :-
  dft_bin(Profile, K, c(Re, Im), _),
  Phase is atan2(Im, Re).

%% tonality_by_phase(+Profile, +K, -TonicPC)
%% Map the phase of bin K to the nearest pitch class (0-11).
%% For K=1, the phase encodes the "center of gravity" on the chroma circle.
tonality_by_phase(Profile, K, TonicPC) :-
  dft_phase_bin(Profile, K, Phase),
  %% Phase of 0 → C (pc 0), each step = -π/6
  %% Map phase → PC: pc = round(-phase * 6 / π) mod 12
  PC0 is round(-Phase * 6 / 3.14159265358979),
  TonicPC is ((PC0 mod 12) + 12) mod 12.

%% tonality_by_phase(+Profile, +K, +ModeBias, -TonicPC)
%% With mode bias: adjust phase interpretation.
%% ModeBias = major | minor | none
%% Major keys shift tonic estimate slightly; minor keys shift the other way.
tonality_by_phase(Profile, K, none, TonicPC) :-
  tonality_by_phase(Profile, K, TonicPC).
tonality_by_phase(Profile, K, major, TonicPC) :-
  tonality_by_phase(Profile, K, RawPC),
  %% Major bias: no adjustment (major is the reference)
  TonicPC = RawPC.
tonality_by_phase(Profile, K, minor, TonicPC) :-
  tonality_by_phase(Profile, K, RawPC),
  %% Minor bias: relative minor is 3 semitones below major
  %% If signal is ambiguous, prefer the minor interpretation
  TonicPC is (RawPC + 3) mod 12.

%% dft_phase_key(+Profile, +KeyRoot, +Mode, -Confidence)
%% Extended version with mode discrimination (C149).
%% Uses both K=1 (tonal center) and K=5 (major/minor distinction).
dft_phase_key_with_mode(Profile, KeyRoot, Mode, Confidence) :-
  dft_bin(Profile, 1, _, Mag1),
  dft_bin(Profile, 5, c(Re5, Im5), Mag5),
  tonality_by_phase(Profile, 1, KeyRoot),
  %% K=5 bin phase discriminates major vs minor:
  %% Major keys have K=5 phase near 0; minor keys near π
  Phase5 is atan2(Im5, Re5),
  AbsPhase5 is abs(Phase5),
  ( AbsPhase5 < 1.5708 ->  % < π/2
      Mode = major
  ;   Mode = minor
  ),
  %% Confidence from magnitude of K=1 relative to profile energy
  profile_sum(Profile, Sum),
  ( Sum > 0 ->
      Confidence is min(100, (Mag1 / Sum) * 200)
  ;   Confidence is 0
  ).

%% ============================================================================
%% SPIRAL ARRAY BEST KEY (C166)
%% ============================================================================

%% spiral_best_key(+ChordSequence, -KeyRoot, -Mode)
%% Determine the best key for a chord sequence using Spiral Array distances.
%% ChordSequence = list of chord(Root, Quality) terms.
spiral_best_key(Chords, BestKeyRoot, BestMode) :-
  findall(Score-key(KeyRoot, Mode), (
    (Mode = major ; Mode = minor),
    key_scale_type(Mode, _),
    note(KeyRoot),
    \+ (KeyRoot = dflat ; KeyRoot = gflat ; KeyRoot = aflat),  % avoid duplicates
    spiral_key_fit_score(Chords, KeyRoot, Mode, Score)
  ), Scores),
  sort(0, @>=, Scores, [_BestScore-key(BestKeyRoot, BestMode)|_]).

spiral_key_fit_score(Chords, KeyRoot, Mode, Score) :-
  findall(D2, (
    member(chord(Root, Quality), Chords),
    spiral_chord_key_distance2(Root, Quality, KeyRoot, Mode, D2)
  ), Distances),
  sum_list(Distances, TotalDist),
  length(Distances, N),
  ( N > 0 ->
      AvgDist is TotalDist / N,
      Score is 1 / (1 + AvgDist)  % inverse distance as fit score
  ;   Score is 0
  ).

sum_list([], 0).
sum_list([X|Xs], S) :- sum_list(Xs, S0), S is S0 + X.

%% spiral_best_voicing(+ChordRoot, +ChordQuality, +KeyRoot, +Mode, -VoicingStrategy)
%% Recommend voicing strategy based on spiral tension (C167).
%% High tension chords get close voicing; low tension gets open voicing.
spiral_best_voicing(ChordRoot, ChordQuality, KeyRoot, Mode, VoicingStrategy) :-
  tonal_tension(ChordRoot, ChordQuality, KeyRoot, Mode, Tension, _),
  ( Tension < 0.3 ->
      VoicingStrategy = open_voicing
  ; Tension < 0.7 ->
      VoicingStrategy = medium_voicing
  ;   VoicingStrategy = close_voicing
  ).

%% ============================================================================
%% GTTM EVENT REPRESENTATION (C171)
%% ============================================================================

%% Canonical GTTM event: note(Start, Duration, Pitch, Velocity, Articulation)
%% where Start/Duration are in ticks, Pitch is MIDI, Velocity 0-127,
%% Articulation is an atom (legato, staccato, normal, accent).
%% The simpler evt/3 is an abbreviation for backward compatibility.

evt_from_note(note(S, D, P, _, _), evt(S, D, P)).
note_velocity(note(_, _, _, V, _), V).
note_articulation(note(_, _, _, _, A), A).

%% Convert between representations
notes_to_evts([], []).
notes_to_evts([Note|Notes], [Evt|Evts]) :-
  evt_from_note(Note, Evt),
  notes_to_evts(Notes, Evts).

%% ============================================================================
%% GTTM BOUNDARY CUES (C173-C177)
%% ============================================================================

%% gttm_boundary_cue(+CueName, +PrevEvt, +CurrEvt, +NextEvt, -Strength)
%% Individual boundary cues, each returning a 0-1 strength.

%% C174: Temporal proximity — large IOI gap after current event
gttm_boundary_cue(temporal_gap, _Prev, Curr, Next, Strength) :-
  ioi(Curr, Next, Gap),
  Strength is min(1.0, Gap / 960).

%% C175: Registral proximity — large pitch leap after current event
gttm_boundary_cue(registral_leap, _Prev, Curr, Next, Strength) :-
  pitch_leap(Curr, Next, Leap),
  Strength is min(1.0, Leap / 12).

%% C176: Durational accent — current event is significantly longer than context
gttm_boundary_cue(durational_accent, Prev, Curr, Next, Strength) :-
  Curr = evt(_, DurCurr, _),
  Prev = evt(_, DurPrev, _),
  Next = evt(_, DurNext, _),
  AvgContext is (DurPrev + DurNext) / 2,
  ( AvgContext > 0 ->
      Ratio is DurCurr / AvgContext,
      Strength is min(1.0, max(0, (Ratio - 1) / 2))
  ;   Strength is 0
  ).

%% C177: Surface change — change in velocity or articulation
%% (Uses velocity difference as proxy; articulation requires note/5 form)
gttm_boundary_cue(surface_change, Prev, _Curr, Next, Strength) :-
  %% Compare velocity between prev and next (using pitch as proxy in evt/3)
  %% With note/5 form, this would compare velocity and articulation
  evt_pitch(Prev, P1),
  evt_pitch(Next, P2),
  %% Directional change as a surface discontinuity signal
  ( (P2 > P1) -> Strength is 0.1
  ; (P2 < P1) -> Strength is 0.1
  ;              Strength is 0.0
  ).

%% Richer surface change for note/5 form
gttm_boundary_cue_rich(surface_change, note(_, _, _, V1, A1), _, note(_, _, _, V2, A2), Strength) :-
  VelDiff is abs(V2 - V1) / 127,
  ( A1 \= A2 -> ArtChange is 0.3 ; ArtChange is 0.0 ),
  Strength is min(1.0, VelDiff + ArtChange).

%% gttm_boundary_score_detailed(+Prev, +Curr, +Next, -Score, -CueBreakdown)
%% Returns both the score and the contribution of each cue (C180 extension).
gttm_boundary_score_detailed(Prev, Curr, Next, Score, CueBreakdown) :-
  findall(cue(Name, Strength, Weight), (
    cue_weight(Name, Weight),
    gttm_boundary_cue(Name, Prev, Curr, Next, Strength)
  ), Cues),
  foldl(accumulate_cue, Cues, 0, Score),
  CueBreakdown = Cues.

cue_weight(temporal_gap, 0.50).
cue_weight(registral_leap, 0.25).
cue_weight(durational_accent, 0.15).
cue_weight(surface_change, 0.10).

accumulate_cue(cue(_, Strength, Weight), Acc, Result) :-
  Result is Acc + Strength * Weight * 100.

%% ============================================================================
%% ACCENT MODEL: BASE (C182)
%% ============================================================================

%% accent_model_base(+Meter, +Position, -Strength)
%% Canonical "downbeat strong, secondary strong, others weak" model.
%% This is the simplest possible accent model, usable as a default.
accent_model_base(meter(N, D), Pos, Strength) :-
  metrical_strength(meter(N, D), Pos, Strength), !.
accent_model_base(meter(N, _), Pos, Strength) :-
  %% Fallback for meters not explicitly listed
  ( Pos =:= 1 -> Strength is 1.0
  ; 0 =:= (Pos - 1) mod 2 -> Strength is 0.5
  ;                           Strength is 0.3
  ),
  Pos >= 1, Pos =< N.

%% ============================================================================
%% PHASE AMBIGUITY DETECTION (C153)
%% ============================================================================

%% phase_ambiguity(+Profile, -AmbiguityLevel, -CompetingCenters)
%% Detects whether the tonal center is ambiguous by examining
%% the DFT k=1 magnitude relative to total energy.
phase_ambiguity(Profile, AmbiguityLevel, CompetingCenters) :-
  dft_bin(Profile, 1, _, Mag1),
  profile_sum(Profile, Sum),
  ( Sum > 0 ->
      Clarity is Mag1 / Sum
  ;   Clarity is 0
  ),
  ( Clarity > 0.3 ->
      AmbiguityLevel = low,
      tonality_by_phase(Profile, 1, PC),
      CompetingCenters = [PC]
  ; Clarity > 0.15 ->
      AmbiguityLevel = moderate,
      %% Find top 2 phase-aligned PCs
      tonality_by_phase(Profile, 1, PC1),
      PC2 is (PC1 + 3) mod 12,  % relative minor/major
      CompetingCenters = [PC1, PC2]
  ;   AmbiguityLevel = high,
      CompetingCenters = []  % too ambiguous to pick
  ).

%% ============================================================================
%% GTTM BOUNDARY CONFIDENCE (C222-C223)
%% ============================================================================

%% gttm_boundary_confidence(+Prev, +Curr, +Next, -Confidence)
%% Phrase boundary confidence 0-100 from multiple GTTM cues.
gttm_boundary_confidence(Prev, Curr, Next, Confidence) :-
  gttm_boundary_score_detailed(Prev, Curr, Next, Score, _),
  Confidence is min(100, max(0, Score)).

%% ============================================================================
%% PIVOT CHORD SEARCH (C247-C248)
%% ============================================================================

%% pivot_chord(+KeyA, +ModeA, +KeyB, +ModeB, -PivotChord, -Score, -Reasons)
%% Find chords that function well in both keys (pivot for modulation).
pivot_chord(KeyA, ModeA, KeyB, ModeB, chord(Root, Quality), Score, Reasons) :-
  key_scale_type(ModeA, ScaleA),
  key_scale_type(ModeB, ScaleB),
  scale_notes(KeyA, ScaleA, NotesA),
  scale_notes(KeyB, ScaleB, NotesB),
  %% Find roots common to both scales
  member(Root, NotesA),
  member(Root, NotesB),
  %% Try common chord qualities
  member(Quality, [major, minor]),
  chord_tones(Root, Quality, Tones),
  %% Check how many chord tones are in both keys
  count_in_scale(Tones, NotesA, CountA),
  count_in_scale(Tones, NotesB, CountB),
  length(Tones, NumTones),
  CountA =:= NumTones,
  CountB =:= NumTones,
  %% Score based on spiral proximity to both keys
  spiral_chord_key_distance2(Root, Quality, KeyA, ModeA, DA),
  spiral_chord_key_distance2(Root, Quality, KeyB, ModeB, DB),
  Score is 1 / (1 + DA + DB),
  format(atom(R1), 'Chord ~w ~w fits both ~w ~w and ~w ~w',
    [Root, Quality, KeyA, ModeA, KeyB, ModeB]),
  format(atom(R2), 'Spiral distances: ~2f to key A, ~2f to key B', [DA, DB]),
  Reasons = [R1, R2].

count_in_scale([], _, 0).
count_in_scale([Note|Rest], ScaleNotes, Count) :-
  count_in_scale(Rest, ScaleNotes, RestCount),
  ( member(Note, ScaleNotes) -> Count is RestCount + 1 ; Count is RestCount ).

%% ============================================================================
%% CADENCE STRENGTH (C256-C257)
%% ============================================================================

%% cadence_strength(+CadenceType, +Spec, -Strength0to100)
%% How conclusive is this cadence type in the given musical context?
cadence_strength(perfect_authentic, _, 100).
cadence_strength(authentic, _, 85).
cadence_strength(imperfect_authentic, _, 70).
cadence_strength(half, _, 50).
cadence_strength(plagal, _, 60).
cadence_strength(deceptive, _, 40).
cadence_strength(unknown, _, 10).

%% Culture-adjusted cadence strength
cadence_strength_culture(CadenceType, music_spec(_, _, _, _, _, Culture, _), Strength) :-
  cadence_strength(CadenceType, _, BaseStrength),
  ( Culture = carnatic ->
      %% Carnatic music doesn't use Western cadences the same way
      Strength is BaseStrength * 0.3
  ; Culture = celtic ->
      %% Celtic modal cadences are weaker in Western sense
      ( CadenceType = authentic -> Strength is BaseStrength * 0.7
      ; Strength is BaseStrength
      )
  ; Culture = chinese ->
      %% Pentatonic cadences differ fundamentally
      Strength is BaseStrength * 0.2
  ; Strength is BaseStrength
  ).

%% ============================================================================
%% TONAL DRIFT (C220-C221)
%% ============================================================================

%% tonal_drift(+Profiles, -DriftScore, -Reasons)
%% Measure how much the tonal center shifts across a sequence of profiles.
%% Profiles = list of 12-bin PCPs (one per time window).
tonal_drift(Profiles, DriftScore, Reasons) :-
  maplist(profile_to_key, Profiles, Keys),
  key_drift_score(Keys, DriftScore),
  format(atom(R), 'Tonal drift score: ~2f across ~w windows', [DriftScore, Len]),
  length(Profiles, Len),
  Reasons = [R].

profile_to_key(Profile, Key) :-
  ks_best_key(Profile, Key, _).

key_drift_score([], 0).
key_drift_score([_], 0).
key_drift_score([K1, K2|Rest], Score) :-
  Diff is min(abs(K2 - K1), 12 - abs(K2 - K1)),
  key_drift_score([K2|Rest], RestScore),
  Score is RestScore + Diff.

%% ============================================================================
%% SCHEMA FINGERPRINT (C233-C234)
%% ============================================================================

%% schema_fingerprint(+Schema, -Fingerprint)
%% Fingerprint = fp(BassDegrees, UpperDegrees, CadenceType)
schema_fingerprint(Schema, fp(Bass, Upper, Cadence)) :-
  galant_schema(Schema),
  schema_pattern(Schema, bass, pat(Bass, _, _)),
  schema_pattern(Schema, upper, pat(_, Upper, _)),
  ( schema_cadence(Schema, Cadence) -> true ; Cadence = unknown ).
%% Fallback: use role degrees directly
schema_fingerprint(Schema, fp(Bass, Upper, unknown)) :-
  galant_schema(Schema),
  schema_role(Schema, bass, Bass),
  schema_role(Schema, upper, Upper),
  \+ schema_pattern(Schema, bass, _).

%% schema_similarity(+SchemaA, +SchemaB, -Score)
%% Score 0-100 measuring overlap of fingerprints.
schema_similarity(A, B, Score) :-
  schema_fingerprint(A, fp(BassA, UpperA, CadA)),
  schema_fingerprint(B, fp(BassB, UpperB, CadB)),
  list_overlap(BassA, BassB, BassScore),
  list_overlap(UpperA, UpperB, UpperScore),
  ( CadA = CadB -> CadScore is 20 ; CadScore is 0 ),
  Score is BassScore * 40 + UpperScore * 40 + CadScore.

list_overlap([], _, 0).
list_overlap(_, [], 0).
list_overlap(A, B, Score) :-
  A \= [], B \= [],
  intersection(A, B, Common),
  length(Common, NC),
  length(A, NA),
  length(B, NB),
  MaxLen is max(NA, NB),
  ( MaxLen > 0 -> Score is NC / MaxLen ; Score is 0 ).

%% ============================================================================
%% RAGA FINGERPRINT (C235-C236)
%% ============================================================================

%% raga_fingerprint(+Raga, -Fingerprint)
%% Fingerprint = rfp(PitchClasses, Emphasis, Direction)
raga_fingerprint(Raga, rfp(PCs, Emphasis, Direction)) :-
  raga_pcs(Raga, PCs),
  findall(S-W, raga_emphasis(Raga, S, W), Emphasis),
  ( raga_arohana(Raga, Aro), raga_avarohana(Raga, Ava) ->
      ( Aro = Ava -> Direction = symmetric ; Direction = asymmetric )
  ; Direction = unknown
  ).

%% raga_similarity(+RagaA, +RagaB, -Score)
%% Score 0-100 based on pitch class overlap and emphasis similarity.
raga_similarity(A, B, Score) :-
  raga_pcs(A, PcsA),
  raga_pcs(B, PcsB),
  intersection(PcsA, PcsB, Common),
  length(Common, NC),
  length(PcsA, NA),
  length(PcsB, NB),
  MaxLen is max(NA, NB),
  ( MaxLen > 0 -> PcScore is (NC / MaxLen) * 70 ; PcScore is 0 ),
  %% Emphasis overlap
  findall(S, (raga_emphasis(A, S, WA), WA >= 0.5, raga_emphasis(B, S, WB), WB >= 0.5), SharedEmph),
  length(SharedEmph, NE),
  EmphScore is min(30, NE * 10),
  Score is PcScore + EmphScore.

%% ============================================================================
%% MODE FINGERPRINT (C237-C238)
%% ============================================================================

%% mode_fingerprint(+Mode, -Fingerprint)
%% Fingerprint = mfp(Intervals, LeadingTone)
mode_fingerprint(Mode, mfp(Intervals, LeadingTone)) :-
  mode_intervals(Mode, Intervals),
  ( member(1, Intervals) -> LeadingTone = yes ; LeadingTone = no ).

%% mode_similarity(+ModeA, +ModeB, -Score)
%% Score 0-100 based on shared intervals and leading-tone behavior.
mode_similarity(A, B, Score) :-
  mode_fingerprint(A, mfp(IntA, LtA)),
  mode_fingerprint(B, mfp(IntB, LtB)),
  intersection(IntA, IntB, Common),
  length(Common, NC),
  length(IntA, NA),
  ( NA > 0 -> IntScore is (NC / NA) * 80 ; IntScore is 0 ),
  ( LtA = LtB -> LtScore is 20 ; LtScore is 0 ),
  Score is IntScore + LtScore.

%% mode_intervals/2 - semitone intervals for standard modes
mode_intervals(major, [2, 2, 1, 2, 2, 2, 1]).
mode_intervals(natural_minor, [2, 1, 2, 2, 1, 2, 2]).
mode_intervals(harmonic_minor, [2, 1, 2, 2, 1, 3, 1]).
mode_intervals(melodic_minor, [2, 1, 2, 2, 2, 2, 1]).
mode_intervals(dorian, [2, 1, 2, 2, 2, 1, 2]).
mode_intervals(phrygian, [1, 2, 2, 2, 1, 2, 2]).
mode_intervals(lydian, [2, 2, 2, 1, 2, 2, 1]).
mode_intervals(mixolydian, [2, 2, 1, 2, 2, 1, 2]).
mode_intervals(locrian, [1, 2, 2, 1, 2, 2, 2]).
mode_intervals(whole_tone, [2, 2, 2, 2, 2, 2]).

%% ============================================================================
%% TONAL CENTROID (C239-C241)
%% ============================================================================

%% tonal_centroid(+Profile, -Centroid)
%% 6D centroid from DFT bins K=1,2,3 (Re+Im for each).
%% Centroid = centroid(R1,I1,R2,I2,R3,I3)
tonal_centroid(Profile, centroid(R1,I1,R2,I2,R3,I3)) :-
  dft_bin(Profile, 1, c(R1, I1), _),
  dft_bin(Profile, 2, c(R2, I2), _),
  dft_bin(Profile, 3, c(R3, I3), _).

%% centroid_distance(+CentroidA, +CentroidB, -Distance)
%% Euclidean distance in 6D centroid space.
centroid_distance(
  centroid(R1a,I1a,R2a,I2a,R3a,I3a),
  centroid(R1b,I1b,R2b,I2b,R3b,I3b),
  Distance
) :-
  D1 is (R1a - R1b) ** 2 + (I1a - I1b) ** 2,
  D2 is (R2a - R2b) ** 2 + (I2a - I2b) ** 2,
  D3 is (R3a - R3b) ** 2 + (I3a - I3b) ** 2,
  Distance is sqrt(D1 + D2 + D3).

%% ============================================================================
%% SEGMENT KEY DETECTION (C244)
%% ============================================================================

%% segment_key(+SegmentEvents, +Model, -Key, -Confidence)
%% Detect key for a segment of events using specified model.
segment_key(Events, ks_profile, Key, Confidence) :-
  pc_profile(Events, Profile),
  ks_best_key(Profile, Key, _),
  ks_key_score(Profile, Key, _, RawScore),
  Confidence is min(100, max(0, RawScore)).

segment_key(Events, dft_phase, Key, Confidence) :-
  pc_profile(Events, Profile),
  dft_phase_key(Profile, Key, Conf0),
  Confidence is min(100, max(0, Conf0 * 100)).

segment_key(Events, spiral_array, Key, Confidence) :-
  pc_profile(Events, Profile),
  ks_best_key(Profile, Key, _),  %% spiral_best_key uses chords, fallback to KS
  Confidence is 60.  %% Lower confidence for fallback

%% ============================================================================
%% MOTIF LABEL AND OCCURRENCE (C230)
%% ============================================================================

:- dynamic(motif_label/2).  %% motif_label(Fingerprint, Label)

%% motif_occurs(+Events, +Library, -Label, -Position)
%% Search for known motifs in a sequence of events.
motif_occurs(Events, Library, Label, Position) :-
  member(motif(Label, RefFingerprint), Library),
  subsequence_at(Events, SubSeq, Position),
  motif_fingerprint(SubSeq, TestFP),
  motif_similarity(RefFingerprint, TestFP, Score),
  Score >= 70.

%% subsequence_at(+List, -SubList, -StartIndex)
%% Extract a subsequence with its starting position (1-based).
subsequence_at(List, Sub, Pos) :-
  append(Prefix, Rest, List),
  length(Prefix, PrefLen),
  Pos is PrefLen + 1,
  append(Sub, _, Rest),
  Sub \= [],
  length(Sub, SubLen),
  SubLen >= 3,
  SubLen =< 12.

%% ============================================================================
%% COMPARE TONALITY MODELS (C213-C214)
%% ============================================================================

%% compare_tonality_models(+Profile, -Results)
%% Results = list of model_result(Model, Key, Confidence)
compare_tonality_models(Profile, Results) :-
  %% KS model
  ( ks_best_key(Profile, KsKey, KsMode) ->
      ks_key_score(Profile, KsKey, KsMode, KsRaw),
      KsConf is min(100, max(0, KsRaw))
  ; KsKey = unknown, KsConf = 0
  ),
  %% DFT model
  ( dft_phase_key(Profile, DftKey, DftConf0) ->
      DftConf is min(100, max(0, DftConf0 * 100))
  ; DftKey = unknown, DftConf = 0
  ),
  Results = [
    model_result(ks_profile, KsKey, KsConf),
    model_result(dft_phase, DftKey, DftConf)
  ].