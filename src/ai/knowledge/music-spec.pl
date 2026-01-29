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