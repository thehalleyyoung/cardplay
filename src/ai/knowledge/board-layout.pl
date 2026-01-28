%% board-layout.pl - Board and Deck Knowledge Base for CardPlay AI
%% 
%% This Prolog knowledge base provides reasoning about:
%% - Board types and control levels
%% - Deck types and compatibility
%% - Workflow recommendations
%% - Layout suggestions and constraints
%%
%% Reference: cardplayui.md for full board architecture

%% ============================================================================
%% L082: BOARD DEFINITIONS
%% ============================================================================

%% board/2 - board(BoardId, ControlLevel)
%% ControlLevel: full_manual | manual_with_hints | assisted | collaborative | directed | generative

% Manual boards - full control
board(notation_board, full_manual).
board(basic_tracker_board, full_manual).
board(basic_sampler_board, full_manual).
board(basic_session_board, full_manual).

% Assisted boards - you + tools
board(tracker_harmony_board, manual_with_hints).
board(tracker_phrases_board, assisted).
board(session_phrases_board, assisted).
board(notation_harmony_board, manual_with_hints).

% Generative boards - AI-driven
board(arranger_board, directed).
board(ai_composition_board, directed).
board(generative_ambient_board, generative).
board(algorithmic_drums_board, generative).

% Hybrid boards - mixed control
board(composer_board, collaborative).
board(producer_board, collaborative).
board(live_performance_board, collaborative).

%% board_category/2 - Categorizes boards
board_category(BoardId, manual) :- board(BoardId, full_manual).
board_category(BoardId, assisted) :- board(BoardId, manual_with_hints).
board_category(BoardId, assisted) :- board(BoardId, assisted).
board_category(BoardId, generative) :- board(BoardId, directed).
board_category(BoardId, generative) :- board(BoardId, generative).
board_category(BoardId, hybrid) :- board(BoardId, collaborative).

%% ============================================================================
%% L083: DECK TYPES
%% ============================================================================

%% deck_type/1 - All available deck types
deck_type(pattern_editor).
deck_type(phrase_library).
deck_type(instrument_rack).
deck_type(effect_chain).
deck_type(mixer).
deck_type(harmony_explorer).
deck_type(arranger).
deck_type(timeline).
deck_type(clip_launcher).
deck_type(sampler).
deck_type(notation_editor).
deck_type(transport).
deck_type(browser).
deck_type(piano_roll).
deck_type(automation).
deck_type(generator).
deck_type(ai_assistant).
deck_type(routing).
deck_type(meter_bridge).

%% ============================================================================
%% L084: BOARD HAS DECK
%% ============================================================================

%% board_has_deck/2 - Which decks are present on which boards
% Notation Board
board_has_deck(notation_board, notation_editor).
board_has_deck(notation_board, instrument_rack).
board_has_deck(notation_board, mixer).
board_has_deck(notation_board, transport).

% Basic Tracker Board
board_has_deck(basic_tracker_board, pattern_editor).
board_has_deck(basic_tracker_board, instrument_rack).
board_has_deck(basic_tracker_board, effect_chain).
board_has_deck(basic_tracker_board, mixer).
board_has_deck(basic_tracker_board, transport).

% Basic Sampler Board
board_has_deck(basic_sampler_board, sampler).
board_has_deck(basic_sampler_board, pattern_editor).
board_has_deck(basic_sampler_board, effect_chain).
board_has_deck(basic_sampler_board, mixer).

% Basic Session Board
board_has_deck(basic_session_board, clip_launcher).
board_has_deck(basic_session_board, mixer).
board_has_deck(basic_session_board, transport).

% Tracker + Harmony Board
board_has_deck(tracker_harmony_board, pattern_editor).
board_has_deck(tracker_harmony_board, harmony_explorer).
board_has_deck(tracker_harmony_board, instrument_rack).
board_has_deck(tracker_harmony_board, effect_chain).
board_has_deck(tracker_harmony_board, mixer).

% Tracker + Phrases Board
board_has_deck(tracker_phrases_board, pattern_editor).
board_has_deck(tracker_phrases_board, phrase_library).
board_has_deck(tracker_phrases_board, instrument_rack).
board_has_deck(tracker_phrases_board, effect_chain).
board_has_deck(tracker_phrases_board, mixer).

% Notation + Harmony Board
board_has_deck(notation_harmony_board, notation_editor).
board_has_deck(notation_harmony_board, harmony_explorer).
board_has_deck(notation_harmony_board, instrument_rack).
board_has_deck(notation_harmony_board, mixer).

% Arranger Board
board_has_deck(arranger_board, arranger).
board_has_deck(arranger_board, generator).
board_has_deck(arranger_board, timeline).
board_has_deck(arranger_board, mixer).

% AI Composition Board
board_has_deck(ai_composition_board, ai_assistant).
board_has_deck(ai_composition_board, generator).
board_has_deck(ai_composition_board, timeline).
board_has_deck(ai_composition_board, mixer).

% Generative Ambient Board
board_has_deck(generative_ambient_board, generator).
board_has_deck(generative_ambient_board, effect_chain).
board_has_deck(generative_ambient_board, automation).
board_has_deck(generative_ambient_board, mixer).

% Composer Board (Hybrid)
board_has_deck(composer_board, notation_editor).
board_has_deck(composer_board, piano_roll).
board_has_deck(composer_board, phrase_library).
board_has_deck(composer_board, harmony_explorer).
board_has_deck(composer_board, instrument_rack).
board_has_deck(composer_board, mixer).

% Producer Board (Hybrid)
board_has_deck(producer_board, pattern_editor).
board_has_deck(producer_board, clip_launcher).
board_has_deck(producer_board, sampler).
board_has_deck(producer_board, arranger).
board_has_deck(producer_board, effect_chain).
board_has_deck(producer_board, mixer).

%% ============================================================================
%% L085: DECK COMPATIBILITY WITH CONTROL LEVELS
%% ============================================================================

%% deck_compatible_with_control_level/2
% Manual decks - available on all boards
deck_compatible_with_control_level(pattern_editor, _).
deck_compatible_with_control_level(instrument_rack, _).
deck_compatible_with_control_level(effect_chain, _).
deck_compatible_with_control_level(mixer, _).
deck_compatible_with_control_level(transport, _).
deck_compatible_with_control_level(notation_editor, _).
deck_compatible_with_control_level(sampler, _).
deck_compatible_with_control_level(piano_roll, _).
deck_compatible_with_control_level(automation, _).
deck_compatible_with_control_level(browser, _).
deck_compatible_with_control_level(routing, _).
deck_compatible_with_control_level(meter_bridge, _).

% Assisted decks - not on full_manual
deck_compatible_with_control_level(phrase_library, Level) :-
    Level \= full_manual.
deck_compatible_with_control_level(harmony_explorer, Level) :-
    Level \= full_manual.
deck_compatible_with_control_level(clip_launcher, _).
deck_compatible_with_control_level(timeline, _).

% Generative decks - only on assisted+ levels
deck_compatible_with_control_level(generator, Level) :-
    member(Level, [assisted, collaborative, directed, generative]).
deck_compatible_with_control_level(arranger, Level) :-
    member(Level, [collaborative, directed, generative]).
deck_compatible_with_control_level(ai_assistant, Level) :-
    member(Level, [directed, generative]).

%% ============================================================================
%% L086: TOOL REQUIREMENTS
%% ============================================================================

%% tool_required_for_deck/2 - Which tools must be enabled for a deck
tool_required_for_deck(phrase_library, phrase_database).
tool_required_for_deck(harmony_explorer, harmony_explorer_tool).
tool_required_for_deck(generator, phrase_generators).
tool_required_for_deck(arranger, arranger_tool).
tool_required_for_deck(ai_assistant, ai_composer).

%% deck_requires_no_tool/1 - Decks that don't require special tools
deck_requires_no_tool(pattern_editor).
deck_requires_no_tool(instrument_rack).
deck_requires_no_tool(effect_chain).
deck_requires_no_tool(mixer).
deck_requires_no_tool(transport).
deck_requires_no_tool(notation_editor).
deck_requires_no_tool(sampler).
deck_requires_no_tool(piano_roll).
deck_requires_no_tool(automation).
deck_requires_no_tool(browser).
deck_requires_no_tool(clip_launcher).
deck_requires_no_tool(timeline).

%% ============================================================================
%% L087-L088: DECK LAYOUT RULES
%% ============================================================================

%% deck_layout_position/2 - Suggested position for deck types
deck_layout_position(pattern_editor, center).
deck_layout_position(notation_editor, center).
deck_layout_position(piano_roll, center).
deck_layout_position(arranger, center).
deck_layout_position(timeline, center).
deck_layout_position(clip_launcher, center).

deck_layout_position(phrase_library, left).
deck_layout_position(browser, left).
deck_layout_position(harmony_explorer, right).
deck_layout_position(ai_assistant, right).

deck_layout_position(instrument_rack, bottom).
deck_layout_position(effect_chain, bottom).
deck_layout_position(mixer, bottom).
deck_layout_position(meter_bridge, bottom).
deck_layout_position(transport, bottom).

deck_layout_position(generator, right).
deck_layout_position(automation, bottom).
deck_layout_position(sampler, center).
deck_layout_position(routing, bottom).

%% panel_size_suggestion/3 - Suggested sizes (percentage)
panel_size_suggestion(pattern_editor, width, 60).
panel_size_suggestion(pattern_editor, height, 70).
panel_size_suggestion(notation_editor, width, 70).
panel_size_suggestion(notation_editor, height, 60).
panel_size_suggestion(phrase_library, width, 20).
panel_size_suggestion(phrase_library, height, 100).
panel_size_suggestion(mixer, width, 100).
panel_size_suggestion(mixer, height, 20).
panel_size_suggestion(harmony_explorer, width, 25).
panel_size_suggestion(harmony_explorer, height, 50).
panel_size_suggestion(arranger, width, 80).
panel_size_suggestion(arranger, height, 70).

%% ============================================================================
%% L089: DECK PAIRING
%% ============================================================================

%% deck_pairing/2 - Decks that work well together
deck_pairing(pattern_editor, phrase_library).
deck_pairing(pattern_editor, harmony_explorer).
deck_pairing(pattern_editor, instrument_rack).
deck_pairing(notation_editor, harmony_explorer).
deck_pairing(notation_editor, phrase_library).
deck_pairing(notation_editor, instrument_rack).
deck_pairing(clip_launcher, arranger).
deck_pairing(clip_launcher, mixer).
deck_pairing(sampler, pattern_editor).
deck_pairing(sampler, effect_chain).
deck_pairing(generator, timeline).
deck_pairing(generator, arranger).
deck_pairing(piano_roll, harmony_explorer).
deck_pairing(automation, mixer).
deck_pairing(effect_chain, mixer).

%% Symmetric: if A pairs with B, B pairs with A
deck_pairs_with(A, B) :- deck_pairing(A, B).
deck_pairs_with(A, B) :- deck_pairing(B, A).

%% ============================================================================
%% L090-L093: WORKFLOWS
%% ============================================================================

%% workflow/2 - workflow(WorkflowId, Description)
workflow(notation_composer, 'Traditional notation-based composition').
workflow(tracker_user, 'Tracker-style pattern sequencing').
workflow(beatmaker, 'Sample-based beat production').
workflow(electronic_producer, 'Electronic music production').
workflow(film_scorer, 'Film and media scoring').
workflow(sound_designer, 'Sound design and synthesis').
workflow(live_performer, 'Live performance and improvisation').
workflow(ambient_artist, 'Ambient and generative music').
workflow(jazz_musician, 'Jazz composition and arrangement').
workflow(classical_arranger, 'Classical orchestration').

%% L091: workflow_requires_deck/2 - Essential decks for workflow
workflow_requires_deck(notation_composer, notation_editor).
workflow_requires_deck(notation_composer, instrument_rack).
workflow_requires_deck(tracker_user, pattern_editor).
workflow_requires_deck(tracker_user, instrument_rack).
workflow_requires_deck(beatmaker, sampler).
workflow_requires_deck(beatmaker, pattern_editor).
workflow_requires_deck(electronic_producer, pattern_editor).
workflow_requires_deck(electronic_producer, effect_chain).
workflow_requires_deck(electronic_producer, mixer).
workflow_requires_deck(film_scorer, notation_editor).
workflow_requires_deck(film_scorer, timeline).
workflow_requires_deck(sound_designer, sampler).
workflow_requires_deck(sound_designer, effect_chain).
workflow_requires_deck(live_performer, clip_launcher).
workflow_requires_deck(live_performer, mixer).
workflow_requires_deck(ambient_artist, generator).
workflow_requires_deck(ambient_artist, effect_chain).
workflow_requires_deck(jazz_musician, notation_editor).
workflow_requires_deck(jazz_musician, harmony_explorer).
workflow_requires_deck(classical_arranger, notation_editor).
workflow_requires_deck(classical_arranger, instrument_rack).

%% L092: workflow_benefits_from_deck/2 - Optional helpful decks
workflow_benefits_from_deck(notation_composer, harmony_explorer).
workflow_benefits_from_deck(notation_composer, phrase_library).
workflow_benefits_from_deck(tracker_user, phrase_library).
workflow_benefits_from_deck(tracker_user, harmony_explorer).
workflow_benefits_from_deck(beatmaker, browser).
workflow_benefits_from_deck(beatmaker, effect_chain).
workflow_benefits_from_deck(electronic_producer, arranger).
workflow_benefits_from_deck(electronic_producer, automation).
workflow_benefits_from_deck(film_scorer, automation).
workflow_benefits_from_deck(film_scorer, mixer).
workflow_benefits_from_deck(sound_designer, automation).
workflow_benefits_from_deck(sound_designer, routing).
workflow_benefits_from_deck(live_performer, automation).
workflow_benefits_from_deck(live_performer, effect_chain).
workflow_benefits_from_deck(ambient_artist, automation).
workflow_benefits_from_deck(ambient_artist, mixer).
workflow_benefits_from_deck(jazz_musician, phrase_library).
workflow_benefits_from_deck(classical_arranger, piano_roll).

%% L093: recommended_board/2 - Best boards for each workflow
recommended_board(notation_composer, notation_board).
recommended_board(notation_composer, notation_harmony_board).
recommended_board(tracker_user, basic_tracker_board).
recommended_board(tracker_user, tracker_phrases_board).
recommended_board(beatmaker, basic_sampler_board).
recommended_board(beatmaker, producer_board).
recommended_board(electronic_producer, producer_board).
recommended_board(electronic_producer, tracker_phrases_board).
recommended_board(film_scorer, composer_board).
recommended_board(film_scorer, notation_harmony_board).
recommended_board(sound_designer, basic_sampler_board).
recommended_board(live_performer, live_performance_board).
recommended_board(live_performer, basic_session_board).
recommended_board(ambient_artist, generative_ambient_board).
recommended_board(ambient_artist, ai_composition_board).
recommended_board(jazz_musician, notation_harmony_board).
recommended_board(jazz_musician, composer_board).
recommended_board(classical_arranger, notation_board).
recommended_board(classical_arranger, composer_board).

%% ============================================================================
%% L094: BOARD TRANSITIONS
%% ============================================================================

%% board_transition/3 - board_transition(From, To, TransitionType)
%% TransitionType: smooth | compatible | requires_migration

board_transition(From, To, smooth) :-
    board(From, Level1),
    board(To, Level2),
    Level1 = Level2.

board_transition(From, To, compatible) :-
    board(From, Level1),
    board(To, Level2),
    compatible_levels(Level1, Level2).

board_transition(From, To, requires_migration) :-
    board(From, Level1),
    board(To, Level2),
    \+ compatible_levels(Level1, Level2),
    Level1 \= Level2.

compatible_levels(full_manual, manual_with_hints).
compatible_levels(manual_with_hints, full_manual).
compatible_levels(manual_with_hints, assisted).
compatible_levels(assisted, manual_with_hints).
compatible_levels(assisted, collaborative).
compatible_levels(collaborative, assisted).
compatible_levels(collaborative, directed).
compatible_levels(directed, collaborative).
compatible_levels(directed, generative).
compatible_levels(generative, directed).

%% ============================================================================
%% L095: DECK OPEN ORDER
%% ============================================================================

%% deck_open_order/2 - Suggested order to open decks for a workflow
deck_open_order(notation_composer, [notation_editor, instrument_rack, mixer, harmony_explorer]).
deck_open_order(tracker_user, [pattern_editor, instrument_rack, mixer, phrase_library]).
deck_open_order(beatmaker, [sampler, pattern_editor, effect_chain, mixer]).
deck_open_order(electronic_producer, [pattern_editor, effect_chain, mixer, arranger]).
deck_open_order(film_scorer, [notation_editor, timeline, instrument_rack, mixer]).
deck_open_order(sound_designer, [sampler, effect_chain, automation, mixer]).
deck_open_order(live_performer, [clip_launcher, mixer, effect_chain, automation]).
deck_open_order(ambient_artist, [generator, effect_chain, automation, mixer]).
deck_open_order(jazz_musician, [notation_editor, harmony_explorer, instrument_rack, mixer]).
deck_open_order(classical_arranger, [notation_editor, instrument_rack, piano_roll, mixer]).

%% ============================================================================
%% L105-L108: SHORTCUTS AND THEMING
%% ============================================================================

%% keyboard_shortcut_conflict/2 - Detects conflicting shortcuts
keyboard_shortcut_conflict(ShortcutA, ShortcutB) :-
    shortcut_for_action(ActionA, ShortcutA),
    shortcut_for_action(ActionB, ShortcutA),
    ActionA \= ActionB,
    ShortcutB = ShortcutA.

%% Default shortcuts for common actions
shortcut_for_action(play, 'Space').
shortcut_for_action(stop, 'Escape').
shortcut_for_action(record, 'R').
shortcut_for_action(undo, 'Cmd+Z').
shortcut_for_action(redo, 'Cmd+Shift+Z').
shortcut_for_action(save, 'Cmd+S').
shortcut_for_action(new_pattern, 'Cmd+N').
shortcut_for_action(duplicate, 'Cmd+D').
shortcut_for_action(delete, 'Backspace').
shortcut_for_action(select_all, 'Cmd+A').
shortcut_for_action(copy, 'Cmd+C').
shortcut_for_action(paste, 'Cmd+V').
shortcut_for_action(cut, 'Cmd+X').

%% L107: theme_appropriate/2 - Theme suggestions for board types
theme_appropriate(dark, _).  % Dark theme works for all
theme_appropriate(light, BoardId) :- board_category(BoardId, manual).
theme_appropriate(notation_theme, notation_board).
theme_appropriate(notation_theme, notation_harmony_board).
theme_appropriate(tracker_theme, basic_tracker_board).
theme_appropriate(tracker_theme, tracker_phrases_board).
theme_appropriate(tracker_theme, tracker_harmony_board).
theme_appropriate(producer_theme, producer_board).
theme_appropriate(producer_theme, basic_session_board).
theme_appropriate(ambient_theme, generative_ambient_board).

%% L108: color_coding_rule/3 - Color coding for control levels
color_coding_rule(full_manual, indicator, blue).
color_coding_rule(manual_with_hints, indicator, green).
color_coding_rule(assisted, indicator, yellow).
color_coding_rule(collaborative, indicator, orange).
color_coding_rule(directed, indicator, purple).
color_coding_rule(generative, indicator, pink).

%% ============================================================================
%% L109-L115: VISIBILITY AND SAFETY RULES
%% ============================================================================

%% L109: deck_visibility_rule/3
deck_visibility_rule(DeckType, BoardId, visible) :-
    board_has_deck(BoardId, DeckType).
deck_visibility_rule(DeckType, BoardId, hidden) :-
    \+ board_has_deck(BoardId, DeckType).

%% L113: performance_constraint/3 - Max deck counts for performance
performance_constraint(max_visible_decks, _, 8).
performance_constraint(max_pattern_editors, _, 4).
performance_constraint(max_generators, _, 2).

%% L115: beginner_safety_rule/2 - Limit complexity for beginners
beginner_safety_rule(hide_advanced_options, true).
beginner_safety_rule(max_visible_decks, 4).
beginner_safety_rule(show_tooltips, true).
beginner_safety_rule(simplified_mixer, true).
beginner_safety_rule(limit_effect_chain, 3).

%% ============================================================================
%% QUERY HELPERS
%% ============================================================================

%% recommend_board_for_workflow/2 - Primary recommendation
recommend_board_for_workflow(Workflow, Board) :-
    recommended_board(Workflow, Board),
    !.  % First match is primary recommendation

%% all_recommended_boards/2 - All recommendations for a workflow
all_recommended_boards(Workflow, Boards) :-
    findall(B, recommended_board(Workflow, B), Boards).

%% validate_deck_combination/3 - Check if decks can coexist on a board
validate_deck_combination(Decks, BoardId, valid) :-
    board(BoardId, Level),
    forall(member(D, Decks), deck_compatible_with_control_level(D, Level)).
validate_deck_combination(Decks, BoardId, invalid(IncompatibleDeck)) :-
    board(BoardId, Level),
    member(IncompatibleDeck, Decks),
    \+ deck_compatible_with_control_level(IncompatibleDeck, Level).

%% suggest_next_deck/3 - Suggest next deck to open
suggest_next_deck(CurrentDecks, Workflow, Suggestion) :-
    workflow_requires_deck(Workflow, Suggestion),
    \+ member(Suggestion, CurrentDecks).
suggest_next_deck(CurrentDecks, Workflow, Suggestion) :-
    workflow_benefits_from_deck(Workflow, Suggestion),
    \+ member(Suggestion, CurrentDecks).

%% count_decks/2 - Count decks on a board
count_decks(BoardId, Count) :-
    findall(D, board_has_deck(BoardId, D), Decks),
    length(Decks, Count).
