%% ============================================================================
%% Board-Centric Workflow Planning Knowledge Base
%%
%% N001-N050: Rules for decomposing high-level goals into sequences of deck
%% actions, routing requirements, and parameter configurations.
%%
%% @module @cardplay/ai/knowledge/workflow-planning
%% ============================================================================

%% ---------------------------------------------------------------------------
%% N002: task_decomposition/3 – (Goal, Persona, DeckActions)
%% Break a high-level goal into ordered deck actions.
%% ---------------------------------------------------------------------------
task_decomposition(make_beat, tracker_user, [
    open_pattern_editor,
    load_drum_samples,
    program_kick_pattern,
    program_snare_pattern,
    program_hihat_pattern,
    add_bass_line,
    adjust_levels,
    add_effects
]).
task_decomposition(make_beat, producer, [
    open_session_view,
    create_drum_track,
    load_drum_rack,
    program_drums,
    create_bass_track,
    program_bass,
    create_synth_track,
    add_chords_or_melody,
    adjust_mix
]).
task_decomposition(compose_score, notation_composer, [
    set_instrumentation,
    set_key_and_tempo,
    open_notation_editor,
    enter_melody,
    add_harmony,
    add_dynamics,
    add_articulations,
    check_engraving,
    extract_parts
]).
task_decomposition(design_sound, sound_designer, [
    choose_synthesis_type,
    open_modular_routing,
    initialize_oscillator,
    shape_with_filter,
    add_modulation,
    add_effects,
    assign_macros,
    save_preset
]).
task_decomposition(mix_track, producer, [
    import_stems,
    set_gain_staging,
    apply_eq_per_track,
    apply_compression,
    setup_bus_routing,
    add_send_effects,
    automate_levels,
    check_loudness,
    reference_check
]).
task_decomposition(master_track, producer, [
    import_stereo_mix,
    check_headroom,
    apply_eq,
    apply_multiband_compression,
    apply_limiter,
    check_lufs,
    check_true_peak,
    export_final
]).
task_decomposition(arrange_song, producer, [
    lay_out_sections,
    set_intro,
    build_verse,
    build_chorus,
    add_bridge,
    add_transitions,
    set_outro,
    review_energy_curve
]).
task_decomposition(create_ambient_piece, sound_designer, [
    choose_granular_source,
    open_modular_routing,
    setup_granular_engine,
    add_reverb_chain,
    add_modulation_sources,
    automate_grain_parameters,
    record_performance,
    arrange_layers
]).

%% ---------------------------------------------------------------------------
%% N003: deck_sequencing/2 – Optimal order to open decks for a task
%% ---------------------------------------------------------------------------
deck_sequencing(make_beat, [
    pattern_editor, sample_browser, instrument_rack, effect_chain, mixer
]).
deck_sequencing(compose_score, [
    score_notation, instrument_browser, harmony_display, properties_inspector
]).
deck_sequencing(design_sound, [
    modular_routing, parameter_inspector, waveform_display, spectrum_analyzer
]).
deck_sequencing(mix_track, [
    mixer, meter_bridge, effect_chain, automation, spectrum_analyzer
]).
deck_sequencing(arrange_song, [
    timeline, mixer, sample_browser, automation
]).

%% ---------------------------------------------------------------------------
%% N004: parameter_dependency/3 – (Param, SourceDeck, AffectedDeck)
%% Parameters on one deck that affect another.
%% ---------------------------------------------------------------------------
parameter_dependency(tempo, transport, pattern_editor).
parameter_dependency(tempo, transport, timeline).
parameter_dependency(tempo, transport, delay_effect).
parameter_dependency(key, transport, harmony_display).
parameter_dependency(key, transport, scale_overlay).
parameter_dependency(master_volume, mixer, meter_bridge).
parameter_dependency(send_level, mixer, reverb_bus).
parameter_dependency(send_level, mixer, delay_bus).
parameter_dependency(filter_cutoff, instrument_rack, spectrum_analyzer).
parameter_dependency(chord_root, harmony_display, phrase_adapter).

%% ---------------------------------------------------------------------------
%% N005: routing_requirement/3 – (Task, SourceDeck, TargetDeck)
%% Audio/data routing needed for a task.
%% ---------------------------------------------------------------------------
routing_requirement(make_beat, pattern_editor, instrument_rack).
routing_requirement(make_beat, instrument_rack, mixer).
routing_requirement(make_beat, instrument_rack, effect_chain).
routing_requirement(mix_track, all_tracks, mixer).
routing_requirement(mix_track, mixer, meter_bridge).
routing_requirement(mix_track, mixer, reverb_send).
routing_requirement(mix_track, mixer, delay_send).
routing_requirement(design_sound, oscillator, filter).
routing_requirement(design_sound, filter, amplifier).
routing_requirement(design_sound, amplifier, effect_chain).
routing_requirement(design_sound, modulation_source, any_parameter).

%% ---------------------------------------------------------------------------
%% N006: workflow_checkpoint/2 – (Task, ValidationPoints)
%% Points during a workflow where validation should occur.
%% ---------------------------------------------------------------------------
workflow_checkpoint(make_beat, [
    check(drums_loaded, 'Ensure all drum samples are loaded'),
    check(levels_balanced, 'Check mix levels before proceeding'),
    check(no_clipping, 'Ensure no channels are clipping')
]).
workflow_checkpoint(compose_score, [
    check(instrumentation_set, 'Verify all instruments assigned'),
    check(key_set, 'Verify key and time signature'),
    check(no_range_violations, 'Check all notes within instrument range'),
    check(engraving_clean, 'Run engraving quality check')
]).
workflow_checkpoint(mix_track, [
    check(gain_staged, 'All tracks gain-staged to -18dBFS average'),
    check(no_clipping, 'No buses or master clipping'),
    check(stereo_balance, 'Left-right balance is acceptable'),
    check(loudness_target, 'Mix LUFS within genre target range')
]).
workflow_checkpoint(design_sound, [
    check(oscillator_set, 'At least one oscillator active'),
    check(no_dc_offset, 'No DC offset in output'),
    check(macros_assigned, 'Performance macros mapped')
]).

%% ---------------------------------------------------------------------------
%% N019-N021: Deck configuration patterns
%% ---------------------------------------------------------------------------

%% deck_configuration_pattern/3 – (Task, DeckType, RecommendedSettings)
deck_configuration_pattern(make_beat, pattern_editor, [
    rows(64), highlight_interval(16), edit_mode(record)
]).
deck_configuration_pattern(make_beat, mixer, [
    visible_channels(8), meter_type(peak_rms), solo_safe(master)
]).
deck_configuration_pattern(mix_track, mixer, [
    visible_channels(all), meter_type(peak_rms_lufs), show_sends(true)
]).
deck_configuration_pattern(compose_score, score_notation, [
    zoom(page_width), display_mode(scroll), cursor_follows_playback(true)
]).
deck_configuration_pattern(design_sound, modular_routing, [
    show_signal_flow(true), auto_layout(true), snap_connections(true)
]).

%% parameter_preset_rule/3 – (DeckType, Task, RecommendedValues)
parameter_preset_rule(mixer, make_beat, [
    master_fader(0), drum_bus_fader(-3), bass_fader(-6)
]).
parameter_preset_rule(mixer, mix_track, [
    master_fader(-6), all_faders(-inf), headroom_target(-6)
]).

%% cross_deck_sync_rule/3 – (Param, Deck1, Deck2)
cross_deck_sync_rule(tempo, transport, pattern_editor).
cross_deck_sync_rule(tempo, transport, timeline).
cross_deck_sync_rule(key, transport, harmony_display).
cross_deck_sync_rule(time_signature, transport, score_notation).
cross_deck_sync_rule(loop_bounds, transport, pattern_editor).

%% ---------------------------------------------------------------------------
%% N031-N033: Routing templates
%% ---------------------------------------------------------------------------

%% routing_template/3 – (TaskType, DeckSet, Connections)
routing_template(beat_making, [drums, bass, synths, fx], [
    connect(drums, drum_bus),
    connect(bass, bass_bus),
    connect(synths, synth_bus),
    connect(fx, fx_bus),
    connect(drum_bus, master),
    connect(bass_bus, master),
    connect(synth_bus, master),
    connect(fx_bus, master),
    send(drum_bus, reverb, 0.1),
    send(synth_bus, reverb, 0.2),
    send(synth_bus, delay, 0.15)
]).
routing_template(mixing, [all_tracks], [
    connect(each_track, appropriate_bus),
    connect(all_buses, master),
    send(all_buses, reverb_send, per_track),
    send(all_buses, delay_send, per_track),
    insert(drum_bus, bus_compressor),
    insert(vocal_bus, bus_compressor),
    insert(master, limiter)
]).
routing_template(sound_design, [oscillators, filters, effects], [
    connect(osc1, filter1),
    connect(osc2, filter1),
    connect(filter1, amp_env),
    connect(amp_env, effect_chain),
    connect(effect_chain, output),
    modulate(lfo1, filter1_cutoff),
    modulate(env2, filter1_cutoff),
    modulate(velocity, amp_env_level)
]).

%% signal_flow_validation/2 – (Issue, Description)
signal_flow_validation(feedback_loop, 'Output feeds back into input without explicit feedback path').
signal_flow_validation(disconnected_node, 'A node has no input or output connections').
signal_flow_validation(missing_output, 'Signal chain does not reach master output').
signal_flow_validation(impedance_mismatch, 'Instrument output level mismatches bus input expectation').

%% routing_optimization/2 – (Technique, Description)
routing_optimization(merge_serial_effects, 'Combine serial effect chains into single insert chain').
routing_optimization(share_send_effects, 'Use shared send/return for common effects (reverb, delay)').
routing_optimization(remove_unused_buses, 'Delete buses with no active sends').
routing_optimization(simplify_parallel, 'Merge parallel paths with identical processing').

%% ---------------------------------------------------------------------------
%% N016: Workflow interruption & resume rules
%%   workflow_interrupt_policy/2 – (Goal, Policy)
%%     Describes what to do when a workflow is interrupted.
%%   workflow_resume_strategy/3 – (Goal, InterruptPoint, Strategy)
%%     Describes how to resume a workflow from a given step.
%% ---------------------------------------------------------------------------
workflow_interrupt_policy(make_beat, save_pattern_state).
workflow_interrupt_policy(compose_score, save_score_state).
workflow_interrupt_policy(design_sound, save_preset_draft).
workflow_interrupt_policy(mix_track, save_mix_snapshot).
workflow_interrupt_policy(master_track, save_master_chain).
workflow_interrupt_policy(arrange_song, save_arrangement_state).
workflow_interrupt_policy(record_audio, stop_recording_save_take).
workflow_interrupt_policy(live_performance, queue_safe_stop).

%% Resume strategies: for each goal, define how to resume at an
%% arbitrary step index.
workflow_resume_strategy(make_beat, StepIndex, resume_from_step) :-
    StepIndex >= 0.
workflow_resume_strategy(compose_score, StepIndex, resume_from_step) :-
    StepIndex >= 0.
workflow_resume_strategy(design_sound, StepIndex, resume_from_step) :-
    StepIndex >= 0.
workflow_resume_strategy(mix_track, StepIndex, resume_from_step) :-
    StepIndex >= 0.
workflow_resume_strategy(master_track, StepIndex, resume_from_step) :-
    StepIndex >= 0.

%% Steps that can be safely skipped on resume (already persisted)
workflow_skip_on_resume(compose_score, set_instrumentation).
workflow_skip_on_resume(compose_score, set_key_and_tempo).
workflow_skip_on_resume(make_beat, open_pattern_editor).
workflow_skip_on_resume(make_beat, load_drum_samples).
workflow_skip_on_resume(design_sound, choose_synthesis_type).
workflow_skip_on_resume(mix_track, import_stems).
workflow_skip_on_resume(mix_track, set_gain_staging).

%% Checkpoint: which steps produce saveable state?
workflow_checkpoint_step(make_beat, program_kick_pattern).
workflow_checkpoint_step(make_beat, add_bass_line).
workflow_checkpoint_step(make_beat, adjust_levels).
workflow_checkpoint_step(compose_score, enter_melody).
workflow_checkpoint_step(compose_score, add_harmony).
workflow_checkpoint_step(compose_score, add_dynamics).
workflow_checkpoint_step(design_sound, shape_with_filter).
workflow_checkpoint_step(design_sound, add_modulation).
workflow_checkpoint_step(mix_track, apply_eq_per_track).
workflow_checkpoint_step(mix_track, apply_compression).
