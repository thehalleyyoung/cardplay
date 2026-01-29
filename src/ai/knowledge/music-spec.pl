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

%% ============================================================================
%% PHASE C8: DECK TEMPLATES & MULTI-BOARD INTEGRATION (C861-C960)
%% ============================================================================

%% ============================================================================
%% DECK TEMPLATES (C861-C865)
%% ============================================================================

%% deck_template(+TemplateId, +Description)
deck_template(theory_deck, 'Core music theory tools').
deck_template(phrase_deck, 'Phrase browsing, generation, and adaptation').
deck_template(harmony_deck, 'Harmony exploration and tonality analysis').
deck_template(arranger_deck, 'Arrangement and orchestration tools').
deck_template(tracker_assist_deck, 'Tracker pattern assistance tools').
deck_template(world_music_deck, 'World music theory tools (Carnatic/Celtic/Chinese)').
deck_template(film_deck, 'Film scoring and cinematic tools').
deck_template(galant_deck, 'Galant schemata and partimento tools').

%% template_slot(+TemplateId, +SlotIndex, +CardType)
%% Arranger deck slots
template_slot(arranger_deck, 1, arranger_style_card).
template_slot(arranger_deck, 2, film_scoring_card).
template_slot(arranger_deck, 3, orchestration_role_card).
template_slot(arranger_deck, 4, scene_arc_card).

%% Theory deck slots
template_slot(theory_deck, 1, tonality_model_card).
template_slot(theory_deck, 2, meter_accent_card).
template_slot(theory_deck, 3, grouping_card).
template_slot(theory_deck, 4, constraint_pack_card).

%% Phrase deck slots
template_slot(phrase_deck, 1, phrase_browser_card).
template_slot(phrase_deck, 2, phrase_generator_card).
template_slot(phrase_deck, 3, phrase_variation_card).
template_slot(phrase_deck, 4, schema_card).

%% Harmony deck slots
template_slot(harmony_deck, 1, harmony_explorer_card).
template_slot(harmony_deck, 2, tonality_model_card).
template_slot(harmony_deck, 3, cadence_tools_card).
template_slot(harmony_deck, 4, modulation_planner_card).

%% Tracker assist deck slots
template_slot(tracker_assist_deck, 1, tracker_pattern_card).
template_slot(tracker_assist_deck, 2, phrase_insert_card).
template_slot(tracker_assist_deck, 3, grouping_card).
template_slot(tracker_assist_deck, 4, fill_builder_card).

%% World music deck slots
template_slot(world_music_deck, 1, carnatic_raga_tala_card).
template_slot(world_music_deck, 2, celtic_tune_card).
template_slot(world_music_deck, 3, chinese_mode_card).
template_slot(world_music_deck, 4, world_converter_card).

%% Film deck slots
template_slot(film_deck, 1, film_scoring_card).
template_slot(film_deck, 2, scene_arc_card).
template_slot(film_deck, 3, leitmotif_card).
template_slot(film_deck, 4, orchestration_role_card).

%% Galant deck slots
template_slot(galant_deck, 1, schema_browser_card).
template_slot(galant_deck, 2, schema_realizer_card).
template_slot(galant_deck, 3, partimento_card).
template_slot(galant_deck, 4, counterpoint_card).

%% ============================================================================
%% RECOMMEND TEMPLATE (C866)
%% ============================================================================

%% recommend_template(+Spec, -TemplateId, -Reasons)
recommend_template(Spec, film_deck, Reasons) :-
  Spec = music_spec(_, _, _, _, Style, _, constraints(Cs)),
  ( Style = cinematic ; Style = trailer ; Style = underscore
  ; member(film_mood(_), Cs)
  ),
  Reasons = [because('Film deck recommended for cinematic workflow')].

recommend_template(Spec, galant_deck, Reasons) :-
  Spec = music_spec(_, _, _, _, Style, _, constraints(Cs)),
  ( Style = galant ; Style = classical ; member(schema(_), Cs) ),
  Reasons = [because('Galant deck recommended for schema-based workflow')].

recommend_template(Spec, world_music_deck, Reasons) :-
  Spec = music_spec(_, _, _, _, _, Culture, constraints(Cs)),
  ( member(Culture, [carnatic, celtic, chinese])
  ; member(raga(_), Cs)
  ; member(celtic_tune(_), Cs)
  ; member(chinese_mode(_), Cs)
  ),
  Reasons = [because('World music deck recommended for non-Western culture')].

recommend_template(Spec, theory_deck, Reasons) :-
  Spec = music_spec(_, _, _, _, _, _, _),
  Reasons = [because('Theory deck is always useful as a foundation')].

%% ============================================================================
%% TEMPLATE FITS BOARD (C867)
%% ============================================================================

%% template_fits_board(+Template, +Board, -Score)
template_fits_board(arranger_deck, arranger, 95).
template_fits_board(film_deck, arranger, 90).
template_fits_board(tracker_assist_deck, tracker, 95).
template_fits_board(phrase_deck, tracker, 80).
template_fits_board(phrase_deck, phrase, 95).
template_fits_board(harmony_deck, harmony, 95).
template_fits_board(harmony_deck, notation, 80).
template_fits_board(galant_deck, notation, 90).
template_fits_board(galant_deck, phrase, 85).
template_fits_board(world_music_deck, arranger, 70).
template_fits_board(world_music_deck, tracker, 70).
template_fits_board(theory_deck, arranger, 75).
template_fits_board(theory_deck, tracker, 75).
template_fits_board(theory_deck, notation, 80).
template_fits_board(theory_deck, phrase, 80).
template_fits_board(theory_deck, harmony, 85).

%% ============================================================================
%% CONSTRAINT MAPPINGS FOR CARDS (C869-C874)
%% ============================================================================

%% constraint_arranger_style(+Style) (C870)
constraint_arranger_style(cinematic).
constraint_arranger_style(trailer).
constraint_arranger_style(underscore).
constraint_arranger_style(edm).
constraint_arranger_style(orchestral).
constraint_arranger_style(ambient).

%% constraint_scene_arc(+ArcType) (C870)
constraint_scene_arc(rising_action).
constraint_scene_arc(tension_release).
constraint_scene_arc(slow_burn).
constraint_scene_arc(bookend).
constraint_scene_arc(stinger).

%% constraint_phrase_density(+Density) (C872)
constraint_type(phrase_density(_), phrase_density).

%% constraint_contour(+Contour) (C872)
constraint_type(contour(_), contour).

%% constraint_max_interval(+MaxInterval)
constraint_type(max_interval(_), max_interval).

%% constraint_pattern_role(+Role) (C874)
constraint_type(pattern_role(_), pattern_role).

%% constraint_swing(+SwingAmount) (C874)
constraint_type(swing(_), swing).

%% ============================================================================
%% PATTERN ROLE TAXONOMY (C875)
%% ============================================================================

pattern_role(groove).
pattern_role(fill).
pattern_role(build).
pattern_role(drop).
pattern_role(break_down).
pattern_role(transition).
pattern_role(intro_pattern).
pattern_role(outro_pattern).

%% role_compatible(+RoleA, +RoleB) (C876)
%% Can RoleA be followed by RoleB?
role_compatible(groove, fill).
role_compatible(groove, build).
role_compatible(groove, transition).
role_compatible(fill, groove).
role_compatible(fill, drop).
role_compatible(build, drop).
role_compatible(build, groove).
role_compatible(drop, groove).
role_compatible(drop, build).
role_compatible(break_down, build).
role_compatible(break_down, groove).
role_compatible(transition, groove).
role_compatible(transition, drop).
role_compatible(intro_pattern, groove).
role_compatible(intro_pattern, build).
role_compatible(groove, outro_pattern).
role_compatible(fill, outro_pattern).

%% ============================================================================
%% NEXT ACTION RECOMMENDATION (C889-C890)
%% ============================================================================

%% next_action(+Context, -HostAction, -Reasons)
next_action(analysis_complete(schema_match, Schema),
  add_card(schema_card, [{schema, Schema}]),
  [because('Schema detected; add schema card for further exploration')]).

next_action(analysis_complete(raga_match, Raga),
  add_card(carnatic_raga_tala_card, [{raga, Raga}]),
  [because('Raga detected; add Carnatic card')]).

next_action(analysis_complete(key_detected, Key),
  set_param(tonality_model_card, detected_key, Key),
  [because('Key detected; update tonality model card')]).

next_action(section_transition(SectionA, SectionB),
  suggest_fill(SectionA, SectionB),
  Reasons) :-
  format(atom(R), 'Transition from ~w to ~w may benefit from a fill', [SectionA, SectionB]),
  Reasons = [because(R)].

%% ============================================================================
%% ARRANGER STYLE RECOMMENDATION (C891-C892)
%% ============================================================================

%% recommend_arranger_style(+Spec, -Style, -Reasons)
recommend_arranger_style(Spec, trailer, Reasons) :-
  Spec = music_spec(_, _, tempo(T), _, _, _, constraints(Cs)),
  T >= 120,
  member(film_mood(action), Cs),
  Reasons = [because('Fast tempo + action mood suggests trailer style')].

recommend_arranger_style(Spec, orchestral, Reasons) :-
  Spec = music_spec(_, _, _, _, Style, _, _),
  member(Style, [cinematic, classical]),
  Reasons = [because('Cinematic/classical style suggests orchestral arrangement')].

recommend_arranger_style(Spec, ambient, Reasons) :-
  Spec = music_spec(_, _, tempo(T), _, _, _, constraints(Cs)),
  T =< 80,
  ( member(film_device(harmonic_stasis), Cs)
  ; member(film_device(pedal_point), Cs)
  ),
  Reasons = [because('Slow tempo + stasis suggests ambient arrangement')].

recommend_arranger_style(Spec, edm, Reasons) :-
  Spec = music_spec(_, _, tempo(T), _, Style, _, _),
  T >= 110,
  Style = edm,
  Reasons = [because('EDM style with appropriate tempo')].

%% ============================================================================
%% PHRASE PRESET RECOMMENDATION (C893-C894)
%% ============================================================================

%% recommend_phrase_preset(+Spec, -Preset, -Reasons)
recommend_phrase_preset(Spec, galant_melody, Reasons) :-
  Spec = music_spec(_, _, _, _, Style, _, constraints(Cs)),
  ( Style = galant ; member(schema(_), Cs) ),
  Reasons = [because('Galant style suggests schema-based melody preset')].

recommend_phrase_preset(Spec, raga_alapana, Reasons) :-
  Spec = music_spec(_, _, _, _, _, carnatic, constraints(Cs)),
  member(raga(_), Cs),
  Reasons = [because('Carnatic context with raga suggests alapana preset')].

recommend_phrase_preset(Spec, celtic_tune_gen, Reasons) :-
  Spec = music_spec(_, _, _, _, _, celtic, constraints(Cs)),
  member(celtic_tune(_), Cs),
  Reasons = [because('Celtic context suggests tune generation preset')].

recommend_phrase_preset(Spec, cinematic_motif, Reasons) :-
  Spec = music_spec(_, _, _, _, Style, _, constraints(Cs)),
  ( Style = cinematic ; member(film_mood(_), Cs) ),
  Reasons = [because('Cinematic context suggests motif-based phrase preset')].

%% ============================================================================
%% TRACKER FILL RECOMMENDATION (C895-C896)
%% ============================================================================

%% recommend_tracker_fill(+Spec, -FillType, -Reasons)
recommend_tracker_fill(Spec, drum_fill, Reasons) :-
  Spec = music_spec(_, _, _, _, Style, _, _),
  member(Style, [edm, action, trailer]),
  Reasons = [because('EDM/action style suggests drum fill')].

recommend_tracker_fill(Spec, melodic_fill, Reasons) :-
  Spec = music_spec(_, _, _, _, Style, _, _),
  member(Style, [cinematic, classical, galant]),
  Reasons = [because('Melodic style suggests melodic fill')].

recommend_tracker_fill(Spec, riser_fill, Reasons) :-
  Spec = music_spec(_, _, _, _, _, _, constraints(Cs)),
  member(film_device(trailer_rise), Cs),
  Reasons = [because('Trailer rise device suggests riser fill')].

%% ============================================================================
%% ORCHESTRATION ROLE ALLOCATION (C897-C898)
%% ============================================================================

%% allocate_roles(+Spec, +Section, -Roles, -Reasons)
allocate_roles(Spec, Section, Roles, Reasons) :-
  Spec = music_spec(_, _, _, _, _, _, constraints(Cs)),
  ( member(film_mood(Mood), Cs) -> true ; Mood = neutral ),
  section_energy(Section, Energy),
  allocate_by_energy(Mood, Energy, Roles),
  format(atom(R), 'Roles allocated for ~w section at ~w energy (mood: ~w)',
    [Section, Energy, Mood]),
  Reasons = [because(R)].

section_energy(intro, low).
section_energy(verse, medium).
section_energy(chorus, high).
section_energy(bridge, medium).
section_energy(climax, peak).
section_energy(outro, low).
section_energy(buildup, rising).
section_energy(drop, peak).
section_energy(breakdown, low).
section_energy(_, medium).  %% fallback

allocate_by_energy(Mood, low, Roles) :-
  ( Mood = ominous ->
      Roles = [role(pad, strings), role(bass, synths)]
  ; Roles = [role(pad, strings), role(melody, piano)]
  ).
allocate_by_energy(Mood, medium, Roles) :-
  ( Mood = heroic ->
      Roles = [role(melody, brass), role(pad, strings), role(bass, strings)]
  ; Mood = tender ->
      Roles = [role(melody, strings), role(pad, piano), role(countermelody, woodwinds)]
  ; Roles = [role(melody, strings), role(pad, strings), role(bass, strings)]
  ).
allocate_by_energy(_, high, Roles) :-
  Roles = [role(melody, brass), role(pad, strings), role(bass, strings),
           role(percussion, percussion), role(countermelody, woodwinds)].
allocate_by_energy(Mood, peak, Roles) :-
  ( Mood = epic ->
      Roles = [role(melody, brass), role(pad, choir), role(countermelody, strings),
               role(bass, strings), role(percussion, percussion), role(ostinato_role, synths)]
  ; Roles = [role(melody, brass), role(pad, strings), role(bass, strings),
             role(percussion, percussion), role(countermelody, woodwinds)]
  ).
allocate_by_energy(_, rising, Roles) :-
  Roles = [role(ostinato_role, strings), role(pad, synths),
           role(percussion, percussion), role(bass, strings)].

%% ============================================================================
%% DEVICE-TO-CARD MAPPING (C901-C902)
%% ============================================================================

%% device_requires_card(+Device, -CardType)
device_requires_card(pedal_point, pedal_generator_card).
device_requires_card(ostinato, ostinato_card).
device_requires_card(planing, planing_card).
device_requires_card(chromatic_mediant, modulation_planner_card).
device_requires_card(cluster_tension, cluster_voicing_card).
device_requires_card(quartal_harmony, quartal_voicing_card).
device_requires_card(leitmotif_interval, leitmotif_card).
device_requires_card(trailer_rise, trailer_build_card).

%% ============================================================================
%% CULTURE-TO-CARD MAPPING (C904-C905)
%% ============================================================================

%% culture_requires_card(+Culture, -CardType)
culture_requires_card(carnatic, carnatic_raga_tala_card).
culture_requires_card(carnatic, drone_card).
culture_requires_card(celtic, celtic_tune_card).
culture_requires_card(celtic, ornament_card).
culture_requires_card(chinese, chinese_mode_card).
culture_requires_card(chinese, heterophony_card).

%% ============================================================================
%% SCHEMA-TO-CARD MAPPING (C906-C907)
%% ============================================================================

%% schema_requires_card(+Schema, -CardType)
schema_requires_card(_, schema_browser_card).
schema_requires_card(_, schema_realizer_card).

%% ============================================================================
%% CARD VISIBILITY / GATING (C908-C909)
%% ============================================================================

%% card_visible(+BoardControlLevel, +CardId, -Visible)
%% BoardControlLevel: beginner | intermediate | advanced | pro
card_visible(beginner, constraint_pack_card, true).
card_visible(beginner, tonality_model_card, false).
card_visible(beginner, grouping_card, false).
card_visible(beginner, modulation_planner_card, false).
card_visible(beginner, counterpoint_card, false).

card_visible(intermediate, constraint_pack_card, true).
card_visible(intermediate, tonality_model_card, true).
card_visible(intermediate, grouping_card, true).
card_visible(intermediate, modulation_planner_card, false).
card_visible(intermediate, counterpoint_card, false).

card_visible(advanced, _, true).
card_visible(pro, _, true).

%% Default: visible at intermediate+ levels
card_visible(Level, _Card, true) :-
  member(Level, [intermediate, advanced, pro]).

%% ============================================================================
%% EXPLANATION LEVEL (C911)
%% ============================================================================

%% explanation_level(+ControlLevel, -Verbosity)
%% Verbosity: terse | normal | verbose | debug
explanation_level(beginner, verbose).
explanation_level(intermediate, normal).
explanation_level(advanced, terse).
explanation_level(pro, debug).

%% ============================================================================
%% VOICE LEADING PROFILE (C940-C941)
%% ============================================================================

%% voice_leading_profile(+Culture, -Rules)
%% Culture-specific voice leading expectations.
voice_leading_profile(western, rules(avoid_parallels, resolve_leading_tone, smooth_motion)).
voice_leading_profile(carnatic, rules(horizontal_focus, no_chord_requirement, gamaka_permitted)).
voice_leading_profile(celtic, rules(modal_motion, drone_ok, parallel_thirds_ok)).
voice_leading_profile(chinese, rules(heterophonic, unison_anchor, parallel_ok)).

%% ============================================================================
%% WORLD PITCH TO MIDI BRIDGE (C942-C943)
%% ============================================================================

%% world_pitch_to_midi(+CulturePitch, +Culture, -MidiNote)
%% Approximate mapping from culture-specific pitch to MIDI.
world_pitch_to_midi(swara(sa, Octave), carnatic, Midi) :-
  Midi is 60 + (Octave - 4) * 12.  % Sa = middle C in octave 4
world_pitch_to_midi(swara(ri1, Octave), carnatic, Midi) :-
  Midi is 61 + (Octave - 4) * 12.
world_pitch_to_midi(swara(ri2, Octave), carnatic, Midi) :-
  Midi is 62 + (Octave - 4) * 12.
world_pitch_to_midi(swara(ga1, Octave), carnatic, Midi) :-
  Midi is 62 + (Octave - 4) * 12.
world_pitch_to_midi(swara(ga2, Octave), carnatic, Midi) :-
  Midi is 63 + (Octave - 4) * 12.
world_pitch_to_midi(swara(ga3, Octave), carnatic, Midi) :-
  Midi is 64 + (Octave - 4) * 12.
world_pitch_to_midi(swara(ma1, Octave), carnatic, Midi) :-
  Midi is 65 + (Octave - 4) * 12.
world_pitch_to_midi(swara(ma2, Octave), carnatic, Midi) :-
  Midi is 66 + (Octave - 4) * 12.
world_pitch_to_midi(swara(pa, Octave), carnatic, Midi) :-
  Midi is 67 + (Octave - 4) * 12.
world_pitch_to_midi(swara(da1, Octave), carnatic, Midi) :-
  Midi is 68 + (Octave - 4) * 12.
world_pitch_to_midi(swara(da2, Octave), carnatic, Midi) :-
  Midi is 69 + (Octave - 4) * 12.
world_pitch_to_midi(swara(ni1, Octave), carnatic, Midi) :-
  Midi is 70 + (Octave - 4) * 12.
world_pitch_to_midi(swara(ni2, Octave), carnatic, Midi) :-
  Midi is 71 + (Octave - 4) * 12.

%% midi_to_world_pitch(+MidiNote, +Culture, -CulturePitch)
midi_to_world_pitch(Midi, carnatic, swara(Swara, Octave)) :-
  Octave is (Midi - 60) // 12 + 4,
  PC is Midi mod 12,
  pc_to_swara(PC, Swara).

pc_to_swara(0, sa).
pc_to_swara(1, ri1).
pc_to_swara(2, ri2).
pc_to_swara(3, ga2).
pc_to_swara(4, ga3).
pc_to_swara(5, ma1).
pc_to_swara(6, ma2).
pc_to_swara(7, pa).
pc_to_swara(8, da1).
pc_to_swara(9, da2).
pc_to_swara(10, ni1).
pc_to_swara(11, ni2).

%% ============================================================================
%% FILL GENERATION (C936-C937)
%% ============================================================================

%% generate_fill(+FillType, +Spec, -Fill, -Reasons)
generate_fill(drum_fill, Spec, fill(drum, Pattern), Reasons) :-
  Spec = music_spec(_, meter(N, _), tempo(T), _, _, _, _),
  ( T >= 140 -> Pattern = [kick, snare, kick, kick, snare, hihat, hihat, crash]
  ; Pattern = [kick, hihat, snare, hihat, kick, kick, snare, crash]
  ),
  format(atom(R), 'Drum fill for ~w/? at ~w BPM', [N, T]),
  Reasons = [because(R)].

generate_fill(melodic_fill, Spec, fill(melodic, Intervals), Reasons) :-
  Spec = music_spec(key(_, Mode), _, _, _, _, _, _),
  ( Mode = major -> Intervals = [0, 2, 4, 7, 12]
  ; Mode = natural_minor -> Intervals = [0, 3, 5, 7, 12]
  ; Intervals = [0, 2, 4, 7, 12]  % fallback
  ),
  Reasons = [because('Melodic fill using scale-based ascending pattern')].

generate_fill(riser_fill, _, fill(riser, Pattern), Reasons) :-
  Pattern = [noise_sweep, pitch_rise, percussion_roll, hit],
  Reasons = [because('Riser fill: noise + pitch sweep + percussion roll')].

%% ============================================================================
%% PHRASE TAG AND SEARCH (C924-C927)
%% ============================================================================

:- dynamic(phrase_tag/3).  %% phrase_tag(PhraseId, Tag, Confidence)

%% phrase_search(+Query, -PhraseId, -Score)
%% Search phrases by tag match.
phrase_search(tags(Tags), PhraseId, Score) :-
  phrase_tag(PhraseId, _, _),
  findall(C, (member(T, Tags), phrase_tag(PhraseId, T, C)), Confidences),
  Confidences \= [],
  sum_list(Confidences, Total),
  length(Tags, NT),
  Score is Total / NT.

%% recommend_phrase(+Spec, +Context, -PhraseId, -Reasons)  (C928-C929)
recommend_phrase(Spec, Context, PhraseId, Reasons) :-
  Spec = music_spec(_, _, _, _, Style, Culture, _),
  phrase_tag(PhraseId, style(Style), C1),
  C1 > 0.5,
  ( phrase_tag(PhraseId, culture(Culture), C2), C2 > 0.3 -> true ; true ),
  format(atom(R), 'Phrase ~w matches style ~w in context ~w', [PhraseId, Style, Context]),
  Reasons = [because(R)].

%% ============================================================================
%% VARIATION AND FILL SUGGESTIONS (C930-C934)
%% ============================================================================

%% recommend_variation(+Style, +Section, -VariationIndex, -Reasons)
recommend_variation(cinematic, climax, 3, [because('Climax: maximum variation intensity')]).
recommend_variation(cinematic, verse, 1, [because('Verse: subtle variation')]).
recommend_variation(cinematic, chorus, 2, [because('Chorus: moderate variation')]).
recommend_variation(edm, drop, 3, [because('Drop: maximum energy variation')]).
recommend_variation(edm, buildup, 2, [because('Buildup: escalating variation')]).
recommend_variation(_, _, 1, [because('Default: minimal variation')]).

%% ============================================================================
%% SPEC AUTOFIX (C120-C121)
%% ============================================================================

%% spec_autofix(+Warning, -FixAction, -Reasons)
spec_autofix('No key specified; defaulting to C major',
  set_param(tonality_model_card, key, c_major),
  [because('Auto-set key to C major when unspecified')]).

spec_autofix(Warning, remove_constraint(Constraint), Reasons) :-
  atom_concat('Constraint ', Rest, Warning),
  atom_concat(ConstraintStr, _, Rest),
  term_to_atom(Constraint, ConstraintStr),
  format(atom(R), 'Remove conflicting constraint: ~w', [Constraint]),
  Reasons = [because(R)].

%% ============================================================================
%% QA: QUERY TIMEOUT GUARD (C960)
%% ============================================================================

%% guarded_query(+Goal, +TimeoutMs, -Result)
%% Wraps a query with a timeout to prevent infinite loops.
guarded_query(Goal, TimeoutMs, Result) :-
  ( TimeoutMs > 0 ->
      catch(
        call(Goal),
        Error,
        ( Result = error(Error) )
      ),
      Result = ok
  ; Result = error(timeout_zero)
  ).

%% ============================================================================
%% ADDITIONAL CONSTRAINT DOMAINS (C1411-C1880)
%% ============================================================================

%% jazz_vocabulary_level(+Level)
%% Jazz vocabulary proficiency levels. (C1411)
jazz_vocabulary_level(beginner).
jazz_vocabulary_level(intermediate).
jazz_vocabulary_level(advanced).

%% jazz_style_era(+Era)
%% Jazz style/era constraint. (C1412)
jazz_style_era(swing).
jazz_style_era(bebop).
jazz_style_era(cool).
jazz_style_era(modal).
jazz_style_era(fusion).
jazz_style_era(contemporary).

%% orchestration_algorithm(+Algorithm)
%% Orchestration search algorithm choice. (C1541)
orchestration_algorithm(greedy).
orchestration_algorithm(beam).
orchestration_algorithm(genetic).
orchestration_algorithm(constraint).

%% timbre_matching_tolerance(+Tolerance)
%% How strict timbre matching should be. (C1542)
timbre_matching_tolerance(strict).
timbre_matching_tolerance(moderate).
timbre_matching_tolerance(loose).

%% east_asian_tradition(+Tradition)
%% East Asian musical tradition selector. (C1814)
east_asian_tradition(chinese).
east_asian_tradition(japanese).
east_asian_tradition(korean).

%% chinese_regional(+Region)
%% Chinese regional music style. (C1815)
chinese_regional(cantonese).
chinese_regional(beijing).
chinese_regional(jiangnan).
chinese_regional(sichuan).

%% japanese_genre(+Genre)
%% Japanese musical genre. (C1816)
japanese_genre(gagaku).
japanese_genre(hogaku).
japanese_genre(minyo).

%% latin_style(+Style)
%% Latin music style selector. (C1880)
latin_style(salsa).
latin_style(son).
latin_style(mambo).
latin_style(cha_cha).
latin_style(bossa).
latin_style(samba).
latin_style(tango).

%% ============================================================================
%% ADDITIONAL CONSTRAINT PACKS (C091 extensions)
%% ============================================================================

constraint_pack(romance, [
  film_mood(tender),
  film_device(suspension_chain),
  culture(western),
  style(cinematic),
  phrase_density(medium)
]).

constraint_pack(comedy, [
  film_mood(comedy),
  film_device(staccato_play),
  culture(western),
  style(cinematic),
  phrase_density(dense)
]).

constraint_pack(sci_fi, [
  film_mood(mystery),
  film_device(whole_tone_wash),
  film_device(quartal_openness),
  culture(western),
  style(cinematic)
]).

constraint_pack(baroque_counterpoint, [
  style(baroque),
  culture(western),
  harmonic_rhythm(4),
  contour(arch)
]).

constraint_pack(jazz_ballad, [
  style(jazz),
  culture(western),
  phrase_density(sparse),
  harmonic_rhythm(2),
  ornament_budget(3)
]).

constraint_pack(lofi_ambient, [
  style(lofi),
  culture(western),
  phrase_density(sparse),
  harmonic_rhythm(1)
]).

%% ============================================================================
%% STATELESS QUERY SUPPORT (C068)
%% ============================================================================

%% stateless_satisfies/2 - check satisfaction against an inline spec term
%% instead of the asserted database.
stateless_satisfies(Candidate, music_spec(Key, _Meter, _Tempo, _Model, _Style, _Culture, constraints(Cs))) :-
  Key = key(KeyRoot, Mode),
  member(C, Cs),
  satisfies(Candidate, C).

%% stateless_conflicts/2 - find conflicts in an inline spec term
stateless_conflicts(music_spec(_Key, _Meter, _Tempo, _Model, _Style, _Culture, constraints(Cs)), Conflicts) :-
  findall(conflict(C1, C2, Reason), (
    member(C1, Cs),
    member(C2, Cs),
    C1 @< C2,
    spec_conflict(C1, C2, Reason)
  ), Conflicts).

%% stateless_lint/2 - lint an inline spec term
stateless_lint(music_spec(_Key, _Meter, _Tempo, _Model, _Style, Culture, constraints(Cs)), Warnings) :-
  findall(lint(W, S), (
    member(C, Cs),
    constraint_culture(C, CCulture),
    CCulture \= Culture,
    Culture \= hybrid,
    format(atom(W), 'Constraint ~w is ~w but spec culture is ~w', [C, CCulture, Culture]),
    S = warning
  ), Warnings).

%% stateless_recommend_mode/3 - recommend mode from inline spec
stateless_recommend_mode(Spec, Mode, Confidence) :-
  Spec = music_spec(_, _, _, _, _, Culture, _),
  culture_suggests_mode(Culture, Mode, Confidence).

%% ============================================================================
%% RECOMMEND DECK FOR SPEC (C107)
%% ============================================================================

%% recommend_deck_for_spec(+Spec, -TemplateId, -Score)
%% Recommends a deck template ID for a given MusicSpec, scored by culture,
%% style, and board-type affinity. Uses template_culture/2, template_style/2,
%% and template_priority/2 facts generated by generateTemplatePrologFacts().
recommend_deck_for_spec(Spec, TemplateId, Score) :-
  Spec = music_spec(_, _, _, _, style(Style), culture(Culture), _),
  deck_template(TemplateId, _),
  template_priority(TemplateId, BasePriority),
  ( template_culture(TemplateId, Culture) -> CultureBonus is 20 ; CultureBonus is 0 ),
  ( template_style(TemplateId, Style) -> StyleBonus is 10 ; StyleBonus is 0 ),
  Score is BasePriority + CultureBonus + StyleBonus.

%% recommend_deck_for_spec_on_board(+Spec, +BoardType, -TemplateId, -Score)
%% Like recommend_deck_for_spec/3 but also factors in board-type fitness.
recommend_deck_for_spec_on_board(Spec, BoardType, TemplateId, Score) :-
  recommend_deck_for_spec(Spec, TemplateId, BaseScore),
  ( template_board(TemplateId, BoardType) -> BoardBonus is 15 ; BoardBonus is 0 ),
  Score is BaseScore + BoardBonus.

%% all_deck_recommendations(+Spec, +BoardType, -Ranked)
%% Collects all deck recommendations for a spec+board, sorted descending.
all_deck_recommendations(Spec, BoardType, Ranked) :-
  findall(Score-TemplateId,
    recommend_deck_for_spec_on_board(Spec, BoardType, TemplateId, Score),
    Pairs),
  sort(1, @>=, Pairs, Ranked).

%% ============================================================================
%% RECOMMEND BOARD FOR SPEC (C108)
%% ============================================================================

%% recommend_board_for_spec(+Spec, -BoardType, -Reasons)
%% Recommends a board type for a given MusicSpec based on style and culture.

%% Cinematic/trailer styles → arranger
recommend_board_for_spec(Spec, arranger, Reasons) :-
  Spec = music_spec(_, _, _, _, style(Style), _, _),
  member(Style, [cinematic, trailer, underscore]),
  format(atom(R), 'Style ~w is best served by the arranger board', [Style]),
  Reasons = [because(R)].

%% Galant/classical styles → notation or phrase
recommend_board_for_spec(Spec, notation, Reasons) :-
  Spec = music_spec(_, _, _, _, style(Style), _, _),
  member(Style, [galant, classical, baroque, romantic]),
  format(atom(R), 'Style ~w works well with the notation board', [Style]),
  Reasons = [because(R)].

recommend_board_for_spec(Spec, phrase, Reasons) :-
  Spec = music_spec(_, _, _, _, style(Style), _, _),
  member(Style, [galant, classical]),
  format(atom(R), 'Style ~w also works well with the phrase board', [Style]),
  Reasons = [because(R)].

%% Carnatic/celtic/chinese cultures → tracker or phrase
recommend_board_for_spec(Spec, tracker, Reasons) :-
  Spec = music_spec(_, _, _, _, _, culture(Culture), _),
  member(Culture, [carnatic, celtic, chinese]),
  format(atom(R), 'Culture ~w works well with the tracker board', [Culture]),
  Reasons = [because(R)].

recommend_board_for_spec(Spec, phrase, Reasons) :-
  Spec = music_spec(_, _, _, _, _, culture(Culture), _),
  member(Culture, [carnatic, celtic, chinese]),
  format(atom(R), 'Culture ~w also works well with the phrase board', [Culture]),
  Reasons = [because(R)].

%% EDM/pop styles → tracker
recommend_board_for_spec(Spec, tracker, Reasons) :-
  Spec = music_spec(_, _, _, _, style(Style), _, _),
  member(Style, [edm, pop, lofi]),
  format(atom(R), 'Style ~w is best served by the tracker board', [Style]),
  Reasons = [because(R)].

%% Jazz style → harmony
recommend_board_for_spec(Spec, harmony, Reasons) :-
  Spec = music_spec(_, _, _, _, style(jazz), _, _),
  Reasons = [because('Jazz style is best served by the harmony board')].

%% Default fallback → arranger
recommend_board_for_spec(Spec, arranger, Reasons) :-
  Spec = music_spec(_, _, _, _, _, _, _),
  Reasons = [because('Arranger board is the default recommendation')].

%% all_board_recommendations(+Spec, -Ranked)
%% Collects all board recommendations, removing duplicates but preserving order.
all_board_recommendations(Spec, Ranked) :-
  findall(BoardType-Reasons,
    recommend_board_for_spec(Spec, BoardType, Reasons),
    Pairs),
  remove_duplicate_boards(Pairs, Ranked).

%% remove_duplicate_boards/2 - keep first occurrence of each board type
remove_duplicate_boards([], []).
remove_duplicate_boards([Board-Reasons|Rest], [Board-Reasons|Filtered]) :-
  exclude_board(Board, Rest, Remaining),
  remove_duplicate_boards(Remaining, Filtered).

exclude_board(_, [], []).
exclude_board(Board, [Board-_|Rest], Filtered) :-
  !, exclude_board(Board, Rest, Filtered).
exclude_board(Board, [Other|Rest], [Other|Filtered]) :-
  exclude_board(Board, Rest, Filtered).

%% ============================================================================
%% THEORY CARD CONSTRAINT PLUMBING (C100)
%% ============================================================================

%% theory_card_constraint/3 - map theory card type + param → constraint type
theory_card_constraint(tonality_model, model, tonality_model).
theory_card_constraint(meter_accent, numerator, meter).
theory_card_constraint(meter_accent, denominator, meter).
theory_card_constraint(meter_accent, accent_model, accent_model).
theory_card_constraint(grouping, sensitivity, grouping).
theory_card_constraint(grouping, contour_bias, contour).
theory_card_constraint(schema, schema, schema).
theory_card_constraint(schema, cadence_target, cadence).
theory_card_constraint(schema, harmonic_rhythm, harmonic_rhythm).
theory_card_constraint(film_scoring, mood, film_mood).
theory_card_constraint(film_scoring, primary_device, film_device).
theory_card_constraint(film_scoring, phrase_density, phrase_density).
theory_card_constraint(carnatic_raga_tala, raga, raga).
theory_card_constraint(carnatic_raga_tala, tala, tala).
theory_card_constraint(carnatic_raga_tala, gamaka_density, gamaka_density).
theory_card_constraint(celtic_tune, tune_type, celtic_tune).
theory_card_constraint(celtic_tune, ornament_budget, ornament_budget).
theory_card_constraint(celtic_tune, accent_model, accent_model).
theory_card_constraint(chinese_mode, mode, chinese_mode).
theory_card_constraint(chinese_mode, phrase_density, phrase_density).

%% theory_card_emits/2 - which constraint types a theory card can emit
theory_card_emits(CardType, ConstraintTypes) :-
  findall(CT, theory_card_constraint(CardType, _, CT), CTs),
  sort(CTs, ConstraintTypes).

%% recommend_theory_card/3 - recommend which theory card to add
recommend_theory_card(culture(carnatic), carnatic_raga_tala, 0.9).
recommend_theory_card(culture(celtic), celtic_tune, 0.9).
recommend_theory_card(culture(chinese), chinese_mode, 0.9).
recommend_theory_card(style(galant), schema, 0.8).
recommend_theory_card(style(cinematic), film_scoring, 0.85).
recommend_theory_card(style(trailer), film_scoring, 0.9).
recommend_theory_card(style(underscore), film_scoring, 0.8).
recommend_theory_card(_, tonality_model, 0.6).
recommend_theory_card(_, meter_accent, 0.5).

%% =========================================================================
%% C201-C203: Bridging predicates — constraint → analysis parameter mapping
%% C193: GroupingCard.sensitivity → gttm_segment/3 threshold
%% =========================================================================

%% constraint_tonality_model/1 (C201)
%% Extracts the active tonality model from constraints.
constraint_tonality_model(Model) :-
  current_spec(Spec),
  Spec = music_spec(_, _, _, Model, _, _, _),
  Model \= none.

%% constraint_grouping/1 (C202)
%% Extracts grouping sensitivity from constraints for GTTM segmentation.
constraint_grouping(Sensitivity) :-
  current_spec(Spec),
  Spec = music_spec(_, _, _, _, _, _, Constraints),
  member(constraint(grouping, _, _, Params), Constraints),
  member(sensitivity=Sensitivity, Params).
constraint_grouping(50) :-
  %% Default sensitivity when no grouping constraint is set
  current_spec(Spec),
  Spec = music_spec(_, _, _, _, _, _, Constraints),
  \+ member(constraint(grouping, _, _, _), Constraints).

%% constraint_meter_accent/1 (C203)
%% Extracts the accent model from constraints.
constraint_meter_accent(AccentModel) :-
  current_spec(Spec),
  Spec = music_spec(_, _, _, _, _, _, Constraints),
  member(constraint(accent_model, _, _, Params), Constraints),
  member(model=AccentModel, Params).
constraint_meter_accent(standard) :-
  current_spec(Spec),
  Spec = music_spec(_, _, _, _, _, _, Constraints),
  \+ member(constraint(accent_model, _, _, _), Constraints).

%% gttm_with_grouping_card/3 (C193)
%% Bridges GroupingCard sensitivity parameter to gttm_segment/3.
%% Converts 0.0–1.0 card sensitivity to 0–100 Prolog threshold.
gttm_with_grouping_card(Events, Segments, Reasons) :-
  constraint_grouping(Sensitivity),
  Threshold is round(Sensitivity),
  gttm_segment(Events, Threshold, Segments),
  Reasons = [grouping_card_applied(Sensitivity)].

%% ============================================================================
%% WEIGHTED KEY IDENTIFICATION (C156)
%% ============================================================================

%% best_key_weighted(+Profile, +Alpha_KS, +Alpha_DFT, +Alpha_Spiral, -Key)
%% Combines KS, DFT, and Spiral Array evidence using caller-supplied alpha
%% weights to identify the best key.  Each model votes for a key (pitch class
%% 0..11); votes are weighted by the corresponding alpha and by each model's
%% own confidence.  The pitch class with the highest weighted score wins.
%%
%% Profile  : 12-element list of pitch class counts/weights
%% Alpha_KS : weight for Krumhansl-Schmuckler evidence  (0..1)
%% Alpha_DFT: weight for DFT phase evidence              (0..1)
%% Alpha_Spiral: weight for Spiral Array evidence         (0..1)
%% Key      : unified result key(RootPC, Mode)
%%
%% Depends on predicates from music-theory-computational.pl:
%%   ks_best_key/3, ks_key_score/4
%%   dft_phase_key/3
%%   spiral_key_point/3, spiral_point_pc/2, point_dist2/3, index_to_note/2

best_key_weighted(Profile, Alpha_KS, Alpha_DFT, Alpha_Spiral, key(BestPC, BestMode)) :-
  %% --- KS evidence ---
  ks_best_key(Profile, KsPC, KsMode),
  ks_key_score(Profile, KsPC, KsMode, KsRawScore),
  KsScore is Alpha_KS * KsRawScore,

  %% --- DFT evidence ---
  dft_phase_key(Profile, DftPC, DftConf),
  DftScore is Alpha_DFT * (DftConf / 100),

  %% --- Spiral evidence ---
  %% Build a weighted centroid from the profile and measure distance to
  %% each candidate key center; closer = higher score.
  spiral_profile_score(Profile, SpiralPC, SpiralMode, SpiralRaw),
  SpiralScore is Alpha_Spiral * SpiralRaw,

  %% --- Combine votes per pitch class ---
  %% Collect per-PC scores: each model contributes to its preferred PC.
  findall(Total-PC-Mode, (
    between(0, 11, PC),
    (Mode = major ; Mode = minor),
    ( PC =:= KsPC, Mode = KsMode -> V_KS is KsScore ; V_KS is 0 ),
    ( PC =:= DftPC -> V_DFT is DftScore ; V_DFT is 0 ),
    ( PC =:= SpiralPC, Mode = SpiralMode -> V_Sp is SpiralScore ; V_Sp is 0 ),
    Total is V_KS + V_DFT + V_Sp
  ), Votes),
  sort(Votes, Sorted),
  append(_, [_BestTotal-BestPC-BestMode], Sorted).

%% spiral_profile_score(+Profile, -BestPC, -BestMode, -Score)
%% Score a 12-element pitch class profile against all candidate keys using
%% the Spiral Array centroid distance.  The profile is converted to a
%% weighted average point in spiral space, then compared to each key center.
spiral_profile_score(Profile, BestPC, BestMode, BestScore) :-
  spiral_profile_centroid(Profile, Centroid),
  findall(Score-PC-Mode, (
    between(0, 11, PC),
    (Mode = major ; Mode = minor),
    index_to_note(PC, Note),
    spiral_key_point(Note, Mode, KP),
    point_dist2(Centroid, KP, D2),
    Score is 1 / (1 + D2)
  ), Scores),
  sort(Scores, Sorted),
  append(_, [BestScore-BestPC-BestMode], Sorted).

%% spiral_profile_centroid(+Profile, -Centroid)
%% Compute the weighted centroid in spiral space from a pitch class profile.
spiral_profile_centroid(Profile, p(AX, AY, AZ)) :-
  spiral_profile_centroid_(0, Profile, 0.0, 0.0, 0.0, 0.0, SX, SY, SZ, TotalW),
  ( TotalW > 0 ->
      AX is SX / TotalW,
      AY is SY / TotalW,
      AZ is SZ / TotalW
  ; AX is 0.0, AY is 0.0, AZ is 0.0
  ).

spiral_profile_centroid_(_, [], SX, SY, SZ, W, SX, SY, SZ, W).
spiral_profile_centroid_(PC, [Val|Rest], SX0, SY0, SZ0, W0, SX, SY, SZ, W) :-
  spiral_point_pc(PC, p(PX, PY, PZ)),
  SX1 is SX0 + Val * PX,
  SY1 is SY0 + Val * PY,
  SZ1 is SZ0 + Val * PZ,
  W1 is W0 + Val,
  PC1 is PC + 1,
  spiral_profile_centroid_(PC1, Rest, SX1, SY1, SZ1, W1, SX, SY, SZ, W).

%% ============================================================================
%% NEW CONSTRAINT TYPE PREDICATES (C411, C511-C513, C689-C691, C789-C791)
%% ============================================================================

%% Constraint type registrations for new constraint domains
constraint_type(trailer_build(_, _, _), trailer_build).
constraint_type(leitmotif(_, _), leitmotif).
constraint_type(leitmotif(_), leitmotif).
constraint_type(drone(_, _), drone).
constraint_type(heterophony(_, _, _), heterophony).
constraint_type(arranger_style(_), arranger_style).
constraint_type(scene_arc(_), scene_arc).

%% ============================================================================
%% TRAILER BUILD PREDICATES (C411)
%% ============================================================================

%% trailer_build_structure(+BuildBars, +HitCount, -HitPositions)
%% Compute evenly-spaced hit positions within a build section.
trailer_build_structure(BuildBars, HitCount, HitPositions) :-
  HitCount > 0,
  Interval is BuildBars / HitCount,
  trailer_hit_positions(0, HitCount, Interval, BuildBars, HitPositions).

trailer_hit_positions(_, 0, _, _, []) :- !.
trailer_hit_positions(Current, Remaining, Interval, Max, [Current|Rest]) :-
  Current =< Max,
  Next is Current + Interval,
  R1 is Remaining - 1,
  trailer_hit_positions(Next, R1, Interval, Max, Rest).

%% trailer_riser_type(+Style, -RiserPattern)
trailer_riser_type(noise_sweep, [noise_sweep]).
trailer_riser_type(pitch_rise, [pitch_rise]).
trailer_riser_type(percussion_roll, [percussion_roll]).
trailer_riser_type(string_trem, [string_trem]).
trailer_riser_type(combined, [noise_sweep, pitch_rise, percussion_roll]).

%% recommend trailer build parameters from spec
recommend_param(trailer_build_card, build_bars, 32, 0.8) :-
  spec_style(current, trailer),
  spec_tempo(current, T),
  T >= 120.

recommend_param(trailer_build_card, build_bars, 16, 0.7) :-
  spec_style(current, trailer),
  spec_tempo(current, T),
  T < 120.

%% ============================================================================
%% LEITMOTIF PREDICATES (C228-C229)
%% ============================================================================

%% Dynamic storage for motif fingerprints
:- dynamic(motif_fingerprint/4).  %% motif_fingerprint(MotifId, Intervals, RhythmRatios, Label)

%% Store a motif fingerprint
store_motif(MotifId, Intervals, RhythmRatios, Label) :-
  retractall(motif_fingerprint(MotifId, _, _, _)),
  assertz(motif_fingerprint(MotifId, Intervals, RhythmRatios, Label)).

%% motif_similarity(+Intervals1, +Intervals2, -Score)
%% Compute normalized interval-sequence similarity (0-1).
motif_similarity(I1, I2, Score) :-
  length(I1, L1),
  length(I2, L2),
  MinLen is min(L1, L2),
  MaxLen is max(L1, L2),
  ( MaxLen =:= 0 -> Score is 1.0
  ; motif_common_intervals(I1, I2, MinLen, 0, Matches),
    Score is Matches / MaxLen
  ).

motif_common_intervals(_, _, 0, Acc, Acc) :- !.
motif_common_intervals([H1|T1], [H2|T2], N, Acc, Matches) :-
  N > 0,
  ( H1 =:= H2 -> Acc1 is Acc + 1 ; Acc1 is Acc ),
  N1 is N - 1,
  motif_common_intervals(T1, T2, N1, Acc1, Matches).
motif_common_intervals(_, _, _, Acc, Acc).

%% motif_transform(+Intervals, +Op, -Transformed)
motif_transform(Intervals, inversion, Transformed) :-
  maplist([I, NI]>>(NI is -I), Intervals, Transformed).
motif_transform(Intervals, retrograde, Transformed) :-
  reverse(Intervals, Transformed).
motif_transform(Intervals, augmentation, Transformed) :-
  maplist([I, NI]>>(NI is I * 2), Intervals, Transformed).
motif_transform(Intervals, diminution, Transformed) :-
  maplist([I, NI]>>(NI is I // 2), Intervals, Transformed).

%% ============================================================================
%% DRONE PREDICATES (C511)
%% ============================================================================

%% drone_tones_for_raga(+Raga, -DroneTones)
%% Canonical drone tones for each raga (Sa + Pa or Sa + Ma).
drone_tones_for_raga(mohanam, [sa, pa]).
drone_tones_for_raga(hamsadhwani, [sa, pa]).
drone_tones_for_raga(kalyani, [sa, pa]).
drone_tones_for_raga(keeravani, [sa, pa]).
drone_tones_for_raga(shankarabharanam, [sa, pa]).
drone_tones_for_raga(hindolam, [sa, ma1]).
drone_tones_for_raga(abhogi, [sa, pa]).
drone_tones_for_raga(todi, [sa, pa]).
drone_tones_for_raga(bhairavi, [sa, pa]).
drone_tones_for_raga(kambhoji, [sa, pa]).

%% drone_tones_for_celtic_tune(+TuneType, +Key, -DroneTones)
drone_tones_for_celtic_tune(reel, Key, [Key, Fifth]) :- fifth_of(Key, Fifth).
drone_tones_for_celtic_tune(jig, Key, [Key, Fifth]) :- fifth_of(Key, Fifth).
drone_tones_for_celtic_tune(air, Key, [Key]).
drone_tones_for_celtic_tune(_, Key, [Key]).

%% fifth_of(+Root, -Fifth) - compute the fifth above a root
fifth_of(Root, Fifth) :-
  note_index(Root, Idx),
  FifthIdx is (Idx + 7) mod 12,
  note_index(Fifth, FifthIdx).

%% drone_style_for_culture(+Culture, -Style)
drone_style_for_culture(carnatic, sruti_box).
drone_style_for_culture(celtic, pipes).
drone_style_for_culture(chinese, open_strings).
drone_style_for_culture(western, sustained).

%% ============================================================================
%% KORVAI/MORA PREDICATES (C513)
%% ============================================================================

%% korvai_valid(+TotalBeats, +GapBeats, +PatternLength)
%% Check if a korvai structure is mathematically valid:
%% 3 * PatternLength + 2 * GapBeats = TotalBeats
korvai_valid(TotalBeats, GapBeats, PatternLength) :-
  PatternLength is (TotalBeats - 2 * GapBeats) / 3,
  PatternLength > 0,
  PatternLength =:= round(PatternLength).

%% mora_valid(+TotalBeats, +GapBeats, +PatternLength)
%% Mora: 3 * PatternLength + 2 * GapBeats = TotalBeats (same math, different context)
mora_valid(TotalBeats, GapBeats, PatternLength) :-
  korvai_valid(TotalBeats, GapBeats, PatternLength).

%% tihai_landing_beat(+StartBeat, +PatternLength, +GapBeats, -LandingBeat)
%% Compute the sam (landing beat) for a tihai.
tihai_landing_beat(StartBeat, PatternLength, GapBeats, LandingBeat) :-
  LandingBeat is StartBeat + 3 * PatternLength + 2 * GapBeats.

%% ============================================================================
%% HETEROPHONY PREDICATES (C789)
%% ============================================================================

%% heterophony_variation(+ReferenceNotes, +Depth, +VoiceIdx, -VariedNotes)
%% Generate a variation of the reference melody for a heterophonic voice.
heterophony_variation(Notes, subtle, _, Notes).  %% subtle = unison (no change)
heterophony_variation(Notes, moderate, VoiceIdx, Varied) :-
  Offset is (VoiceIdx mod 3) - 1,  %% -1, 0, or +1 scale degrees
  maplist(heterophony_offset(Offset), Notes, Varied).
heterophony_variation(Notes, free, VoiceIdx, Varied) :-
  Offset is (VoiceIdx mod 5) - 2,  %% -2..+2 scale degrees
  maplist(heterophony_offset(Offset), Notes, Varied).

heterophony_offset(Offset, Note, VariedNote) :-
  VariedNote is Note + Offset.

%% heterophony_timing_spread(+BaseOnset, +SpreadAmount, +VoiceIdx, -AdjustedOnset)
heterophony_timing_spread(Onset, Spread, VoiceIdx, Adjusted) :-
  Jitter is Spread * ((VoiceIdx mod 7) - 3) / 3.0,
  Adjusted is Onset + Jitter.

%% ============================================================================
%% SPEC LINT EXTENSIONS (C837-C838)
%% ============================================================================

%% Lint: ornament density exceeds instrument technique constraints
spec_lint_check(Warning, warning) :-
  constraint(ornament_budget(N)),
  N > 3,
  spec_tempo(current, T),
  T > 140,
  format(atom(Warning),
    'Ornament density ~w/beat at tempo ~w exceeds typical technique limits',
    [N, T]).

%% Lint: heterophony with too many voices may cause masking
spec_lint_check(Warning, info) :-
  spec_constraint(current, heterophony(V, _, _), _, _),
  V > 4,
  format(atom(Warning),
    'Heterophony with ~w voices may cause masking; consider 2-4 voices', [V]).

%% Lint: trailer build with sparse percussion is unusual
spec_lint_check(Warning, info) :-
  spec_constraint(current, trailer_build(_, _, sparse), _, _),
  format(atom(Warning),
    'Trailer builds typically use dense percussion; sparse is unusual', []).

%% ============================================================================
%% NEW THEORY CARD CONSTRAINT PLUMBING (extensions to C100)
%% ============================================================================

theory_card_constraint(trailer_build, build_bars, trailer_build).
theory_card_constraint(trailer_build, hit_count, trailer_build).
theory_card_constraint(trailer_build, percussion_density, trailer_build).
theory_card_constraint(leitmotif_library, active_motif_id, leitmotif).
theory_card_constraint(leitmotif_library, transform_op, leitmotif).
theory_card_constraint(drone, drone_tone_1, drone).
theory_card_constraint(drone, drone_tone_2, drone).
theory_card_constraint(drone, drone_style, drone).
theory_card_constraint(mridangam_pattern, tala, tala).
theory_card_constraint(mridangam_pattern, pattern_density, phrase_density).
theory_card_constraint(korvai_generator, structure, tala).
theory_card_constraint(korvai_generator, target_beats, tala).
theory_card_constraint(ornament_generator, instrument, ornament_budget).
theory_card_constraint(ornament_generator, ornament_budget, ornament_budget).
theory_card_constraint(bodhran, tune_type, celtic_tune).
theory_card_constraint(bodhran, humanize, swing).
theory_card_constraint(heterophony, voice_count, heterophony).
theory_card_constraint(heterophony, variation_depth, heterophony).
theory_card_constraint(heterophony, timing_spread, heterophony).
theory_card_constraint(guzheng_gliss, mode, chinese_mode).
theory_card_constraint(guzheng_gliss, gliss_rate, ornament_budget).
theory_card_constraint(erhu_ornament, slide_density, ornament_budget).
theory_card_constraint(erhu_ornament, vibrato_density, ornament_budget).

%% New theory card recommendations
recommend_theory_card(style(trailer), trailer_build, 0.9).
recommend_theory_card(film_device(trailer_rise), trailer_build, 0.95).
recommend_theory_card(culture(carnatic), drone, 0.8).
recommend_theory_card(culture(celtic), drone, 0.6).
recommend_theory_card(culture(carnatic), mridangam_pattern, 0.7).
recommend_theory_card(culture(carnatic), korvai_generator, 0.6).
recommend_theory_card(culture(celtic), ornament_generator, 0.8).
recommend_theory_card(culture(celtic), bodhran, 0.7).
recommend_theory_card(culture(chinese), heterophony, 0.8).
recommend_theory_card(culture(chinese), guzheng_gliss, 0.6).
recommend_theory_card(culture(chinese), erhu_ornament, 0.6).

%% ============================================================================
%% NEW CONSTRAINT PACKS (extending C091)
%% ============================================================================

constraint_pack(trailer_heroic, [
  style(trailer),
  film_mood(heroic),
  film_device(trailer_rise),
  trailer_build(16, 3, dense),
  culture(western)
]).

constraint_pack(carnatic_kriti, [
  culture(carnatic),
  phrase_density(medium),
  ornament_budget(2),
  gamaka_density(medium)
]).

constraint_pack(celtic_session, [
  culture(celtic),
  celtic_tune(reel),
  ornament_budget(2),
  accent_model(celtic_dance)
]).

constraint_pack(chinese_ensemble, [
  culture(chinese),
  chinese_mode(gong),
  heterophony(3, moderate, 0.3),
  phrase_density(medium)
]).

%% ============================================================================
%% SELECTION ANALYZER PREDICATES (C882-C883)
%% ============================================================================

%% analyze_selection(+Events, -Profile)
%% Extract a musical profile from a list of note events.
%% Events: list of event(Pitch, Onset, Duration, Velocity)
analyze_selection(Events, profile(PitchClasses, IntervalSet, DensityEstimate, RangeSpan)) :-
  extract_pitch_classes(Events, PitchClasses),
  extract_intervals(Events, IntervalSet),
  estimate_density(Events, DensityEstimate),
  compute_range(Events, RangeSpan).

extract_pitch_classes(Events, PCs) :-
  findall(PC, (member(event(P, _, _, _), Events), PC is P mod 12), PCsRaw),
  sort(PCsRaw, PCs).

extract_intervals(Events, Intervals) :-
  findall(I, (
    append(_, [event(P1, _, _, _), event(P2, _, _, _)|_], Events),
    I is P2 - P1
  ), IntervalsRaw),
  sort(IntervalsRaw, Intervals).

estimate_density(Events, Density) :-
  length(Events, N),
  ( N =< 2 -> Density = sparse
  ; N =< 8 -> Density = medium
  ; Density = dense
  ).

compute_range(Events, Range) :-
  findall(P, member(event(P, _, _, _), Events), Pitches),
  ( Pitches = [] -> Range is 0
  ; min_list(Pitches, Min),
    max_list(Pitches, Max),
    Range is Max - Min
  ).

%% profile_to_culture_match(+Profile, -Culture, -Confidence)
%% Match a selection profile to a likely culture.
profile_to_culture_match(profile(PCs, _, _, _), carnatic, 0.8) :-
  length(PCs, L),
  L =< 7,
  L >= 5.
profile_to_culture_match(profile(PCs, _, _, _), chinese, 0.7) :-
  length(PCs, L),
  L =:= 5.
profile_to_culture_match(profile(PCs, _, _, _), western, 0.6) :-
  length(PCs, L),
  L >= 6.
profile_to_culture_match(profile(_, _, _, _), western, 0.4).  %% fallback

%% profile_to_raga_match(+Profile, -Raga, -Confidence)
profile_to_raga_match(profile(PCs, _, _, _), Raga, Confidence) :-
  raga_pcs(Raga, RagaPCs),
  intersection(PCs, RagaPCs, Common),
  length(Common, NC),
  length(PCs, NP),
  ( NP > 0 -> Confidence is NC / NP ; Confidence is 0 ),
  Confidence > 0.5.

%% profile_to_chinese_mode_match(+Profile, -Mode, -Confidence)
profile_to_chinese_mode_match(profile(PCs, _, _, _), Mode, Confidence) :-
  chinese_pentatonic_mode(Mode, ModePCs),
  intersection(PCs, ModePCs, Common),
  length(Common, NC),
  length(PCs, NP),
  ( NP > 0 -> Confidence is NC / NP ; Confidence is 0 ),
  Confidence > 0.5.

%% ============================================================================
%% MODE SHIFT RECOMMENDATION (C847)
%% ============================================================================

%% recommend_mode_shift(+CurrentMode, +Context, -TargetMode, -Reasons)
%% Suggest a mode shift instead of a chord modulation.
recommend_mode_shift(major, tension_increase, mixolydian,
  [because('Mixolydian adds bluesy tension while staying close to major')]).
recommend_mode_shift(major, darken, dorian,
  [because('Dorian provides a darker color without full minor shift')]).
recommend_mode_shift(major, brighten, lydian,
  [because('Lydian raises the 4th for bright, floating quality')]).
recommend_mode_shift(natural_minor, tension_increase, phrygian,
  [because('Phrygian adds exotic tension via lowered 2nd')]).
recommend_mode_shift(natural_minor, lighten, dorian,
  [because('Dorian raises the 6th for a lighter minor feel')]).
recommend_mode_shift(dorian, darken, natural_minor,
  [because('Natural minor darkens by lowering the 6th')]).
recommend_mode_shift(dorian, brighten, mixolydian,
  [because('Mixolydian brightens by raising the 3rd')]).
recommend_mode_shift(phrygian, lighten, natural_minor,
  [because('Natural minor lightens by raising the 2nd')]).
recommend_mode_shift(lydian, darken, major,
  [because('Major restores standard 4th for less ambiguity')]).
recommend_mode_shift(mixolydian, brighten, major,
  [because('Major raises the 7th for stronger dominant resolution')]).
recommend_mode_shift(mixolydian, darken, dorian,
  [because('Dorian lowers the 3rd for a minor-ish feel')]).

%% ============================================================================
%% MASKING AVOIDANCE (C851-C853)
%% ============================================================================

%% masking_avoidance(+Role1, +Role2, -RegisterSeparation)
%% Minimum register separation (in semitones) to avoid timbral masking.
masking_avoidance(melody, countermelody, 5).
masking_avoidance(melody, pad, 12).
masking_avoidance(melody, bass, 24).
masking_avoidance(countermelody, pad, 7).
masking_avoidance(countermelody, bass, 19).
masking_avoidance(pad, bass, 12).
masking_avoidance(drone, melody, 12).
masking_avoidance(drone, countermelody, 7).
masking_avoidance(R1, R2, Sep) :-
  R1 @> R2,
  masking_avoidance(R2, R1, Sep).

%% allocate_registers(+Roles, +TotalRange, -Allocations)
%% Allocate register ranges to avoid masking.
allocate_registers(Roles, range(Low, High), Allocations) :-
  length(Roles, N),
  Span is High - Low,
  SliceSize is Span / N,
  allocate_registers_(Roles, Low, SliceSize, Allocations).

allocate_registers_([], _, _, []).
allocate_registers_([Role|Rest], Current, Slice, [Role-range(Current, Top)|Allocs]) :-
  Top is Current + Slice,
  allocate_registers_(Rest, Top, Slice, Allocs).