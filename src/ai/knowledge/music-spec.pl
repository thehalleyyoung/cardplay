%% music-spec.pl - Music Specification Predicates for CardPlay AI (Branch C)
%%
%% Provides the Prolog-side representation of MusicSpec and constraint handling.
%% This module is loaded alongside the theory KBs and provides:
%% - spec_conflict/3 detection (C049)
%% - spec_normalize/2 canonicalization (C050)
%% - current_spec/1 accessor (C056)
%% - constraint/1 family (C057)
%% - with_constraints/3 (C058)
%% - satisfies/2 and violates/2 (C059-C060)
%% - recommend_*/3 and explain_*/3 conventions (C063)
%%
%% Depends on: music-theory.pl

%% ============================================================================
%% CURRENT SPEC (C056)
%% ============================================================================

%% Dynamic storage for the current spec (set by TS bridge)
:- dynamic(spec_key/3).
:- dynamic(spec_meter/3).
:- dynamic(spec_tempo/2).
:- dynamic(spec_tonality_model/2).
:- dynamic(spec_style/2).
:- dynamic(spec_culture/2).
:- dynamic(spec_constraint/4).

%% current_spec/1 - unified accessor for the active spec
%% Returns the current spec as a music_spec/7 term
current_spec(music_spec(
  key(KeyRoot, Mode),
  meter(Num, Den),
  tempo(Tempo),
  tonality_model(Model),
  style(Style),
  culture(Culture),
  constraints(Constraints)
)) :-
  ( spec_key(current, KeyRoot, Mode) -> true ; KeyRoot = c, Mode = major ),
  ( spec_meter(current, Num, Den) -> true ; Num = 4, Den = 4 ),
  ( spec_tempo(current, Tempo) -> true ; Tempo = 120 ),
  ( spec_tonality_model(current, Model) -> true ; Model = ks_profile ),
  ( spec_style(current, Style) -> true ; Style = cinematic ),
  ( spec_culture(current, Culture) -> true ; Culture = western ),
  findall(C, spec_constraint(current, C, _, _), Constraints).

%% ============================================================================
%% CONSTRAINT FAMILY (C057)
%% ============================================================================

%% constraint/1 - retrieve normalized constraints from current spec
constraint(C) :-
  spec_constraint(current, C, _, _).

%% hard_constraint/1 - only hard constraints
hard_constraint(C) :-
  spec_constraint(current, C, hard, _).

%% soft_constraint/2 - soft constraints with weight
soft_constraint(C, Weight) :-
  spec_constraint(current, C, soft, Weight).

%% constraint_type/2 - extract type from constraint term
constraint_type(key(_, _), key).
constraint_type(tempo(_), tempo).
constraint_type(meter(_, _), meter).
constraint_type(tonality_model(_), tonality_model).
constraint_type(style(_), style).
constraint_type(culture(_), culture).
constraint_type(schema(_), schema).
constraint_type(raga(_), raga).
constraint_type(tala(_), tala).
constraint_type(tala(_, _), tala).
constraint_type(celtic_tune(_), celtic_tune).
constraint_type(chinese_mode(_), chinese_mode).
constraint_type(chinese_mode(_, _), chinese_mode).
constraint_type(film_mood(_), film_mood).
constraint_type(film_device(_), film_device).
constraint_type(phrase_density(_), phrase_density).
constraint_type(contour(_), contour).
constraint_type(grouping(_), grouping).
constraint_type(accent_model(_), accent_model).
constraint_type(gamaka_density(_), gamaka_density).
constraint_type(ornament_budget(_), ornament_budget).
constraint_type(harmonic_rhythm(_), harmonic_rhythm).
constraint_type(cadence(_), cadence).

%% ============================================================================
%% WITH_CONSTRAINTS (C058)
%% ============================================================================

%% with_constraints/3 - derive a new spec with additional constraints
with_constraints(
  music_spec(Key, Meter, Tempo, Model, Style, Culture, constraints(Cs1)),
  ExtraConstraints,
  music_spec(Key, Meter, Tempo, Model, Style, Culture, constraints(Cs2))
) :-
  append(Cs1, ExtraConstraints, Cs2).

%% ============================================================================
%% SATISFIES / VIOLATES (C059-C060)
%% ============================================================================

%% satisfies/2 - check if a candidate satisfies a constraint
%% Candidates can be various musical elements (chord, melody, phrase, etc.)

%% Key constraints
satisfies(chord(Root, _Quality), key(KeyRoot, Mode)) :-
  scale_notes(KeyRoot, Mode, ScaleNotes),
  member(Root, ScaleNotes).

satisfies(note(NoteName), key(KeyRoot, Mode)) :-
  scale_notes(KeyRoot, Mode, ScaleNotes),
  member(NoteName, ScaleNotes).

%% Tempo constraints (allow 5% tolerance by default)
satisfies(tempo_value(T), tempo(Target)) :-
  Diff is abs(T - Target),
  Diff =< Target * 0.05.

%% Meter constraints
satisfies(meter_value(N, D), meter(N, D)).

%% Schema constraints - melody degree sequence matches schema pattern
satisfies(degree_sequence(Degrees), schema(Schema)) :-
  galant_schema(Schema),
  schema_pattern(Schema, _, Pat),
  sublist(Pat, Degrees).

%% Raga constraints - pitch class set is subset of raga
satisfies(pitch_class_set(PCs), raga(Raga)) :-
  raga_pcs(Raga, RagaPCs),
  subset(PCs, RagaPCs).

%% Celtic tune - mode preference
satisfies(mode(Mode), celtic_tune(TuneType)) :-
  celtic_prefers_mode(TuneType, Mode, Weight),
  Weight > 0.3.

%% Chinese mode - pitch class set
satisfies(pitch_class_set(PCs), chinese_mode(Mode)) :-
  chinese_pentatonic_mode(Mode, ModePCs),
  subset(PCs, ModePCs).

%% Film mood - mode preferences
satisfies(mode(Mode), film_mood(Mood)) :-
  mood_prefers_mode(Mood, Mode, Weight),
  Weight > 0.3.

%% Generic fallback - unrecognized constraints always pass (soft)
satisfies(_, Constraint) :-
  \+ constraint_type(Constraint, _).

%% violates/2 - inverse of satisfies, with explanation hooks
violates(Candidate, Constraint) :-
  \+ satisfies(Candidate, Constraint).

%% violation_reason/3 - explain why a candidate violates a constraint
violation_reason(chord(Root, _), key(KeyRoot, Mode), Reason) :-
  \+ satisfies(chord(Root, _), key(KeyRoot, Mode)),
  format(atom(Reason), 'Chord root ~w is not in ~w ~w scale', [Root, KeyRoot, Mode]).

violation_reason(pitch_class_set(PCs), raga(Raga), Reason) :-
  raga_pcs(Raga, RagaPCs),
  findall(PC, (member(PC, PCs), \+ member(PC, RagaPCs)), Bad),
  format(atom(Reason), 'Pitch classes ~w are not in raga ~w', [Bad, Raga]).

%% ============================================================================
%% SPEC CONFLICT DETECTION (C049)
%% ============================================================================

%% spec_conflict/3 - detect conflicts between constraints
%% Returns: spec_conflict(Constraint1, Constraint2, Reason)

%% Culture conflicts
spec_conflict(culture(carnatic), schema(_), 
  'Galant schemata are Western; consider culture(hybrid) or removing schema').

spec_conflict(culture(celtic), schema(_),
  'Galant schemata are Western; consider culture(hybrid) or removing schema').

spec_conflict(culture(chinese), schema(_),
  'Galant schemata are Western; consider culture(hybrid) or removing schema').

spec_conflict(culture(western), raga(_),
  'Raga constraints are Carnatic; consider culture(hybrid) or carnatic').

spec_conflict(culture(western), tala(_),
  'Tala constraints are Carnatic; consider culture(hybrid) or carnatic').

spec_conflict(culture(western), chinese_mode(_),
  'Chinese modes conflict with Western culture; consider culture(hybrid)').

%% Style conflicts
spec_conflict(style(galant), film_mood(_),
  'Galant style conflicts with film mood; consider style(cinematic)').

spec_conflict(style(edm), schema(_),
  'EDM style rarely uses galant schemata; consider removing schema').

%% Mode conflicts with culture
spec_conflict(key(_, lydian), culture(carnatic),
  'Lydian mode does not map to a standard raga; use specific raga constraint').

%% Film device conflicts
spec_conflict(film_device(whole_tone_wash), key(_, major),
  'Whole-tone wash obscures major tonality; consider mode(whole_tone)').

spec_conflict(film_device(octatonic_action), key(_, major),
  'Octatonic scale conflicts with major; use octatonic mode or hybrid approach').

%% Ornament budget conflicts with tempo
spec_conflict(ornament_budget(MaxPerBeat), tempo(T),
  Reason) :-
  T > 180,
  MaxPerBeat > 2,
  format(atom(Reason), 'High ornament density (~w/beat) at tempo ~w may be unplayable', [MaxPerBeat, T]).

%% Check all constraints for conflicts
all_spec_conflicts(Conflicts) :-
  findall(conflict(C1, C2, Reason), (
    constraint(C1),
    constraint(C2),
    C1 @< C2,
    spec_conflict(C1, C2, Reason)
  ), Conflicts).

%% ============================================================================
%% SPEC NORMALIZATION (C050)
%% ============================================================================

%% spec_normalize/2 - canonicalize equivalent specs
%% Handles enharmonic equivalents, mode aliases, etc.

%% Enharmonic root normalization (prefer sharps except for common flats)
normalize_root(dflat, csharp) :- !.
normalize_root(gflat, fsharp) :- !.
normalize_root(aflat, gsharp) :- !.
%% Keep common flats as-is
normalize_root(eflat, eflat) :- !.
normalize_root(bflat, bflat) :- !.
normalize_root(R, R).

%% Mode alias normalization
normalize_mode(ionian, major) :- !.
normalize_mode(aeolian, natural_minor) :- !.
normalize_mode(M, M).

%% Normalize a key constraint
normalize_constraint(key(Root, Mode), key(NRoot, NMode)) :-
  normalize_root(Root, NRoot),
  normalize_mode(Mode, NMode),
  !.

%% Other constraints pass through
normalize_constraint(C, C).

%% Normalize entire spec
spec_normalize(
  music_spec(key(R1, M1), Meter, Tempo, Model, Style, Culture, constraints(Cs)),
  music_spec(key(R2, M2), Meter, Tempo, Model, Style, Culture, constraints(NCs))
) :-
  normalize_root(R1, R2),
  normalize_mode(M1, M2),
  maplist(normalize_constraint, Cs, NCs).

%% ============================================================================
%% RECOMMENDATION CONVENTIONS (C063)
%% ============================================================================

%% recommend_*/3 and explain_*/3 convention:
%% - recommend_X(Spec, Recommendation, Confidence)
%% - explain_X(Spec, Recommendation, Reasons)

%% Example: recommend mode based on culture
recommend_mode(Spec, Mode, Confidence) :-
  Spec = music_spec(_, _, _, _, _, Culture, _),
  culture_suggests_mode(Culture, Mode, Confidence).

%% Culture-based mode suggestions
culture_suggests_mode(western, major, 0.8).
culture_suggests_mode(western, natural_minor, 0.7).
culture_suggests_mode(carnatic, Mode, 0.9) :-
  constraint(raga(Raga)),
  raga_mode_approximation(Raga, Mode).
culture_suggests_mode(celtic, dorian, 0.7).
culture_suggests_mode(celtic, mixolydian, 0.7).
culture_suggests_mode(chinese, Mode, 0.8) :-
  constraint(chinese_mode(ChMode)),
  chinese_mode_to_western(ChMode, Mode).

%% Fallback for cultures without specific raga/mode
culture_suggests_mode(carnatic, natural_minor, 0.5).
culture_suggests_mode(chinese, pentatonic_major, 0.5).

%% Raga to Western mode approximation (rough)
raga_mode_approximation(mohanam, pentatonic_major).
raga_mode_approximation(hamsadhwani, major).
raga_mode_approximation(kalyani, lydian).
raga_mode_approximation(keeravani, harmonic_minor).
raga_mode_approximation(shankarabharanam, major).

%% Chinese mode to Western approximation
chinese_mode_to_western(gong, major).
chinese_mode_to_western(shang, dorian).
chinese_mode_to_western(jiao, phrygian).
chinese_mode_to_western(zhi, mixolydian).
chinese_mode_to_western(yu, natural_minor).

%% Explain mode recommendation
explain_mode(Spec, Mode, Reasons) :-
  recommend_mode(Spec, Mode, _),
  Spec = music_spec(_, _, _, _, _, Culture, _),
  format(atom(R1), 'Mode ~w suggested for ~w culture', [Mode, Culture]),
  Reasons = [R1].

%% ============================================================================
%% CONSTRAINT PACKS (C089-C090)
%% ============================================================================

%% constraint_pack/2 - predefined constraint combinations
constraint_pack(cinematic_heroic, [
  film_mood(heroic),
  film_device(pedal_point),
  film_device(chromatic_mediant),
  culture(western),
  style(cinematic)
]).

constraint_pack(galant_phrase, [
  style(galant),
  culture(western),
  harmonic_rhythm(2)
]).

constraint_pack(carnatic_alapana, [
  culture(carnatic),
  phrase_density(sparse),
  ornament_budget(3)
]).

constraint_pack(celtic_reel, [
  culture(celtic),
  celtic_tune(reel),
  meter(4, 4)
]).

constraint_pack(chinese_heterophony, [
  culture(chinese),
  phrase_density(medium)
]).

constraint_pack(horror, [
  film_mood(ominous),
  film_device(cluster_tension),
  film_device(phrygian_color),
  culture(western),
  style(cinematic)
]).

constraint_pack(fantasy, [
  film_mood(wonder),
  film_device(lydian_tonic),
  film_device(pedal_point),
  culture(western),
  style(cinematic)
]).

constraint_pack(action, [
  film_mood(action),
  film_device(ostinato),
  film_device(octatonic_action),
  culture(western),
  style(trailer)
]).

%% Apply a constraint pack to current spec
apply_pack(PackId) :-
  constraint_pack(PackId, Constraints),
  forall(member(C, Constraints), assertz(spec_constraint(current, C, soft, 0.7))).

%% ============================================================================
%% SCORE AGGREGATION (C087)
%% ============================================================================

%% score_candidate/3 - score a candidate against all soft constraints
%% Returns weighted sum of satisfaction scores
score_candidate(Candidate, Score, Reasons) :-
  findall(W-R, (
    soft_constraint(C, Weight),
    ( satisfies(Candidate, C)
      -> S is Weight, format(atom(R), 'Satisfies ~w (+~2f)', [C, Weight])
      ;  S is -Weight, format(atom(R), 'Violates ~w (-~2f)', [C, Weight])
    ),
    W = S
  ), Weighted),
  sum_weighted(Weighted, Score),
  findall(R, member(_-R, Weighted), Reasons).

sum_weighted([], 0).
sum_weighted([W-_|Rest], Sum) :-
  sum_weighted(Rest, Rest_Sum),
  Sum is W + Rest_Sum.

%% ============================================================================
%% SPEC LINT (C119)
%% ============================================================================

%% spec_lint/2 - return warnings for the current spec
spec_lint(Warning, Severity) :-
  spec_lint_check(Warning, Severity).

%% Lint: culture mismatch with constraints
spec_lint_check(Warning, warning) :-
  spec_culture(current, Culture),
  Culture \= hybrid,
  constraint(C),
  constraint_culture(C, CCulture),
  CCulture \= Culture,
  format(atom(Warning), 'Constraint ~w is ~w but spec culture is ~w', [C, CCulture, Culture]).

%% Map constraints to their native culture
constraint_culture(raga(_), carnatic).
constraint_culture(tala(_), carnatic).
constraint_culture(tala(_, _), carnatic).
constraint_culture(celtic_tune(_), celtic).
constraint_culture(chinese_mode(_), chinese).
constraint_culture(chinese_mode(_, _), chinese).
constraint_culture(schema(_), western).
constraint_culture(film_mood(_), western).
constraint_culture(film_device(_), western).

%% Lint: tempo too fast for ornaments
spec_lint_check(Warning, warning) :-
  spec_tempo(current, Tempo),
  Tempo > 160,
  constraint(ornament_budget(N)),
  N > 2,
  format(atom(Warning), 'Tempo ~w is fast for ~w ornaments per beat', [Tempo, N]).

%% Lint: missing key when using Western theory
spec_lint_check('No key specified; defaulting to C major', info) :-
  \+ spec_key(current, _, _).

%% Get all lint warnings
all_lint_warnings(Warnings) :-
  findall(lint(W, S), spec_lint(W, S), Warnings).
%% ============================================================================
%% PER-BOARD CONTEXT SLICE (C055)
%% ============================================================================

%% Dynamic storage for board-specific context
:- dynamic(board_context/4).  % board_context(BoardId, tempo, meter(N,D), key(R,M))
:- dynamic(active_board/1).
:- dynamic(board_deck/2).     % board_deck(BoardId, DeckId)

%% Set active board context
set_board_context(BoardId, Tempo, Meter, Key) :-
  retractall(board_context(BoardId, _, _, _)),
  assertz(board_context(BoardId, Tempo, Meter, Key)),
  retractall(active_board(_)),
  assertz(active_board(BoardId)).

%% Get context for a specific board
get_board_context(BoardId, Tempo, Meter, Key) :-
  board_context(BoardId, Tempo, Meter, Key).

%% Get context for the active board
current_board_context(Tempo, Meter, Key) :-
  active_board(BoardId),
  get_board_context(BoardId, Tempo, Meter, Key).

%% Board types for context specialization
board_type(arranger).
board_type(tracker).
board_type(notation).
board_type(phrase).
board_type(harmony).

%% Board-specific defaults
board_default(arranger, style, cinematic).
board_default(tracker, style, edm).
board_default(notation, style, classical).
board_default(phrase, style, custom).
board_default(harmony, style, jazz).

%% ============================================================================
%% SPEC PUSH/POP FOR SCOPED QUERIES (C064)
%% ============================================================================

%% Stack for scoped spec queries (dev/testing only)
:- dynamic(spec_stack/2).  % spec_stack(Token, FactsList)
:- dynamic(spec_stack_counter/1).

spec_stack_counter(0).

%% Generate unique token
new_stack_token(Token) :-
  retract(spec_stack_counter(N)),
  N1 is N + 1,
  assertz(spec_stack_counter(N1)),
  atom_concat('scope_', N1, Token).

%% Push current spec facts and return token
spec_push(Token) :-
  new_stack_token(Token),
  findall(spec_key(current, R, M), spec_key(current, R, M), Keys),
  findall(spec_meter(current, N, D), spec_meter(current, N, D), Meters),
  findall(spec_tempo(current, T), spec_tempo(current, T), Tempos),
  findall(spec_tonality_model(current, M), spec_tonality_model(current, M), Models),
  findall(spec_style(current, S), spec_style(current, S), Styles),
  findall(spec_culture(current, C), spec_culture(current, C), Cultures),
  findall(spec_constraint(current, C, H, W), spec_constraint(current, C, H, W), Constraints),
  append([Keys, Meters, Tempos, Models, Styles, Cultures, Constraints], AllFacts),
  assertz(spec_stack(Token, AllFacts)).

%% Pop and restore spec facts
spec_pop(Token) :-
  spec_stack(Token, Facts),
  retract(spec_stack(Token, Facts)),
  clearSpec,
  restore_facts(Facts).

clearSpec :-
  retractall(spec_key(current, _, _)),
  retractall(spec_meter(current, _, _)),
  retractall(spec_tempo(current, _)),
  retractall(spec_tonality_model(current, _)),
  retractall(spec_style(current, _)),
  retractall(spec_culture(current, _)),
  retractall(spec_constraint(current, _, _, _)).

restore_facts([]).
restore_facts([F|Fs]) :-
  assertz(F),
  restore_facts(Fs).

%% ============================================================================
%% MUSIC CONTEXT FACTS (C065)
%% ============================================================================

%% Dynamic storage for live project state
:- dynamic(music_context/3).  % music_context(Property, Value, Source)

%% Context properties from project state
music_context_property(tempo).
music_context_property(meter).
music_context_property(key).
music_context_property(section).
music_context_property(position).
music_context_property(loop_length).

%% Set music context (called from TS bridge)
set_music_context(Property, Value, Source) :-
  retractall(music_context(Property, _, _)),
  assertz(music_context(Property, Value, Source)).

%% Get music context with source
get_music_context(Property, Value, Source) :-
  music_context(Property, Value, Source).

%% Get music context (value only)
get_music_context(Property, Value) :-
  music_context(Property, Value, _).

%% ============================================================================
%% DECK CONTEXT FACTS (C066)
%% ============================================================================

%% Dynamic storage for active deck layout
:- dynamic(deck_context/3).  % deck_context(DeckId, Property, Value)
:- dynamic(active_deck/2).   % active_deck(BoardId, DeckId)

%% Set deck context
set_deck_context(DeckId, Property, Value) :-
  retractall(deck_context(DeckId, Property, _)),
  assertz(deck_context(DeckId, Property, Value)).

%% Get deck context
get_deck_context(DeckId, Property, Value) :-
  deck_context(DeckId, Property, Value).

%% Set active deck for a board
set_active_deck(BoardId, DeckId) :-
  retractall(active_deck(BoardId, _)),
  assertz(active_deck(BoardId, DeckId)).

%% Get active deck for a board
get_active_deck(BoardId, DeckId) :-
  active_deck(BoardId, DeckId).

%% ============================================================================
%% CARD CONTEXT FACTS (C067)
%% ============================================================================

%% Dynamic storage for selected card parameters
:- dynamic(card_context/4).  % card_context(CardId, ParamId, Value, Timestamp)

%% Set card context (called when card params change)
set_card_context(CardId, ParamId, Value, Timestamp) :-
  retractall(card_context(CardId, ParamId, _, _)),
  assertz(card_context(CardId, ParamId, Value, Timestamp)).

%% Get card context
get_card_context(CardId, ParamId, Value) :-
  card_context(CardId, ParamId, Value, _).

%% Get all params for a card
get_card_params(CardId, Params) :-
  findall(param(ParamId, Value), card_context(CardId, ParamId, Value, _), Params).

%% ============================================================================
%% CARD PARAM REPRESENTATION (C077)
%% ============================================================================

%% card_param/3 - represents current parameter snapshots
%% card_param(CardId, ParamId, Value)
card_param(CardId, ParamId, Value) :-
  get_card_context(CardId, ParamId, Value).

%% ============================================================================
%% DERIVED PARAM (C078)
%% ============================================================================

%% derived_param/3 - inferred/auto params with confidence
:- dynamic(derived_param/4).  % derived_param(CardId, ParamId, Value, Confidence)

%% Compute derived param from constraints
derive_param(CardId, ParamId, Value, Confidence) :-
  card_derives_param(CardId, ParamId, Value, Confidence).

%% Example derivations
card_derives_param(tonality_model_card, model, ks_profile, 0.8) :-
  spec_culture(current, western),
  \+ constraint(raga(_)).

card_derives_param(tonality_model_card, model, spiral_array, 0.9) :-
  spec_style(current, cinematic).

card_derives_param(schema_card, schema, prinner, 0.7) :-
  constraint(cadence(authentic)),
  spec_style(current, galant).

%% ============================================================================
%% RECOMMEND PARAM (C079)
%% ============================================================================

%% recommend_param/4 - recommend parameter values
%% recommend_param(CardId, ParamId, Value, Confidence)
recommend_param(CardId, ParamId, Value, Confidence) :-
  derive_param(CardId, ParamId, Value, Confidence).

%% Additional param recommendations based on context
recommend_param(raga_card, raga, mohanam, 0.8) :-
  spec_culture(current, carnatic),
  constraint(phrase_density(sparse)).

recommend_param(raga_card, raga, kalyani, 0.7) :-
  spec_culture(current, carnatic),
  constraint(film_mood(wonder)).

recommend_param(celtic_card, tune_type, reel, 0.9) :-
  spec_culture(current, celtic),
  spec_meter(current, 4, 4).

recommend_param(celtic_card, tune_type, jig, 0.9) :-
  spec_culture(current, celtic),
  spec_meter(current, 6, 8).

recommend_param(film_card, mood, heroic, 0.85) :-
  spec_style(current, trailer),
  spec_tempo(current, T),
  T >= 120.

recommend_param(film_card, mood, tender, 0.8) :-
  spec_style(current, underscore),
  spec_tempo(current, T),
  T =< 80.

%% ============================================================================
%% RECOMMEND ACTION (C080)
%% ============================================================================

%% recommend_action/3 - emit HostAction terms
%% Actions: set_param, add_card, remove_card, add_constraint, apply_pack

recommend_action(set_param(CardId, ParamId, Value), Confidence, Reasons) :-
  recommend_param(CardId, ParamId, Value, Confidence),
  format(atom(R), 'Recommended ~w for ~w.~w', [Value, CardId, ParamId]),
  Reasons = [R].

recommend_action(apply_pack(PackId), 0.7, Reasons) :-
  spec_style(current, Style),
  style_suggests_pack(Style, PackId),
  format(atom(R), 'Style ~w suggests constraint pack ~w', [Style, PackId]),
  Reasons = [R].

recommend_action(add_constraint(Constraint), 0.6, Reasons) :-
  spec_culture(current, Culture),
  culture_suggests_constraint(Culture, Constraint),
  \+ constraint(Constraint),
  format(atom(R), 'Culture ~w suggests adding ~w', [Culture, Constraint]),
  Reasons = [R].

%% Style to pack suggestions
style_suggests_pack(cinematic, cinematic_heroic).
style_suggests_pack(trailer, action).
style_suggests_pack(galant, galant_phrase).

%% Culture to constraint suggestions
culture_suggests_constraint(carnatic, raga(mohanam)) :-
  \+ constraint(raga(_)).
culture_suggests_constraint(celtic, celtic_tune(reel)) :-
  spec_meter(current, 4, 4),
  \+ constraint(celtic_tune(_)).
culture_suggests_constraint(chinese, chinese_mode(gong)) :-
  \+ constraint(chinese_mode(_)).

%% Get all recommended actions
all_recommended_actions(Actions) :-
  findall(action(A, C, Rs), recommend_action(A, C, Rs), Actions).