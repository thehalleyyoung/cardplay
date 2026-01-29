%% ============================================================================
%% User Preferences Dynamic Knowledge Base
%%
%% L325-L329: Dynamic Prolog facts for user preference learning.
%%
%% All facts in this KB are asserted/retracted at runtime based on user
%% actions. Nothing is network-transmitted (L335: privacy-safe).
%%
%% Predicates:
%%   user_prefers_board/2          – (UserId, BoardId)
%%   user_workflow/2               – (UserId, WorkflowPattern)
%%   user_genre_preference/2       – (UserId, Genre)
%%   user_skill_level/2            – (UserId, SkillLevel)
%%   user_generator_style/3        – (UserId, GeneratorType, Style)
%%   user_board_transition/3       – (UserId, FromBoard, ToBoard)
%%   user_constraint_template/3    – (UserId, GeneratorType, ConstraintId)
%%
%% @module @cardplay/ai/knowledge/user-prefs
%% ============================================================================

%% ---------------------------------------------------------------------------
%% L326: user_prefers_board/2
%% Dynamic fact recording which boards a user gravitates toward.
%% ---------------------------------------------------------------------------
:- dynamic(user_prefers_board/2).

%% ---------------------------------------------------------------------------
%% L327: user_workflow/2
%% Learned workflow patterns (e.g. user usually opens tracker then mixer).
%% ---------------------------------------------------------------------------
:- dynamic(user_workflow/2).

%% ---------------------------------------------------------------------------
%% L328: user_genre_preference/2
%% Genre usage statistics as atoms.
%% ---------------------------------------------------------------------------
:- dynamic(user_genre_preference/2).

%% ---------------------------------------------------------------------------
%% L329: user_skill_level/2
%% Estimated skill level per area.
%% Levels: beginner, intermediate, advanced, expert
%% ---------------------------------------------------------------------------
:- dynamic(user_skill_level/2).

%% ---------------------------------------------------------------------------
%% Generator-specific preferences
%% ---------------------------------------------------------------------------
:- dynamic(user_generator_style/3).
:- dynamic(user_board_transition/3).
:- dynamic(user_constraint_template/3).

%% ============================================================================
%% Inference rules over user preferences
%% ============================================================================

%% recommend_board/2 – Suggest a board based on learned preference
recommend_board(UserId, BoardId) :-
    user_prefers_board(UserId, BoardId).

%% recommend_genre/2 – Suggest genre based on usage
recommend_genre(UserId, Genre) :-
    user_genre_preference(UserId, Genre).

%% recommend_next_board/3 – Based on transitions
recommend_next_board(UserId, CurrentBoard, NextBoard) :-
    user_board_transition(UserId, CurrentBoard, NextBoard).

%% is_beginner/1 – True if user has beginner skill in any area
is_beginner(UserId) :-
    user_skill_level(UserId, beginner).

%% is_advanced/1 – True if user has advanced or expert skill
is_advanced(UserId) :-
    user_skill_level(UserId, advanced).
is_advanced(UserId) :-
    user_skill_level(UserId, expert).

%% should_simplify/1 – True if suggestions should be simplified
should_simplify(UserId) :-
    is_beginner(UserId).

%% should_show_advanced/1 – True if advanced features should be visible
should_show_advanced(UserId) :-
    is_advanced(UserId).

%% preferred_generator_style/3 – Query learned generator style
preferred_generator_style(UserId, Generator, Style) :-
    user_generator_style(UserId, Generator, Style).

%% ============================================================================
%% N106-N108: Learned pattern dynamic KB facts
%% ============================================================================

%% ---------------------------------------------------------------------------
%% N106: learned_workflow_pattern/3
%% Dynamic fact recording recurring deck-opening sequences.
%% (UserId, PatternId, DeckSequence)
%% ---------------------------------------------------------------------------
:- dynamic(learned_workflow_pattern/3).

%% ---------------------------------------------------------------------------
%% N107: learned_parameter_preference/4
%% Dynamic fact recording frequently adjusted parameters.
%% (UserId, ParamName, DeckType, PreferredValue)
%% ---------------------------------------------------------------------------
:- dynamic(learned_parameter_preference/4).

%% ---------------------------------------------------------------------------
%% N108: learned_routing_pattern/4
%% Dynamic fact recording routing connections the user creates repeatedly.
%% (UserId, FromDeck, ToDeck, Purpose)
%% ---------------------------------------------------------------------------
:- dynamic(learned_routing_pattern/4).

%% ============================================================================
%% Inference rules over learned patterns (N106-N108)
%% ============================================================================

%% suggest_workflow/3 – Suggest next deck based on learned workflow patterns.
%% Given a partial deck sequence prefix, find patterns that start with it.
suggest_workflow(UserId, CurrentDecks, SuggestedDeck) :-
    learned_workflow_pattern(UserId, _, Sequence),
    append(CurrentDecks, [SuggestedDeck|_], Sequence).

%% suggest_parameter/4 – Suggest a parameter value based on learned preference.
suggest_parameter(UserId, ParamName, DeckType, Value) :-
    learned_parameter_preference(UserId, ParamName, DeckType, Value).

%% suggest_routing/3 – Suggest routing based on learned patterns.
suggest_routing_pattern(UserId, FromDeck, ToDeck) :-
    learned_routing_pattern(UserId, FromDeck, ToDeck, _).

%% has_learned_patterns/1 – True if any learned patterns exist for user.
has_learned_patterns(UserId) :-
    learned_workflow_pattern(UserId, _, _), !.
has_learned_patterns(UserId) :-
    learned_parameter_preference(UserId, _, _, _), !.
has_learned_patterns(UserId) :-
    learned_routing_pattern(UserId, _, _, _).
