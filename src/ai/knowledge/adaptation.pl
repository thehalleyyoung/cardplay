%% ============================================================================
%% Adaptive Suggestion Rules
%%
%% L344-L352: Rules for adapting AI suggestions based on user skill level.
%%
%% Predicates:
%%   adapt_suggestion/3           – (SkillLevel, RawSuggestion, AdaptedSuggestion)
%%   beginner_simplification/2    – (Feature, SimplifiedVersion)
%%   expert_enhancement/2         – (Feature, EnhancedVersion)
%%   skill_level_order/2          – (Level, NumericOrder)  (0=beginner..3=expert)
%%   feature_complexity/2         – (Feature, ComplexityLevel)
%%   visible_at_level/2           – (Feature, MinimumSkillLevel)
%%
%% @module @cardplay/ai/knowledge/adaptation
%% ============================================================================

%% ---------------------------------------------------------------------------
%% Skill level ordering (for comparisons)
%% ---------------------------------------------------------------------------
skill_level_order(beginner, 0).
skill_level_order(intermediate, 1).
skill_level_order(advanced, 2).
skill_level_order(expert, 3).

%% ---------------------------------------------------------------------------
%% Feature complexity ratings
%% ---------------------------------------------------------------------------
feature_complexity(basic_chords, beginner).
feature_complexity(major_minor_scales, beginner).
feature_complexity(simple_progressions, beginner).
feature_complexity(basic_drum_patterns, beginner).
feature_complexity(simple_melodies, beginner).

feature_complexity(seventh_chords, intermediate).
feature_complexity(modes, intermediate).
feature_complexity(secondary_dominants, intermediate).
feature_complexity(syncopation, intermediate).
feature_complexity(phrase_variation, intermediate).
feature_complexity(basic_voice_leading, intermediate).

feature_complexity(extended_harmony, advanced).
feature_complexity(modal_interchange, advanced).
feature_complexity(tritone_substitution, advanced).
feature_complexity(counterpoint, advanced).
feature_complexity(polyrhythm, advanced).
feature_complexity(advanced_voice_leading, advanced).
feature_complexity(reharmonization, advanced).

feature_complexity(twelve_tone, expert).
feature_complexity(spectral_harmony, expert).
feature_complexity(generative_composition, expert).
feature_complexity(microtonal, expert).
feature_complexity(complex_polyrhythm, expert).
feature_complexity(advanced_orchestration, expert).

%% ---------------------------------------------------------------------------
%% Feature visibility by skill level
%% ---------------------------------------------------------------------------
visible_at_level(Feature, MinLevel) :-
    feature_complexity(Feature, MinLevel).

%% A feature is visible if the user's level is >= the feature's minimum level
feature_visible_for(Feature, UserLevel) :-
    feature_complexity(Feature, FeatureLevel),
    skill_level_order(FeatureLevel, FeatureOrder),
    skill_level_order(UserLevel, UserOrder),
    UserOrder >= FeatureOrder.

%% ---------------------------------------------------------------------------
%% L345: adapt_suggestion/3
%% Adapts a suggestion based on user skill level.
%% ---------------------------------------------------------------------------
adapt_suggestion(beginner, Suggestion, adapted(Suggestion, simplified)) :-
    beginner_simplification(Suggestion, _).
adapt_suggestion(beginner, Suggestion, adapted(Suggestion, as_is)) :-
    \+ beginner_simplification(Suggestion, _).

adapt_suggestion(intermediate, Suggestion, adapted(Suggestion, as_is)).

adapt_suggestion(advanced, Suggestion, adapted(Suggestion, enhanced)) :-
    expert_enhancement(Suggestion, _).
adapt_suggestion(advanced, Suggestion, adapted(Suggestion, as_is)) :-
    \+ expert_enhancement(Suggestion, _).

adapt_suggestion(expert, Suggestion, adapted(Suggestion, enhanced)) :-
    expert_enhancement(Suggestion, _).
adapt_suggestion(expert, Suggestion, adapted(Suggestion, as_is)) :-
    \+ expert_enhancement(Suggestion, _).

%% ---------------------------------------------------------------------------
%% L346: beginner_simplification/2
%% Simplified versions of features for beginners.
%% ---------------------------------------------------------------------------
beginner_simplification(chord_suggestion, use_triads_only).
beginner_simplification(scale_suggestion, use_major_minor_only).
beginner_simplification(progression_suggestion, use_four_chord_only).
beginner_simplification(rhythm_suggestion, use_straight_only).
beginner_simplification(voice_leading, skip_voice_leading).
beginner_simplification(counterpoint, skip_counterpoint).
beginner_simplification(reharmonization, skip_reharmonization).
beginner_simplification(modulation, skip_modulation).

%% ---------------------------------------------------------------------------
%% L347: expert_enhancement/2
%% Enhanced features for advanced/expert users.
%% ---------------------------------------------------------------------------
expert_enhancement(chord_suggestion, include_extensions_and_alterations).
expert_enhancement(scale_suggestion, include_synthetic_scales).
expert_enhancement(progression_suggestion, include_chromatic_and_modal).
expert_enhancement(rhythm_suggestion, include_polyrhythm).
expert_enhancement(voice_leading, show_parallel_motion_analysis).
expert_enhancement(melody_suggestion, include_motivic_development).
expert_enhancement(arrangement, include_orchestration_suggestions).
expert_enhancement(harmony_analysis, include_non_functional_analysis).

%% ---------------------------------------------------------------------------
%% Adaptive help text rules (L348)
%% ---------------------------------------------------------------------------
help_detail_level(beginner, minimal).
help_detail_level(intermediate, standard).
help_detail_level(advanced, detailed).
help_detail_level(expert, comprehensive).

%% Should show tutorial hints?
show_tutorial_hints(beginner).
show_tutorial_hints(intermediate).

%% Should show advanced tooltips?
show_advanced_tooltips(advanced).
show_advanced_tooltips(expert).

%% ---------------------------------------------------------------------------
%% Adaptive defaults (L350)
%% ---------------------------------------------------------------------------
default_chord_type(beginner, major).
default_chord_type(intermediate, seventh).
default_chord_type(advanced, extended).
default_chord_type(expert, altered).

default_scale_type(beginner, major).
default_scale_type(intermediate, natural_minor).
default_scale_type(advanced, harmonic_minor).
default_scale_type(expert, melodic_minor).

default_complexity(beginner, 0.2).
default_complexity(intermediate, 0.5).
default_complexity(advanced, 0.7).
default_complexity(expert, 0.9).

%% ---------------------------------------------------------------------------
%% Adaptive tutorial sequences (L349)
%%
%% adaptive_tutorial/3 – (TutorialId, SkillLevel, Steps)
%% Adapts tutorial content depth based on skill level.
%% ---------------------------------------------------------------------------
adaptive_tutorial(note_entry, beginner, [
    explain_staff_lines, show_note_durations, practice_whole_notes,
    practice_quarter_notes, practice_eighth_notes, explain_rests
]).
adaptive_tutorial(note_entry, intermediate, [
    review_durations, practice_dotted_notes, practice_ties,
    practice_tuplets, practice_grace_notes
]).
adaptive_tutorial(note_entry, advanced, [
    practice_cross_staff, practice_cue_notes,
    practice_ossia_passages, practice_complex_tuplets
]).

adaptive_tutorial(chord_building, beginner, [
    explain_intervals, build_major_triad, build_minor_triad,
    identify_triads_by_ear, practice_triad_inversions
]).
adaptive_tutorial(chord_building, intermediate, [
    build_seventh_chords, build_suspended_chords,
    identify_seventh_chords, practice_voice_leading_basics
]).
adaptive_tutorial(chord_building, advanced, [
    build_extended_chords, build_altered_chords,
    practice_jazz_voicings, practice_quartal_voicings
]).

adaptive_tutorial(arrangement, beginner, [
    explain_song_sections, build_verse_chorus, add_intro_outro,
    practice_simple_form
]).
adaptive_tutorial(arrangement, intermediate, [
    add_pre_chorus, add_bridge, practice_energy_curves,
    practice_transitions_between_sections
]).
adaptive_tutorial(arrangement, advanced, [
    practice_through_composed, practice_development_techniques,
    practice_modulation_in_arrangement, practice_orchestration_changes
]).

adaptive_tutorial(mixing, beginner, [
    explain_faders, practice_level_balance, explain_panning,
    add_simple_eq, add_simple_reverb
]).
adaptive_tutorial(mixing, intermediate, [
    practice_eq_surgery, practice_compression, setup_bus_routing,
    practice_send_effects, practice_automation_basics
]).
adaptive_tutorial(mixing, advanced, [
    practice_parallel_compression, practice_mid_side_processing,
    practice_multiband_dynamics, practice_reference_matching
]).

%% adaptive_tutorial_for_user/3 – Select tutorial matching user level
adaptive_tutorial_for_user(TutorialId, SkillLevel, Steps) :-
    adaptive_tutorial(TutorialId, SkillLevel, Steps).
adaptive_tutorial_for_user(TutorialId, SkillLevel, Steps) :-
    \+ adaptive_tutorial(TutorialId, SkillLevel, _),
    adaptive_tutorial(TutorialId, beginner, Steps).  % Fallback to beginner

%% ============================================================================
%% N123: adaptive_suggestion_rule/3 – (SkillLevel, SuggestionType, Adjustment)
%%
%% Maps skill levels to concrete adjustments for each suggestion category.
%% Used by adaptSuggestions() to filter/transform raw suggestions.
%% ============================================================================
adaptive_suggestion_rule(beginner, chord_suggestion, limit_to_triads).
adaptive_suggestion_rule(beginner, scale_suggestion, limit_to_major_minor).
adaptive_suggestion_rule(beginner, rhythm_suggestion, limit_to_straight).
adaptive_suggestion_rule(beginner, arrangement, limit_sections_to_4).
adaptive_suggestion_rule(beginner, mixing, hide_advanced_processors).

adaptive_suggestion_rule(intermediate, chord_suggestion, include_sevenths).
adaptive_suggestion_rule(intermediate, scale_suggestion, include_modes).
adaptive_suggestion_rule(intermediate, rhythm_suggestion, include_syncopation).
adaptive_suggestion_rule(intermediate, arrangement, allow_all_sections).
adaptive_suggestion_rule(intermediate, mixing, show_compression_basics).

adaptive_suggestion_rule(advanced, chord_suggestion, include_extensions).
adaptive_suggestion_rule(advanced, scale_suggestion, include_altered_scales).
adaptive_suggestion_rule(advanced, rhythm_suggestion, include_polyrhythm).
adaptive_suggestion_rule(advanced, arrangement, suggest_development).
adaptive_suggestion_rule(advanced, mixing, show_all_processors).

adaptive_suggestion_rule(expert, chord_suggestion, include_all_harmony).
adaptive_suggestion_rule(expert, scale_suggestion, include_synthetic).
adaptive_suggestion_rule(expert, rhythm_suggestion, include_metric_modulation).
adaptive_suggestion_rule(expert, arrangement, suggest_through_composed).
adaptive_suggestion_rule(expert, mixing, show_mastering_tools).

%% ============================================================================
%% N124: progressive_disclosure_rule/2 – (Feature, MinSkillLevel)
%%
%% Determines the minimum skill level required to see a UI feature.
%% Features below the user's level are shown; those above are hidden.
%% ============================================================================
progressive_disclosure_rule(basic_board_switcher, beginner).
progressive_disclosure_rule(simple_generator, beginner).
progressive_disclosure_rule(pattern_editor, beginner).
progressive_disclosure_rule(sample_browser, beginner).
progressive_disclosure_rule(basic_mixer, beginner).

progressive_disclosure_rule(phrase_library, intermediate).
progressive_disclosure_rule(harmony_display, intermediate).
progressive_disclosure_rule(chord_track, intermediate).
progressive_disclosure_rule(automation_basic, intermediate).
progressive_disclosure_rule(effect_chain, intermediate).

progressive_disclosure_rule(ai_advisor, advanced).
progressive_disclosure_rule(routing_overlay, advanced).
progressive_disclosure_rule(modulation_matrix, advanced).
progressive_disclosure_rule(counterpoint_checker, advanced).
progressive_disclosure_rule(advanced_automation, advanced).
progressive_disclosure_rule(spectrum_analyzer, advanced).

progressive_disclosure_rule(custom_prolog_rules, expert).
progressive_disclosure_rule(kb_editor, expert).
progressive_disclosure_rule(performance_profiler, expert).
progressive_disclosure_rule(script_editor, expert).

%% Helper: check if a feature should be disclosed for a given level
should_disclose(Feature, UserLevel) :-
    progressive_disclosure_rule(Feature, RequiredLevel),
    skill_level_order(RequiredLevel, ReqOrder),
    skill_level_order(UserLevel, UserOrder),
    UserOrder >= ReqOrder.

%% ============================================================================
%% N125: skill_estimation/3 – (Area, ActionCount, EstimatedLevel)
%%
%% Estimates a user's skill level in a specific area based on the number
%% of actions they've performed. Used by estimateSkillLevel().
%% ============================================================================
skill_estimation(_, ActionCount, beginner) :-
    ActionCount < 20.
skill_estimation(_, ActionCount, intermediate) :-
    ActionCount >= 20, ActionCount < 80.
skill_estimation(_, ActionCount, advanced) :-
    ActionCount >= 80, ActionCount < 200.
skill_estimation(_, ActionCount, expert) :-
    ActionCount >= 200.

%% Area-specific thresholds (override generic if desired)
skill_estimation_area(mixing, ActionCount, beginner) :-
    ActionCount < 30.
skill_estimation_area(mixing, ActionCount, intermediate) :-
    ActionCount >= 30, ActionCount < 100.
skill_estimation_area(mixing, ActionCount, advanced) :-
    ActionCount >= 100, ActionCount < 300.
skill_estimation_area(mixing, ActionCount, expert) :-
    ActionCount >= 300.

skill_estimation_area(composition, ActionCount, beginner) :-
    ActionCount < 15.
skill_estimation_area(composition, ActionCount, intermediate) :-
    ActionCount >= 15, ActionCount < 60.
skill_estimation_area(composition, ActionCount, advanced) :-
    ActionCount >= 60, ActionCount < 150.
skill_estimation_area(composition, ActionCount, expert) :-
    ActionCount >= 150.

%% ============================================================================
%% N134: error_pattern_detection/2 – (ErrorPattern, Description)
%%
%% Known error patterns that users commonly make.
%% Used by the error tracking system to identify repeated mistakes.
%% ============================================================================
error_pattern_detection(parallel_fifths, 'Consecutive parallel fifths in voice leading').
error_pattern_detection(parallel_octaves, 'Consecutive parallel octaves in voice leading').
error_pattern_detection(voice_crossing, 'Voice parts cross each other').
error_pattern_detection(unresolved_leading_tone, 'Leading tone does not resolve upward to tonic').
error_pattern_detection(doubled_leading_tone, 'Leading tone is doubled in a chord').
error_pattern_detection(augmented_second, 'Augmented second interval in melodic line').
error_pattern_detection(direct_fifths, 'Hidden or direct fifths in outer voices').
error_pattern_detection(missing_root, 'Root omitted from chord without clear justification').
error_pattern_detection(excessive_range, 'Voice exceeds comfortable singing or instrument range').
error_pattern_detection(clipping_output, 'Mix output exceeds 0dBFS causing distortion').
error_pattern_detection(feedback_loop, 'Signal routing creates a feedback cycle').
error_pattern_detection(tempo_mismatch, 'Sample tempo does not match project tempo').

%% ============================================================================
%% N135: corrective_suggestion/2 – (ErrorPattern, Correction)
%%
%% Corrective advice for each known error pattern.
%% ============================================================================
corrective_suggestion(parallel_fifths, 'Use contrary or oblique motion between voices').
corrective_suggestion(parallel_octaves, 'Move one voice in a different direction').
corrective_suggestion(voice_crossing, 'Rearrange voices so higher parts stay above lower parts').
corrective_suggestion(unresolved_leading_tone, 'Resolve the 7th scale degree up to tonic').
corrective_suggestion(doubled_leading_tone, 'Double the root or fifth instead of the leading tone').
corrective_suggestion(augmented_second, 'Use the melodic minor ascending form to avoid augmented seconds').
corrective_suggestion(direct_fifths, 'Approach the fifth by contrary or oblique motion in outer voices').
corrective_suggestion(missing_root, 'Include the root in the chord or mark the omission as intentional').
corrective_suggestion(excessive_range, 'Transpose the passage or reassign to a more suitable instrument').
corrective_suggestion(clipping_output, 'Reduce channel or bus levels until peak stays below -1dBFS').
corrective_suggestion(feedback_loop, 'Break the routing cycle by removing one send or changing the target').
corrective_suggestion(tempo_mismatch, 'Time-stretch the sample to match project tempo or adjust project tempo').

%% ---------------------------------------------------------------------------
%% N130: Advanced features override
%%
%% When advanced_override_active/0 is asserted, all features become visible
%% regardless of skill level. This is controlled from TypeScript.
%% ---------------------------------------------------------------------------
%% :- dynamic advanced_override_active/0.  % Asserted/retracted at runtime

%% Override version of should_disclose: when override is active, everything is visible
should_disclose_override(_, _) :-
    advanced_override_active, !.
should_disclose_override(Feature, SkillLevel) :-
    should_disclose(Feature, SkillLevel).
