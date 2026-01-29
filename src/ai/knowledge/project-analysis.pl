%% ============================================================================
%% Intelligent Project Analysis Knowledge Base
%%
%% N051-N100: Rules for analysing project health, detecting issues,
%% checking consistency, and suggesting improvements.
%%
%% @module @cardplay/ai/knowledge/project-analysis
%% ============================================================================

%% ---------------------------------------------------------------------------
%% Project state (injected from the app)
%% ---------------------------------------------------------------------------

:- dynamic(project_has/1).
:- dynamic(project_issue_flag/2).
:- dynamic(project_stat/2).

%% ---------------------------------------------------------------------------
%% N052: project_health_metric/2 – (MetricId, Description)
%% ---------------------------------------------------------------------------
project_health_metric(completeness, 'All sections have content; no empty tracks or gaps').
project_health_metric(balance, 'Frequency spectrum and stereo field are well-distributed').
project_health_metric(coherence, 'Musical elements support a unified artistic vision').
project_health_metric(variety, 'Sufficient contrast between sections to maintain interest').
project_health_metric(dynamics, 'Dynamic range is appropriate for the genre').
project_health_metric(arrangement_form, 'Song structure follows genre conventions or is intentionally novel').

%% ---------------------------------------------------------------------------
%% N053: missing_element_detection/2 – (Issue, Remedy)
%% ---------------------------------------------------------------------------
missing_element_detection(no_bass, 'Add a bass element to anchor the low end').
missing_element_detection(no_melody, 'Consider adding a melodic element for singability').
missing_element_detection(no_drums, 'Add rhythmic elements to drive the track').
missing_element_detection(no_harmony, 'Add chords or harmonic movement').
missing_element_detection(no_intro, 'Consider adding an introduction to ease listeners in').
missing_element_detection(no_outro, 'Add an ending section rather than abruptly stopping').
missing_element_detection(no_transition, 'Add transitions (fills, risers, sweeps) between sections').
missing_element_detection(no_variation, 'Add variation to repeated sections to prevent monotony').

%% ---------------------------------------------------------------------------
%% N054: overused_element_detection/2 – (Issue, Remedy)
%% ---------------------------------------------------------------------------
overused_element_detection(excessive_repetition, 'Same pattern repeats more than 8 times without variation').
overused_element_detection(constant_velocity, 'All notes at the same velocity sounds mechanical').
overused_element_detection(static_mix, 'Mix levels never change; add automation for movement').
overused_element_detection(overused_reverb, 'Too much reverb on too many tracks; reduce send levels').
overused_element_detection(too_many_layers, 'More than 6 simultaneous melodic elements causes mud').
overused_element_detection(constant_density, 'Arrangement density never changes; add sparse sections').

%% ---------------------------------------------------------------------------
%% N055: structural_issue_detection/2 – (Issue, Remedy)
%% ---------------------------------------------------------------------------
structural_issue_detection(no_chorus_contrast, 'Chorus should have noticeably higher energy than verse').
structural_issue_detection(too_long_intro, 'Intro longer than 16 bars may lose listener interest').
structural_issue_detection(abrupt_ending, 'Track ends without proper resolution or fade').
structural_issue_detection(no_buildup, 'Drops or choruses need buildup for impact').
structural_issue_detection(monotonic_energy, 'Energy stays flat throughout; create peaks and valleys').
structural_issue_detection(weak_hook, 'No memorable hook or motif that recurs').

%% ---------------------------------------------------------------------------
%% N056: technical_issue_detection/2 – (Issue, Remedy)
%% ---------------------------------------------------------------------------
technical_issue_detection(clipping, 'One or more channels exceed 0dBFS; reduce levels').
technical_issue_detection(dc_offset, 'DC offset detected; apply high-pass filter at 20Hz').
technical_issue_detection(phase_cancellation, 'Stereo elements may cancel in mono; check phase correlation').
technical_issue_detection(mud_buildup, 'Excessive energy in 200-500Hz range; apply subtractive EQ').
technical_issue_detection(harsh_frequencies, 'Peaks in 2-4kHz range; apply narrow cut or de-essing').
technical_issue_detection(low_end_rumble, 'Sub-30Hz energy wastes headroom; high-pass non-bass tracks').
technical_issue_detection(stereo_imbalance, 'Left-right balance differs by more than 2dB').
technical_issue_detection(over_compression, 'Dynamic range less than 4dB suggests over-compression').

%% ---------------------------------------------------------------------------
%% N070-N073: Style and consistency checks
%% ---------------------------------------------------------------------------

%% style_consistency_check/2 – (Issue, Description)
style_consistency_check(genre_mismatch, 'Elements from incompatible genres are combined without intent').
style_consistency_check(tempo_inconsistency, 'Tempo varies unexpectedly outside of intentional changes').
style_consistency_check(timbral_clash, 'Sound palette mixes organic and synthetic without cohesion').
style_consistency_check(era_mismatch, 'Production style mixes different decades without intent').

%% harmony_coherence_check/2 – (Issue, Description)
harmony_coherence_check(non_functional_progression, 'Chord progression lacks harmonic direction').
harmony_coherence_check(unresolved_tension, 'Dominant chord not followed by tonic resolution').
harmony_coherence_check(key_confusion, 'Notes suggest conflicting key centers').
harmony_coherence_check(excessive_chromaticism, 'Too many non-diatonic notes without clear purpose').
harmony_coherence_check(parallel_motion, 'Parallel fifths or octaves in voice leading').

%% rhythm_consistency_check/2 – (Issue, Description)
rhythm_consistency_check(timing_drift, 'Notes drift from grid without humanization intent').
rhythm_consistency_check(inconsistent_swing, 'Swing amount varies between tracks unexpectedly').
rhythm_consistency_check(conflicting_subdivisions, 'Tracks use incompatible rhythmic subdivisions').
rhythm_consistency_check(missing_downbeat, 'Strong beats are not emphasised in expected genre').

%% instrumentation_balance_check/2 – (Issue, Description)
instrumentation_balance_check(frequency_masking, 'Multiple instruments compete in the same frequency band').
instrumentation_balance_check(empty_spectrum_band, 'No instruments filling an important frequency range').
instrumentation_balance_check(mono_center_crowded, 'Too many elements panned to center').
instrumentation_balance_check(missing_high_end, 'No elements with significant energy above 8kHz').
instrumentation_balance_check(missing_low_end, 'No elements with significant energy below 100Hz').

%% ---------------------------------------------------------------------------
%% N083-N085: Complexity metrics
%% ---------------------------------------------------------------------------

%% project_complexity_metric/2 – (Metric, Description)
project_complexity_metric(track_count, 'Number of active tracks in the project').
project_complexity_metric(unique_instruments, 'Number of distinct instrument types used').
project_complexity_metric(effect_count, 'Total number of effect instances').
project_complexity_metric(automation_lanes, 'Number of active automation lanes').
project_complexity_metric(routing_connections, 'Number of non-trivial signal routing connections').
project_complexity_metric(section_count, 'Number of distinct arrangement sections').

%% simplification_suggestion/2 – (Technique, Description)
simplification_suggestion(reduce_tracks, 'Combine similar tracks to reduce count').
simplification_suggestion(simplify_routing, 'Replace complex routing with simple bus structure').
simplification_suggestion(reduce_effects, 'Remove redundant or inaudible effects').
simplification_suggestion(consolidate_automation, 'Merge fine-grained automation into broader curves').
simplification_suggestion(use_presets, 'Use board presets instead of manual deck configuration').

%% beginner_safety_check/2 – (Check, Warning)
beginner_safety_check(too_many_tracks, 'More than 8 tracks may be overwhelming for beginners').
beginner_safety_check(complex_routing, 'Custom routing may confuse; use default bus structure').
beginner_safety_check(advanced_effects, 'Multiband compression, mid-side EQ are advanced tools').
beginner_safety_check(too_many_automations, 'Many automation lanes may be hard to manage').
beginner_safety_check(non_standard_form, 'Unusual song structures may confuse; start with verse-chorus').

%% ---------------------------------------------------------------------------
%% Suggestion inference rules
%% ---------------------------------------------------------------------------

%% suggest_improvement/2 – Check all issue types and suggest remedies
suggest_improvement(missing, Remedy) :- missing_element_detection(_, Remedy).
suggest_improvement(overused, Remedy) :- overused_element_detection(_, Remedy).
suggest_improvement(structural, Remedy) :- structural_issue_detection(_, Remedy).
suggest_improvement(technical, Remedy) :- technical_issue_detection(_, Remedy).

%% ---------------------------------------------------------------------------
%% Project-specific issue inference (driven by injected facts)
%% ---------------------------------------------------------------------------

project_issue(missing, no_bass, Remedy) :-
  \+ project_has(bass),
  missing_element_detection(no_bass, Remedy).
project_issue(missing, no_melody, Remedy) :-
  \+ project_has(melody),
  missing_element_detection(no_melody, Remedy).
project_issue(missing, no_drums, Remedy) :-
  \+ project_has(drums),
  missing_element_detection(no_drums, Remedy).
project_issue(missing, no_harmony, Remedy) :-
  \+ project_has(harmony),
  missing_element_detection(no_harmony, Remedy).
project_issue(missing, no_intro, Remedy) :-
  \+ project_has(intro),
  missing_element_detection(no_intro, Remedy).
project_issue(missing, no_outro, Remedy) :-
  \+ project_has(outro),
  missing_element_detection(no_outro, Remedy).
project_issue(missing, no_transition, Remedy) :-
  \+ project_has(transition),
  missing_element_detection(no_transition, Remedy).
project_issue(missing, no_variation, Remedy) :-
  \+ project_has(variation),
  missing_element_detection(no_variation, Remedy).

project_issue(overused, Issue, Remedy) :-
  project_issue_flag(overused, Issue),
  overused_element_detection(Issue, Remedy).
project_issue(structural, Issue, Remedy) :-
  project_issue_flag(structural, Issue),
  structural_issue_detection(Issue, Remedy).
project_issue(technical, Issue, Remedy) :-
  project_issue_flag(technical, Issue),
  technical_issue_detection(Issue, Remedy).
project_issue(style, Issue, Description) :-
  project_issue_flag(style, Issue),
  style_consistency_check(Issue, Description).
project_issue(harmony, Issue, Description) :-
  project_issue_flag(harmony, Issue),
  harmony_coherence_check(Issue, Description).
project_issue(rhythm, Issue, Description) :-
  project_issue_flag(rhythm, Issue),
  rhythm_consistency_check(Issue, Description).
project_issue(balance, Issue, Description) :-
  project_issue_flag(balance, Issue),
  instrumentation_balance_check(Issue, Description).
