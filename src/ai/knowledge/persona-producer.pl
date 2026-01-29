%% ============================================================================
%% Producer / Beatmaker Persona Knowledge Base
%%
%% M241-M320: Prolog facts and rules for the producer persona.
%%
%% Covers: production workflows, genre templates, arrangement structures,
%% mixing checklists, mastering targets, track organization, bus routing,
%% automation, loudness analysis, stem export, and board presets.
%%
%% @module @cardplay/ai/knowledge/persona-producer
%% ============================================================================

%% ---------------------------------------------------------------------------
%% M242: production_workflow/2 – Common production tasks
%% ---------------------------------------------------------------------------
production_workflow(beat_making, 'Create drum patterns, bass lines, and harmonic elements').
production_workflow(arranging, 'Structure clips into full song arrangement on timeline').
production_workflow(recording, 'Capture live audio or MIDI performances').
production_workflow(editing, 'Trim, quantize, and clean up recorded material').
production_workflow(mixing, 'Balance levels, pan, EQ, and effects across tracks').
production_workflow(mastering, 'Apply final processing for loudness and tonal balance').
production_workflow(sound_selection, 'Choose instruments, samples, and presets for the project').
production_workflow(automation, 'Automate volume, pan, sends, and plugin parameters over time').

%% ---------------------------------------------------------------------------
%% M243: genre_production_template/3 – (Genre, BPM range, Typical instruments)
%% ---------------------------------------------------------------------------
genre_production_template(lofi_hiphop, bpm(70, 90), [
    vinyl_drums, muted_keys, sub_bass, guitar_sample, vocal_chop, ambient_texture
]).
genre_production_template(house, bpm(120, 130), [
    four_on_floor_kick, offbeat_hihat, clap, bass_synth, chord_stab, vocal_sample
]).
genre_production_template(techno, bpm(125, 140), [
    kick_808, hihat_closed, clap_reverb, bass_acid, pad_atmospheric, perc_metallic
]).
genre_production_template(dnb, bpm(170, 180), [
    breakbeat_drums, reese_bass, pad_dark, amen_break, vocal_sample, fx_riser
]).
genre_production_template(trap, bpm(130, 170), [
    kick_808_long, hihat_rolls, snare_trap, bass_808, lead_bell, vocal_chop
]).
genre_production_template(pop, bpm(100, 130), [
    acoustic_drums, bass_electric, piano, synth_pad, lead_vocal, backing_vocal
]).
genre_production_template(ambient, bpm(60, 100), [
    pad_evolving, texture_granular, sub_drone, field_recording, delay_feedback, reverb_shimmer
]).
genre_production_template(jazz, bpm(80, 160), [
    acoustic_drums, upright_bass, piano_acoustic, guitar_clean, horn_section, vocal
]).
genre_production_template(rock, bpm(100, 140), [
    drum_kit, bass_electric, guitar_distorted, guitar_clean, lead_vocal, keys
]).
genre_production_template(cinematic, bpm(80, 120), [
    orchestral_strings, brass_section, choir, percussion_epic, piano, sub_bass
]).

%% ---------------------------------------------------------------------------
%% M244: arrangement_structure/2 – Typical song structures by genre
%% ---------------------------------------------------------------------------
arrangement_structure(pop, [intro, verse, pre_chorus, chorus, verse, pre_chorus, chorus, bridge, chorus, outro]).
arrangement_structure(house, [intro, buildup, drop, breakdown, buildup, drop, outro]).
arrangement_structure(techno, [intro, buildup, main, breakdown, main, outro]).
arrangement_structure(dnb, [intro, buildup, drop, breakdown, drop, outro]).
arrangement_structure(trap, [intro, verse, hook, verse, hook, bridge, hook, outro]).
arrangement_structure(lofi_hiphop, [intro, loop_a, loop_b, loop_a, loop_b, outro]).
arrangement_structure(ambient, [intro, section_a, transition, section_b, section_a, fade_out]).
arrangement_structure(rock, [intro, verse, chorus, verse, chorus, solo, chorus, outro]).
arrangement_structure(jazz, [head_in, solo_a, solo_b, solo_a, head_out]).
arrangement_structure(cinematic, [opening, tension_build, climax, resolution, denouement]).

%% ---------------------------------------------------------------------------
%% M245: mixing_checklist/2 – Genre-specific mixing steps
%% ---------------------------------------------------------------------------
mixing_checklist(electronic, [
    gain_staging, kick_eq, bass_sidechain, drum_bus_compression,
    synth_eq_separation, send_reverb, send_delay,
    stereo_width, low_end_mono, master_limiter_check
]).
mixing_checklist(acoustic, [
    gain_staging, drum_overhead_phase, bass_di_blend,
    vocal_compression, vocal_eq, guitar_pan, reverb_bus,
    bus_compression, stereo_balance, reference_check
]).
mixing_checklist(cinematic, [
    gain_staging, string_section_eq, brass_dynamics,
    percussion_transients, choir_reverb, sub_bass_control,
    automation_rides, stereo_field, dynamic_range_preservation, reference_check
]).

%% ---------------------------------------------------------------------------
%% M246: mastering_target/3 – (Genre, target LUFS, dynamic range dB)
%% ---------------------------------------------------------------------------
mastering_target(pop, -14, 8).
mastering_target(rock, -14, 7).
mastering_target(edm, -10, 5).
mastering_target(house, -11, 6).
mastering_target(techno, -10, 5).
mastering_target(hiphop, -12, 6).
mastering_target(classical, -18, 15).
mastering_target(jazz, -16, 12).
mastering_target(ambient, -16, 14).
mastering_target(cinematic, -16, 12).
mastering_target(lofi_hiphop, -14, 8).
mastering_target(dnb, -10, 5).

%% ---------------------------------------------------------------------------
%% M247: Producer board deck configuration rules
%% ---------------------------------------------------------------------------
producer_board_deck(timeline, required).
producer_board_deck(mixer, required).
producer_board_deck(instrument_rack, recommended).
producer_board_deck(sample_browser, recommended).
producer_board_deck(effect_chain, recommended).
producer_board_deck(automation, recommended).
producer_board_deck(meter_bridge, optional).
producer_board_deck(ai_advisor, optional).

producer_board_deck_size(timeline, 55).     % 55% main area
producer_board_deck_size(mixer, 30).        % 30% bottom panel
producer_board_deck_size(instrument_rack, 20).
producer_board_deck_size(sample_browser, 20).
producer_board_deck_size(automation, 15).

%% ---------------------------------------------------------------------------
%% M248: Default routing in production context
%% ---------------------------------------------------------------------------
producer_default_routing(standard, [
    route(instrument_tracks, instrument_bus),
    route(drum_tracks, drum_bus),
    route(vocal_tracks, vocal_bus),
    route(fx_tracks, fx_bus),
    route(instrument_bus, master),
    route(drum_bus, master),
    route(vocal_bus, master),
    route(fx_bus, master),
    route(all_buses, reverb_send),
    route(all_buses, delay_send),
    route(reverb_send, master),
    route(delay_send, master)
]).

%% ---------------------------------------------------------------------------
%% M249: Typical track organization
%% ---------------------------------------------------------------------------
track_organization(electronic, [
    group(drums, [kick, snare, hihat, perc, cymbals]),
    group(bass, [sub_bass, mid_bass]),
    group(synths, [lead, pad, chord_stab, arp]),
    group(fx, [riser, impact, transition, ambient]),
    group(vocals, [lead_vocal, vocal_chop, backing])
]).
track_organization(acoustic, [
    group(drums, [kick, snare, toms, overheads, room]),
    group(bass, [bass_di, bass_amp]),
    group(guitars, [guitar_l, guitar_r, acoustic]),
    group(keys, [piano, organ, synth]),
    group(vocals, [lead, harmony, backing])
]).
track_organization(cinematic, [
    group(strings, [violins_1, violins_2, violas, cellos, basses]),
    group(brass, [horns, trumpets, trombones, tuba]),
    group(woodwinds, [flute, oboe, clarinet, bassoon]),
    group(percussion, [timpani, cymbals, snare, bass_drum, aux_perc]),
    group(choir, [soprano, alto, tenor, bass_voice]),
    group(synth, [pad, texture, sub])
]).

%% ---------------------------------------------------------------------------
%% M266-M268: Producer board presets
%% ---------------------------------------------------------------------------
producer_board_preset(beat_making, 'Beat Making', [
    timeline, instrument_rack, sample_browser, drum_machine, mixer
]).
producer_board_preset(mixing, 'Mixing', [
    mixer, meter_bridge, effect_chain, automation, spectrum_analyzer
]).
producer_board_preset(mastering, 'Mastering', [
    master_chain, meter_bridge, spectrum_analyzer, loudness_meter, reference_player
]).

%% ---------------------------------------------------------------------------
%% M275: track_color_scheme/2 – Visual track organization
%% ---------------------------------------------------------------------------
track_color_scheme(drums, orange).
track_color_scheme(bass, blue).
track_color_scheme(synths, purple).
track_color_scheme(guitars, green).
track_color_scheme(keys, cyan).
track_color_scheme(vocals, red).
track_color_scheme(fx, yellow).
track_color_scheme(bus, grey).
track_color_scheme(master, white).

%% ---------------------------------------------------------------------------
%% M276: bus_routing_pattern/2 – Common send/return setups
%% ---------------------------------------------------------------------------
bus_routing_pattern(standard_reverb, [
    bus(reverb_bus, reverb_hall, wet_only),
    send_from(vocals, 0.3),
    send_from(synths, 0.2),
    send_from(guitars, 0.15)
]).
bus_routing_pattern(standard_delay, [
    bus(delay_bus, delay_sync, wet_only),
    send_from(vocals, 0.2),
    send_from(synths, 0.15),
    send_from(guitars, 0.1)
]).
bus_routing_pattern(parallel_compression, [
    bus(parallel_bus, compressor_heavy, blended),
    send_from(drums, 0.4),
    send_from(bass, 0.2)
]).

%% ---------------------------------------------------------------------------
%% M277: automation_lane_priority/2 – Key parameters to automate
%% ---------------------------------------------------------------------------
automation_lane_priority(volume, 1).        % Most important
automation_lane_priority(filter_cutoff, 2).
automation_lane_priority(send_reverb, 3).
automation_lane_priority(send_delay, 4).
automation_lane_priority(pan, 5).
automation_lane_priority(eq_frequency, 6).
automation_lane_priority(compressor_threshold, 7).
automation_lane_priority(effect_mix, 8).

%% ---------------------------------------------------------------------------
%% M287-M289: Reference matching and loudness analysis
%% ---------------------------------------------------------------------------
reference_matching_technique(frequency_spectrum, 'Compare frequency balance via FFT analysis').
reference_matching_technique(loudness_curve, 'Compare LUFS readings over time').
reference_matching_technique(stereo_width, 'Compare mid-side energy ratios').
reference_matching_technique(dynamic_range, 'Compare peak-to-RMS ratios').
reference_matching_technique(transient_density, 'Compare transient frequency and intensity').

loudness_analysis_rule(streaming, 'Target -14 LUFS integrated for Spotify/Apple Music').
loudness_analysis_rule(club, 'Target -10 to -8 LUFS integrated for club playback').
loudness_analysis_rule(broadcast, 'Target -24 LUFS integrated per EBU R128').
loudness_analysis_rule(film, 'Target -24 LUFS per dialogue norm (ATSC A/85)').

dynamic_range_target(pop, 6).
dynamic_range_target(rock, 7).
dynamic_range_target(edm, 4).
dynamic_range_target(classical, 15).
dynamic_range_target(jazz, 12).
dynamic_range_target(ambient, 14).
dynamic_range_target(cinematic, 12).

%% ---------------------------------------------------------------------------
%% M308: version_naming_convention/2 – Project version naming
%% ---------------------------------------------------------------------------
version_naming_convention(date_based, 'YYYY-MM-DD_HH-MM description').
version_naming_convention(numbered, 'v1, v2, v3... with optional suffix').
version_naming_convention(milestone, 'demo, rough_mix, final_mix, master').
version_naming_convention(descriptive, 'Short phrase describing changes').

%% ---------------------------------------------------------------------------
%% Suggestion rules – infer production recommendations
%% ---------------------------------------------------------------------------

%% suggest_arrangement_structure/2 – Recommend arrangement for genre
suggest_arrangement_structure(Genre, Sections) :-
    arrangement_structure(Genre, Sections).

%% suggest_mix_checklist/2 – Recommend mixing steps for genre category
suggest_mix_checklist(Genre, Checklist) :-
    mixing_checklist(Genre, Checklist).
suggest_mix_checklist(Genre, Checklist) :-
    \+ mixing_checklist(Genre, _),
    mixing_checklist(electronic, Checklist).  % Default to electronic

%% suggest_mastering_target/3 – Recommend loudness target
suggest_mastering_target(Genre, LUFS, DynamicRange) :-
    mastering_target(Genre, LUFS, DynamicRange).

%% suggest_track_organization/2 – Recommend track grouping
suggest_track_organization(Genre, Groups) :-
    track_organization(Genre, Groups).
suggest_track_organization(Genre, Groups) :-
    \+ track_organization(Genre, _),
    track_organization(electronic, Groups).  % Default

%% suggest_track_colors/2 – Recommend color for track group
suggest_track_colors(GroupType, Color) :-
    track_color_scheme(GroupType, Color).

%% ---------------------------------------------------------------------------
%% M307: collaboration_workflow/2 – Multi-user project workflows
%% ---------------------------------------------------------------------------
collaboration_workflow(stem_exchange, 'Exchange rendered stems between collaborators').
collaboration_workflow(project_sharing, 'Share full project files with versioning').
collaboration_workflow(midi_export, 'Export MIDI data for collaborator import').
collaboration_workflow(reference_review, 'Share rough mix for feedback before final').
collaboration_workflow(template_sharing, 'Share board/deck templates across team').
collaboration_workflow(split_arrangement, 'Divide song sections among collaborators').

%% Collaboration role definitions
collaboration_role(lead_producer, [arranging, mixing, mastering, final_approval]).
collaboration_role(beat_maker, [beat_making, sound_selection]).
collaboration_role(vocalist, [recording, vocal_editing]).
collaboration_role(mix_engineer, [mixing, mastering]).
collaboration_role(sound_designer, [sound_selection, synthesis_programming]).

%% Handoff rules: what format to use when passing work between roles
collaboration_handoff(beat_maker, vocalist, stem_exchange).
collaboration_handoff(vocalist, mix_engineer, stem_exchange).
collaboration_handoff(beat_maker, mix_engineer, project_sharing).
collaboration_handoff(sound_designer, lead_producer, stem_exchange).
collaboration_handoff(lead_producer, mix_engineer, project_sharing).
collaboration_handoff(mix_engineer, lead_producer, reference_review).

%% suggest_collaboration_handoff/3 – Recommend handoff method
suggest_collaboration_handoff(FromRole, ToRole, Method) :-
    collaboration_handoff(FromRole, ToRole, Method).
suggest_collaboration_handoff(_FromRole, _ToRole, stem_exchange).  % Default fallback

%% ---------------------------------------------------------------------------
%% M279: bus_routing_setup/2 – Bus configuration for track setups
%%   bus_routing_setup(SetupType, BusConfig)
%% ---------------------------------------------------------------------------
bus_routing_setup(electronic, [
    bus(drum_bus, [compressor, eq_scoop], group),
    bus(bass_bus, [compressor, saturator], group),
    bus(synth_bus, [eq_mid_cut, stereo_width], group),
    bus(fx_bus, [eq_highpass, limiter], group),
    bus(reverb_send, [reverb_hall], aux),
    bus(delay_send, [delay_sync], aux),
    bus(master, [eq, compressor, limiter], master)
]).
bus_routing_setup(acoustic, [
    bus(drum_bus, [compressor, eq_presence], group),
    bus(bass_bus, [compressor], group),
    bus(guitar_bus, [eq_mid, stereo_width], group),
    bus(vocal_bus, [compressor, deesser, eq], group),
    bus(reverb_send, [reverb_plate], aux),
    bus(master, [eq, compressor, limiter], master)
]).
bus_routing_setup(cinematic, [
    bus(string_bus, [eq, reverb_hall], group),
    bus(brass_bus, [eq, compressor], group),
    bus(woodwind_bus, [eq, reverb_room], group),
    bus(percussion_bus, [compressor, transient_shaper], group),
    bus(choir_bus, [reverb_cathedral, eq], group),
    bus(reverb_send, [reverb_large_hall], aux),
    bus(master, [eq, limiter], master)
]).

%% suggest_bus_routing/2 – Recommend bus setup for genre category
suggest_bus_routing(Genre, Config) :-
    bus_routing_setup(Genre, Config).
suggest_bus_routing(Genre, Config) :-
    \+ bus_routing_setup(Genre, _),
    bus_routing_setup(electronic, Config).  % Default

%% ---------------------------------------------------------------------------
%% M280: automation_lane_suggestion/3 – Suggest automation lanes for a mix
%%   automation_lane_suggestion(TrackType, Parameter, Priority)
%% ---------------------------------------------------------------------------
automation_lane_suggestion(vocals, volume, 1).
automation_lane_suggestion(vocals, send_reverb, 2).
automation_lane_suggestion(vocals, eq_frequency, 4).
automation_lane_suggestion(bass, volume, 1).
automation_lane_suggestion(bass, filter_cutoff, 2).
automation_lane_suggestion(synths, volume, 1).
automation_lane_suggestion(synths, filter_cutoff, 2).
automation_lane_suggestion(synths, send_delay, 3).
automation_lane_suggestion(synths, pan, 5).
automation_lane_suggestion(drums, volume, 1).
automation_lane_suggestion(drums, send_reverb, 3).
automation_lane_suggestion(fx, volume, 1).
automation_lane_suggestion(fx, send_delay, 2).
automation_lane_suggestion(fx, pan, 3).
automation_lane_suggestion(master, volume, 1).

%% suggest_automation_lanes/2 – Get lane suggestions sorted by priority
suggest_automation_lanes(TrackType, Params) :-
    findall(param(P, Pr), automation_lane_suggestion(TrackType, P, Pr), Params).
