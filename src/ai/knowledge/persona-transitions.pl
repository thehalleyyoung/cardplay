%% ============================================================================
%% Cross-Persona Transitions Knowledge Base
%%
%% M321-M328: Rules for transitioning between personas, detecting workflow
%% mixing, and bridging different persona workflows.
%%
%% @module @cardplay/ai/knowledge/persona-transitions
%% ============================================================================

%% ---------------------------------------------------------------------------
%% M322: persona_transition_path/3 – (FromPersona, ToPersona, SharedNeeds)
%% ---------------------------------------------------------------------------
persona_transition_path(notation_composer, tracker_user, [
    midi_note_data, quantization, tempo, key_signature, time_signature
]).
persona_transition_path(notation_composer, producer, [
    arrangement_structure, instrumentation, dynamics, tempo
]).
persona_transition_path(notation_composer, sound_designer, [
    instrument_selection, articulation_mapping, expression_control
]).
persona_transition_path(tracker_user, producer, [
    pattern_data, sample_library, effect_chains, tempo, mix_levels
]).
persona_transition_path(tracker_user, sound_designer, [
    sample_library, effect_chains, modulation_routing
]).
persona_transition_path(producer, sound_designer, [
    instrument_presets, effect_chains, mix_context, automation_data
]).
persona_transition_path(sound_designer, producer, [
    preset_library, effect_chain_templates, macro_mappings
]).
persona_transition_path(producer, notation_composer, [
    chord_progression, melody_lines, arrangement_form, key_and_tempo
]).
persona_transition_path(tracker_user, notation_composer, [
    note_data, pattern_structure, tempo, key
]).
persona_transition_path(sound_designer, tracker_user, [
    instrument_presets, sample_library, effect_presets
]).

%% ---------------------------------------------------------------------------
%% M323: board_compatibility/2 – Boards that serve multiple personas
%% ---------------------------------------------------------------------------
board_compatibility(tracker_phrases_board, [tracker_user, notation_composer]).
board_compatibility(session_board, [producer, tracker_user]).
board_compatibility(modular_board, [sound_designer, producer]).
board_compatibility(notation_harmony_board, [notation_composer, producer]).
board_compatibility(mixing_board, [producer, tracker_user, sound_designer]).
board_compatibility(ai_composer_board, [notation_composer, producer]).
board_compatibility(ambient_generator_board, [sound_designer, producer]).
board_compatibility(live_performance_board, [tracker_user, producer]).

%% ---------------------------------------------------------------------------
%% M324: workflow_bridge/3 – Connecting different persona workflows
%%   workflow_bridge(FromWorkflow, ToWorkflow, BridgeAction)
%% ---------------------------------------------------------------------------
workflow_bridge(pattern_creation, arranging, export_patterns_to_timeline).
workflow_bridge(score_entry, mixing, render_score_to_stems).
workflow_bridge(synthesis_programming, beat_making, save_preset_and_load_in_track).
workflow_bridge(mixing, mastering, bounce_mix_to_stereo).
workflow_bridge(sample_slicing, pattern_creation, load_slices_into_pattern).
workflow_bridge(effect_design, mixing, save_effect_chain_preset).
workflow_bridge(notation_entry, tracker_pattern, convert_notation_to_pattern).
workflow_bridge(tracker_pattern, notation_entry, convert_pattern_to_notation).
workflow_bridge(arranging, score_entry, export_arrangement_as_score).
workflow_bridge(beat_making, arranging, promote_beat_to_arrangement).
workflow_bridge(preset_management, sound_selection, browse_user_presets).
workflow_bridge(modulation_routing, automation, convert_mod_routes_to_automation).

%% ---------------------------------------------------------------------------
%% M325 helper: suggest_board_for_transition/3
%%   suggest_board_for_transition(FromPersona, ToPersona, BoardId)
%% ---------------------------------------------------------------------------
suggest_board_for_transition(From, To, Board) :-
    board_compatibility(Board, Personas),
    member(From, Personas),
    member(To, Personas).

%% ---------------------------------------------------------------------------
%% M326 helper: detect_workflow_mix/2
%%   detect_workflow_mix(ActiveBoards, DetectedPersonas)
%% ---------------------------------------------------------------------------
detect_workflow_mix(ActiveBoards, DetectedPersonas) :-
    findall(Persona,
        (member(Board, ActiveBoards),
         board_compatibility(Board, Personas),
         member(Persona, Personas)),
        AllPersonas),
    sort(AllPersonas, DetectedPersonas).

%% ---------------------------------------------------------------------------
%% M350: learning_path/3 – (Persona, SkillLevel, NextSteps)
%% ---------------------------------------------------------------------------
learning_path(notation_composer, beginner, [
    learn_note_entry, learn_key_signatures, learn_basic_dynamics,
    learn_part_layout, learn_simple_scores
]).
learning_path(notation_composer, intermediate, [
    learn_orchestration, learn_voice_leading, learn_counterpoint,
    learn_score_preparation, learn_engraving_rules
]).
learning_path(notation_composer, advanced, [
    learn_extended_techniques, learn_complex_forms,
    learn_ai_assisted_composition, learn_custom_notation
]).
learning_path(tracker_user, beginner, [
    learn_pattern_editor, learn_sample_loading, learn_basic_effects,
    learn_pattern_navigation, learn_simple_songs
]).
learning_path(tracker_user, intermediate, [
    learn_advanced_effects, learn_automation, learn_sample_slicing,
    learn_groove_templates, learn_mixing_basics
]).
learning_path(tracker_user, advanced, [
    learn_resampling, learn_complex_routing, learn_live_performance,
    learn_ai_suggestions, learn_custom_workflows
]).
learning_path(sound_designer, beginner, [
    learn_subtractive_synthesis, learn_basic_modulation,
    learn_effect_basics, learn_preset_browsing, learn_simple_patches
]).
learning_path(sound_designer, intermediate, [
    learn_fm_synthesis, learn_wavetable, learn_complex_modulation,
    learn_layering, learn_macro_mapping
]).
learning_path(sound_designer, advanced, [
    learn_granular, learn_spectral, learn_physical_modeling,
    learn_advanced_routing, learn_custom_randomization
]).
learning_path(producer, beginner, [
    learn_beat_making, learn_arrangement_basics, learn_basic_mixing,
    learn_sound_selection, learn_simple_automation
]).
learning_path(producer, intermediate, [
    learn_advanced_arrangement, learn_mixing_techniques, learn_bus_routing,
    learn_reference_matching, learn_genre_conventions
]).
learning_path(producer, advanced, [
    learn_mastering, learn_stem_export, learn_advanced_automation,
    learn_ai_workflow_planning, learn_template_creation
]).

%% ---------------------------------------------------------------------------
%% M351: tutorial_sequence/2 – Ordered learning progression
%% ---------------------------------------------------------------------------
tutorial_sequence(getting_started, [
    choose_persona, explore_board, open_first_deck,
    create_first_content, save_project
]).
tutorial_sequence(first_beat, [
    open_tracker_board, load_drum_samples, enter_kick_pattern,
    add_hihat, add_snare, add_bass, play_and_adjust
]).
tutorial_sequence(first_score, [
    open_notation_board, set_key_signature, set_time_signature,
    enter_melody, add_harmony, add_dynamics, export_pdf
]).
tutorial_sequence(first_patch, [
    open_sound_designer_board, choose_oscillator, set_filter,
    add_envelope, add_modulation, save_preset
]).
tutorial_sequence(first_mix, [
    open_producer_board, import_stems, set_levels,
    add_eq, add_compression, add_reverb, check_loudness
]).

%% ---------------------------------------------------------------------------
%% Quick start flow definitions (M358)
%% ---------------------------------------------------------------------------
quick_start_flow(notation_composer, [
    select_instrumentation, choose_template, set_key_and_tempo,
    open_notation_board, start_composing
]).
quick_start_flow(tracker_user, [
    choose_genre, load_sample_pack, set_tempo,
    open_tracker_board, start_sequencing
]).
quick_start_flow(sound_designer, [
    choose_synthesis_type, open_modular_board, init_patch,
    start_designing
]).
quick_start_flow(producer, [
    choose_genre_template, set_bpm, open_session_board,
    start_producing
]).
