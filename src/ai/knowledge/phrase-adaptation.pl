%% phrase-adaptation.pl - Phrase Adaptation Knowledge Base for CardPlay AI
%% 
%% This Prolog knowledge base provides rules for adapting musical phrases
%% to different harmonic contexts. Supports:
%% - Transposition rules
%% - Chord-tone mapping
%% - Voice-leading optimization
%% - Scale-degree preservation
%% - Phrase similarity measurement
%%
%% L221-L250: Phrase Adaptation KB

%% ============================================================================
%% TRANSPOSITION RULES
%% ============================================================================

%% transpose_pitch/3 - Transpose a pitch by semitones
%% transpose_pitch(OriginalPitch, Semitones, ResultPitch)
transpose_pitch(Pitch, Semitones, Result) :-
    Result is (Pitch + Semitones) mod 128,
    Result >= 0,
    Result =< 127.

%% transpose_pitch_class/3 - Transpose within octave (0-11)
transpose_pitch_class(PC, Semitones, Result) :-
    Result is (PC + Semitones) mod 12.

%% interval_between/3 - Calculate interval between two notes
interval_between(Note1, Note2, Interval) :-
    Interval is (Note2 - Note1 + 12) mod 12.

%% ============================================================================
%% CHORD-TONE MAPPING
%% ============================================================================

%% chord_tone_index/3 - Get index of chord tone (0-based)
%% chord_tone_index(PitchClass, ChordTones, Index)
chord_tone_index(PC, [PC|_], 0).
chord_tone_index(PC, [_|Rest], Index) :-
    chord_tone_index(PC, Rest, PrevIndex),
    Index is PrevIndex + 1.

%% is_chord_tone/2 - Check if pitch class is a chord tone
is_chord_tone(PC, ChordTones) :-
    member(PC, ChordTones).

%% nearest_chord_tone/3 - Find nearest chord tone to a pitch class
%% nearest_chord_tone(PitchClass, ChordTones, NearestChordTone)
nearest_chord_tone(PC, ChordTones, Nearest) :-
    findall(Dist-CT, (
        member(CT, ChordTones),
        distance_mod12(PC, CT, Dist)
    ), Distances),
    sort(Distances, [_-Nearest|_]).

%% distance_mod12/3 - Distance between pitch classes (0-6)
distance_mod12(PC1, PC2, Dist) :-
    D1 is abs(PC1 - PC2),
    D2 is 12 - D1,
    Dist is min(D1, D2).

%% map_chord_tone/5 - Map a chord tone from source to target chord
%% map_chord_tone(PitchClass, SourceChordTones, TargetChordTones, TargetPC)
map_chord_tone(PC, SourceTones, TargetTones, TargetPC) :-
    chord_tone_index(PC, SourceTones, Index),
    length(TargetTones, Len),
    TargetIndex is Index mod Len,
    nth0(TargetIndex, TargetTones, TargetPC).

%% ============================================================================
%% SCALE-DEGREE PRESERVATION
%% ============================================================================

%% scale_degree/3 - Get scale degree of a pitch class in a scale
%% scale_degree(PitchClass, ScaleTones, Degree)
scale_degree(PC, ScaleTones, Degree) :-
    nth1(Degree, ScaleTones, PC),
    !.
scale_degree(PC, ScaleTones, Degree) :-
    nearest_scale_tone(PC, ScaleTones, NearestTone),
    nth1(Degree, ScaleTones, NearestTone).

%% nearest_scale_tone/3 - Find nearest scale tone
nearest_scale_tone(PC, ScaleTones, Nearest) :-
    findall(Dist-ST, (
        member(ST, ScaleTones),
        distance_mod12(PC, ST, Dist)
    ), Distances),
    sort(Distances, [_-Nearest|_]).

%% pitch_from_degree/3 - Get pitch class from scale degree
%% pitch_from_degree(Degree, ScaleTones, PitchClass)
pitch_from_degree(Degree, ScaleTones, PC) :-
    length(ScaleTones, Len),
    AdjustedDegree is ((Degree - 1) mod Len) + 1,
    nth1(AdjustedDegree, ScaleTones, PC).

%% ============================================================================
%% VOICE LEADING RULES
%% ============================================================================

%% voice_leading_cost/3 - Calculate voice leading cost between two pitches
%% Lower cost = smoother voice leading
%% voice_leading_cost(Pitch1, Pitch2, Cost)
voice_leading_cost(P1, P2, Cost) :-
    Interval is abs(P1 - P2),
    voice_leading_interval_cost(Interval, Cost).

%% Costs by interval size (semitones)
voice_leading_interval_cost(0, 0).   % Same note - no movement cost
voice_leading_interval_cost(1, 1).   % Half step - minimal
voice_leading_interval_cost(2, 2).   % Whole step - good
voice_leading_interval_cost(3, 3).   % Minor 3rd - acceptable
voice_leading_interval_cost(4, 4).   % Major 3rd - moderate
voice_leading_interval_cost(5, 5).   % Perfect 4th - still ok
voice_leading_interval_cost(N, 10) :- N > 5, N =< 7.  % 5-7 semitones
voice_leading_interval_cost(N, 15) :- N > 7, N =< 12. % Octave range
voice_leading_interval_cost(N, 25) :- N > 12.          % More than octave - avoid

%% smooth_voice_leading/2 - Check if interval is smooth (<=2 semitones)
smooth_voice_leading(P1, P2) :-
    Interval is abs(P1 - P2),
    Interval =< 2.

%% stepwise_motion/2 - Check if movement is stepwise (1-2 semitones)
stepwise_motion(P1, P2) :-
    Interval is abs(P1 - P2),
    Interval >= 1,
    Interval =< 2.

%% ============================================================================
%% CONTOUR PRESERVATION
%% ============================================================================

%% contour_direction/3 - Determine melodic direction
%% contour_direction(Pitch1, Pitch2, Direction)
contour_direction(P1, P2, ascending) :- P2 > P1.
contour_direction(P1, P2, descending) :- P2 < P1.
contour_direction(P, P, static).

%% contour_matches/4 - Check if adapted contour matches original
contour_matches(Orig1, Orig2, New1, New2) :-
    contour_direction(Orig1, Orig2, Dir),
    contour_direction(New1, New2, Dir).

%% ============================================================================
%% PASSING TONE DETECTION
%% ============================================================================

%% is_passing_tone/5 - Check if a note is a passing tone
%% is_passing_tone(Note, PrevNote, NextNote, ChordTones, ScaleTones)
is_passing_tone(Note, Prev, Next, ChordTones, ScaleTones) :-
    \+ is_chord_tone(Note, ChordTones),
    member(Note, ScaleTones),
    stepwise_motion(Prev, Note),
    stepwise_motion(Note, Next),
    contour_direction(Prev, Note, Dir),
    contour_direction(Note, Next, Dir).

%% is_neighbor_tone/4 - Check if a note is a neighbor tone
is_neighbor_tone(Note, Prev, Next, ChordTones) :-
    \+ is_chord_tone(Note, ChordTones),
    Prev =:= Next,
    stepwise_motion(Prev, Note).

%% is_approach_tone/3 - Check if note approaches a target chromatically
is_approach_tone(Note, Target, ChordTones) :-
    \+ is_chord_tone(Note, ChordTones),
    Interval is abs(Note - Target),
    Interval =:= 1.

%% ============================================================================
%% PHRASE SIMILARITY MEASUREMENT
%% ============================================================================

%% phrase_similarity/3 - Overall similarity score (0-100)
%% phrase_similarity(Phrase1, Phrase2, Score)
%% Note: Phrases are lists of [Pitch, Duration, Velocity] triplets

%% For simpler queries, we provide atomic comparisons:

%% rhythm_similarity/3 - Compare rhythmic patterns (durations only)
rhythm_similarity([], [], 100).
rhythm_similarity([D1|Rest1], [D2|Rest2], Score) :-
    rhythm_similarity(Rest1, Rest2, RestScore),
    DurRatio is min(D1, D2) / max(D1, D2),
    ElementScore is DurRatio * 100,
    length([D1|Rest1], Len),
    Score is (ElementScore + RestScore * (Len - 1)) / Len.
rhythm_similarity([_|_], [], 50).
rhythm_similarity([], [_|_], 50).

%% contour_similarity/3 - Compare melodic contours
%% Uses direction sequence comparison
contour_similarity([], [], 100).
contour_similarity([_], [_], 100).
contour_similarity([P1, P2|Rest1], [Q1, Q2|Rest2], Score) :-
    contour_similarity([P2|Rest1], [Q2|Rest2], RestScore),
    contour_direction(P1, P2, Dir1),
    contour_direction(Q1, Q2, Dir2),
    (Dir1 = Dir2 -> DirScore = 100 ; DirScore = 0),
    length([P1, P2|Rest1], Len),
    Score is (DirScore + RestScore * (Len - 2)) / (Len - 1).
contour_similarity([_|_], [_], 50).
contour_similarity([_], [_|_], 50).

%% interval_similarity/3 - Compare interval patterns
interval_similarity([], [], 100).
interval_similarity([_], [_], 100).
interval_similarity([P1, P2|Rest1], [Q1, Q2|Rest2], Score) :-
    interval_similarity([P2|Rest1], [Q2|Rest2], RestScore),
    Int1 is P2 - P1,
    Int2 is Q2 - Q1,
    IntDiff is abs(Int1 - Int2),
    (IntDiff =:= 0 -> IntScore = 100 ;
     IntDiff =< 2 -> IntScore = 75 ;
     IntDiff =< 5 -> IntScore = 50 ;
     IntScore = 25),
    length([P1, P2|Rest1], Len),
    Score is (IntScore + RestScore * (Len - 2)) / (Len - 1).

%% ============================================================================
%% ADAPTATION STRATEGIES
%% ============================================================================

%% adapt_strategy/2 - Recommended strategy for given context
adapt_strategy(transpose, same_quality).
adapt_strategy(chord_tone, different_quality).
adapt_strategy(scale_degree, modal_interchange).
adapt_strategy(voice_leading, close_voicing).

%% adaptation_quality/4 - Rate quality of an adaptation
%% adaptation_quality(OriginalPhraseInfo, AdaptedPhraseInfo, Mode, Quality)

%% For transpose mode, check consistent transposition
adaptation_quality_transpose(OrigPitches, AdaptedPitches, Quality) :-
    length(OrigPitches, Len),
    Len > 0,
    findall(Diff, (
        nth1(I, OrigPitches, OP),
        nth1(I, AdaptedPitches, AP),
        Diff is AP - OP
    ), Diffs),
    all_same(Diffs),
    Quality = 100.
adaptation_quality_transpose(_, _, 50).  % Fallback

%% all_same/1 - Check if all elements are the same
all_same([]).
all_same([_]).
all_same([X, X|Rest]) :- all_same([X|Rest]).

%% ============================================================================
%% CHROMATIC ADAPTATION RULES
%% ============================================================================

%% allow_chromatic_passing/3 - When chromatic passing tones are appropriate
allow_chromatic_passing(jazz, between_chord_tones, yes).
allow_chromatic_passing(blues, blue_notes, yes).
allow_chromatic_passing(classical, approach_note, yes).
allow_chromatic_passing(pop, _, no).
allow_chromatic_passing(rock, _, no).

%% blue_note/2 - Blue notes for blues genre
blue_note(0, 3).   % b3 over major
blue_note(0, 10).  % b7 over major
blue_note(0, 6).   % b5 (tritone)

%% ============================================================================
%% OCTAVE MANAGEMENT
%% ============================================================================

%% constrain_to_range/4 - Keep pitch within range
%% constrain_to_range(Pitch, MinPitch, MaxPitch, ConstrainedPitch)
constrain_to_range(Pitch, Min, Max, Constrained) :-
    Pitch >= Min,
    Pitch =< Max,
    Constrained = Pitch.
constrain_to_range(Pitch, Min, Max, Constrained) :-
    Pitch < Min,
    Adjusted is Pitch + 12,
    constrain_to_range(Adjusted, Min, Max, Constrained).
constrain_to_range(Pitch, Min, Max, Constrained) :-
    Pitch > Max,
    Adjusted is Pitch - 12,
    constrain_to_range(Adjusted, Min, Max, Constrained).

%% comfortable_range/3 - Comfortable ranges for different instruments/voices
comfortable_range(bass, 28, 55).     % E1 to G3
comfortable_range(guitar, 40, 84).   % E2 to C6
comfortable_range(piano, 21, 108).   % A0 to C8
comfortable_range(soprano, 60, 81).  % C4 to A5
comfortable_range(alto, 53, 74).     % F3 to D5
comfortable_range(tenor, 48, 69).    % C3 to A4
comfortable_range(baritone, 40, 64). % E2 to E4
