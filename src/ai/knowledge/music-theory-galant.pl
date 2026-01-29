%% music-theory-galant.pl - Galant / Schemata Knowledge for CardPlay AI
%%
%% Encodes a starter set of galant schemata as constraints and matching patterns.
%% This is not a complete corpus; it is a pragmatic KB scaffold designed for:
%% - phrase generation constraints ("generate a Prinner-like continuation")
%% - analysis ("this phrase resembles a Prinner with 7–6 chain")
%% - explanation surfaces in Schema-related cards
%%
%% Representation strategy:
%% - schemata are identified by atom ids: prinner, fonte, monte, romanesca, ...
%% - each schema stores at least one *degree skeleton* pattern
%% - additional metadata is captured as tags and cadence tendencies

%% ============================================================================
%% CORE SCHEMA FACTS
%% ============================================================================

galant_schema(prinner).
galant_schema(fonte).
galant_schema(monte).
galant_schema(romanesca).
galant_schema(meyer).
galant_schema(quiescenza).
galant_schema(do_re_mi).
galant_schema(cadential_64).
galant_schema(lament_bass).

%% schema_tag(+Schema, +Tag)
schema_tag(prinner, cadential).
schema_tag(prinner, descending).
schema_tag(fonte, sequential).
schema_tag(fonte, descending).
schema_tag(monte, sequential).
schema_tag(monte, ascending).
schema_tag(romanesca, sequential).
schema_tag(meyer, cadential).
schema_tag(quiescenza, cadential).
schema_tag(do_re_mi, opening).
schema_tag(cadential_64, cadential).
schema_tag(lament_bass, expressive).

%% schema_cadence(+Schema, +CadenceType)
%% Uses cadence ids already present in base KB where possible.
schema_cadence(prinner, authentic).
schema_cadence(fonte, half).
schema_cadence(monte, half).
schema_cadence(romanesca, authentic).
schema_cadence(meyer, authentic).
schema_cadence(quiescenza, perfect_authentic).
schema_cadence(do_re_mi, half).
schema_cadence(cadential_64, perfect_authentic).
schema_cadence(lament_bass, deceptive).

%% schema_pattern(+Schema, +Role, +Degrees)
%% Degrees are scale degrees (1..7) in a local key context.
%% Roles: soprano, bass. (Extend later: inner voices, harmony, figured bass)
schema_pattern(prinner, bass,    [4,3,2,1]).
schema_pattern(prinner, soprano, [6,5,4,3]).

schema_pattern(fonte, bass,    [4,3,2,1]).
schema_pattern(fonte, soprano, [6,5,4,3]).

schema_pattern(monte, bass,    [1,2,3,4]).
schema_pattern(monte, soprano, [3,4,5,6]).

schema_pattern(romanesca, bass,    [1,7,6,3]).
schema_pattern(romanesca, soprano, [5,5,6,5]).

schema_pattern(meyer, soprano, [1,7,1]).

%% Quiescenza and cadential 6/4 are better captured as harmonic frames; keep degree skeletons minimal
schema_pattern(quiescenza, bass, [4,5,1]).
schema_pattern(cadential_64, bass, [1,5,1]).

%% Do-Re-Mi: an opening upper-voice gesture (1-2-3) in the soprano is a common abstraction
schema_pattern(do_re_mi, soprano, [1,2,3]).

%% Lament bass: chromatic is hard to encode with diatonic degrees alone; store as degree tendency
schema_pattern(lament_bass, bass, [1,7,6,6]).

%% ============================================================================
%% MATCHING UTILITIES (LOW-COMPLEXITY)
%% ============================================================================

%% sublist(+Sub, +List) : Sub occurs contiguously inside List
sublist(Sub, List) :-
  append(_, Rest, List),
  append(Sub, _, Rest).

%% match_galant_schema(+DegreeSequence, -Schema, -Score)
%% Score is a simple heuristic:
%% - 100 if a known schema soprano or bass pattern occurs as a sublist
%% - 60 if only the first 2 degrees match contiguously
%% - 0 otherwise
match_galant_schema(Degrees, Schema, 100) :-
  galant_schema(Schema),
  schema_pattern(Schema, _Role, Pat),
  sublist(Pat, Degrees),
  !.
match_galant_schema(Degrees, Schema, 60) :-
  galant_schema(Schema),
  schema_pattern(Schema, _Role, [A,B|_]),
  sublist([A,B], Degrees),
  !.

%% recommend_galant_schema(+CadenceType, -Schema, -Reasons)
recommend_galant_schema(Cadence, Schema, [because(cadence(Cadence)), because(schema(Schema))]) :-
  schema_cadence(Schema, Cadence).

%% ============================================================================
%% SCHEMA EXTENSIONS (C261-C300)
%% ============================================================================

%% schema_era(+Schema, +Era)
%% Era context for schema usage
schema_era(prinner, galant).
schema_era(prinner, classical).
schema_era(fonte, galant).
schema_era(fonte, baroque).
schema_era(monte, galant).
schema_era(monte, baroque).
schema_era(romanesca, renaissance).
schema_era(romanesca, baroque).
schema_era(romanesca, galant).
schema_era(meyer, classical).
schema_era(quiescenza, baroque).
schema_era(quiescenza, galant).
schema_era(cadential_64, classical).
schema_era(lament_bass, baroque).
schema_era(lament_bass, romantic).

%% schema_length_bars(+Schema, +LengthBars)
%% Typical length in bars/measures
schema_length_bars(prinner, 2).
schema_length_bars(prinner, 4).
schema_length_bars(fonte, 4).
schema_length_bars(monte, 4).
schema_length_bars(romanesca, 4).
schema_length_bars(romanesca, 8).
schema_length_bars(meyer, 2).
schema_length_bars(quiescenza, 1).
schema_length_bars(quiescenza, 2).
schema_length_bars(cadential_64, 1).
schema_length_bars(do_re_mi, 2).

%% schema_harmony(+Schema, +Position, +RomanNumeral)
%% Position: 1-indexed slot in the schema
schema_harmony(prinner, 1, 'IV').
schema_harmony(prinner, 2, 'V6/5').
schema_harmony(prinner, 3, 'I6').
schema_harmony(prinner, 4, 'V').

schema_harmony(fonte, 1, 'ii').
schema_harmony(fonte, 2, 'V/ii').
schema_harmony(fonte, 3, 'I').
schema_harmony(fonte, 4, 'V').

schema_harmony(monte, 1, 'IV').
schema_harmony(monte, 2, 'V/V').
schema_harmony(monte, 3, 'V').
schema_harmony(monte, 4, 'V/vi').

schema_harmony(romanesca, 1, 'I').
schema_harmony(romanesca, 2, 'V6').
schema_harmony(romanesca, 3, 'vi').
schema_harmony(romanesca, 4, 'iii').

schema_harmony(cadential_64, 1, 'I6/4').
schema_harmony(cadential_64, 2, 'V').
schema_harmony(cadential_64, 3, 'I').

%% ============================================================================
%% SCHEMA VARIATIONS (C288-C300)
%% ============================================================================

%% schema_variation(+Schema, +VariationName, +Description)
schema_variation(prinner, riposte, 'Prinner with extended pickup').
schema_variation(prinner, leaping, 'Prinner with leap at start').
schema_variation(prinner, chromatic, 'Prinner with chromatic passing tones').
schema_variation(fonte, modulating, 'Fonte moving through more keys').
schema_variation(monte, double, 'Two iterations of Monte').
schema_variation(romanesca, galant, 'Romanesca simplified for galant style').

%% variation_pattern(+Schema, +VariationName, +Role, +Degrees)
variation_pattern(prinner, riposte, soprano, [5,6,5,4,3]).
variation_pattern(prinner, leaping, soprano, [8,5,4,3]).
variation_pattern(fonte, modulating, soprano, [6,5,4,3,2,1]).
variation_pattern(monte, double, soprano, [3,4,5,6,5,6,7,8]).

%% ============================================================================
%% 7-6 CHAIN SUPPORT (C295-C298)
%% ============================================================================

%% seven_six_chain(+StartDegree, +EndDegree, -Chain)
%% Generates a descending 7-6 suspension chain pattern
seven_six_chain(Start, End, Chain) :-
  Start >= End,
  seven_six_chain_(Start, End, Chain).

seven_six_chain_(End, End, [[End]]).
seven_six_chain_(Current, End, [[Current, Prev]|Rest]) :-
  Current > End,
  Prev is Current - 1,
  seven_six_chain_(Prev, End, Rest).

%% Prinner with 7-6 chain
schema_with_chain(prinner, '7-6', [6,5,4,3], [[6,5],[5,4],[4,3]]).

%% ============================================================================
%% SCHEMA COMBINATION (C299-C301)
%% ============================================================================

%% schema_follows(+Schema1, +Schema2, +Quality)
%% Common schema sequences
schema_follows(fonte, monte, common).
schema_follows(fonte, prinner, common).
schema_follows(monte, prinner, common).
schema_follows(do_re_mi, prinner, common).
schema_follows(prinner, cadential_64, common).
schema_follows(romanesca, prinner, occasional).
schema_follows(quiescenza, cadential_64, common).

%% recommend_schema_sequence(+CurrentSchema, -NextSchemas, -Reasons)
recommend_schema_sequence(Schema, NextSchemas, [because(follows_from(Schema))]) :-
  findall(Next, schema_follows(Schema, Next, _), NextSchemas),
  NextSchemas \= [].

%% recommend_opening_schema(-Schema, -Reasons)
recommend_opening_schema(Schema, [because(opening_tag), because(schema(Schema))]) :-
  schema_tag(Schema, opening).

%% recommend_closing_schema(-Schema, -Reasons)
recommend_closing_schema(Schema, [because(cadential_tag), because(schema(Schema))]) :-
  schema_tag(Schema, cadential).
%% ============================================================================
%% MORE SCHEMATA (C264-C283)
%% ============================================================================

galant_schema(ponte).
galant_schema(passo_indietro).
galant_schema(circolo).
galant_schema(indugio).
galant_schema(ascending_56).
galant_schema(descending_76).
galant_schema(rocket).
galant_schema(mannheim_sigh).
galant_schema(mannheim_roller).

%% Tags for new schemata
schema_tag(ponte, prolongation).
schema_tag(ponte, dominant).
schema_tag(passo_indietro, cadential).
schema_tag(passo_indietro, preparation).
schema_tag(circolo, sequential).
schema_tag(indugio, delay).
schema_tag(indugio, cadential).
schema_tag(ascending_56, sequential).
schema_tag(ascending_56, ascending).
schema_tag(descending_76, sequential).
schema_tag(descending_76, descending).
schema_tag(rocket, opening).
schema_tag(rocket, gesture).
schema_tag(mannheim_sigh, ornamental).
schema_tag(mannheim_roller, sequential).
schema_tag(mannheim_roller, ascending).

%% Cadence types for new schemata (C285)
schema_cadence(ponte, half).
schema_cadence(passo_indietro, authentic).
schema_cadence(circolo, half).
schema_cadence(indugio, authentic).
schema_cadence(ascending_56, none).
schema_cadence(descending_76, authentic).
schema_cadence(rocket, none).
schema_cadence(mannheim_sigh, none).
schema_cadence(mannheim_roller, half).

%% Patterns for new schemata
schema_pattern(ponte, bass, [5,5,5,1]).
schema_pattern(ponte, soprano, [2,2,2,3]).

schema_pattern(passo_indietro, bass, [2,5,1]).
schema_pattern(passo_indietro, soprano, [4,2,3]).

schema_pattern(circolo, bass, [1,4,7,3,6,2,5,1]).
schema_pattern(circolo, soprano, [5,4,4,3,3,2,2,1]).

schema_pattern(indugio, bass, [4,4,5,1]).
schema_pattern(indugio, soprano, [6,6,7,8]).

schema_pattern(ascending_56, bass, [1,1,2,2,3,3]).
schema_pattern(ascending_56, soprano, [3,4,4,5,5,6]).

schema_pattern(descending_76, bass, [5,5,4,4,3,3,2,2]).
schema_pattern(descending_76, soprano, [7,6,6,5,5,4,4,3]).

schema_pattern(rocket, soprano, [1,3,5,8]).
schema_pattern(mannheim_sigh, soprano, [5,4]).
schema_pattern(mannheim_roller, soprano, [1,2,3,4,5,6,7,8]).

%% Era contexts for new schemata
schema_era(ponte, galant).
schema_era(passo_indietro, galant).
schema_era(circolo, baroque).
schema_era(circolo, galant).
schema_era(indugio, galant).
schema_era(ascending_56, baroque).
schema_era(descending_76, baroque).
schema_era(rocket, classical).
schema_era(mannheim_sigh, classical).
schema_era(mannheim_roller, classical).

%% Length in bars
schema_length_bars(ponte, 2).
schema_length_bars(passo_indietro, 1).
schema_length_bars(circolo, 4).
schema_length_bars(circolo, 8).
schema_length_bars(indugio, 2).
schema_length_bars(ascending_56, 2).
schema_length_bars(ascending_56, 4).
schema_length_bars(descending_76, 2).
schema_length_bars(descending_76, 4).
schema_length_bars(rocket, 1).
schema_length_bars(mannheim_sigh, 1).
schema_length_bars(mannheim_roller, 2).
schema_length_bars(mannheim_roller, 4).

%% ============================================================================
%% SCHEMA CONSTRAINTS (C286-C287)
%% ============================================================================

%% schema_requires(+Schema, +Constraint)
schema_requires(prinner, meter(_, 4)).  % Duple or quadruple meter
schema_requires(fonte, meter(_, 4)).
schema_requires(monte, meter(_, 4)).
schema_requires(romanesca, harmonic_rhythm(slow)).
schema_requires(rocket, tempo(fast)).
schema_requires(mannheim_roller, tempo(moderate)).

%% schema_prefers(+Schema, +Preference, +Weight)
schema_prefers(prinner, ornament_density(medium), 0.7).
schema_prefers(fonte, ornament_density(low), 0.6).
schema_prefers(romanesca, ornament_density(high), 0.8).
schema_prefers(rocket, ornament_density(low), 0.9).
schema_prefers(mannheim_sigh, ornament_density(high), 0.9).

%% ============================================================================
%% SCHEMA REALIZATION (C293-C295)
%% ============================================================================

%% schema_realize_degrees(+Key, +Schema, +Role, -Notes)
%% Converts schema degrees to actual note names in a key
schema_realize_degrees(Key, Schema, Role, Notes) :-
  schema_pattern(Schema, Role, Degrees),
  scale_notes(Key, major, ScaleNotes),
  maplist(degree_to_note(ScaleNotes), Degrees, Notes).

degree_to_note(ScaleNotes, Degree, Note) :-
  D is ((Degree - 1) mod 7) + 1,
  nth1(D, ScaleNotes, Note).

%% schema_realize_harmony(+Key, +Schema, -Chords, -Reasons)
schema_realize_harmony(Key, Schema, Chords, Reasons) :-
  findall(Pos-Roman, schema_harmony(Schema, Pos, Roman), Harmonies),
  sort(Harmonies, SortedH),
  findall(Roman, member(_-Roman, SortedH), RomanList),
  maplist(roman_to_chord(Key), RomanList, Chords),
  format(atom(R), 'Realized ~w in key of ~w', [Schema, Key]),
  Reasons = [R].

roman_to_chord(Key, Roman, chord(Root, Quality)) :-
  roman_numeral_degree(Roman, Degree, Quality),
  scale_notes(Key, major, ScaleNotes),
  nth1(Degree, ScaleNotes, Root).

%% Basic roman numeral parsing (simplified)
roman_numeral_degree('I', 1, major).
roman_numeral_degree('I6', 1, major).
roman_numeral_degree('I6/4', 1, major).
roman_numeral_degree('ii', 2, minor).
roman_numeral_degree('iii', 3, minor).
roman_numeral_degree('IV', 4, major).
roman_numeral_degree('V', 5, major).
roman_numeral_degree('V6', 5, major).
roman_numeral_degree('V6/5', 5, dominant7).
roman_numeral_degree('V/ii', 6, major).  % Secondary dominant
roman_numeral_degree('V/V', 2, major).   % V of V
roman_numeral_degree('V/vi', 3, major).  % V of vi
roman_numeral_degree('vi', 6, minor).

%% ============================================================================
%% SCHEMA DIMINUTION (C322-C323)
%% ============================================================================

%% schema_diminution(+Schema, +Position, -OrnamentPattern)
schema_diminution(prinner, 1, [upper_neighbor, passing]).
schema_diminution(prinner, 2, [lower_neighbor]).
schema_diminution(prinner, 3, [passing]).
schema_diminution(prinner, 4, [none]).

schema_diminution(romanesca, 1, [upper_neighbor]).
schema_diminution(romanesca, 2, [passing, passing]).
schema_diminution(romanesca, 3, [none]).
schema_diminution(romanesca, 4, [lower_neighbor]).

%% ============================================================================
%% PHRASE FORM TEMPLATES (C328-C333)
%% ============================================================================

%% galant_phrase_form(+FormName, +SchemaSequence, +Description)
galant_phrase_form(sentence, [do_re_mi, prinner, cadential_64], 
  'Sentence form: presentation (2+2) + continuation + cadence').

galant_phrase_form(period, [do_re_mi, ponte, prinner, cadential_64],
  'Period form: antecedent + consequent with stronger final cadence').

galant_phrase_form(hybrid, [monte, fonte, cadential_64],
  'Hybrid form: sentence-period blend with sequential middle').

galant_phrase_form(sequential, [fonte, fonte, prinner],
  'Sequential: multiple descending sequences before close').

galant_phrase_form(expanded, [do_re_mi, monte, fonte, indugio, cadential_64],
  'Expanded form: full journey with delay before cadence').

%% recommend_phrase_form(+CadenceStrength, -Form, -Reasons)
recommend_phrase_form(strong, sentence, ['Strong cadence suggests sentence form']).
recommend_phrase_form(strong, period, ['Strong cadence also fits period form']).
recommend_phrase_form(weak, hybrid, ['Weak cadence suggests hybrid or open form']).

%% ============================================================================
%% SCHEMA SIMILARITY METRICS (C233-C234)
%% ============================================================================

%% schema_fingerprint(+Schema, -Fingerprint)
schema_fingerprint(Schema, fingerprint(Soprano, Bass, Cadence)) :-
  ( schema_pattern(Schema, soprano, Soprano) -> true ; Soprano = [] ),
  ( schema_pattern(Schema, bass, Bass) -> true ; Bass = [] ),
  ( schema_cadence(Schema, Cadence) -> true ; Cadence = none ).

%% schema_similarity(+Schema1, +Schema2, -Similarity0to100)
schema_similarity(Schema1, Schema2, Similarity) :-
  schema_fingerprint(Schema1, fingerprint(S1, B1, C1)),
  schema_fingerprint(Schema2, fingerprint(S2, B2, C2)),
  list_overlap(S1, S2, SopranoScore),
  list_overlap(B1, B2, BassScore),
  ( C1 = C2 -> CadScore is 100 ; CadScore is 0 ),
  Similarity is (SopranoScore * 0.4) + (BassScore * 0.4) + (CadScore * 0.2).

list_overlap([], _, 0) :- !.
list_overlap(_, [], 0) :- !.
list_overlap(L1, L2, Score) :-
  findall(X, (member(X, L1), member(X, L2)), Common),
  length(Common, CommonLen),
  length(L1, Len1),
  length(L2, Len2),
  MaxLen is max(Len1, Len2),
  Score is (CommonLen / MaxLen) * 100.

%% ============================================================================
%% SCHEMA INDEX (C352-C355)
%% ============================================================================

%% schema_index(+Cadence, +Role, -Schema)
%% Fast lookup by cadence and role
schema_index(Cadence, Role, Schema) :-
  schema_cadence(Schema, Cadence),
  schema_tag(Schema, Role).

%% All schemata by tag
schemata_by_tag(Tag, Schemata) :-
  findall(S, schema_tag(S, Tag), Schemata).

%% schemata_by_cadence(+Cadence, -Schemata)
schemata_by_cadence(Cadence, Schemata) :-
  findall(S, schema_cadence(S, Cadence), Schemata).

%% ============================================================================
%% DEGREE SKELETON EXTRACTION (C291)
%% ============================================================================

%% degree_skeleton(+Melody, -Skeleton)
%% Extract structural scale degrees from a melody (list of MIDI pitches)
%% by filtering to metrically strong positions and removing passing tones.
%% Melody = list of evt(Start, Dur, Pitch) events
%% Skeleton = list of scale degrees (1-7)
degree_skeleton(Melody, Skeleton) :-
  %% Use duration as proxy for structural weight
  findall(Deg, (
    member(evt(_, Dur, Pitch), Melody),
    Dur >= 240,  % at least an eighth note at 480 ticks/quarter
    pitch_to_degree(Pitch, Deg)
  ), Skeleton0),
  ( Skeleton0 = [] ->
      %% Fallback: use all notes
      findall(Deg, (
        member(evt(_, _, Pitch), Melody),
        pitch_to_degree(Pitch, Deg)
      ), Skeleton)
  ;   Skeleton = Skeleton0
  ).

%% pitch_to_degree(+MidiPitch, -Degree1to7)
%% Map MIDI pitch to scale degree in C major (default context).
%% For key-aware mapping, use pitch_to_degree/3.
pitch_to_degree(Pitch, Degree) :-
  PC is Pitch mod 12,
  pc_to_degree(PC, Degree).

pc_to_degree(0, 1).  % C
pc_to_degree(2, 2).  % D
pc_to_degree(4, 3).  % E
pc_to_degree(5, 4).  % F
pc_to_degree(7, 5).  % G
pc_to_degree(9, 6).  % A
pc_to_degree(11, 7). % B
%% Chromatic tones map to nearest degree
pc_to_degree(1, 1).  % C#→1
pc_to_degree(3, 2).  % Eb→2
pc_to_degree(6, 4).  % F#→4
pc_to_degree(8, 5).  % Ab→5
pc_to_degree(10, 7). % Bb→7

%% pitch_to_degree(+MidiPitch, +KeyRootPC, -Degree1to7)
%% Key-aware degree extraction: transpose to C then map.
pitch_to_degree(Pitch, KeyRootPC, Degree) :-
  PC is (Pitch - KeyRootPC + 12) mod 12,
  pc_to_degree(PC, Degree).

%% ============================================================================
%% SCHEMA FIT (C292)
%% ============================================================================

%% schema_fit(+MelodyDegrees, +BassDegrees, -Schema, -Score)
%% Score a melody+bass degree pair against known schemata.
%% Returns best-matching schema and fit score (0-100).
schema_fit(MelodyDegrees, BassDegrees, Schema, Score) :-
  galant_schema(Schema),
  schema_fit_score(MelodyDegrees, BassDegrees, Schema, Score),
  Score > 0.

schema_fit_score(MelodyDegrees, BassDegrees, Schema, Score) :-
  ( schema_pattern(Schema, soprano, SopPat) ->
      degree_match_score(MelodyDegrees, SopPat, SopScore)
  ;   SopScore is 0
  ),
  ( schema_pattern(Schema, bass, BassPat) ->
      degree_match_score(BassDegrees, BassPat, BassScore)
  ;   BassScore is 0
  ),
  %% Weight soprano and bass equally
  Score is (SopScore + BassScore) / 2.

%% degree_match_score(+InputDegrees, +PatternDegrees, -Score0to100)
%% How well does the input degree sequence match the pattern?
degree_match_score(Input, Pattern, Score) :-
  length(Pattern, PatLen),
  ( PatLen =:= 0 -> Score is 0
  ;   %% Check if pattern is a sublist of input
      ( sublist(Pattern, Input) -> Score is 100
      ; %% Check partial match (first N degrees)
        length(Input, InLen),
        MinLen is min(InLen, PatLen),
        length(InputPrefix, MinLen),
        append(InputPrefix, _, Input),
        length(PatPrefix, MinLen),
        append(PatPrefix, _, Pattern),
        count_matching(InputPrefix, PatPrefix, Matches),
        Score is (Matches / PatLen) * 100
      )
  ).

count_matching([], [], 0).
count_matching([X|Xs], [Y|Ys], Count) :-
  count_matching(Xs, Ys, RestCount),
  ( X =:= Y -> Count is RestCount + 1 ; Count is RestCount ).

%% ============================================================================
%% RECOMMEND SCHEMA FOR CADENCE (C299)
%% ============================================================================

%% recommend_schema_for_cadence(+Spec, +CadenceType, -Schema, -Reasons)
%% Recommend schemata that naturally lead to a specific cadence type.
recommend_schema_for_cadence(Spec, CadenceType, Schema, Reasons) :-
  schema_cadence(Schema, CadenceType),
  Spec = music_spec(_, _, _, _, Style, Culture, _),
  %% Filter by culture compatibility
  ( Culture = western ; Culture = hybrid ),
  %% Filter by style compatibility if galant style
  ( Style = galant ->
      schema_era(Schema, galant)
  ; Style = classical ->
      ( schema_era(Schema, classical) ; schema_era(Schema, galant) )
  ; Style = baroque ->
      ( schema_era(Schema, baroque) ; schema_era(Schema, galant) )
  ; true  % any style accepts any schema
  ),
  format(atom(R1), 'Schema ~w produces ~w cadence', [Schema, CadenceType]),
  format(atom(R2), 'Compatible with ~w style, ~w culture', [Style, Culture]),
  Reasons = [R1, R2].

%% ============================================================================
%% SUSPENSIONS AND VOICE LEADING (C324-C327)
%% ============================================================================

%% suspension(+SuspType, +PrepDegree, +SusDegree, +ResDegree)
%% Standard suspensions with preparation, suspension, and resolution degrees.
suspension('4-3', 4, 4, 3).
suspension('7-6', 7, 7, 6).
suspension('9-8', 9, 9, 8).
suspension('2-3', 2, 2, 3).  % bass suspension (retardation)

%% schema_suspension(+Schema, +Position, +SuspType)
%% Which suspensions are idiomatic at which positions in a schema.
schema_suspension(prinner, 2, '7-6').
schema_suspension(prinner, 3, '4-3').
schema_suspension(fonte, 2, '7-6').
schema_suspension(monte, 3, '4-3').
schema_suspension(romanesca, 2, '7-6').
schema_suspension(descending_76, 1, '7-6').
schema_suspension(descending_76, 3, '7-6').
schema_suspension(descending_76, 5, '7-6').
schema_suspension(descending_76, 7, '7-6').
schema_suspension(cadential_64, 1, '4-3').

%% galant_counterpoint_ok(+Voice1Degree, +Voice2Degree, +Motion, -Quality)
%% Check if two-voice counterpoint motion is acceptable in galant style.
%% Motion: parallel, contrary, oblique, similar
%% Quality: good, acceptable, avoid
galant_counterpoint_ok(D1, D2, contrary, good) :-
  D1 \= D2.
galant_counterpoint_ok(D1, D2, oblique, good) :-
  D1 \= D2.
galant_counterpoint_ok(D1, D2, similar, acceptable) :-
  Interval is abs(D2 - D1),
  \+ member(Interval, [0, 7, 12]).  % avoid parallel unisons/octaves/fifths
galant_counterpoint_ok(D1, D2, parallel, avoid) :-
  Interval is abs(D2 - D1),
  member(Interval, [0, 7, 12]).  % parallel unisons/octaves/fifths
galant_counterpoint_ok(_, _, parallel, acceptable) :-
  true.  % parallel thirds/sixths are acceptable

%% galant_voice_leading_ok(+SopDegrees, +BassDegrees, -Issues)
%% Check voice leading between soprano and bass in galant style.
galant_voice_leading_ok(SopDegrees, BassDegrees, Issues) :-
  check_voice_leading(SopDegrees, BassDegrees, [], Issues).

check_voice_leading([], [], Acc, Acc).
check_voice_leading([_], [_], Acc, Acc).
check_voice_leading([S1, S2|Ss], [B1, B2|Bs], Acc, Issues) :-
  SDiff is S2 - S1,
  BDiff is B2 - B1,
  ( SDiff > 0, BDiff > 0 -> Motion = parallel
  ; SDiff < 0, BDiff < 0 -> Motion = parallel
  ; SDiff =:= 0 -> Motion = oblique
  ; BDiff =:= 0 -> Motion = oblique
  ; Motion = contrary
  ),
  Interval is abs(S2 - B2) mod 7,
  ( Motion = parallel, member(Interval, [0, 4]) ->
      format(atom(Issue), 'Parallel ~w at degrees ~w/~w', [Interval, S2, B2]),
      append(Acc, [Issue], Acc2)
  ; Acc2 = Acc
  ),
  check_voice_leading([S2|Ss], [B2|Bs], Acc2, Issues).

%% ============================================================================
%% RULE OF THE OCTAVE (C318-C319)
%% ============================================================================

%% rule_of_octave(+Direction, +BassDegree, -Harmony)
%% Standard rule-of-the-octave harmonizations.
%% Direction: ascending | descending
rule_of_octave(ascending, 1, 'I').
rule_of_octave(ascending, 2, 'V6/5').
rule_of_octave(ascending, 3, 'I6').
rule_of_octave(ascending, 4, 'IV').
rule_of_octave(ascending, 5, 'V').
rule_of_octave(ascending, 6, 'IV6').
rule_of_octave(ascending, 7, 'V6').

rule_of_octave(descending, 1, 'I').
rule_of_octave(descending, 7, 'V6').
rule_of_octave(descending, 6, 'I6/4').
rule_of_octave(descending, 5, 'V').
rule_of_octave(descending, 4, 'ii6').
rule_of_octave(descending, 3, 'I6').
rule_of_octave(descending, 2, 'V4/3').

%% partimento_rule(+BassDegree, +Context, -FiguredBass)
%% Partimento bass rules (C314-C315).
%% Context: opening | continuation | cadential
partimento_rule(1, opening, '5/3').
partimento_rule(1, cadential, '5/3').
partimento_rule(2, continuation, '6').
partimento_rule(3, continuation, '6').
partimento_rule(4, opening, '5/3').
partimento_rule(4, cadential, '6/5').
partimento_rule(5, opening, '5/3').
partimento_rule(5, cadential, '5/3').
partimento_rule(6, continuation, '6').
partimento_rule(7, cadential, '6').

%% ============================================================================
%% GALANT CADENCE PATTERNS (C320-C321)
%% ============================================================================

%% galant_cadence_pattern(+PatternName, +BassDegrees, +SopranoDegrees)
galant_cadence_pattern(simple_pac, [5, 1], [2, 1]).
galant_cadence_pattern(compound_pac, [4, 5, 1], [6, 7, 8]).
galant_cadence_pattern(meyer_cadence, [1, 7, 1], [1, 7, 1]).
galant_cadence_pattern(quiescenza_cadence, [4, 5, 1], [6, 5, 5]).
galant_cadence_pattern(cudworth_cadence, [4, 5, 1], [4, 2, 3]).
galant_cadence_pattern(half_cadence, [1, 5], [3, 2]).
galant_cadence_pattern(phrygian_hc, [3, 2, 5], [5, 4, 5]).
galant_cadence_pattern(evaded_cadence, [5, 6], [2, 1]).

%% ============================================================================
%% SCHEMA CHAIN RECOMMENDATION (C336)
%% ============================================================================

%% recommend_schema_chain(+Spec, +Length, -Chain, -Reasons)
%% Generate a recommended chain of schemata of given length.
%% Uses schema_follows/3 tendency rules and form templates.
recommend_schema_chain(Spec, Length, Chain, Reasons) :-
  Length > 0,
  Spec = music_spec(_, _, _, _, _, Culture, _),
  ( Culture = western ; Culture = hybrid ),
  %% Start with an opening schema
  findall(S, schema_tag(S, opening), OpeningSchemas),
  ( OpeningSchemas = [Start|_] -> true ; Start = do_re_mi ),
  build_chain(Start, Length, 1, [Start], Chain),
  format(atom(R), 'Chain of ~w schemata starting with ~w', [Length, Start]),
  Reasons = [R, 'Built using schema tendency rules'].

build_chain(_, MaxLen, MaxLen, Acc, Chain) :-
  reverse(Acc, Chain).
build_chain(Current, MaxLen, N, Acc, Chain) :-
  N < MaxLen,
  N1 is N + 1,
  %% If near the end, prefer cadential schemas
  Remaining is MaxLen - N,
  ( Remaining =< 1 ->
      %% Last schema should be cadential
      ( schema_follows(Current, Next, _), schema_tag(Next, cadential) ->
          true
      ; findall(S, schema_tag(S, cadential), CadSchemas),
        CadSchemas = [Next|_]
      )
  ; %% Otherwise follow tendency rules
    ( schema_follows(Current, Next, _) ->
        true
    ; %% Fallback: pick a sequential or continuation schema
      findall(S, schema_tag(S, sequential), SeqSchemas),
      ( SeqSchemas = [Next|_] -> true ; Next = prinner )
    )
  ),
  build_chain(Next, MaxLen, N1, [Next|Acc], Chain).

%% ============================================================================
%% SCHEMA-TO-FILM BRIDGE (C356-C357)
%% ============================================================================

%% schema_film_analogue(+Schema, +FilmDevice, +Reasons)
%% Map galant cadential patterns to cinematic analogues.
schema_film_analogue(prinner, suspension_chain,
  'Prinner descending parallel ≈ cinematic suspension chain').
schema_film_analogue(fonte, chromatic_mediant,
  'Fonte descending sequence ≈ chromatic mediant shifts').
schema_film_analogue(monte, trailer_rise,
  'Monte ascending sequence ≈ trailer rise build').
schema_film_analogue(romanesca, pedal_point,
  'Romanesca bass pattern ≈ tonic pedal with upper voice motion').
schema_film_analogue(lament_bass, ostinato,
  'Lament chromatic bass ≈ cinematic ostinato').
schema_film_analogue(cadential_64, cadence_deferral,
  'Cadential 6/4 delay ≈ cinematic cadence deferral').
schema_film_analogue(indugio, cadence_deferral,
  'Indugio lingering ≈ extended cadence deferral').

%% ============================================================================
%% SCHEMA-TO-POP BRIDGE (C358-C359)
%% ============================================================================

%% schema_pop_analogue(+Schema, +PopPattern, +Reasons)
%% Map galant schemata to common pop/rock progressions.
schema_pop_analogue(romanesca, 'I-V-vi-iii',
  'Romanesca bass 1-7-6-3 maps to I-V-vi-iii (pop canon)').
schema_pop_analogue(prinner, 'vi-V-IV-I',
  'Prinner bass 4-3-2-1 over upper 6-5-4-3 maps to vi-V-IV-I').
schema_pop_analogue(lament_bass, 'i-bVII-bVI-V',
  'Lament descending bass maps to Andalusian cadence / pop minor descent').
schema_pop_analogue(monte, 'IV-V-vi-V',
  'Monte ascending pattern maps to ascending pop energy build').
schema_pop_analogue(do_re_mi, 'I-V/vi-vi',
  'Do-Re-Mi opening gesture maps to common pop verse opening').

%% ============================================================================
%% SCHEMA HARMONIC RHYTHM (C313)
%% ============================================================================

%% schema_harmonic_rhythm(+Schema, -ChordsPerBar)
%% Default harmonic rhythm for each schema type.
schema_harmonic_rhythm(prinner, 2).
schema_harmonic_rhythm(fonte, 2).
schema_harmonic_rhythm(monte, 2).
schema_harmonic_rhythm(romanesca, 1).
schema_harmonic_rhythm(quiescenza, 2).
schema_harmonic_rhythm(do_re_mi, 1).
schema_harmonic_rhythm(ponte, 1).
schema_harmonic_rhythm(passo_indietro, 2).
schema_harmonic_rhythm(circolo, 2).
schema_harmonic_rhythm(cadential_64, 2).
schema_harmonic_rhythm(indugio, 1).
schema_harmonic_rhythm(lament_bass, 1).
schema_harmonic_rhythm(ascending_56, 2).
schema_harmonic_rhythm(descending_76, 2).
schema_harmonic_rhythm(omnibus, 1).
schema_harmonic_rhythm(rocket, 1).
schema_harmonic_rhythm(mannheim_sigh, 2).
schema_harmonic_rhythm(mannheim_roller, 2).

%% ============================================================================
%% GALANT VOICE LEADING (C316-C317)
%% ============================================================================

%% galant_voice_leading_ok(+SopranoLine, +BassLine, -Issues)
%% Check voice leading quality for galant texture (outer voices priority).
%% Returns empty list if OK, otherwise list of issues.
galant_voice_leading_ok(Soprano, Bass, Issues) :-
  check_galant_vl(Soprano, Bass, [], Issues).

check_galant_vl([], _, Acc, Acc).
check_galant_vl([_], _, Acc, Acc).
check_galant_vl([S1, S2|Ss], [B1, B2|Bs], Acc, Issues) :-
  SMotion is S2 - S1,
  BMotion is B2 - B1,
  %% Check parallel unisons
  ( S1 =:= B1, S2 =:= B2 ->
      append(Acc, ['Parallel unisons'], Acc2)
  ;
  %% Check parallel fifths/octaves
  Interval1 is abs(S1 - B1) mod 12,
  Interval2 is abs(S2 - B2) mod 12,
  ( Interval1 =:= 7, Interval2 =:= 7, SMotion =\= 0 ->
      append(Acc, ['Parallel fifths'], Acc2)
  ; Interval1 =:= 0, Interval2 =:= 0, SMotion =\= 0 ->
      append(Acc, ['Parallel octaves'], Acc2)
  ;
  %% Check voice crossing
  ( S2 < B2 ->
      append(Acc, ['Voice crossing'], Acc2)
  ;
  %% Check large leaps (> octave)
  ( abs(SMotion) > 12 ->
      append(Acc, ['Soprano leap > octave'], Acc2)
  ; abs(BMotion) > 12 ->
      append(Acc, ['Bass leap > octave'], Acc2)
  ; Acc2 = Acc
  ))))),
  check_galant_vl([S2|Ss], [B2|Bs], Acc2, Issues).

%% ============================================================================
%% RECOMMEND GALANT SCHEMA (C300 wrapper predicate)
%% ============================================================================

%% recommend_galant_schema(+Spec, -SchemaList, -Reasons)
%% Returns ranked list of recommended schemata for the current spec.
recommend_galant_schema(Spec, SchemaList, Reasons) :-
  Spec = music_spec(_, _, _, _, _, Culture, constraints(Cs)),
  ( Culture = western ; Culture = hybrid ),
  %% Gather all schema recommendations
  findall(schema_rec(Schema, Score), (
    galant_schema(Schema),
    schema_score_for_spec(Schema, Cs, Score),
    Score > 0
  ), AllRecs),
  sort(2, @>=, AllRecs, Sorted),
  maplist(extract_schema, Sorted, SchemaList),
  Reasons = [because('Schemata ranked by fit with current spec constraints')].

extract_schema(schema_rec(S, _), S).

schema_score_for_spec(Schema, Constraints, Score) :-
  %% Base score
  BaseScore is 50,
  %% Cadence match bonus
  ( member(cadence(CadType), Constraints),
    schema_cadence(Schema, CadType) ->
      CadBonus is 30
  ; CadBonus is 0
  ),
  %% Tag match bonus (opening/cadential based on position constraints)
  ( member(position(opening), Constraints),
    schema_tag(Schema, opening) ->
      PosBonus is 20
  ; member(position(cadential), Constraints),
    schema_tag(Schema, cadential) ->
      PosBonus is 20
  ; PosBonus is 0
  ),
  Score is BaseScore + CadBonus + PosBonus.

%% deck_requires_schema_tools(+DeckType, -RequiredTools)
%% Which schema tools are needed for galant-related deck types. (C348)
deck_requires_schema_tools(galant_analysis, [schema_matcher, voice_leading_checker, schema_sequence]).
deck_requires_schema_tools(partimento_realization, [schema_matcher, bass_pattern_analyzer, figured_bass]).
deck_requires_schema_tools(schema_composition, [schema_matcher, schema_sequencer, voice_leading_checker]).
deck_requires_schema_tools(style_analysis, [schema_matcher, period_detector, cadence_analyzer]).