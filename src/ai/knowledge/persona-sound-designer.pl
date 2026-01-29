%% ============================================================================
%% Sound Designer Persona Knowledge Base
%%
%% M161-M240: Prolog facts and rules for the sound-designer persona.
%%
%% Covers: synthesis techniques, modulation routing, effect chains,
%% sample manipulation, layering, macros, presets, and board presets.
%%
%% @module @cardplay/ai/knowledge/persona-sound-designer
%% ============================================================================

%% ---------------------------------------------------------------------------
%% M162: sound_design_workflow/2 – Common sound design tasks
%% ---------------------------------------------------------------------------
sound_design_workflow(synthesis_programming, 'Program synths from init patch using subtractive/FM/additive techniques').
sound_design_workflow(modulation_routing, 'Create expressive modulation routings (LFO, envelope, velocity, etc.)').
sound_design_workflow(effect_design, 'Design effect chains for specific sonic characters').
sound_design_workflow(sample_manipulation, 'Manipulate samples via time-stretch, pitch-shift, granular, reverse').
sound_design_workflow(layering, 'Layer multiple sound sources for complex timbres').
sound_design_workflow(resampling, 'Render output and re-import for further processing').
sound_design_workflow(preset_management, 'Organise, tag, and recall presets and sound libraries').
sound_design_workflow(macro_mapping, 'Map expressive macro controls to multiple parameters').

%% ---------------------------------------------------------------------------
%% M163: synthesis_technique/2 – Synthesis methods and descriptions
%% ---------------------------------------------------------------------------
synthesis_technique(subtractive, 'Filter harmonically-rich oscillators (saw, pulse, noise)').
synthesis_technique(fm, 'Frequency modulation between operators for metallic/bell tones').
synthesis_technique(additive, 'Sum individual sine partials for precise harmonic control').
synthesis_technique(granular, 'Decompose audio into grains for texture/cloud effects').
synthesis_technique(wavetable, 'Morph through single-cycle waveform tables').
synthesis_technique(physical_modeling, 'Simulate physical resonant structures (string, tube, membrane)').
synthesis_technique(sample_playback, 'Play back recorded audio with pitch/time control').
synthesis_technique(spectral, 'Process audio in the frequency domain via FFT').
synthesis_technique(phase_distortion, 'Distort the phase of a sine wave for timbral variety').
synthesis_technique(vector, 'Crossfade between multiple oscillator sources via 2-D joystick').

%% ---------------------------------------------------------------------------
%% M163 (cont): synthesis_for_sound_type/2 – Recommended synthesis per target
%% ---------------------------------------------------------------------------
synthesis_for_sound_type(pad, wavetable).
synthesis_for_sound_type(pad, subtractive).
synthesis_for_sound_type(pad, granular).
synthesis_for_sound_type(lead, subtractive).
synthesis_for_sound_type(lead, wavetable).
synthesis_for_sound_type(lead, fm).
synthesis_for_sound_type(bass, subtractive).
synthesis_for_sound_type(bass, fm).
synthesis_for_sound_type(bass, phase_distortion).
synthesis_for_sound_type(bell, fm).
synthesis_for_sound_type(bell, additive).
synthesis_for_sound_type(bell, physical_modeling).
synthesis_for_sound_type(pluck, physical_modeling).
synthesis_for_sound_type(pluck, wavetable).
synthesis_for_sound_type(texture, granular).
synthesis_for_sound_type(texture, spectral).
synthesis_for_sound_type(noise_sweep, subtractive).
synthesis_for_sound_type(noise_sweep, spectral).
synthesis_for_sound_type(string, physical_modeling).
synthesis_for_sound_type(string, wavetable).
synthesis_for_sound_type(keys, fm).
synthesis_for_sound_type(keys, sample_playback).
synthesis_for_sound_type(drum, subtractive).
synthesis_for_sound_type(drum, fm).
synthesis_for_sound_type(drum, sample_playback).

%% ---------------------------------------------------------------------------
%% M164: modulation_routing_pattern/3 – Common mod-matrix setups
%%   modulation_routing_pattern(Name, Source, Targets)
%% ---------------------------------------------------------------------------
modulation_routing_pattern(vibrato, lfo_sine, [osc_pitch]).
modulation_routing_pattern(tremolo, lfo_sine, [amplitude]).
modulation_routing_pattern(wah, lfo_triangle, [filter_cutoff]).
modulation_routing_pattern(swell, envelope_slow, [amplitude, filter_cutoff]).
modulation_routing_pattern(pluck_decay, envelope_fast, [filter_cutoff, amplitude]).
modulation_routing_pattern(wobble, lfo_square, [filter_cutoff]).
modulation_routing_pattern(stereo_motion, lfo_sine, [pan]).
modulation_routing_pattern(brightness_fade, envelope_slow, [filter_cutoff, resonance]).
modulation_routing_pattern(velocity_dynamics, velocity, [amplitude, filter_cutoff]).
modulation_routing_pattern(aftertouch_expression, aftertouch, [filter_cutoff, vibrato_depth]).
modulation_routing_pattern(mod_wheel_morph, mod_wheel, [wavetable_position, filter_cutoff]).
modulation_routing_pattern(random_texture, sample_and_hold, [osc_pitch, filter_cutoff]).

%% ---------------------------------------------------------------------------
%% M165: effect_chain_for_sound_type/3 – Effect chains per sound category
%%   effect_chain_for_sound_type(SoundType, Style, EffectList)
%% ---------------------------------------------------------------------------
effect_chain_for_sound_type(pad, lush, [chorus, reverb_hall, eq_lowcut]).
effect_chain_for_sound_type(pad, dark, [lowpass_filter, phaser, reverb_plate]).
effect_chain_for_sound_type(pad, ambient, [granular_delay, shimmer_reverb, eq_tilt]).
effect_chain_for_sound_type(lead, aggressive, [distortion, eq_presence_boost, delay_ping_pong]).
effect_chain_for_sound_type(lead, smooth, [chorus, compressor, reverb_room]).
effect_chain_for_sound_type(lead, retro, [tape_saturation, flanger, spring_reverb]).
effect_chain_for_sound_type(bass, sub, [eq_lowpass, compressor, saturator]).
effect_chain_for_sound_type(bass, growl, [wavefolder, bandpass_filter, compressor]).
effect_chain_for_sound_type(bass, reese, [unison_detune, chorus, eq_sub_boost]).
effect_chain_for_sound_type(pluck, bright, [eq_presence_boost, reverb_short, compressor]).
effect_chain_for_sound_type(pluck, muted, [lowpass_filter, tape_saturation, delay_short]).
effect_chain_for_sound_type(drum, punchy, [transient_shaper, compressor, eq_scoop]).
effect_chain_for_sound_type(drum, lo_fi, [bitcrusher, saturator, eq_lowpass]).
effect_chain_for_sound_type(texture, evolving, [granular_delay, reverb_hall, phaser]).
effect_chain_for_sound_type(texture, glitch, [beat_repeat, bitcrusher, delay_ping_pong]).
effect_chain_for_sound_type(keys, warm, [tape_saturation, chorus, reverb_plate]).
effect_chain_for_sound_type(keys, electric, [overdrive, tremolo, spring_reverb]).

%% ---------------------------------------------------------------------------
%% M166: sample_manipulation_technique/2 – Sample processing methods
%% ---------------------------------------------------------------------------
sample_manipulation_technique(time_stretch, 'Change duration without pitch shift').
sample_manipulation_technique(pitch_shift, 'Change pitch without time stretch').
sample_manipulation_technique(reverse, 'Play sample backwards').
sample_manipulation_technique(granular_freeze, 'Freeze a grain position for sustained texture').
sample_manipulation_technique(spectral_freeze, 'Freeze FFT frame for drone effect').
sample_manipulation_technique(paulstretch, 'Extreme time-stretch for ambient textures').
sample_manipulation_technique(vocoder, 'Impose spectral shape of one sound onto another').
sample_manipulation_technique(convolution, 'Apply impulse response of one sound to another').
sample_manipulation_technique(slicing, 'Auto-slice at transients into individual hits').
sample_manipulation_technique(crossfade_loop, 'Create seamless loop point with crossfade').

%% ---------------------------------------------------------------------------
%% M167: Modular board deck configuration rules
%% ---------------------------------------------------------------------------
sound_designer_board_deck(modular_routing, required).
sound_designer_board_deck(parameter_inspector, required).
sound_designer_board_deck(waveform_display, recommended).
sound_designer_board_deck(spectrum_analyzer, recommended).
sound_designer_board_deck(modulation_matrix, recommended).
sound_designer_board_deck(preset_browser, recommended).
sound_designer_board_deck(effect_chain, optional).
sound_designer_board_deck(ai_advisor, optional).

sound_designer_board_deck_size(modular_routing, 50).   % 50% main area
sound_designer_board_deck_size(parameter_inspector, 25). % 25% right panel
sound_designer_board_deck_size(waveform_display, 15).
sound_designer_board_deck_size(spectrum_analyzer, 15).
sound_designer_board_deck_size(modulation_matrix, 25).
sound_designer_board_deck_size(preset_browser, 20).

%% ---------------------------------------------------------------------------
%% M168: Routing overlay visibility rules
%% ---------------------------------------------------------------------------
routing_visibility_rule(modular_board, always_visible).
routing_visibility_rule(session_board, on_hover).
routing_visibility_rule(notation_board, hidden).
routing_visibility_rule(tracker_board, on_request).

%% ---------------------------------------------------------------------------
%% M169: Parameter inspector modulation source rules
%% ---------------------------------------------------------------------------
param_inspector_shows(modulation_sources, always).
param_inspector_shows(automation_lanes, when_recording).
param_inspector_shows(midi_learn_status, when_mapping).
param_inspector_shows(value_range, always).
param_inspector_shows(default_value, always).

%% ---------------------------------------------------------------------------
%% M186-M188: Sound designer board presets
%% ---------------------------------------------------------------------------
sound_designer_board_preset(synthesis_lab, 'Synthesis Lab', [
    modular_routing, parameter_inspector, waveform_display, spectrum_analyzer, modulation_matrix
]).
sound_designer_board_preset(sample_mangling, 'Sample Mangling', [
    waveform_display, sample_editor, effect_chain, spectrum_analyzer, preset_browser
]).
sound_designer_board_preset(effect_design, 'Effect Design', [
    effect_chain, modular_routing, spectrum_analyzer, parameter_inspector
]).

%% ---------------------------------------------------------------------------
%% M195: layering_rule/3 – Rules for combining sounds
%%   layering_rule(TargetCharacter, LayerRoles, CombiningNotes)
%% ---------------------------------------------------------------------------
layering_rule(thick_pad, [sub_layer, body_layer, air_layer],
    'Sub provides low-end weight, body fills mid, air adds high shimmer').
layering_rule(fat_bass, [sub_sine, mid_growl, top_click],
    'Sub sine anchors fundamental, mid growl adds character, click adds attack').
layering_rule(rich_lead, [main_lead, octave_layer, texture_layer],
    'Main lead carries melody, octave adds width, texture adds movement').
layering_rule(organic_keys, [dry_sample, reverb_tail, subtle_synth],
    'Dry sample for definition, reverb for space, synth for sustain').
layering_rule(cinematic_hit, [low_boom, mid_impact, high_transient, reverb_tail],
    'Boom for weight, impact for body, transient for cut, tail for decay').

%% ---------------------------------------------------------------------------
%% M196: frequency_balance_rule/2 – Mix clarity rules
%% ---------------------------------------------------------------------------
frequency_balance_rule(sub_bass, 'Only one element below 80 Hz to avoid mud').
frequency_balance_rule(bass_clarity, 'High-pass non-bass elements above 100-200 Hz').
frequency_balance_rule(mid_scoop, 'Gentle scoop at 300-500 Hz prevents boxiness').
frequency_balance_rule(presence, 'Boost 2-5 kHz for clarity and definition').
frequency_balance_rule(air, 'Gentle shelf above 10 kHz adds openness').
frequency_balance_rule(harshness, 'Dip 2-4 kHz if harshness detected').
frequency_balance_rule(masking, 'If two elements share a band, cut one and boost the other').

%% ---------------------------------------------------------------------------
%% M197: stereo_imaging_technique/2 – Width/depth techniques
%% ---------------------------------------------------------------------------
stereo_imaging_technique(haas_effect, 'Short delay on one channel (1-30ms) for width').
stereo_imaging_technique(mid_side_eq, 'EQ mid and side channels differently for focused width').
stereo_imaging_technique(stereo_chorus, 'Chorus with stereo spread for lush width').
stereo_imaging_technique(pan_automation, 'Automate pan for movement across stereo field').
stereo_imaging_technique(mono_below_200, 'Keep frequencies below 200 Hz mono for punch').
stereo_imaging_technique(binaural_panning, 'Use HRTF-based panning for headphone depth').
stereo_imaging_technique(reverb_width, 'Wide reverb on narrow source creates depth contrast').

%% ---------------------------------------------------------------------------
%% M207: macro_assignment_pattern/2 – Common macro setups
%%   macro_assignment_pattern(SoundType, MacroList)
%% ---------------------------------------------------------------------------
macro_assignment_pattern(pad, [
    macro(1, brightness, [filter_cutoff, harmonic_content]),
    macro(2, movement, [lfo_rate, lfo_depth]),
    macro(3, space, [reverb_mix, delay_mix]),
    macro(4, character, [drive_amount, chorus_depth])
]).
macro_assignment_pattern(lead, [
    macro(1, brightness, [filter_cutoff]),
    macro(2, vibrato, [vibrato_rate, vibrato_depth]),
    macro(3, attack, [amp_attack, filter_attack]),
    macro(4, effects, [delay_mix, distortion_amount])
]).
macro_assignment_pattern(bass, [
    macro(1, growl, [filter_cutoff, resonance, drive]),
    macro(2, sub_level, [sub_osc_level]),
    macro(3, punch, [amp_attack, transient_shape]),
    macro(4, movement, [lfo_rate, lfo_depth])
]).
macro_assignment_pattern(drum, [
    macro(1, tone, [pitch, filter_cutoff]),
    macro(2, snap, [amp_attack, transient_shape]),
    macro(3, decay, [amp_decay, amp_release]),
    macro(4, dirt, [distortion_amount, bitcrush_depth])
]).

%% ---------------------------------------------------------------------------
%% M208: performance_control_mapping/3 – Expressive controller mappings
%%   performance_control_mapping(Controller, SoundType, Targets)
%% ---------------------------------------------------------------------------
performance_control_mapping(mod_wheel, pad, [filter_cutoff, lfo_depth]).
performance_control_mapping(mod_wheel, lead, [vibrato_depth, filter_cutoff]).
performance_control_mapping(mod_wheel, bass, [filter_cutoff, drive_amount]).
performance_control_mapping(aftertouch, pad, [filter_cutoff, volume]).
performance_control_mapping(aftertouch, lead, [vibrato_depth, brightness]).
performance_control_mapping(pitch_bend, lead, [osc_pitch]).
performance_control_mapping(expression_pedal, pad, [volume, filter_cutoff]).
performance_control_mapping(breath_controller, lead, [amplitude, filter_cutoff, vibrato_depth]).
performance_control_mapping(sustain_pedal, keys, [sustain_on_off]).

%% ---------------------------------------------------------------------------
%% M215-M216: Preset organization and metadata
%% ---------------------------------------------------------------------------
preset_organization_scheme(by_category, [bass, lead, pad, keys, pluck, drum, texture, fx, vocal]).
preset_organization_scheme(by_mood, [dark, bright, warm, cold, aggressive, gentle, dreamy, tense]).
preset_organization_scheme(by_genre, [electronic, cinematic, ambient, pop, rock, jazz, experimental]).
preset_organization_scheme(by_character, [analog, digital, organic, metallic, glassy, wooden, airy]).

preset_metadata_standard(name, required).
preset_metadata_standard(category, required).
preset_metadata_standard(tags, recommended).
preset_metadata_standard(author, recommended).
preset_metadata_standard(description, optional).
preset_metadata_standard(genre, optional).
preset_metadata_standard(mood, optional).
preset_metadata_standard(character, optional).
preset_metadata_standard(velocity_sensitive, optional).
preset_metadata_standard(mpe_compatible, optional).

%% ---------------------------------------------------------------------------
%% M226: randomization_constraint/3 – Constrained randomization rules
%%   randomization_constraint(ParamGroup, MinFraction, MaxFraction)
%%   Fractions are 0.0 to 1.0 of parameter range
%% ---------------------------------------------------------------------------
randomization_constraint(oscillator_pitch, 0.0, 0.0).     % Never randomize pitch
randomization_constraint(oscillator_waveform, 0.0, 1.0).  % Full range
randomization_constraint(filter_cutoff, 0.2, 0.9).        % Avoid extremes
randomization_constraint(filter_resonance, 0.0, 0.7).     % Avoid self-oscillation
randomization_constraint(amplitude_attack, 0.0, 0.5).     % Keep attack reasonable
randomization_constraint(amplitude_decay, 0.1, 0.8).
randomization_constraint(amplitude_sustain, 0.2, 1.0).
randomization_constraint(amplitude_release, 0.05, 0.6).
randomization_constraint(lfo_rate, 0.1, 0.8).
randomization_constraint(lfo_depth, 0.0, 0.6).            % Subtle modulation
randomization_constraint(effect_mix, 0.0, 0.5).           % Don't drown in effects
randomization_constraint(drive_amount, 0.0, 0.4).         % Subtle distortion

%% ---------------------------------------------------------------------------
%% Suggestion rules – infer best synthesis, effects, macros for a goal
%% ---------------------------------------------------------------------------

%% suggest_synthesis/2 – Recommend synthesis technique for a sound type
suggest_synthesis(SoundType, Technique) :-
    synthesis_for_sound_type(SoundType, Technique).

%% suggest_effect_design/3 – Recommend effect chain for sound type + style
suggest_effect_design(SoundType, Style, Effects) :-
    effect_chain_for_sound_type(SoundType, Style, Effects).

%% suggest_modulation/2 – Recommend modulation routing for a character
suggest_modulation(Character, routing(Source, Targets)) :-
    modulation_routing_pattern(Character, Source, Targets).

%% suggest_macro_layout/2 – Recommend macro assignments for sound type
suggest_macro_layout(SoundType, Macros) :-
    macro_assignment_pattern(SoundType, Macros).

%% suggest_layering/2 – Recommend layer structure for a target character
suggest_layering(Character, layers(Roles, Notes)) :-
    layering_rule(Character, Roles, Notes).
