%% music-theory-jazz.pl - Jazz Theory Knowledge Base for CardPlay AI
%%
%% Provides jazz theory predicates for:
%% - Lydian Chromatic Concept (C1101-C1130)
%% - Jazz voicing foundations (C1201-C1240)
%% - Jazz reharmonization basics (C1311-C1350)
%%
%% Depends on: music-theory.pl, music-spec.pl

%% ============================================================================
%% LYDIAN CHROMATIC CONCEPT — CORE (C1101-C1130)
%% ============================================================================

%% lydian_tonic(+Root, -LydianScale)
%% The Lydian scale from a given root — Russell's primary consonant scale. (C1102)
lydian_tonic(Root, Scale) :-
  note_index(Root, I),
  LydianIntervals = [0, 2, 4, 6, 7, 9, 11],
  maplist(offset_pc(I), LydianIntervals, PCs),
  maplist(pc_to_note_name, PCs, Scale).

offset_pc(Base, Interval, PC) :-
  PC is (Base + Interval) mod 12.

pc_to_note_name(0, c). pc_to_note_name(1, csharp). pc_to_note_name(2, d).
pc_to_note_name(3, eflat). pc_to_note_name(4, e). pc_to_note_name(5, f).
pc_to_note_name(6, fsharp). pc_to_note_name(7, g). pc_to_note_name(8, gsharp).
pc_to_note_name(9, a). pc_to_note_name(10, bflat). pc_to_note_name(11, b).

%% lydian_chromatic_order(+Root, -OrderedPCs)
%% All 12 tones ordered by tonal gravity from Lydian tonic. (C1103-C1104)
%% Order: Lydian scale tones first, then remaining chromatic tones by fifths distance.
lydian_chromatic_order(Root, Order) :-
  note_index(Root, I),
  %% Lydian scale degrees first (most consonant)
  LydianOffsets = [0, 7, 2, 9, 4, 11, 6],
  %% Remaining 5 chromatic tones ordered by descending gravity
  ChromaticOffsets = [1, 8, 3, 10, 5],
  append(LydianOffsets, ChromaticOffsets, AllOffsets),
  maplist(offset_pc(I), AllOffsets, Order).

%% tonal_gravity_level(+Note, +LydianRoot, -Level)
%% Level 1-12: how consonant is Note relative to LydianRoot's Lydian tonic? (C1105-C1106)
tonal_gravity_level(Note, LydianRoot, Level) :-
  note_index(Note, NI),
  lydian_chromatic_order(LydianRoot, Order),
  nth1(Level, Order, NI), !.
tonal_gravity_level(_, _, 12).  %% fallback

%% principal_scale(+ScaleName, -Intervals)
%% Russell's principal scales derived from Lydian. (C1107-C1108)
principal_scale(lydian, [0, 2, 4, 6, 7, 9, 11]).
principal_scale(lydian_augmented, [0, 2, 4, 6, 8, 9, 11]).
principal_scale(lydian_diminished, [0, 2, 3, 6, 7, 9, 11]).
principal_scale(lydian_flat7, [0, 2, 4, 6, 7, 9, 10]).
principal_scale(auxiliary_augmented, [0, 2, 4, 6, 8, 10]).
principal_scale(auxiliary_diminished, [0, 1, 3, 4, 6, 7, 9, 10]).
principal_scale(auxiliary_diminished_blues, [0, 2, 3, 5, 6, 8, 9, 11]).

%% horizontal_scale(+ChordType, -ScaleName, -Intervals)
%% Scales for melodic (horizontal) motion over chord types. (C1109-C1110)
horizontal_scale(major7, lydian, [0, 2, 4, 6, 7, 9, 11]).
horizontal_scale(major7, ionian, [0, 2, 4, 5, 7, 9, 11]).
horizontal_scale(minor7, dorian, [0, 2, 3, 5, 7, 9, 10]).
horizontal_scale(minor7, aeolian, [0, 2, 3, 5, 7, 8, 10]).
horizontal_scale(dominant7, lydian_flat7, [0, 2, 4, 6, 7, 9, 10]).
horizontal_scale(dominant7, mixolydian, [0, 2, 4, 5, 7, 9, 10]).
horizontal_scale(min7b5, locrian_sharp2, [0, 2, 3, 5, 6, 8, 10]).
horizontal_scale(dim7, auxiliary_diminished, [0, 1, 3, 4, 6, 7, 9, 10]).
horizontal_scale(aug, auxiliary_augmented, [0, 2, 4, 6, 8, 10]).

%% vertical_scale(+ChordType, -ScaleName, -Intervals)
%% Scales for chord voicing and extensions. (C1111-C1112)
vertical_scale(major7, lydian, [0, 2, 4, 6, 7, 9, 11]).
vertical_scale(minor7, dorian, [0, 2, 3, 5, 7, 9, 10]).
vertical_scale(dominant7, lydian_flat7, [0, 2, 4, 6, 7, 9, 10]).
vertical_scale(min7b5, locrian_sharp2, [0, 2, 3, 5, 6, 8, 10]).
vertical_scale(aug_maj7, lydian_augmented, [0, 2, 4, 6, 8, 9, 11]).

%% chord_parent_scale(+Chord, -ParentScale, -Reasons)
%% Derive parent scale from chord (LCC: scale first, chord second). (C1113-C1114)
chord_parent_scale(chord(Root, major7), scale(Root, lydian), Reasons) :-
  format(atom(R), 'Maj7 from ~w: parent Lydian scale (highest gravity)', [Root]),
  Reasons = [because(R)].
chord_parent_scale(chord(Root, minor7), scale(LydianRoot, lydian), Reasons) :-
  note_index(Root, I),
  LydianI is (I + 10) mod 12,  % Dorian is 2nd mode of Lydian a whole step below
  note_index(LydianRoot, LydianI),
  format(atom(R), 'min7 from ~w: parent Lydian of ~w (Dorian relationship)', [Root, LydianRoot]),
  Reasons = [because(R)].
chord_parent_scale(chord(Root, dominant7), scale(LydianRoot, lydian), Reasons) :-
  note_index(Root, I),
  LydianI is (I + 5) mod 12,  % Lydian b7 is 4th mode of Lydian a 4th below
  note_index(LydianRoot, LydianI),
  format(atom(R), 'Dom7 from ~w: parent Lydian of ~w (Lydian b7)', [Root, LydianRoot]),
  Reasons = [because(R)].

%% lcc_pitch_order(+Tonic, +PC, -Order)
%% Position of pitch class in Lydian Chromatic order. (C1115-C1116)
lcc_pitch_order(Tonic, PC, Order) :-
  lydian_chromatic_order(Tonic, OrderList),
  nth1(Order, OrderList, PC), !.
lcc_pitch_order(_, _, 12).

%% gravity_direction(+Note, +LydianRoot, -Direction)
%% Ingoing (toward tonic) vs outgoing (away from tonic). (C1117-C1118)
gravity_direction(Note, LydianRoot, Direction) :-
  tonal_gravity_level(Note, LydianRoot, Level),
  ( Level =< 7 -> Direction = ingoing
  ; Direction = outgoing
  ).

%% lydian_degree(+Note, +LydianRoot, -Degree)
%% Map note to Lydian degree (I-VII or chromatic). (C1119-C1120)
lydian_degree(Note, LydianRoot, Degree) :-
  note_index(Note, NI),
  note_index(LydianRoot, RI),
  Interval is (NI - RI + 12) mod 12,
  lydian_degree_map(Interval, Degree).

lydian_degree_map(0, 'I').
lydian_degree_map(2, 'II').
lydian_degree_map(4, 'III').
lydian_degree_map(6, '#IV').
lydian_degree_map(7, 'V').
lydian_degree_map(9, 'VI').
lydian_degree_map(11, 'VII').
lydian_degree_map(1, 'bII').
lydian_degree_map(3, 'bIII').
lydian_degree_map(5, 'IV').
lydian_degree_map(8, 'bVI').
lydian_degree_map(10, 'bVII').

%% chord_scale_unity(+ChordSymbol, -Scale, -Voicing)
%% LCC: chord and scale as same entity. (C1121-C1122)
chord_scale_unity(major7, lydian, [0, 4, 7, 11, 2, 6]).
chord_scale_unity(minor7, dorian, [0, 3, 7, 10, 2, 9]).
chord_scale_unity(dominant7, lydian_flat7, [0, 4, 7, 10, 2, 6]).
chord_scale_unity(min7b5, locrian_sharp2, [0, 3, 6, 10, 2, 8]).
chord_scale_unity(dim7, auxiliary_diminished, [0, 3, 6, 9, 1, 4]).

%% modal_genre(+Scale, -Genre)
%% Modal genre categories per Russell. (C1123-C1124)
modal_genre(lydian, major).
modal_genre(ionian, major).
modal_genre(mixolydian, major).
modal_genre(dorian, minor).
modal_genre(aeolian, minor).
modal_genre(phrygian, minor).
modal_genre(lydian_augmented, augmented).
modal_genre(auxiliary_augmented, augmented).
modal_genre(lydian_diminished, diminished).
modal_genre(locrian, diminished).
modal_genre(auxiliary_diminished, diminished).

%% supra_vertical_extension(+Chord, +Extension, -GravityScore)
%% Score for extensions based on tonal gravity. (C1125-C1126)
supra_vertical_extension(major7, sharp11, 95).  % Lydian #11 = highest gravity
supra_vertical_extension(major7, natural9, 90).
supra_vertical_extension(major7, natural13, 85).
supra_vertical_extension(minor7, natural9, 90).
supra_vertical_extension(minor7, natural11, 85).
supra_vertical_extension(minor7, natural13, 80).
supra_vertical_extension(dominant7, sharp11, 90).
supra_vertical_extension(dominant7, natural9, 85).
supra_vertical_extension(dominant7, natural13, 80).
supra_vertical_extension(dominant7, flat9, 60).
supra_vertical_extension(dominant7, sharp9, 55).
supra_vertical_extension(dominant7, flat13, 50).

%% ============================================================================
%% JAZZ VOICING FOUNDATIONS (C1201-C1240)
%% ============================================================================

%% shell_voicing(+ChordType, -VoiceSet, -Inversion)
%% Root + 3rd + 7th (shell). (C1202-C1203)
shell_voicing(major7, [0, 4, 11], root_position).
shell_voicing(major7, [4, 11, 12], first_inversion).
shell_voicing(minor7, [0, 3, 10], root_position).
shell_voicing(minor7, [3, 10, 12], first_inversion).
shell_voicing(dominant7, [0, 4, 10], root_position).
shell_voicing(dominant7, [4, 10, 12], first_inversion).
shell_voicing(min7b5, [0, 3, 10], root_position).
shell_voicing(dim7, [0, 3, 9], root_position).

%% rootless_voicing(+ChordType, +Type, -Notes, -Register)
%% A voicing (3-7) and B voicing (7-3). (C1204-C1205)
rootless_voicing(major7, a, [4, 7, 9, 11], mid).      % 3-5-6-7
rootless_voicing(major7, b, [11, 14, 16, 18], mid).    % 7-9-#11-13
rootless_voicing(minor7, a, [3, 5, 7, 10], mid).       % 3-5-5-7
rootless_voicing(minor7, b, [10, 14, 15, 17], mid).    % 7-9-11-13
rootless_voicing(dominant7, a, [4, 6, 9, 10], mid).    % 3-#11-13-7
rootless_voicing(dominant7, b, [10, 14, 16, 18], mid). % 7-9-#11-13

%% drop_voicing(+CloseVoicing, +DropType, -OpenVoicing, -Span)
%% Drop 2: lower 2nd voice from top by octave. (C1206-C1207)
drop_voicing([V1, V2, V3, V4], drop2, [V3Low, V1, V2, V4], Span) :-
  V3Low is V3 - 12,
  Span is V4 - V3Low.
drop_voicing([V1, V2, V3, V4], drop3, [V2Low, V1, V3, V4], Span) :-
  V2Low is V2 - 12,
  Span is V4 - V2Low.
drop_voicing([V1, V2, V3, V4], drop2_4, [V3Low, V1Low, V2, V4], Span) :-
  V3Low is V3 - 12,
  V1Low is V1 - 12,
  Span is V4 - min(V3Low, V1Low).

%% spread_voicing(+ChordType, +Extensions, -Voicing, -RegisterSpan)
%% Open orchestral jazz texture. (C1208-C1209)
spread_voicing(major7, [9, 13], [0, 11, 16, 21, 28], 28).   % C-B-E-A-E
spread_voicing(minor7, [9, 11], [0, 10, 15, 19, 26], 26).   % C-Bb-Eb-G-D
spread_voicing(dominant7, [9, 13], [0, 10, 16, 21, 28], 28). % C-Bb-E-A-E

%% jazz_cluster_voicing(+ChordType, +Density, -Voicing, -Tensions)
%% Dense modern jazz texture. (C1210-C1211)
jazz_cluster_voicing(major7, dense, [0, 2, 4, 6, 7], ['9', '#11', '5']).
jazz_cluster_voicing(minor7, dense, [0, 2, 3, 5, 7], ['9', 'b3', '11', '5']).
jazz_cluster_voicing(dominant7, dense, [0, 2, 4, 6, 10], ['9', '3', '#11', 'b7']).

%% quartal_jazz_voicing(+ChordType, +QuartalStack, -Notes, -Reasons)
%% McCoy Tyner-style quartal voicings. (C1212-C1213)
quartal_jazz_voicing(minor7, 4, [0, 5, 10, 15], [because('4-note quartal stack for modal minor')]).
quartal_jazz_voicing(dominant7sus, 4, [0, 5, 10, 15], [because('Quartal sus voicing')]).
quartal_jazz_voicing(major7, 3, [6, 11, 16], [because('3-note quartal from #11')]).

%% so_what_voicing(+Root, +Quality, -Notes)
%% The "So What" chord: 3 fourths + major third. (C1214-C1215)
so_what_voicing(Root, minor, Notes) :-
  note_index(Root, I),
  N1 is I, N2 is I + 5, N3 is I + 10, N4 is I + 15, N5 is I + 19,
  Notes = [N1, N2, N3, N4, N5].

%% voice_leading_score(+Voicing1, +Voicing2, -Score, -Moves)
%% Score voice leading between two voicings (lower = smoother). (C1228-C1229)
voice_leading_score(V1, V2, Score, Moves) :-
  maplist(voice_move, V1, V2, Moves),
  sumlist(Moves, Score).

voice_move(N1, N2, Move) :-
  Move is abs(N2 - N1).

%% common_tones(+Chord1PCs, +Chord2PCs, -SharedNotes)
%% Find shared pitch classes. (C1230-C1231)
common_tones(PCs1, PCs2, Shared) :-
  intersection(PCs1, PCs2, Shared).

%% smooth_voice_leading(+Progression, -Voicings, -TotalMotion, -Reasons)
%% Optimize voice leading across a progression. (C1232-C1233)
smooth_voice_leading([], [], 0, [because('Empty progression')]).
smooth_voice_leading([_], [default], 0, [because('Single chord, no motion')]).
smooth_voice_leading([C1, C2|Rest], [V1, V2|VRest], TotalMotion, Reasons) :-
  shell_voicing(C1, V1, root_position),
  shell_voicing(C2, V2, _),
  voice_leading_score(V1, V2, Motion, _),
  smooth_voice_leading([C2|Rest], [V2|VRest], RestMotion, _),
  TotalMotion is Motion + RestMotion,
  format(atom(R), 'Total voice leading motion: ~w semitones', [TotalMotion]),
  Reasons = [because(R)].

%% ============================================================================
%% JAZZ REHARMONIZATION BASICS (C1311-C1350)
%% ============================================================================

%% tritone_sub(+OriginalChord, -SubChord, -Reasons)
%% Tritone substitution: replace dominant with dominant a tritone away. (C1312-C1313)
tritone_sub(chord(Root, dominant7), chord(SubRoot, dominant7), Reasons) :-
  note_index(Root, I),
  SubI is (I + 6) mod 12,
  note_index(SubRoot, SubI),
  format(atom(R), 'Tritone sub: ~w7 → ~w7 (shared 3rd/7th)', [Root, SubRoot]),
  Reasons = [because(R)].

%% secondary_dominant(+TargetChord, -SecDom, -Resolution, -Reasons)
%% V/x approach. (C1318-C1319)
secondary_dominant(chord(Target, _Quality), chord(DomRoot, dominant7), Target, Reasons) :-
  note_index(Target, TI),
  DomI is (TI + 7) mod 12,  % V is a fifth above
  note_index(DomRoot, DomI),
  format(atom(R), 'Secondary dominant: V/~w = ~w7', [Target, DomRoot]),
  Reasons = [because(R)].

%% related_ii(+TargetChord, -RelatedII, -FullApproach)
%% ii-V approach to target. (C1320-C1321)
related_ii(chord(Target, _Quality), chord(IIRoot, minor7), [chord(IIRoot, minor7), chord(VRoot, dominant7)]) :-
  note_index(Target, TI),
  VIndex is (TI + 7) mod 12,
  IIIndex is (TI + 2) mod 12,
  note_index(VRoot, VIndex),
  note_index(IIRoot, IIIndex).

%% backdoor_dominant(+TargetChord, -Backdoor, -Reasons)
%% bVII7 resolving to I. (C1322-C1323)
backdoor_dominant(chord(Target, major7), chord(BackdoorRoot, dominant7), Reasons) :-
  note_index(Target, TI),
  BDI is (TI + 10) mod 12,
  note_index(BackdoorRoot, BDI),
  format(atom(R), 'Backdoor dominant: bVII7 (~w7) → I (~w)', [BackdoorRoot, Target]),
  Reasons = [because(R)].

%% chromatic_approach(+TargetChord, -ApproachChord, -Direction, -Reasons)
%% Chromatic approach from above or below. (C1316-C1317)
chromatic_approach(chord(Target, Quality), chord(AboveRoot, Quality), above, Reasons) :-
  note_index(Target, TI),
  AboveI is (TI + 1) mod 12,
  note_index(AboveRoot, AboveI),
  format(atom(R), 'Chromatic approach from above: ~w → ~w', [AboveRoot, Target]),
  Reasons = [because(R)].
chromatic_approach(chord(Target, Quality), chord(BelowRoot, Quality), below, Reasons) :-
  note_index(Target, TI),
  BelowI is (TI + 11) mod 12,
  note_index(BelowRoot, BelowI),
  format(atom(R), 'Chromatic approach from below: ~w → ~w', [BelowRoot, Target]),
  Reasons = [because(R)].

%% passing_diminished(+Chord1Root, +Chord2Root, -PassingDim, -VoiceLeading)
%% Insert passing diminished chord. (C1314-C1315)
passing_diminished(Root1, Root2, chord(DimRoot, dim7), chromatic_bass) :-
  note_index(Root1, I1),
  note_index(Root2, I2),
  Diff is abs(I2 - I1),
  Diff =:= 2,  % Whole step apart
  DimI is (I1 + 1) mod 12,
  note_index(DimRoot, DimI).

%% ============================================================================
%% LCC CONSTRAINT PACK (C1176-C1178)
%% ============================================================================

constraint_pack(lcc_modal_jazz, [
  style(jazz),
  culture(western),
  tonality_model(lcc_gravity)
]).

constraint_pack(lcc_bebop, [
  style(jazz),
  culture(western),
  tonality_model(lcc_gravity),
  harmonic_rhythm(2)
]).

constraint_pack(lcc_fusion, [
  style(jazz),
  culture(western),
  tonality_model(lcc_gravity),
  phrase_density(medium)
]).

%% ============================================================================
%% LCC QUERY WRAPPERS (Prolog-side) (C1179-C1181)
%% ============================================================================

%% recommend_lcc_scale(+Chord, -Scale, -GravityFit, -Reasons)
recommend_lcc_scale(chord(Root, ChordType), scale(Root, ScaleName), GravityFit, Reasons) :-
  horizontal_scale(ChordType, ScaleName, _Intervals),
  ( ScaleName = lydian -> GravityFit is 100
  ; ScaleName = lydian_flat7 -> GravityFit is 95
  ; ScaleName = dorian -> GravityFit is 90
  ; GravityFit is 70
  ),
  format(atom(R), 'LCC scale ~w for ~w ~w (gravity fit ~w)',
    [ScaleName, Root, ChordType, GravityFit]),
  Reasons = [because(R)].

%% recommend_lcc_voicing(+Chord, +Context, -Voicing, -Reasons)
recommend_lcc_voicing(chord(_, ChordType), comping, Voicing, Reasons) :-
  rootless_voicing(ChordType, a, Voicing, _),
  Reasons = [because('LCC Type A rootless voicing for comping')].
recommend_lcc_voicing(chord(_, ChordType), solo, Voicing, Reasons) :-
  shell_voicing(ChordType, Voicing, root_position),
  Reasons = [because('LCC shell voicing for solo accompaniment')].
recommend_lcc_voicing(chord(_, minor7), modal, Voicing, Reasons) :-
  quartal_jazz_voicing(minor7, 4, Voicing, _),
  Reasons = [because('LCC quartal voicing for modal context')].

%% analyze_melody_gravity(+Notes, +LydianRoot, -GravityProfile)
%% Analyze a melody's tonal gravity relative to a Lydian tonic. (C1184-C1185)
analyze_melody_gravity(Notes, LydianRoot, GravityProfile) :-
  maplist(note_gravity(LydianRoot), Notes, GravityProfile).

note_gravity(LydianRoot, Note, gravity(Note, Level, Direction)) :-
  tonal_gravity_level(Note, LydianRoot, Level),
  gravity_direction(Note, LydianRoot, Direction).

%% ============================================================================
%% REHARMONIZATION STRENGTH & MELODY COMPATIBILITY (C1337-C1339)
%% ============================================================================

%% sub_strength(+Original, +Substitution, -Strength, -Compatibility)
%% Rate how strong a reharmonization substitution is (1-10 scale). (C1337)
sub_strength(Original, Substitution, Strength, Compatibility) :-
  sub_strength_score(Original, Substitution, Strength),
  sub_compatibility(Original, Substitution, Compatibility).

%% Tritone sub: very strong, shares guide tones
sub_strength_score(chord(_, dominant7), chord(_, dominant7), 9) :- !.
%% Secondary dominant: strong
sub_strength_score(chord(_, dominant7), chord(_, major7), 7) :- !.
sub_strength_score(chord(_, major7), chord(_, dominant7), 7) :- !.
%% Related ii: moderate
sub_strength_score(chord(_, minor7), chord(_, dominant7), 6) :- !.
%% Backdoor dominant: moderate-strong
sub_strength_score(chord(_, dominant7), chord(_, major), 7) :- !.
%% Chromatic approach: moderate
sub_strength_score(chord(_, _), chord(_, _), 5).

sub_compatibility(chord(Root1, Type1), chord(Root2, Type2), Compat) :-
  ( Root1 == Root2 -> Compat = identical
  ; chord_tones(chord(Root1, Type1), T1),
    chord_tones(chord(Root2, Type2), T2),
    intersection(T1, T2, Common),
    length(Common, N),
    ( N >= 2 -> Compat = high
    ; N >= 1 -> Compat = moderate
    ; Compat = low
    )
  ).

%% chord_tones/2 — get pitch classes for common chord types
chord_tones(chord(Root, major), PCs) :-
  note_index(Root, I),
  maplist(offset_pc(I), [0, 4, 7], PCs).
chord_tones(chord(Root, minor), PCs) :-
  note_index(Root, I),
  maplist(offset_pc(I), [0, 3, 7], PCs).
chord_tones(chord(Root, dominant7), PCs) :-
  note_index(Root, I),
  maplist(offset_pc(I), [0, 4, 7, 10], PCs).
chord_tones(chord(Root, major7), PCs) :-
  note_index(Root, I),
  maplist(offset_pc(I), [0, 4, 7, 11], PCs).
chord_tones(chord(Root, minor7), PCs) :-
  note_index(Root, I),
  maplist(offset_pc(I), [0, 3, 7, 10], PCs).
chord_tones(chord(Root, diminished), PCs) :-
  note_index(Root, I),
  maplist(offset_pc(I), [0, 3, 6], PCs).
chord_tones(chord(Root, augmented), PCs) :-
  note_index(Root, I),
  maplist(offset_pc(I), [0, 4, 8], PCs).
chord_tones(chord(Root, half_diminished), PCs) :-
  note_index(Root, I),
  maplist(offset_pc(I), [0, 3, 6, 10], PCs).
chord_tones(chord(Root, diminished7), PCs) :-
  note_index(Root, I),
  maplist(offset_pc(I), [0, 3, 6, 9], PCs).

%% melody_compatible(+MelodyNotes, +NewChord, -CompatScore, -Conflicts)
%% Check whether a melody is compatible with a reharmonization chord. (C1338-C1339)
melody_compatible(MelodyNotes, NewChord, CompatScore, Conflicts) :-
  chord_tones(NewChord, ChordPCs),
  check_melody_compat(MelodyNotes, ChordPCs, 0, 0, Score, ConflictList),
  length(MelodyNotes, Total),
  ( Total > 0 -> CompatScore is Score / Total * 100
  ; CompatScore = 100
  ),
  Conflicts = ConflictList.

check_melody_compat([], _, Score, _, Score, []).
check_melody_compat([Note|Rest], ChordPCs, AccScore, Idx, FinalScore, Conflicts) :-
  note_index(Note, PC),
  ( member(PC, ChordPCs) ->
    %% Chord tone: full compatibility
    NewScore is AccScore + 1,
    check_melody_compat(Rest, ChordPCs, NewScore, Idx + 1, FinalScore, Conflicts)
  ; tension_distance(PC, ChordPCs, Dist),
    ( Dist =< 2 ->
      %% Passing tone or tension: partial compatibility
      NewScore is AccScore + 0.5,
      check_melody_compat(Rest, ChordPCs, NewScore, Idx + 1, FinalScore, Conflicts)
    ;
      %% Clash: no credit, record conflict
      check_melody_compat(Rest, ChordPCs, AccScore, Idx + 1, FinalScore, RestConflicts),
      Conflicts = [conflict(Idx, Note, PC)|RestConflicts]
    )
  ).

tension_distance(PC, ChordPCs, MinDist) :-
  maplist(pc_distance(PC), ChordPCs, Dists),
  min_list(Dists, MinDist).

pc_distance(PC1, PC2, Dist) :-
  D is abs(PC1 - PC2),
  Dist is min(D, 12 - D).

%% ============================================================================
%% JAZZ IMPROVISATION THEORY — BEBOP & MELODIC VOCABULARY (C1351-C1390)
%% ============================================================================

%% bebop_scale(+Type, +Root, -Notes)
%% Bebop scales add a chromatic passing tone for continuous eighth-note flow. (C1352-C1353)
bebop_scale(dominant, Root, Notes) :-
  note_index(Root, I),
  maplist(offset_pc(I), [0, 2, 4, 5, 7, 9, 10, 11], PCs),
  maplist(pc_to_note_name, PCs, Notes).
bebop_scale(major, Root, Notes) :-
  note_index(Root, I),
  maplist(offset_pc(I), [0, 2, 4, 5, 7, 8, 9, 11], PCs),
  maplist(pc_to_note_name, PCs, Notes).
bebop_scale(minor, Root, Notes) :-
  note_index(Root, I),
  maplist(offset_pc(I), [0, 2, 3, 5, 7, 9, 10, 11], PCs),
  maplist(pc_to_note_name, PCs, Notes).
bebop_scale(dorian, Root, Notes) :-
  note_index(Root, I),
  maplist(offset_pc(I), [0, 2, 3, 4, 5, 7, 9, 10], PCs),
  maplist(pc_to_note_name, PCs, Notes).

%% enclosure(+TargetNote, +Type, -Notes, -Rhythm)
%% Chromatic approach patterns enclosing a target note from above/below. (C1354-C1355)
enclosure(Target, chromatic_above_below, [Above, Below, Target], [eighth, eighth, quarter]) :-
  note_index(Target, TI),
  AbovePC is (TI + 1) mod 12,
  BelowPC is (TI + 11) mod 12,
  pc_to_note_name(AbovePC, Above),
  pc_to_note_name(BelowPC, Below).
enclosure(Target, chromatic_below_above, [Below, Above, Target], [eighth, eighth, quarter]) :-
  note_index(Target, TI),
  BelowPC is (TI + 11) mod 12,
  AbovePC is (TI + 1) mod 12,
  pc_to_note_name(BelowPC, Below),
  pc_to_note_name(AbovePC, Above).
enclosure(Target, diatonic_above_chromatic_below, [Above, Below, Target], [eighth, eighth, quarter]) :-
  note_index(Target, TI),
  AbovePC is (TI + 2) mod 12,
  BelowPC is (TI + 11) mod 12,
  pc_to_note_name(AbovePC, Above),
  pc_to_note_name(BelowPC, Below).
enclosure(Target, double_chromatic, [A1, A2, B1, Target], [sixteenth, sixteenth, eighth, quarter]) :-
  note_index(Target, TI),
  A1PC is (TI + 2) mod 12,
  A2PC is (TI + 1) mod 12,
  B1PC is (TI + 11) mod 12,
  pc_to_note_name(A1PC, A1),
  pc_to_note_name(A2PC, A2),
  pc_to_note_name(B1PC, B1).

%% digital_pattern(+Chord, +PatternType, -Notes, -Direction)
%% "Digital patterns" — numbered scale degree patterns (1235, 1357, etc.). (C1356-C1357)
digital_pattern(chord(Root, Type), '1235', Notes, ascending) :-
  chord_scale_degrees(Type, Degrees),
  nth1(1, Degrees, D1), nth1(2, Degrees, D2),
  nth1(3, Degrees, D3), nth1(5, Degrees, D5),
  note_index(Root, I),
  maplist(offset_pc(I), [D1, D2, D3, D5], PCs),
  maplist(pc_to_note_name, PCs, Notes).
digital_pattern(chord(Root, Type), '1357', Notes, ascending) :-
  chord_scale_degrees(Type, Degrees),
  nth1(1, Degrees, D1), nth1(3, Degrees, D3),
  nth1(5, Degrees, D5), nth1(7, Degrees, D7),
  note_index(Root, I),
  maplist(offset_pc(I), [D1, D3, D5, D7], PCs),
  maplist(pc_to_note_name, PCs, Notes).
digital_pattern(chord(Root, Type), '3579', Notes, ascending) :-
  chord_scale_degrees(Type, Degrees),
  nth1(3, Degrees, D3), nth1(5, Degrees, D5),
  nth1(7, Degrees, D7),
  D9 is (nth1(2, Degrees, Base), Base),
  note_index(Root, I),
  maplist(offset_pc(I), [D3, D5, D7, D9], PCs),
  maplist(pc_to_note_name, PCs, Notes).

%% chord_scale_degrees/2 for digital patterns
chord_scale_degrees(dominant7, [0, 2, 4, 5, 7, 9, 10]).
chord_scale_degrees(major7, [0, 2, 4, 5, 7, 9, 11]).
chord_scale_degrees(minor7, [0, 2, 3, 5, 7, 9, 10]).
chord_scale_degrees(half_diminished, [0, 1, 3, 5, 6, 8, 10]).

%% approach_pattern(+TargetNote, +Type, -Notes, -Rhythm)
%% Chromatic, scalar, and indirect approach to a target note. (C1358-C1359)
approach_pattern(Target, chromatic_above, [Approach, Target], [eighth, quarter]) :-
  note_index(Target, TI),
  APC is (TI + 1) mod 12,
  pc_to_note_name(APC, Approach).
approach_pattern(Target, chromatic_below, [Approach, Target], [eighth, quarter]) :-
  note_index(Target, TI),
  APC is (TI + 11) mod 12,
  pc_to_note_name(APC, Approach).
approach_pattern(Target, scalar_above, [A2, A1, Target], [eighth, eighth, quarter]) :-
  note_index(Target, TI),
  A1PC is (TI + 2) mod 12,
  A2PC is (TI + 4) mod 12,
  pc_to_note_name(A2PC, A2),
  pc_to_note_name(A1PC, A1).
approach_pattern(Target, indirect, [Below, Above, Target], [eighth, eighth, quarter]) :-
  note_index(Target, TI),
  BPC is (TI + 10) mod 12,
  APC is (TI + 1) mod 12,
  pc_to_note_name(BPC, Below),
  pc_to_note_name(APC, Above).

%% jazz_arpeggio(+Chord, +Range, -Notes, -Direction)
%% Arpeggio patterns from chord tones through extensions. (C1360-C1361)
jazz_arpeggio(chord(Root, Type), basic, Notes, ascending) :-
  chord_tones(chord(Root, Type), PCs),
  maplist(pc_to_note_name, PCs, Notes).
jazz_arpeggio(chord(Root, Type), extended, Notes, ascending) :-
  chord_scale_degrees(Type, Degrees),
  note_index(Root, I),
  %% 1-3-5-7-9 arpeggio
  nth1(1, Degrees, D1), nth1(3, Degrees, D3),
  nth1(5, Degrees, D5), nth1(7, Degrees, D7),
  nth1(2, Degrees, D9),
  maplist(offset_pc(I), [D1, D3, D5, D7, D9], PCs),
  maplist(pc_to_note_name, PCs, Notes).

%% pentatonic_super(+Chord, +PentatonicRoot, -Notes, -Tension)
%% Pentatonic superimposition over a chord for modern jazz. (C1362-C1363)
pentatonic_super(chord(Root, dominant7), PentRoot, Notes, Tension) :-
  note_index(Root, RI),
  note_index(PentRoot, PI),
  Offset is (PI - RI + 12) mod 12,
  pentatonic_tension(Offset, Tension),
  pentatonic_major_scale(PentRoot, Notes).

pentatonic_tension(0, low).      %% Root pent = basic
pentatonic_tension(2, moderate). %% 9th pent = some extensions
pentatonic_tension(5, moderate). %% 4th pent = sus sound
pentatonic_tension(7, low).      %% 5th pent = mixolydian
pentatonic_tension(9, high).     %% 13th pent = altered feel
pentatonic_tension(1, high).     %% b9 pent = altered dominant
pentatonic_tension(6, high).     %% #11 pent = Lydian dominant
pentatonic_tension(_, moderate). %% fallback

pentatonic_major_scale(Root, Notes) :-
  note_index(Root, I),
  maplist(offset_pc(I), [0, 2, 4, 7, 9], PCs),
  maplist(pc_to_note_name, PCs, Notes).

%% triad_pair(+Chord, -TriadPair, -Pattern, -Reasons)
%% Triad pair improvisation: two adjacent triads creating hexatonic scale. (C1364-C1365)
triad_pair(chord(Root, dominant7), pair(T1, T2), ascending, Reasons) :-
  note_index(Root, I),
  %% Common triad pair for dom7: major triads a whole step apart
  T1Root is (I + 0) mod 12,
  T2Root is (I + 2) mod 12,
  pc_to_note_name(T1Root, T1),
  pc_to_note_name(T2Root, T2),
  Reasons = [because('Triad pair from root and 9th creates Mixolydian sound')].
triad_pair(chord(Root, minor7), pair(T1, T2), ascending, Reasons) :-
  note_index(Root, I),
  T1Root is (I + 3) mod 12,
  T2Root is (I + 5) mod 12,
  pc_to_note_name(T1Root, T1),
  pc_to_note_name(T2Root, T2),
  Reasons = [because('Triad pair from b3 and 4th covers Dorian color')].

%% hexatonic_scale(+TriadPair, -Scale, -Tensions)
%% Merge two triads into a hexatonic scale. (C1366-C1367)
hexatonic_scale(pair(Root1, Root2), Scale, Tensions) :-
  chord_tones(chord(Root1, major), PCs1),
  chord_tones(chord(Root2, major), PCs2),
  append(PCs1, PCs2, AllPCs),
  sort(AllPCs, SortedPCs),
  maplist(pc_to_note_name, SortedPCs, Scale),
  length(SortedPCs, Len),
  ( Len =:= 6 -> Tensions = [hexatonic, bright]
  ; Tensions = [overlapping, dense]
  ).

%% jazz_cliche(+Context, -Phrase, -Source, -Usage)
%% Stock jazz phrases and licks indexed by harmonic context. (C1368-C1369)
jazz_cliche(ii_v_i_major, [d, f, a, c, b, g, e, c], 'Charlie Parker', common_bebop).
jazz_cliche(ii_v_i_minor, [d, f, gsharp, b, bflat, g, eflat, c], 'Bud Powell', minor_bebop).
jazz_cliche(blues_turnaround, [c, e, g, bflat, a, fsharp, d, g], 'generic', blues_vocabulary).
jazz_cliche(dominant_resolution, [b, d, f, gsharp, a, c, e], 'Dizzy Gillespie', altered_dominant).
jazz_cliche(modal_vamp, [d, e, f, g, a, d, c, a], 'Miles Davis', modal_jazz).

%% target_note_line(+ChordProgression, -Targets, -Line, -Reasons)
%% Construct a melodic line by targeting chord tones on strong beats. (C1370-C1371)
target_note_line([], [], [], []).
target_note_line([Chord|Rest], [Target|RestTargets], LinePart, Reasons) :-
  chord_tones(Chord, PCs),
  %% Pick 3rd as default target (strongest guide tone)
  nth1(2, PCs, TargetPC),
  pc_to_note_name(TargetPC, Target),
  target_note_line(Rest, RestTargets, RestLine, RestReasons),
  LinePart = [Target|RestLine],
  Reasons = [because('Targeting 3rd on downbeat')|RestReasons].

%% guide_tone_line(+ChordProgression, -GuideTones, -VoiceLeading)
%% Generate a guide tone line (3rds and 7ths voice-led through changes). (C1372-C1373)
guide_tone_line([], [], []).
guide_tone_line([chord(Root, Type)|Rest], [guide(Third, Seventh)|RestGuide], VL) :-
  chord_scale_degrees(Type, Degrees),
  note_index(Root, I),
  nth1(3, Degrees, D3), nth1(7, Degrees, D7),
  offset_pc(I, D3, ThirdPC), offset_pc(I, D7, SeventhPC),
  pc_to_note_name(ThirdPC, Third),
  pc_to_note_name(SeventhPC, Seventh),
  guide_tone_line(Rest, RestGuide, RestVL),
  VL = [voice_led(Third, Seventh)|RestVL].

%% motif_development(+Motif, +Technique, -DevelopedMotif, -Reasons)
%% Apply motivic development techniques common in jazz. (C1374-C1375)
motif_development(Motif, sequence_up, Developed, Reasons) :-
  transpose_notes(Motif, 2, Developed),
  Reasons = [because('Sequential transposition up a whole step')].
motif_development(Motif, sequence_down, Developed, Reasons) :-
  transpose_notes(Motif, -2, Developed),
  Reasons = [because('Sequential transposition down a whole step')].
motif_development(Motif, inversion, Developed, Reasons) :-
  invert_intervals(Motif, Developed),
  Reasons = [because('Melodic inversion of intervallic contour')].
motif_development(Motif, fragmentation, Developed, Reasons) :-
  length(Motif, Len),
  Half is max(1, Len // 2),
  length(Developed, Half),
  append(Developed, _, Motif),
  Reasons = [because('Fragmentation: first half of motif')].
motif_development(Motif, augmentation, Developed, Reasons) :-
  Developed = Motif, %% rhythmic augmentation is timing-based, notes same
  Reasons = [because('Augmentation: double note values (rhythmic)')].

transpose_notes([], _, []).
transpose_notes([Note|Rest], Semitones, [Transposed|RestT]) :-
  note_index(Note, I),
  NewPC is (I + Semitones + 12) mod 12,
  pc_to_note_name(NewPC, Transposed),
  transpose_notes(Rest, Semitones, RestT).

invert_intervals([], []).
invert_intervals([X], [X]).
invert_intervals([N1, N2|Rest], [N1, Inv|InvRest]) :-
  note_index(N1, I1), note_index(N2, I2),
  Interval is (I2 - I1 + 12) mod 12,
  InvInterval is (12 - Interval) mod 12,
  InvPC is (I1 + InvInterval) mod 12,
  pc_to_note_name(InvPC, Inv),
  invert_intervals([Inv|Rest], [Inv|InvRest]).

%% rhythmic_displacement(+Pattern, +Displacement, -NewPattern, -Reasons)
%% Shift a rhythmic pattern by a given offset. (C1376-C1377)
rhythmic_displacement(Pattern, eighth_note, Pattern, Reasons) :-
  Reasons = [because('Displaced by one eighth note: creates syncopation')].
rhythmic_displacement(Pattern, quarter_note, Pattern, Reasons) :-
  Reasons = [because('Displaced by one quarter note: strong beat shift')].
rhythmic_displacement(Pattern, triplet, Pattern, Reasons) :-
  Reasons = [because('Displaced by triplet offset: cross-rhythm effect')].

%% outside_technique(+Chord, +Technique, -OutsideLine, -ResolutionPath)
%% "Outside" playing: deliberate dissonance with planned resolution. (C1378-C1379)
outside_technique(chord(Root, Type), side_step_up, Line, Resolution) :-
  note_index(Root, I),
  %% Play a half step above, then resolve down
  UpI is (I + 1) mod 12,
  bebop_scale(dominant, Root, InNotes),
  pc_to_note_name(UpI, UpRoot),
  bebop_scale(dominant, UpRoot, OutNotes),
  append(OutNotes, InNotes, Line),
  Resolution = [resolve_to(Root, Type), because('Side-step up resolves chromatically down')].
outside_technique(chord(Root, Type), side_step_down, Line, Resolution) :-
  note_index(Root, I),
  DownI is (I + 11) mod 12,
  pc_to_note_name(DownI, DownRoot),
  bebop_scale(dominant, DownRoot, OutNotes),
  bebop_scale(dominant, Root, InNotes),
  append(OutNotes, InNotes, Line),
  Resolution = [resolve_to(Root, Type), because('Side-step down resolves chromatically up')].
outside_technique(chord(Root, _), superimposition, Line, Resolution) :-
  note_index(Root, I),
  %% Superimpose tritone sub's scale
  TriI is (I + 6) mod 12,
  pc_to_note_name(TriI, TriRoot),
  bebop_scale(dominant, TriRoot, OutNotes),
  bebop_scale(dominant, Root, InNotes),
  append(OutNotes, InNotes, Line),
  Resolution = [resolve_to(Root, dominant7), because('Tritone superimposition with chromatic resolution')].

%% jazz_practice_exercise(+Concept, -Exercise, -Chords, -Instructions)
%% Generate practice exercises for jazz concepts. (C1389)
jazz_practice_exercise(enclosures, Exercise, [chord(c, major7), chord(a, minor7), chord(d, minor7), chord(g, dominant7)], Instructions) :-
  Exercise = enclosure_drill,
  Instructions = ['Play chromatic enclosures to the 3rd of each chord',
                  'Start with above-below pattern, then reverse',
                  'Use metronome at quarter = 60, increase to 120'].
jazz_practice_exercise(digital_patterns, Exercise, [chord(c, major7), chord(f, major7), chord(g, dominant7)], Instructions) :-
  Exercise = digital_1235_drill,
  Instructions = ['Play 1-2-3-5 pattern ascending through each chord',
                  'Then 3-5-7-9 through each chord',
                  'Vary articulation: legato then staccato'].
jazz_practice_exercise(guide_tones, Exercise, [chord(d, minor7), chord(g, dominant7), chord(c, major7)], Instructions) :-
  Exercise = guide_tone_drill,
  Instructions = ['Connect 3rds and 7ths through ii-V-I',
                  'Note how 7th of ii becomes 3rd of V',
                  'Sing guide tones while playing chord roots'].
jazz_practice_exercise(outside_playing, Exercise, [chord(c, dominant7)], Instructions) :-
  Exercise = side_step_drill,
  Instructions = ['Play 4 bars inside, then side-step up for 2 bars',
                  'Resolve back by step, landing on chord tone',
                  'Increase outside time as comfort grows'].

%% analyze_jazz_phrase(+Phrase, -Patterns, -Vocabulary)
%% Analyze a jazz phrase to identify vocabulary patterns. (C1402)
analyze_jazz_phrase(Phrase, Patterns, Vocabulary) :-
  find_enclosures(Phrase, Enclosures),
  find_arpeggios(Phrase, Arpeggios),
  find_scale_runs(Phrase, ScaleRuns),
  Patterns = patterns(Enclosures, Arpeggios, ScaleRuns),
  length(Enclosures, NE), length(Arpeggios, NA), length(ScaleRuns, NS),
  Total is NE + NA + NS,
  ( Total > 5 -> Vocabulary = advanced
  ; Total > 2 -> Vocabulary = intermediate
  ; Vocabulary = beginner
  ).

find_enclosures([], []).
find_enclosures([_], []).
find_enclosures([_, _], []).
find_enclosures([A, B, C|Rest], [enclosure(A, B, C)|More]) :-
  note_index(A, AI), note_index(B, BI), note_index(C, CI),
  DA is (AI - CI + 12) mod 12,
  DB is (BI - CI + 12) mod 12,
  DA =< 2, DB =< 2, DA =\= DB, !,
  find_enclosures([C|Rest], More).
find_enclosures([_|Rest], Enclosures) :-
  find_enclosures(Rest, Enclosures).

find_arpeggios([], []).
find_arpeggios([_], []).
find_arpeggios([_, _], []).
find_arpeggios([_, _, _], []).
find_arpeggios([A, B, C, D|Rest], [arpeggio(A, B, C, D)|More]) :-
  note_index(A, AI), note_index(B, BI),
  note_index(C, CI), note_index(D, DI),
  I1 is (BI - AI + 12) mod 12,
  I2 is (CI - BI + 12) mod 12,
  I3 is (DI - CI + 12) mod 12,
  I1 >= 3, I2 >= 3, I3 >= 3, !,
  find_arpeggios([D|Rest], More).
find_arpeggios([_|Rest], Arps) :-
  find_arpeggios(Rest, Arps).

find_scale_runs([], []).
find_scale_runs([_], []).
find_scale_runs([_,_], []).
find_scale_runs([A, B, C|Rest], [scale_run(A, B, C)|More]) :-
  note_index(A, AI), note_index(B, BI), note_index(C, CI),
  D1 is (BI - AI + 12) mod 12,
  D2 is (CI - BI + 12) mod 12,
  D1 =< 2, D2 =< 2, !,
  find_scale_runs([C|Rest], More).
find_scale_runs([_|Rest], Runs) :-
  find_scale_runs(Rest, Runs).

%% recognize_pattern(+Notes, -PatternType, -Match)
%% Recognize specific pattern types in a note sequence. (C1404)
recognize_pattern(Notes, enclosure, Match) :-
  find_enclosures(Notes, Matches),
  Matches = [Match|_].
recognize_pattern(Notes, arpeggio, Match) :-
  find_arpeggios(Notes, Matches),
  Matches = [Match|_].
recognize_pattern(Notes, scale_run, Match) :-
  find_scale_runs(Notes, Matches),
  Matches = [Match|_].

%% tension_curve(+Line, +Chords, -TensionProfile)
%% Analyze the tension curve of an improvised line against chord changes. (C1434)
tension_curve([], [], []).
tension_curve([Note|RestNotes], [Chord|RestChords], [TVal|RestTension]) :-
  chord_tones(Chord, ChordPCs),
  note_index(Note, NPC),
  ( member(NPC, ChordPCs) -> TVal = 0
  ; tension_distance(NPC, ChordPCs, Dist),
    TVal is Dist
  ),
  tension_curve(RestNotes, RestChords, RestTension).
tension_curve([Note|RestNotes], [], [TVal|RestTension]) :-
  TVal = 3, %% No chord context = moderate tension
  tension_curve(RestNotes, [], RestTension).

%% jazz_style_match(+Phrase, +Style, -Score)
%% Score how well a phrase matches a jazz style. (C1422)
jazz_style_match(Phrase, bebop, Score) :-
  analyze_jazz_phrase(Phrase, patterns(Enc, Arp, _), _),
  length(Enc, NE), length(Arp, NA),
  Score is NE * 2 + NA * 3.  %% Bebop favors enclosures and arpeggios
jazz_style_match(Phrase, modal, Score) :-
  analyze_jazz_phrase(Phrase, patterns(_, _, Runs), _),
  length(Runs, NR),
  Score is NR * 3.  %% Modal favors scale runs
jazz_style_match(_, free, 5).  %% Free jazz: everything scores equally
