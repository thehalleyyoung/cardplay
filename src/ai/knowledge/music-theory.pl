%% music-theory.pl - Music Theory Knowledge Base for CardPlay AI
%% 
%% This Prolog knowledge base provides music theory reasoning capabilities
%% for the CardPlay DAW's AI system. It covers:
%% - Notes and intervals
%% - Scales and modes
%% - Chords and progressions
%% - Voice leading rules
%% - Harmonic functions and cadences
%%
%% All predicates follow ISO Prolog conventions and work with Tau Prolog.

%% ============================================================================
%% L032: CHROMATIC NOTES
%% ============================================================================

%% note/1 - All 12 chromatic notes
%% We use lowercase atoms with 'sharp' suffix for sharps, 'flat' for flats
note(c).
note(csharp).
note(d).
note(dsharp).
note(e).
note(f).
note(fsharp).
note(g).
note(gsharp).
note(a).
note(asharp).
note(b).

%% Flats as aliases (enharmonic equivalents)
note(dflat).
note(eflat).
note(gflat).
note(aflat).
note(bflat).

%% L043: Enharmonic equivalents
enharmonic(csharp, dflat).
enharmonic(dsharp, eflat).
enharmonic(fsharp, gflat).
enharmonic(gsharp, aflat).
enharmonic(asharp, bflat).

%% Symmetry: if A is enharmonic to B, B is enharmonic to A
enharmonic(A, B) :- enharmonic(B, A), A \= B.

%% note_index/2 - Map notes to semitone index (0-11)
note_index(c, 0).
note_index(csharp, 1).
note_index(dflat, 1).
note_index(d, 2).
note_index(dsharp, 3).
note_index(eflat, 3).
note_index(e, 4).
note_index(f, 5).
note_index(fsharp, 6).
note_index(gflat, 6).
note_index(g, 7).
note_index(gsharp, 8).
note_index(aflat, 8).
note_index(a, 9).
note_index(asharp, 10).
note_index(bflat, 10).
note_index(b, 11).

%% ============================================================================
%% L033: INTERVALS
%% ============================================================================

%% interval_semitones/2 - Interval name to semitone count
interval_semitones(unison, 0).
interval_semitones(minor_second, 1).
interval_semitones(major_second, 2).
interval_semitones(minor_third, 3).
interval_semitones(major_third, 4).
interval_semitones(perfect_fourth, 5).
interval_semitones(tritone, 6).
interval_semitones(augmented_fourth, 6).
interval_semitones(diminished_fifth, 6).
interval_semitones(perfect_fifth, 7).
interval_semitones(minor_sixth, 8).
interval_semitones(major_sixth, 9).
interval_semitones(minor_seventh, 10).
interval_semitones(major_seventh, 11).
interval_semitones(octave, 12).

%% L044: note_distance/3 - Semitone distance between two notes
note_distance(Note1, Note2, Distance) :-
    note_index(Note1, I1),
    note_index(Note2, I2),
    Distance is (I2 - I1 + 12) mod 12.

%% interval/3 - Determine interval between two notes
interval(Note1, Note2, IntervalName) :-
    note_distance(Note1, Note2, Semitones),
    interval_semitones(IntervalName, Semitones).

%% L046: invert_interval/2 - Interval inversion
invert_interval(unison, octave).
invert_interval(minor_second, major_seventh).
invert_interval(major_second, minor_seventh).
invert_interval(minor_third, major_sixth).
invert_interval(major_third, minor_sixth).
invert_interval(perfect_fourth, perfect_fifth).
invert_interval(tritone, tritone).
invert_interval(perfect_fifth, perfect_fourth).
invert_interval(minor_sixth, major_third).
invert_interval(major_sixth, minor_third).
invert_interval(minor_seventh, major_second).
invert_interval(major_seventh, minor_second).
invert_interval(octave, unison).

%% L047: Consonance/dissonance ratings
consonance(unison, perfect).
consonance(octave, perfect).
consonance(perfect_fifth, perfect).
consonance(perfect_fourth, imperfect).  % Depends on context
consonance(major_third, imperfect).
consonance(minor_third, imperfect).
consonance(major_sixth, imperfect).
consonance(minor_sixth, imperfect).
consonance(major_second, dissonant).
consonance(minor_second, dissonant).
consonance(major_seventh, dissonant).
consonance(minor_seventh, dissonant).
consonance(tritone, dissonant).

%% ============================================================================
%% L034-L035: SCALES
%% ============================================================================

%% scale/2 - Scale type with semitone pattern (steps from one degree to next)
scale(major, [2, 2, 1, 2, 2, 2, 1]).
scale(natural_minor, [2, 1, 2, 2, 1, 2, 2]).
scale(harmonic_minor, [2, 1, 2, 2, 1, 3, 1]).
scale(melodic_minor, [2, 1, 2, 2, 2, 2, 1]).  % Ascending form
scale(pentatonic_major, [2, 2, 3, 2, 3]).
scale(pentatonic_minor, [3, 2, 2, 3, 2]).
scale(blues, [3, 2, 1, 1, 3, 2]).
scale(chromatic, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]).
scale(whole_tone, [2, 2, 2, 2, 2, 2]).

%% L042: Modes
scale(ionian, [2, 2, 1, 2, 2, 2, 1]).      % = major
scale(dorian, [2, 1, 2, 2, 2, 1, 2]).
scale(phrygian, [1, 2, 2, 2, 1, 2, 2]).
scale(lydian, [2, 2, 2, 1, 2, 2, 1]).
scale(mixolydian, [2, 2, 1, 2, 2, 1, 2]).
scale(aeolian, [2, 1, 2, 2, 1, 2, 2]).     % = natural minor
scale(locrian, [1, 2, 2, 1, 2, 2, 2]).

%% mode/2 - Mode name with base scale relationship
mode(ionian, major).
mode(dorian, minor).
mode(phrygian, minor).
mode(lydian, major).
mode(mixolydian, major).
mode(aeolian, minor).
mode(locrian, diminished).

%% Helper: Build list of note indices from pattern
build_scale_indices(_, [], []).
build_scale_indices(Current, [Step|Steps], [Current|Rest]) :-
    Next is (Current + Step) mod 12,
    build_scale_indices(Next, Steps, Rest).

%% index_to_note/2 - Map semitone index (0-11) to a canonical note
index_to_note(0, c).
index_to_note(1, csharp).
index_to_note(2, d).
index_to_note(3, dsharp).
index_to_note(4, e).
index_to_note(5, f).
index_to_note(6, fsharp).
index_to_note(7, g).
index_to_note(8, gsharp).
index_to_note(9, a).
index_to_note(10, asharp).
index_to_note(11, b).

%% L035: scale_notes/3 - Get list of notes for a scale
scale_notes(Root, ScaleType, Notes) :-
    note_index(Root, RootIndex),
    scale(ScaleType, Pattern),
    build_scale_indices(RootIndex, Pattern, Indices),
    maplist(index_to_note, Indices, Notes).

%% Check if a note is in a scale
in_scale(Note, Root, ScaleType) :-
    scale_notes(Root, ScaleType, Notes),
    member(Note, Notes).

%% ============================================================================
%% L036-L037: CHORDS
%% ============================================================================

%% chord/2 - Chord type with interval pattern from root (in semitones)
chord(major, [0, 4, 7]).
chord(minor, [0, 3, 7]).
chord(diminished, [0, 3, 6]).
chord(augmented, [0, 4, 8]).
chord(sus2, [0, 2, 7]).
chord(sus4, [0, 5, 7]).

%% L067: Extended chords (7ths, 9ths, etc.)
chord(major7, [0, 4, 7, 11]).
chord(minor7, [0, 3, 7, 10]).
chord(dominant7, [0, 4, 7, 10]).
chord(diminished7, [0, 3, 6, 9]).
chord(half_diminished7, [0, 3, 6, 10]).  % m7b5
chord(minor_major7, [0, 3, 7, 11]).
chord(augmented7, [0, 4, 8, 10]).

chord(major9, [0, 4, 7, 11, 14]).
chord(minor9, [0, 3, 7, 10, 14]).
chord(dominant9, [0, 4, 7, 10, 14]).
chord(add9, [0, 4, 7, 14]).

chord(major11, [0, 4, 7, 11, 14, 17]).
chord(minor11, [0, 3, 7, 10, 14, 17]).
chord(dominant11, [0, 4, 7, 10, 14, 17]).

chord(major13, [0, 4, 7, 11, 14, 17, 21]).
chord(minor13, [0, 3, 7, 10, 14, 17, 21]).
chord(dominant13, [0, 4, 7, 10, 14, 17, 21]).

%% chord_quality/2 - Major/minor quality of chord types
chord_quality(major, major).
chord_quality(minor, minor).
chord_quality(diminished, diminished).
chord_quality(augmented, augmented).
chord_quality(major7, major).
chord_quality(minor7, minor).
chord_quality(dominant7, dominant).
chord_quality(diminished7, diminished).
chord_quality(half_diminished7, diminished).

%% L037: chord_tones/3 - Get list of notes for a chord
chord_tones(Root, ChordType, Notes) :-
    note_index(Root, RootIndex),
    chord(ChordType, Intervals),
    maplist(add_to_root(RootIndex), Intervals, NoteIndices),
    maplist(normalize_index, NoteIndices, NormalizedIndices),
    maplist(index_to_note, NormalizedIndices, Notes).

add_to_root(Root, Interval, Result) :-
    Result is Root + Interval.

normalize_index(Index, Normalized) :-
    Normalized is Index mod 12.

%% Check if a note is a chord tone
chord_tone(Note, Root, ChordType) :-
    chord_tones(Root, ChordType, Notes),
    member(Note, Notes).

%% ============================================================================
%% L038: CHORD PROGRESSIONS
%% ============================================================================

%% Common progressions as Roman numeral sequences
%% We represent them as lists of (degree, quality) pairs

progression(pop_basic, [[1, major], [5, major], [6, minor], [4, major]]).  % I-V-vi-IV
progression(pop_variant, [[1, major], [4, major], [5, major], [1, major]]).  % I-IV-V-I
progression(jazz_ii_v_i, [[2, minor7], [5, dominant7], [1, major7]]).      % ii-V-I
progression(jazz_i_vi_ii_v, [[1, major7], [6, minor7], [2, minor7], [5, dominant7]]). % I-vi-ii-V
progression(blues_12bar, [[1, dominant7], [1, dominant7], [1, dominant7], [1, dominant7],
                          [4, dominant7], [4, dominant7], [1, dominant7], [1, dominant7],
                          [5, dominant7], [4, dominant7], [1, dominant7], [5, dominant7]]).
progression(canon, [[1, major], [5, major], [6, minor], [3, minor],
                    [4, major], [1, major], [4, major], [5, major]]).
progression(andalusian, [[6, minor], [5, major], [4, major], [3, major]]).  % Am-G-F-E in A minor
progression(axis, [[1, major], [5, major], [6, minor], [4, major]]).        % Same as pop_basic

%% ============================================================================
%% L040: HARMONIC FUNCTIONS
%% ============================================================================

%% harmonic_function/2 - Chord degree to function
harmonic_function(1, tonic).
harmonic_function(3, tonic).        % iii has tonic function
harmonic_function(6, tonic).        % vi has tonic function
harmonic_function(2, subdominant).
harmonic_function(4, subdominant).
harmonic_function(5, dominant).
harmonic_function(7, dominant).     % vii° has dominant function

%% Tension levels (higher = more tension, wants resolution)
%% L048: tension/2
tension(1, 0).   % Tonic - stable
tension(2, 3).   % Supertonic
tension(3, 1).   % Mediant
tension(4, 2).   % Subdominant
tension(5, 4).   % Dominant - high tension
tension(6, 1).   % Submediant
tension(7, 5).   % Leading tone - highest tension

%% ============================================================================
%% L041: CADENCES
%% ============================================================================

cadence(authentic, [[5, dominant7], [1, major]]).        % V-I
cadence(perfect_authentic, [[5, dominant7], [1, major]]). % V-I with root in soprano
cadence(imperfect_authentic, [[5, major], [1, major]]).  % V-I (not as strong)
cadence(half, [[1, major], [5, major]]).                 % I-V (ends on V)
cadence(plagal, [[4, major], [1, major]]).               % IV-I (Amen cadence)
cadence(deceptive, [[5, dominant7], [6, minor]]).        % V-vi

%% ============================================================================
%% L063: DIATONIC CHORDS
%% ============================================================================

%% diatonic_chord/3 - Scale degree to chord quality in major key
diatonic_chord(major, 1, major).
diatonic_chord(major, 2, minor).
diatonic_chord(major, 3, minor).
diatonic_chord(major, 4, major).
diatonic_chord(major, 5, major).
diatonic_chord(major, 6, minor).
diatonic_chord(major, 7, diminished).

%% Diatonic chords in natural minor
diatonic_chord(natural_minor, 1, minor).
diatonic_chord(natural_minor, 2, diminished).
diatonic_chord(natural_minor, 3, major).
diatonic_chord(natural_minor, 4, minor).
diatonic_chord(natural_minor, 5, minor).  % Note: not dominant!
diatonic_chord(natural_minor, 6, major).
diatonic_chord(natural_minor, 7, major).

%% Diatonic 7th chords in major
diatonic_chord_7th(major, 1, major7).
diatonic_chord_7th(major, 2, minor7).
diatonic_chord_7th(major, 3, minor7).
diatonic_chord_7th(major, 4, major7).
diatonic_chord_7th(major, 5, dominant7).
diatonic_chord_7th(major, 6, minor7).
diatonic_chord_7th(major, 7, half_diminished7).

%% L045: transpose/3 - Transpose a note by semitones
transpose(Note, Semitones, Result) :-
    note_index(Note, Index),
    NewIndex is (Index + Semitones) mod 12,
    index_to_note(NewIndex, Result).

%% ============================================================================
%% L039: VOICE LEADING RULES
%% ============================================================================

%% voice_leading_distance/3 - Semitone distance for voice leading
voice_leading_distance(Note1, Note2, Distance) :-
    note_distance(Note1, Note2, Dist1),
    Dist2 is 12 - Dist1,
    Distance is min(Dist1, Dist2).

%% smooth_motion/2 - True if voice movement is smooth (<=2 semitones)
smooth_motion(Note1, Note2) :-
    voice_leading_distance(Note1, Note2, D),
    D =< 2.

%% Common tone/2 - True if note appears in both chord tone lists
common_tone(Notes1, Notes2) :-
    member(Note, Notes1),
    member(Note, Notes2).

%% Good voice leading between two chords
good_voice_leading(Root1, Type1, Root2, Type2) :-
    chord_tones(Root1, Type1, Notes1),
    chord_tones(Root2, Type2, Notes2),
    common_tone(Notes1, Notes2).

%% ============================================================================
%% L064-L066: BORROWED AND SECONDARY CHORDS
%% ============================================================================

%% borrowed_chord/3 - Modal mixture / borrowed from parallel mode
borrowed_chord(major, 4, minor).      % iv borrowed from minor
borrowed_chord(major, 2, diminished). % ii° borrowed from minor
borrowed_chord(major, 6, major).      % VI borrowed from minor (bVI)
borrowed_chord(major, 7, major).      % bVII borrowed from mixolydian

%% L065: secondary_dominant/2 - Secondary dominants
secondary_dominant(of_2, [csharp, e, g]).    % V/ii
secondary_dominant(of_3, [dsharp, fsharp, a]). % V/iii
secondary_dominant(of_4, [c, e, g]).          % V/IV (= I)
secondary_dominant(of_5, [d, fsharp, a]).     % V/V
secondary_dominant(of_6, [e, gsharp, b]).     % V/vi

%% L066: tritone_substitution/3 - Jazz tritone sub
%% SubRoot is a tritone away from OriginalRoot
tritone_substitution(OriginalRoot, OriginalType, SubRoot) :-
    note_index(OriginalRoot, I),
    SubIndex is (I + 6) mod 12,
    index_to_note(SubIndex, SubRoot),
    OriginalType = dominant7.  % Only applies to dominant chords

%% L068: chord_extension_compatibility/3
chord_extension_compatible(major, 9, yes).
chord_extension_compatible(major, 11, avoid).  % #11 preferred
chord_extension_compatible(major, 13, yes).
chord_extension_compatible(minor, 9, yes).
chord_extension_compatible(minor, 11, yes).
chord_extension_compatible(minor, 13, yes).
chord_extension_compatible(dominant7, 9, yes).
chord_extension_compatible(dominant7, sharp9, yes).  % Hendrix chord
chord_extension_compatible(dominant7, flat9, yes).
chord_extension_compatible(dominant7, 11, avoid).
chord_extension_compatible(dominant7, sharp11, yes).
chord_extension_compatible(dominant7, 13, yes).
chord_extension_compatible(dominant7, flat13, yes).

%% ============================================================================
%% L069-L072: MELODIC AND RHYTHMIC PATTERNS
%% ============================================================================

%% L069: Melodic contour (direction of melody)
%% contour/2 - List of notes, contour type
melodic_contour(Notes, ascending) :-
    length(Notes, L), L >= 2,
    all_ascending(Notes).
melodic_contour(Notes, descending) :-
    length(Notes, L), L >= 2,
    all_descending(Notes).
melodic_contour(Notes, arch) :-
    length(Notes, L), L >= 3,
    split_at_peak(Notes, _, _).
melodic_contour(Notes, static) :-
    length(Notes, L), L >= 2,
    all_same(Notes).

all_ascending([_]).
all_ascending([N1, N2|Rest]) :-
    note_index(N1, I1),
    note_index(N2, I2),
    I2 > I1,
    all_ascending([N2|Rest]).

all_descending([_]).
all_descending([N1, N2|Rest]) :-
    note_index(N1, I1),
    note_index(N2, I2),
    I2 < I1,
    all_descending([N2|Rest]).

all_same([_]).
all_same([N, N|Rest]) :- all_same([N|Rest]).

split_at_peak([_], [], []).
split_at_peak([N1, N2|Rest], [N1|Asc], Desc) :-
    note_index(N1, I1),
    note_index(N2, I2),
    I2 > I1,
    split_at_peak([N2|Rest], Asc, Desc).
split_at_peak([N1, N2|Rest], [], [N1, N2|Rest]) :-
    note_index(N1, I1),
    note_index(N2, I2),
    I2 =< I1.

%% L071: Metric strength
strong_beat(Beat, Meter) :-
    Meter = 4, Beat = 1.
strong_beat(Beat, Meter) :-
    Meter = 4, Beat = 3.
strong_beat(Beat, Meter) :-
    Meter = 3, Beat = 1.

weak_beat(Beat, Meter) :-
    \+ strong_beat(Beat, Meter).

%% L072: Phrase structure
%% antecedent ends on non-tonic, consequent ends on tonic
phrase_type(antecedent, EndDegree) :- EndDegree \= 1.
phrase_type(consequent, 1).

%% A period has antecedent followed by consequent
period(Antecedent, Consequent) :-
    phrase_type(antecedent, AntEnd),
    phrase_type(consequent, ConsEnd),
    AntEnd \= ConsEnd.

%% ============================================================================
%% L073-L074: ORCHESTRATION AND TEXTURE
%% ============================================================================

%% L073: Instrument ranges (MIDI note numbers)
instrument_range(piano, 21, 108).
instrument_range(violin, 55, 103).
instrument_range(viola, 48, 91).
instrument_range(cello, 36, 76).
instrument_range(bass, 28, 60).
instrument_range(flute, 60, 96).
instrument_range(oboe, 58, 91).
instrument_range(clarinet, 50, 94).
instrument_range(bassoon, 34, 75).
instrument_range(trumpet, 55, 82).
instrument_range(horn, 41, 77).
instrument_range(trombone, 40, 72).
instrument_range(tuba, 28, 58).
instrument_range(soprano, 60, 81).
instrument_range(alto, 55, 77).
instrument_range(tenor, 48, 72).
instrument_range(baritone, 43, 67).
instrument_range(bass_voice, 36, 62).

register_suitable(Instrument, MidiNote) :-
    instrument_range(Instrument, Low, High),
    MidiNote >= Low,
    MidiNote =< High.

%% L074: Texture types
texture(monophonic, 1).          % Single melodic line
texture(homophonic, Voices) :-   % Melody with chordal accompaniment
    Voices > 1.
texture(polyphonic, Voices) :-   % Multiple independent melodic lines
    Voices >= 2.
texture(heterophonic, Voices) :- % Same melody with variations
    Voices >= 2.

%% ============================================================================
%% HELPER PREDICATES FOR QUERIES
%% ============================================================================

%% Suggest next chord based on current chord and function
suggest_next_chord(CurrentDegree, CurrentQuality, NextDegree, NextQuality) :-
    harmonic_function(CurrentDegree, CurrentFunction),
    valid_progression_step(CurrentFunction, NextFunction),
    harmonic_function(NextDegree, NextFunction),
    diatonic_chord(major, NextDegree, NextQuality).

valid_progression_step(tonic, subdominant).
valid_progression_step(tonic, dominant).
valid_progression_step(subdominant, dominant).
valid_progression_step(subdominant, tonic).  % Less common but valid
valid_progression_step(dominant, tonic).
valid_progression_step(dominant, subdominant).  % Deceptive type motion

%% Identify chord from notes
identify_chord(Notes, Root, ChordType) :-
    note(Root),
    chord(ChordType, _),
    chord_tones(Root, ChordType, ChordNotes),
    permutation(Notes, ChordNotes).

%% Identify scale from notes
identify_scale(Notes, Root, ScaleType) :-
    note(Root),
    scale(ScaleType, _),
    scale_notes(Root, ScaleType, ScaleNotes),
    subset(Notes, ScaleNotes).

subset([], _).
subset([H|T], List) :- member(H, List), subset(T, List).
