%% ============================================================================
%% Tracker User Persona Knowledge Base
%%
%% M081-M095: Prolog facts and rules for the tracker-user persona.
%%
%% Covers: tracker workflows, pattern conventions, effect chains,
%% sample organization, and board presets.
%%
%% @module @cardplay/ai/knowledge/persona-tracker-user
%% ============================================================================

%% ---------------------------------------------------------------------------
%% M082: tracker_workflow/2 – Common tracker tasks
%% ---------------------------------------------------------------------------
tracker_workflow(pattern_creation, 'Create and edit patterns with step sequencing').
tracker_workflow(sample_browsing, 'Browse and audition samples for tracks').
tracker_workflow(effect_design, 'Chain effects on individual tracks').
tracker_workflow(pattern_arrangement, 'Arrange patterns into a song sequence').
tracker_workflow(automation, 'Automate parameters per-pattern or per-song').
tracker_workflow(mixing, 'Balance volume, pan, and sends across tracks').
tracker_workflow(sample_slicing, 'Slice loops into individual hits').
tracker_workflow(resampling, 'Render tracks to new samples for re-use').

%% ---------------------------------------------------------------------------
%% M083: pattern_length_convention/2 – Typical pattern lengths by genre
%% ---------------------------------------------------------------------------
pattern_length_convention(chiptune, 32).
pattern_length_convention(chiptune, 64).
pattern_length_convention(techno, 64).
pattern_length_convention(techno, 128).
pattern_length_convention(house, 64).
pattern_length_convention(house, 128).
pattern_length_convention(breakbeat, 64).
pattern_length_convention(dnb, 64).
pattern_length_convention(dnb, 128).
pattern_length_convention(hiphop, 32).
pattern_length_convention(hiphop, 64).
pattern_length_convention(lofi, 32).
pattern_length_convention(lofi, 64).
pattern_length_convention(ambient, 128).
pattern_length_convention(ambient, 256).
pattern_length_convention(industrial, 64).
pattern_length_convention(pop, 64).
pattern_length_convention(pop, 128).

%% ---------------------------------------------------------------------------
%% M084: hex_vs_decimal_preference/2 – Numbering preference by background
%% ---------------------------------------------------------------------------
hex_vs_decimal_preference(protracker_veteran, hex).
hex_vs_decimal_preference(renoise_user, hex).
hex_vs_decimal_preference(openmpt_user, hex).
hex_vs_decimal_preference(famitracker_user, hex).
hex_vs_decimal_preference(daw_user, decimal).
hex_vs_decimal_preference(beginner, decimal).
hex_vs_decimal_preference(musician, decimal).

%% ---------------------------------------------------------------------------
%% M085: sample_library_organization/2 – Organization rules
%% ---------------------------------------------------------------------------
sample_library_organization(by_type, [kick, snare, hihat, clap, tom, cymbal, perc, bass, pad, lead, fx, vocal]).
sample_library_organization(by_genre, [techno, house, dnb, hiphop, chiptune, ambient, industrial]).
sample_library_organization(by_key, [c, csharp, d, dsharp, e, f, fsharp, g, gsharp, a, asharp, b]).
sample_library_organization(by_pack, pack_name).

%% ---------------------------------------------------------------------------
%% M086: effect_chain_preset/3 – Common tracker effect chains
%% ---------------------------------------------------------------------------
effect_chain_preset(kick, punchy, [eq_highpass, compressor, saturator]).
effect_chain_preset(kick, deep, [eq_lowshelf_boost, compressor, limiter]).
effect_chain_preset(snare, crisp, [eq_mid_boost, compressor, reverb_short]).
effect_chain_preset(snare, fat, [saturator, eq_scoop, reverb_room]).
effect_chain_preset(hihat, clean, [eq_highpass, compressor]).
effect_chain_preset(hihat, lofi, [bitcrusher, eq_lowpass, saturator]).
effect_chain_preset(bass, sub, [eq_lowpass, compressor, saturator]).
effect_chain_preset(bass, distorted, [overdrive, eq_mid_boost, compressor]).
effect_chain_preset(pad, wide, [chorus, reverb_hall, delay_stereo]).
effect_chain_preset(pad, dark, [eq_lowpass, reverb_plate, phaser]).
effect_chain_preset(lead, cutting, [eq_presence_boost, chorus, delay_ping_pong]).
effect_chain_preset(lead, detuned, [unison_detune, chorus, reverb_room]).
effect_chain_preset(vocal, clean, [eq_highpass, compressor, deesser, reverb_plate]).
effect_chain_preset(vocal, chopped, [gate, bitcrusher, delay_sync]).

%% ---------------------------------------------------------------------------
%% M087: Tracker board deck configuration rules
%% ---------------------------------------------------------------------------
tracker_board_deck(pattern_editor, required).
tracker_board_deck(sample_browser, required).
tracker_board_deck(instrument_rack, recommended).
tracker_board_deck(effect_chain, recommended).
tracker_board_deck(mixer, recommended).
tracker_board_deck(pattern_arranger, optional).
tracker_board_deck(automation, optional).
tracker_board_deck(ai_advisor, optional).

tracker_board_deck_size(pattern_editor, 60).   % 60% of main area
tracker_board_deck_size(sample_browser, 25).   % 25% left panel
tracker_board_deck_size(instrument_rack, 15).  % 15% bottom panel
tracker_board_deck_size(effect_chain, 20).
tracker_board_deck_size(mixer, 25).

%% ---------------------------------------------------------------------------
%% M088: Tracker keyboard shortcuts
%% ---------------------------------------------------------------------------
tracker_shortcut(note_entry, 'Z-M row for octave 4, Q-P for octave 5').
tracker_shortcut(pattern_navigation, 'Ctrl+Up/Down to move between patterns').
tracker_shortcut(row_insert, 'Insert to add row, Backspace to remove').
tracker_shortcut(selection, 'Shift+Arrow to select, Ctrl+C/V to copy/paste').
tracker_shortcut(octave_change, 'Numpad +/- to change current octave').
tracker_shortcut(effect_entry, 'Tab to move to effect column, type effect code').
tracker_shortcut(interpolation, 'Ctrl+I to interpolate between values').
tracker_shortcut(transpose, 'Ctrl+F1/F2 to transpose selection semitone down/up').
tracker_shortcut(mute_track, 'F9 to mute track, F10 to solo').
tracker_shortcut(play_pattern, 'Enter to play pattern, Shift+Enter to play from line').

%% ---------------------------------------------------------------------------
%% M089: Sample browser organization
%% ---------------------------------------------------------------------------
sample_browser_sort(by_type).
sample_browser_sort(by_genre).
sample_browser_sort(by_key).
sample_browser_sort(by_recently_used).
sample_browser_sort(by_favorites).

sample_browser_filter(type, [kick, snare, hihat, clap, tom, perc, bass, lead, pad, fx, vocal]).
sample_browser_filter(key, [c, d, e, f, g, a, b]).
sample_browser_filter(tempo_range, [slow, medium, fast]).

%% ---------------------------------------------------------------------------
%% M090-M092: Suggestion rules
%% ---------------------------------------------------------------------------

%% suggest_pattern_length/3 – Suggest length based on genre and tempo
suggest_pattern_length(Genre, _Tempo, Length) :-
    pattern_length_convention(Genre, Length).

%% suggest_sample_for_slot/3 – Suggest sample type for a track role
suggest_sample_for_slot(kick_track, _, kick).
suggest_sample_for_slot(snare_track, _, snare).
suggest_sample_for_slot(hihat_track, _, hihat).
suggest_sample_for_slot(bass_track, _, bass).
suggest_sample_for_slot(lead_track, _, lead).
suggest_sample_for_slot(pad_track, _, pad).
suggest_sample_for_slot(fx_track, _, fx).

%% suggest_effect_chain/3 – Suggest effect chain for track type and genre
suggest_effect_chain(TrackType, _Genre, Effects) :-
    effect_chain_preset(TrackType, _, Effects).

%% ---------------------------------------------------------------------------
%% M107-M109: Board presets
%% ---------------------------------------------------------------------------
tracker_board_preset(chip_music, 'Chip Music', [
    pattern_editor, sample_browser, instrument_rack
]).
tracker_board_preset(breakbeat, 'Breakbeat', [
    pattern_editor, sample_browser, sample_slicer, effect_chain, mixer
]).
tracker_board_preset(techno, 'Techno', [
    pattern_editor, step_sequencer, effect_chain, mixer, automation
]).

%% ---------------------------------------------------------------------------
%% M115-M117: Effect routing rules
%% ---------------------------------------------------------------------------
tracker_effect_routing(standard, [
    route(track_output, insert_chain),
    route(insert_chain, send_bus),
    route(insert_chain, master),
    route(send_bus, master)
]).

send_return_configuration(reverb, [
    send_level(0.3),
    return_eq(highpass_200hz),
    return_mix(wet_only)
]).
send_return_configuration(delay, [
    send_level(0.25),
    return_mix(wet_only),
    sync_to_tempo(true)
]).

sidechain_routing(kick_to_bass, [
    source(kick_track),
    target(bass_track),
    compressor_threshold(-20),
    ratio(4),
    attack(1),
    release(100)
]).

%% ---------------------------------------------------------------------------
%% M125-M127: Pattern variation and groove
%% ---------------------------------------------------------------------------
pattern_variation_technique(shift_right, 'Shift all notes right by N steps').
pattern_variation_technique(shift_left, 'Shift all notes left by N steps').
pattern_variation_technique(invert, 'Invert note pitches around axis').
pattern_variation_technique(reverse, 'Reverse note order in pattern').
pattern_variation_technique(retrograde_inversion, 'Reverse and invert').
pattern_variation_technique(halve, 'Halve pattern length (double speed)').
pattern_variation_technique(double, 'Double pattern length (half speed)').
pattern_variation_technique(randomize_velocity, 'Randomize note velocities within range').
pattern_variation_technique(humanize_timing, 'Add subtle timing offsets').

groove_template(mpc_swing_54, [0, 0, 10, 0, 0, 0, 10, 0]).
groove_template(mpc_swing_58, [0, 0, 15, 0, 0, 0, 15, 0]).
groove_template(mpc_swing_62, [0, 0, 20, 0, 0, 0, 20, 0]).
groove_template(mpc_swing_66, [0, 0, 25, 0, 0, 0, 25, 0]).
groove_template(mpc_swing_71, [0, 0, 33, 0, 0, 0, 33, 0]).
groove_template(straight, [0, 0, 0, 0, 0, 0, 0, 0]).
groove_template(push, [-5, 0, -5, 0, -5, 0, -5, 0]).
groove_template(lazy, [5, 0, 5, 0, 5, 0, 5, 0]).

humanization_amount(chiptune, 0).
humanization_amount(techno, 5).
humanization_amount(house, 8).
humanization_amount(hiphop, 15).
humanization_amount(lofi, 20).
humanization_amount(jazz, 25).
humanization_amount(live_performance, 30).

%% ---------------------------------------------------------------------------
%% M145: performance_mode_layout/2 – Deck layout for live tracker use
%%   performance_mode_layout(DeckType, SizePercent)
%% ---------------------------------------------------------------------------
performance_mode_layout(pattern_launcher, 50).   % Large grid of launchable patterns
performance_mode_layout(mixer, 25).              % Essential level control
performance_mode_layout(effect_rack, 15).        % Quick access to live effects
performance_mode_layout(meter_bridge, 10).       % Visual monitoring

%% Performance mode deck properties
performance_mode_deck_property(pattern_launcher, priority, critical).
performance_mode_deck_property(mixer, priority, critical).
performance_mode_deck_property(effect_rack, priority, high).
performance_mode_deck_property(meter_bridge, priority, medium).
performance_mode_deck_property(pattern_launcher, feature, scene_launch).
performance_mode_deck_property(pattern_launcher, feature, pattern_queue).
performance_mode_deck_property(mixer, feature, mute_solo_only).
performance_mode_deck_property(effect_rack, feature, macro_knobs).

%% ---------------------------------------------------------------------------
%% M146: pattern_launch_quantization/2 – Quantization rules for pattern launch
%%   pattern_launch_quantization(Mode, Description)
%% ---------------------------------------------------------------------------
pattern_launch_quantization(none, 'Launch immediately with no quantization').
pattern_launch_quantization(beat, 'Quantize launch to next beat boundary').
pattern_launch_quantization(bar, 'Quantize launch to next bar boundary').
pattern_launch_quantization(two_bar, 'Quantize launch to next 2-bar boundary').
pattern_launch_quantization(four_bar, 'Quantize launch to next 4-bar boundary').
pattern_launch_quantization(pattern_length, 'Quantize to current pattern length').

%% Default quantization per genre
genre_launch_quantization(chiptune, beat).
genre_launch_quantization(techno, bar).
genre_launch_quantization(house, bar).
genre_launch_quantization(dnb, bar).
genre_launch_quantization(breakbeat, two_bar).
genre_launch_quantization(hiphop, bar).
genre_launch_quantization(lofi, bar).
genre_launch_quantization(ambient, four_bar).
genre_launch_quantization(industrial, bar).
genre_launch_quantization(pop, bar).
genre_launch_quantization(live_performance, beat).

%% Suggest launch quantization based on genre
suggest_launch_quantization(Genre, Mode) :-
    genre_launch_quantization(Genre, Mode).
suggest_launch_quantization(Genre, bar) :-
    \+ genre_launch_quantization(Genre, _).
