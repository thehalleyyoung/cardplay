%% music-theory-film-scoring.pl - Film Scoring Theory & Emotion Mapping KB
%%
%% Provides predicates for:
%% - Foundational film music theory (C1551-C1580)
%% - Emotion-music mapping models (C1581-C1620)
%% - Genre-specific film scoring (C1621-C1660)
%% - Famous composer techniques (C1661-C1700)
%%
%% Depends on: music-theory.pl, music-theory-film.pl

%% ============================================================================
%% FOUNDATIONAL FILM MUSIC THEORY (C1551-C1580)
%% ============================================================================

%% diegetic_vs_nondiegetic(+MusicCue, -Type)
%% Classify a music cue as diegetic (source) or non-diegetic (underscore). (C1552)
diegetic_vs_nondiegetic(Cue, diegetic) :-
  member(source, Cue), !.
diegetic_vs_nondiegetic(Cue, nondiegetic) :-
  member(underscore, Cue), !.
diegetic_vs_nondiegetic(Cue, meta_diegetic) :-
  member(character_imagination, Cue), !.
diegetic_vs_nondiegetic(_, nondiegetic).

%% mickey_mousing(+Action, +MusicSync, -IsMickeying)
%% Detect if music is "mickey mousing" (literal sync with action). (C1553)
mickey_mousing(Action, MusicSync, true) :-
  Action = action(Type, Timing),
  MusicSync = sync(Type, Timing), !.
mickey_mousing(_, _, false).

%% underscoring_technique(+Scene, -Technique, -Application)
%% Recommend underscoring techniques for scene types. (C1554)
underscoring_technique(dialogue, sparse_underscore, [
  sustain_pads, avoid_melody, low_register, pp_dynamic
]).
underscoring_technique(action, rhythmic_drive, [
  ostinato, percussion, brass_stabs, ff_dynamic
]).
underscoring_technique(romantic, melodic_theme, [
  strings_melody, warm_harmony, moderate_dynamic
]).
underscoring_technique(suspense, tension_build, [
  clusters, tremolo, ascending_register, crescendo
]).
underscoring_technique(montage, rhythmic_punctuation, [
  scene_cuts_on_beat, motivic_fragments, varied_dynamics
]).
underscoring_technique(establishing, ambient_texture, [
  sustained_tones, world_elements, open_harmony
]).

%% anempathetic_music(+SceneEmotion, +MusicEmotion, -Contrast)
%% Music deliberately at odds with scene emotion (Kubrick technique). (C1556)
anempathetic_music(sad, happy, high_contrast).
anempathetic_music(violent, peaceful, high_contrast).
anempathetic_music(chaotic, orderly, moderate_contrast).
anempathetic_music(joyful, melancholic, moderate_contrast).
anempathetic_music(tense, relaxed, high_contrast).

%% empathetic_music(+SceneEmotion, +MusicEmotion, -Alignment)
%% Music that matches scene emotion (standard practice). (C1557)
empathetic_music(Emotion, Emotion, perfect_alignment) :- !.
empathetic_music(sad, melancholic, close_alignment).
empathetic_music(happy, joyful, close_alignment).
empathetic_music(tense, anxious, close_alignment).
empathetic_music(peaceful, serene, close_alignment).
empathetic_music(_, _, partial_alignment).

%% leitmotif_definition(+MotifId, -Character, -MusicalMaterial)
%% Define a leitmotif for a character/concept. (C1558)
%% Dynamic: users define their own leitmotifs
:- dynamic leitmotif_definition/3.

%% leitmotif_transformation(+MotifId, +Scene, -Transform, -Result)
%% Transform a leitmotif based on dramatic context. (C1559)
leitmotif_transformation(MotifId, triumphant, major_mode, Result) :-
  leitmotif_definition(MotifId, _, Material),
  Result = transformed(Material, [mode(major), dynamics(ff), tempo(faster)]).
leitmotif_transformation(MotifId, tragic, minor_mode, Result) :-
  leitmotif_definition(MotifId, _, Material),
  Result = transformed(Material, [mode(minor), dynamics(pp), tempo(slower)]).
leitmotif_transformation(MotifId, mysterious, fragmented, Result) :-
  leitmotif_definition(MotifId, _, Material),
  Result = transformed(Material, [fragmented, muted, sparse_orchestration]).
leitmotif_transformation(MotifId, romantic, lush, Result) :-
  leitmotif_definition(MotifId, _, Material),
  Result = transformed(Material, [strings_melody, warm_harmony, rubato]).

%% leitmotif_combination(+Motif1, +Motif2, -Technique, -Combined)
%% Combine two leitmotifs (as in Wagner's technique). (C1560)
leitmotif_combination(M1, M2, counterpoint, combined(M1, M2, simultaneous)).
leitmotif_combination(M1, M2, sequential, combined(M1, M2, sequential)).
leitmotif_combination(M1, M2, merged, combined(M1, M2, thematic_synthesis)).

%% hit_point_scoring(+Timecode, +EventType, -MusicAction)
%% Score a hit point (visual event sync). (C1562)
hit_point_scoring(TC, door_slam, stinger(TC, sfz, brass)) :- !.
hit_point_scoring(TC, explosion, impact(TC, fff, full_orchestra)) :- !.
hit_point_scoring(TC, reveal, swell(TC, pp_to_ff, strings)) :- !.
hit_point_scoring(TC, death, sustain(TC, ppp, solo_instrument)) :- !.
hit_point_scoring(TC, kiss, warmth(TC, mf, strings_woodwinds)) :- !.
hit_point_scoring(TC, chase_start, drive(TC, f, percussion_brass)) :- !.
hit_point_scoring(TC, _, neutral(TC, mp, ensemble)).

%% click_track_calculation(+HitPoints, +TempoRange, +Rubato, -ClickTrack)
%% Calculate variable click track to hit sync points. (C1564)
click_track_calculation(HitPoints, range(MinTempo, MaxTempo), Rubato, ClickTrack) :-
  length(HitPoints, N),
  ( N < 2 -> ClickTrack = constant(MinTempo)
  ; calculate_variable_tempo(HitPoints, MinTempo, MaxTempo, Rubato, ClickTrack)
  ).

calculate_variable_tempo([], _, _, _, []).
calculate_variable_tempo([_], Tempo, _, _, [segment(Tempo)]).
calculate_variable_tempo([HP1, HP2|Rest], MinT, MaxT, Rubato, [segment(Tempo)|RestTrack]) :-
  HP1 = hit(TC1, _), HP2 = hit(TC2, _),
  Duration is TC2 - TC1,
  %% Compute tempo to fill duration (simplified)
  ( Duration > 0 ->
    Beats is Duration * 2,  %% Assume 2 beats per second at moderate tempo
    RawTempo is Beats / Duration * 60,
    Tempo is max(MinT, min(MaxT, RawTempo))
  ; Tempo = MinT
  ),
  calculate_variable_tempo([HP2|Rest], MinT, MaxT, Rubato, RestTrack).

%% scoring_philosophy constraints (C1579)
scoring_philosophy(classical_hollywood).
scoring_philosophy(minimalist).
scoring_philosophy(avant_garde).
scoring_philosophy(hybrid).

%% director_preference constraints (C1580)
director_preference(wall_to_wall).
director_preference(sparse).
director_preference(source_heavy).

%% ============================================================================
%% EMOTION-MUSIC MAPPING MODELS (C1581-C1620)
%% ============================================================================

%% russell_circumplex(+Valence, +Arousal, -EmotionLabel)
%% Russell's circumplex model of emotion. (C1581)
russell_circumplex(positive, high, excited).
russell_circumplex(positive, moderate, happy).
russell_circumplex(positive, low, relaxed).
russell_circumplex(neutral, high, alert).
russell_circumplex(neutral, moderate, neutral).
russell_circumplex(neutral, low, calm).
russell_circumplex(negative, high, angry).
russell_circumplex(negative, moderate, sad).
russell_circumplex(negative, low, depressed).

%% thayer_energy_stress(+Energy, +Stress, -EmotionLabel)
%% Thayer's two-dimensional model. (C1582)
thayer_energy_stress(high, low, calm_energy).
thayer_energy_stress(high, high, tense_energy).
thayer_energy_stress(low, low, calm_tiredness).
thayer_energy_stress(low, high, tense_tiredness).

%% plutchik_wheel(+PrimaryEmotion, +Intensity, -Variant)
%% Plutchik's wheel of emotions with intensity levels. (C1583)
plutchik_wheel(joy, low, serenity).
plutchik_wheel(joy, medium, joy).
plutchik_wheel(joy, high, ecstasy).
plutchik_wheel(trust, low, acceptance).
plutchik_wheel(trust, medium, trust).
plutchik_wheel(trust, high, admiration).
plutchik_wheel(fear, low, apprehension).
plutchik_wheel(fear, medium, fear).
plutchik_wheel(fear, high, terror).
plutchik_wheel(surprise, low, distraction).
plutchik_wheel(surprise, medium, surprise).
plutchik_wheel(surprise, high, amazement).
plutchik_wheel(sadness, low, pensiveness).
plutchik_wheel(sadness, medium, sadness).
plutchik_wheel(sadness, high, grief).
plutchik_wheel(disgust, low, boredom).
plutchik_wheel(disgust, medium, disgust).
plutchik_wheel(disgust, high, loathing).
plutchik_wheel(anger, low, annoyance).
plutchik_wheel(anger, medium, anger).
plutchik_wheel(anger, high, rage).
plutchik_wheel(anticipation, low, interest).
plutchik_wheel(anticipation, medium, anticipation).
plutchik_wheel(anticipation, high, vigilance).

%% ekman_basic_emotion(+Emotion, -MusicalCorrelates)
%% Ekman's basic emotions mapped to musical features. (C1584)
ekman_basic_emotion(happiness, [major_mode, fast_tempo, bright_timbre, staccato]).
ekman_basic_emotion(sadness, [minor_mode, slow_tempo, dark_timbre, legato]).
ekman_basic_emotion(fear, [dissonance, irregular_rhythm, tremolo, crescendo]).
ekman_basic_emotion(anger, [loud, fast, low_register, harsh_timbre]).
ekman_basic_emotion(disgust, [dissonance, irregular, muted_timbre]).
ekman_basic_emotion(surprise, [sudden_change, sforzando, wide_intervals]).

%% laukka_juslin_cues(+Emotion, -AcousticCues, -Weights)
%% Juslin & Laukka's acoustic cue model for emotion perception. (C1585)
laukka_juslin_cues(happiness, [fast_tempo, high_sound_level, bright_timbre, fast_attack, wide_vibrato], [0.3, 0.2, 0.2, 0.15, 0.15]).
laukka_juslin_cues(sadness, [slow_tempo, low_sound_level, dark_timbre, slow_attack, narrow_vibrato], [0.3, 0.2, 0.2, 0.15, 0.15]).
laukka_juslin_cues(anger, [fast_tempo, high_sound_level, harsh_timbre, sharp_attack, irregular_rhythm], [0.25, 0.25, 0.2, 0.15, 0.15]).
laukka_juslin_cues(fear, [fast_tempo, low_sound_level, dark_timbre, irregular_rhythm, wide_vibrato], [0.2, 0.2, 0.2, 0.2, 0.2]).
laukka_juslin_cues(tenderness, [slow_tempo, low_sound_level, soft_timbre, slow_attack, legato], [0.25, 0.25, 0.2, 0.15, 0.15]).

%% tempo_to_arousal(+Tempo, -ArousalLevel)
%% Map BPM to arousal. (C1586)
tempo_to_arousal(Tempo, low) :- Tempo < 70, !.
tempo_to_arousal(Tempo, moderate) :- Tempo < 120, !.
tempo_to_arousal(Tempo, high) :- Tempo < 160, !.
tempo_to_arousal(_, very_high).

%% mode_to_valence(+Mode, -ValenceLevel)
%% Map musical mode to perceived valence. (C1587)
mode_to_valence(major, positive).
mode_to_valence(lydian, very_positive).
mode_to_valence(mixolydian, slightly_positive).
mode_to_valence(dorian, neutral).
mode_to_valence(minor, negative).
mode_to_valence(phrygian, very_negative).
mode_to_valence(locrian, very_negative).
mode_to_valence(whole_tone, ambiguous).
mode_to_valence(chromatic, tense).

%% dynamics_to_intensity(+DynamicLevel, -IntensityLevel)
%% Map dynamic markings to perceived intensity. (C1588)
dynamics_to_intensity(ppp, very_low).
dynamics_to_intensity(pp, low).
dynamics_to_intensity(p, moderate_low).
dynamics_to_intensity(mp, moderate).
dynamics_to_intensity(mf, moderate_high).
dynamics_to_intensity(f, high).
dynamics_to_intensity(ff, very_high).
dynamics_to_intensity(fff, extreme).

%% articulation_to_tension(+Articulation, -TensionLevel)
%% Map articulation to perceived tension. (C1589)
articulation_to_tension(legato, low).
articulation_to_tension(portato, moderate).
articulation_to_tension(staccato, moderate_high).
articulation_to_tension(marcato, high).
articulation_to_tension(sforzando, very_high).
articulation_to_tension(tremolo, high).
articulation_to_tension(col_legno, moderate_high).

%% register_to_weight(+Register, -PerceivedWeight)
%% Map musical register to perceived "weight". (C1590)
register_to_weight(sub_bass, very_heavy).
register_to_weight(bass, heavy).
register_to_weight(tenor, moderate).
register_to_weight(alto, moderate_light).
register_to_weight(soprano, light).
register_to_weight(super_soprano, very_light).

%% harmonic_tension_to_suspense(+TensionScore, -SuspenseLevel)
%% Map harmonic tension (0-10) to suspense. (C1591)
harmonic_tension_to_suspense(T, none) :- T =< 1, !.
harmonic_tension_to_suspense(T, slight) :- T =< 3, !.
harmonic_tension_to_suspense(T, moderate) :- T =< 5, !.
harmonic_tension_to_suspense(T, high) :- T =< 7, !.
harmonic_tension_to_suspense(T, extreme) :- T =< 10, !.
harmonic_tension_to_suspense(_, extreme).

%% timbre_brightness_to_mood(+Brightness, -MoodAssociation)
%% Map timbral brightness to mood. (C1592)
timbre_brightness_to_mood(very_dark, somber).
timbre_brightness_to_mood(dark, introspective).
timbre_brightness_to_mood(neutral, balanced).
timbre_brightness_to_mood(bright, cheerful).
timbre_brightness_to_mood(very_bright, ecstatic).

%% composite_emotion_model(+MusicalFeatures, +Model, -EmotionVector)
%% Combine multiple musical features into an emotion vector. (C1594)
composite_emotion_model(Features, russell, EmotionVector) :-
  extract_valence(Features, Valence),
  extract_arousal(Features, Arousal),
  russell_circumplex(Valence, Arousal, Label),
  EmotionVector = emotion(Label, valence(Valence), arousal(Arousal)).

extract_valence(Features, positive) :-
  member(mode(major), Features), !.
extract_valence(Features, negative) :-
  member(mode(minor), Features), !.
extract_valence(_, neutral).

extract_arousal(Features, high) :-
  member(tempo(T), Features), T > 120, !.
extract_arousal(Features, low) :-
  member(tempo(T), Features), T < 70, !.
extract_arousal(_, moderate).

%% emotion_to_music_params(+TargetEmotion, -Constraints, -MusicSpec)
%% Convert a target emotion into musical parameters. (C1595)
emotion_to_music_params(happy, Constraints, MusicSpec) :-
  Constraints = [mode(major), tempo_range(100, 140), dynamics(mf), articulation(staccato)],
  MusicSpec = spec(happy, major, 120, mf).
emotion_to_music_params(sad, Constraints, MusicSpec) :-
  Constraints = [mode(minor), tempo_range(50, 80), dynamics(p), articulation(legato)],
  MusicSpec = spec(sad, minor, 65, p).
emotion_to_music_params(tense, Constraints, MusicSpec) :-
  Constraints = [mode(chromatic), tempo_range(80, 130), dynamics(mf_to_ff), articulation(tremolo)],
  MusicSpec = spec(tense, chromatic, 100, mf).
emotion_to_music_params(peaceful, Constraints, MusicSpec) :-
  Constraints = [mode(major), tempo_range(60, 80), dynamics(pp), articulation(legato)],
  MusicSpec = spec(peaceful, major, 70, pp).
emotion_to_music_params(triumphant, Constraints, MusicSpec) :-
  Constraints = [mode(major), tempo_range(100, 130), dynamics(ff), articulation(marcato)],
  MusicSpec = spec(triumphant, major, 115, ff).
emotion_to_music_params(mysterious, Constraints, MusicSpec) :-
  Constraints = [mode(whole_tone), tempo_range(50, 70), dynamics(pp), articulation(legato)],
  MusicSpec = spec(mysterious, whole_tone, 60, pp).

%% emotional_arc(+SceneTimeline, -EmotionCurve, -MusicPlan)
%% Map a scene timeline to an emotional arc and music plan. (C1596)
emotional_arc(Timeline, Curve, Plan) :-
  maplist(scene_to_emotion, Timeline, Curve),
  maplist(emotion_to_section, Curve, Plan).

scene_to_emotion(scene(_, calm), calm).
scene_to_emotion(scene(_, tension), rising_tension).
scene_to_emotion(scene(_, climax), peak).
scene_to_emotion(scene(_, resolution), release).
scene_to_emotion(scene(_, _, Emotion), Emotion).

emotion_to_section(calm, section(pp, legato, sustained)).
emotion_to_section(rising_tension, section(crescendo, tremolo, ascending)).
emotion_to_section(peak, section(ff, marcato, full_orchestra)).
emotion_to_section(release, section(diminuendo, legato, descending)).
emotion_to_section(_, section(mp, normal, neutral)).

%% catharsis_model(+TensionBuild, +Release, -CatharsisPoint)
%% Model tension-release catharsis. (C1598)
catharsis_model(TensionBuild, Release, CatharsisPoint) :-
  length(TensionBuild, BuildLen),
  ( BuildLen > 8 -> CatharsisPoint = extended_catharsis
  ; BuildLen > 4 -> CatharsisPoint = standard_catharsis
  ; CatharsisPoint = quick_release
  ),
  Release = release_section.

%% meyer_expectation_emotion(+Expectation, +Outcome, -Emotion)
%% Leonard Meyer's expectation theory: emotion from violated/fulfilled expectations. (C1608)
meyer_expectation_emotion(strong_expectation, fulfillment, satisfaction).
meyer_expectation_emotion(strong_expectation, violation, surprise).
meyer_expectation_emotion(strong_expectation, delay, suspense).
meyer_expectation_emotion(weak_expectation, fulfillment, mild_pleasure).
meyer_expectation_emotion(weak_expectation, violation, curiosity).
meyer_expectation_emotion(no_expectation, _, indifference).

%% huron_sweet_anticipation(+Prediction, +Resolution, -Response)
%% David Huron's ITPRA theory of musical expectation. (C1609)
huron_sweet_anticipation(strong_prediction, predicted_resolution, comfort).
huron_sweet_anticipation(strong_prediction, surprise_resolution, frisson).
huron_sweet_anticipation(weak_prediction, predicted_resolution, mild_pleasure).
huron_sweet_anticipation(weak_prediction, surprise_resolution, wonder).
huron_sweet_anticipation(no_prediction, _, neutral_response).

%% chill_inducing_pattern(+Pattern, -ChillProbability)
%% Musical patterns that tend to induce chills/frisson. (C1613)
chill_inducing_pattern(unexpected_harmony, 0.7).
chill_inducing_pattern(crescendo_to_climax, 0.8).
chill_inducing_pattern(solo_voice_entry, 0.6).
chill_inducing_pattern(choir_entry, 0.75).
chill_inducing_pattern(melodic_appoggiatura, 0.65).
chill_inducing_pattern(enharmonic_change, 0.5).
chill_inducing_pattern(subito_piano, 0.55).
chill_inducing_pattern(new_instrument_entry, 0.5).
chill_inducing_pattern(sequence_break, 0.6).
chill_inducing_pattern(structural_downbeat, 0.5).

%% tear_inducing_pattern(+Pattern, -TearProbability)
%% Musical patterns associated with tears/sadness. (C1614)
tear_inducing_pattern(descending_melody, 0.5).
tear_inducing_pattern(minor_mode_shift, 0.6).
tear_inducing_pattern(solo_instrument_lament, 0.7).
tear_inducing_pattern(slow_harmonic_rhythm, 0.4).
tear_inducing_pattern(suspension_chain, 0.65).
tear_inducing_pattern(picardy_third, 0.55).
tear_inducing_pattern(deceptive_cadence, 0.45).

%% awe_inducing_pattern(+Pattern, -AweProbability)
%% Musical patterns associated with awe/wonder. (C1615)
awe_inducing_pattern(massive_orchestral_swell, 0.85).
awe_inducing_pattern(wide_register_expansion, 0.7).
awe_inducing_pattern(slow_brass_chorale, 0.75).
awe_inducing_pattern(pipe_organ_full, 0.8).
awe_inducing_pattern(choir_unison_to_harmony, 0.7).
awe_inducing_pattern(timpani_roll_crescendo, 0.65).

%% ============================================================================
%% GENRE-SPECIFIC FILM SCORING (C1621-C1660)
%% ============================================================================

%% horror_scoring_technique(+Technique, -Implementation, -Effect)
%% Horror scoring techniques. (C1621)
horror_scoring_technique(cluster, [col_legno, sul_pont, extreme_register], dread).
horror_scoring_technique(stinger, [sfz, brass_hit, cymbal_crash], startle).
horror_scoring_technique(drone, [low_sustained, beating_frequencies, slow_lfo], unease).
horror_scoring_technique(silence, [sudden_cutoff, ambient_only], anticipation).
horror_scoring_technique(glissando, [string_slides, brass_bends], disorientation).
horror_scoring_technique(prepared_piano, [muted_strings, objects_on_strings], uncanny).

%% horror_stinger(+StingerType, -Duration, -Instrumentation)
%% Types of horror stingers. (C1623)
horror_stinger(jump_scare, short, [brass, percussion, strings_sfz]).
horror_stinger(creeping, long, [high_strings, prepared_piano]).
horror_stinger(false_alarm, short, [single_instrument, quick_decay]).
horror_stinger(reveal, medium, [full_orchestra, sustained]).

%% action_scoring_technique(+Technique, -Implementation, -Effect)
%% Action scoring techniques. (C1626)
action_scoring_technique(ostinato, [repeated_pattern, driving_rhythm], momentum).
action_scoring_technique(brass_stab, [short_brass_hits, syncopated], punctuation).
action_scoring_technique(rhythmic_intensification, [accelerando, more_layers], escalation).
action_scoring_technique(percussion_build, [snare_roll, timpani, taiko], power).

%% chase_music_pattern(+IntensityLevel, -Tempo, -Pattern)
%% Patterns for chase sequences. (C1629)
chase_music_pattern(low, 120, [ostinato, light_percussion]).
chase_music_pattern(medium, 140, [ostinato, full_percussion, brass_accents]).
chase_music_pattern(high, 160, [double_time_ostinato, full_orchestra, syncopation]).
chase_music_pattern(extreme, 180, [relentless_drive, maximum_density, tutti]).

%% romance_scoring_technique(+Technique, -Implementation, -Effect)
%% Romance scoring techniques. (C1631)
romance_scoring_technique(soaring_melody, [wide_intervals, rubato, strings], yearning).
romance_scoring_technique(lush_harmony, [extended_chords, suspensions], warmth).
romance_scoring_technique(intimate_texture, [solo_instrument, sparse_accompaniment], vulnerability).
romance_scoring_technique(building_swell, [gradual_crescendo, adding_instruments], passion).

%% comedy_scoring_technique(+Technique, -Implementation, -Effect)
%% Comedy scoring techniques. (C1635)
comedy_scoring_technique(stinger_comedy, [pizzicato, woodwind_chirp, cymbal], punchline).
comedy_scoring_technique(musical_pun, [wrong_note, unexpected_instrument], wit).
comedy_scoring_technique(chase_comedy, [fast_tempo, silly_timbres, galop], slapstick).
comedy_scoring_technique(ironic_grandeur, [overblown_orchestra, trivial_action], irony).

%% scifi_scoring_technique(+Technique, -Implementation, -Effect)
%% Science fiction scoring techniques. (C1643)
scifi_scoring_technique(synth_pad, [evolving_texture, filter_sweep], atmosphere).
scifi_scoring_technique(granular, [particle_clouds, time_stretch], alien).
scifi_scoring_technique(hybrid, [orchestra_plus_synth, processed_acoustics], futuristic).
scifi_scoring_technique(spectral, [overtone_manipulation, inharmonic], otherworldly).

%% fantasy_scoring_technique(+Technique, -Implementation, -Effect)
%% Fantasy scoring techniques. (C1647)
fantasy_scoring_technique(epic_theme, [brass_melody, wide_orchestration, modal], grandeur).
fantasy_scoring_technique(magical_element, [celesta, harp_gliss, choir_ah], wonder).
fantasy_scoring_technique(battle_music, [percussion_heavy, brass_calls, driving], intensity).
fantasy_scoring_technique(pastoral, [woodwinds, folk_instruments, simple_harmony], innocence).

%% film_genre constraint (C1651)
film_genre(horror).
film_genre(action).
film_genre(romance).
film_genre(comedy).
film_genre(drama).
film_genre(scifi).
film_genre(fantasy).

%% scoring_era constraint (C1652)
scoring_era(golden_age).
scoring_era(new_hollywood).
scoring_era(modern).
scoring_era(contemporary).

%% ============================================================================
%% FAMOUS COMPOSER TECHNIQUES (C1661-C1700)
%% ============================================================================

%% williams_technique(+Technique, -Context, -Implementation)
%% John Williams scoring techniques. (C1661)
williams_technique(fanfare, heroic, [brass_unison, dotted_rhythm, ascending, ff]).
williams_technique(march, adventure, [snare_pattern, brass_melody, major_mode]).
williams_technique(lyrical_melody, romantic, [wide_intervals, strings, rubato]).
williams_technique(ostinato, tension, [repeated_pattern, building_orchestration]).
williams_technique(modal_mixture, wonder, [major_minor_shifts, chromatic_mediants]).

%% williams_fanfare(+Type, -Voicing, -Rhythm)
%% Williams fanfare patterns. (C1662)
williams_fanfare(heroic, [unison_brass, octave_doubles], dotted_quarter_eighth_half).
williams_fanfare(triumphant, [full_brass, choir], quarter_quarter_half_whole).
williams_fanfare(adventurous, [trumpet_horn, countermelody], syncopated_march).

%% zimmer_technique(+Technique, -Context, -Implementation)
%% Hans Zimmer scoring techniques. (C1665)
zimmer_technique(ostinato_layers, action, [synth_bass, string_ostinato, percussion_layers]).
zimmer_technique(bass_design, power, [sub_bass, distortion, side_chain]).
zimmer_technique(braaam, impact, [massive_brass, sub_drop, reverb_tail]).
zimmer_technique(ticking, suspense, [clock_pattern, increasing_tempo, minimal]).
zimmer_technique(hybrid_texture, modern, [processed_strings, synth_pads, organic_percussion]).

%% morricone_technique(+Technique, -Context, -Implementation)
%% Ennio Morricone scoring techniques. (C1672)
morricone_technique(sparse_texture, tension, [solo_instrument, silence, space]).
morricone_technique(vocal_use, emotional, [wordless_soprano, choir_humming, whistling]).
morricone_technique(electric_guitar, western, [twangy_guitar, reverb, tremolo]).
morricone_technique(harmonica, loneliness, [solo_harmonica, sustained_notes]).

%% elfman_technique(+Technique, -Context, -Implementation)
%% Danny Elfman scoring techniques. (C1678)
elfman_technique(quirky_orchestration, whimsical, [celesta, tubular_bells, xylophone]).
elfman_technique(gothic_choir, dark_fantasy, [latin_text, minor_mode, organ]).
elfman_technique(waltz, tim_burton, [3_4_time, quirky_melody, minor_mode]).

%% composer_style_match(+Cue, +Composer, -Similarity)
%% Score how similar a cue is to a composer's style. (C1687)
composer_style_match(Cue, williams, Score) :-
  count_style_features(Cue, [brass_fanfare, wide_melody, modal_mixture, march_rhythm], Score).
composer_style_match(Cue, zimmer, Score) :-
  count_style_features(Cue, [ostinato_layers, bass_design, hybrid_texture, minimal_melody], Score).
composer_style_match(Cue, morricone, Score) :-
  count_style_features(Cue, [sparse_texture, vocal_element, guitar, silence], Score).
composer_style_match(Cue, elfman, Score) :-
  count_style_features(Cue, [quirky_timbre, gothic, waltz, celesta], Score).

count_style_features(_, [], 0).
count_style_features(Cue, [Feature|Rest], Score) :-
  count_style_features(Cue, Rest, RestScore),
  ( member(Feature, Cue) -> Score is RestScore + 1
  ; Score = RestScore
  ).

%% style_blend(+Composer1, +Composer2, +Ratio, -BlendedStyle)
%% Blend two composer styles at a given ratio. (C1688)
style_blend(Composer1, Composer2, Ratio, BlendedStyle) :-
  composer_palette(Composer1, Palette1),
  composer_palette(Composer2, Palette2),
  BlendedStyle = blend(Composer1, Composer2, Ratio, combined(Palette1, Palette2)).

composer_palette(williams, [orchestral, thematic, brass_focused, romantic_harmony]).
composer_palette(zimmer, [hybrid, textural, bass_heavy, modern_harmony]).
composer_palette(morricone, [sparse, vocal, eclectic, modal]).
composer_palette(elfman, [quirky, gothic, percussive, minor_mode]).
composer_palette(goldsmith, [modernist, dissonant, orchestral, atonal_passages]).
composer_palette(horner, [ethnic_elements, danger_motif, lush_strings, celtic]).
composer_palette(desplat, [chamber, intimate, french_impressionist, delicate]).
composer_palette(howard, [orchestral_color, warm, gentle, nature_inspired]).
composer_palette(newman, [americana, nostalgic, piano_based, accessible]).

%% ============================================================================
%% FILM SCHOOL APPROACHES (C1574-C1578)
%% ============================================================================

%% berklee_film_scoring_rule(+Situation, -Rule, -Application)
%% Berklee approach to film scoring. (C1574)
berklee_film_scoring_rule(dialogue_scene, avoid_competing_register, keep_music_below_vocal_range).
berklee_film_scoring_rule(action_sequence, rhythmic_drive, ostinato_based_with_hits).
berklee_film_scoring_rule(transition, musical_bridge, modulate_to_new_scene_key).
berklee_film_scoring_rule(montage, thematic_development, vary_theme_for_each_segment).
berklee_film_scoring_rule(climax, full_orchestra, all_sections_fortissimo).

%% usc_scoring_approach(+Genre, -Approach, -Techniques)
%% USC Thornton approach. (C1575)
usc_scoring_approach(drama, psychological_underscore, [leitmotif, tension_release, subtext]).
usc_scoring_approach(comedy, light_touch, [pizzicato, woodwinds, ironic_contrast]).
usc_scoring_approach(horror, sound_design_hybrid, [extended_techniques, electronics, silence]).
usc_scoring_approach(documentary, authentic_palette, [source_music_integration, ethnographic]).

%% nyu_steinhardt_method(+Scene, -Analysis, -Recommendation)
%% NYU analytical approach to scene scoring. (C1576)
nyu_steinhardt_method(emotional_scene, subtext_analysis, score_the_subtext_not_surface).
nyu_steinhardt_method(plot_scene, narrative_function, support_story_momentum).
nyu_steinhardt_method(character_scene, psychological_portrait, leitmotif_variation).
nyu_steinhardt_method(atmospheric_scene, world_building, ambient_texture).

%% ucla_scoring_technique(+Context, -Technique, -Implementation)
%% UCLA scoring techniques. (C1577)
ucla_scoring_technique(main_title, overture_approach, present_all_themes).
ucla_scoring_technique(end_credits, suite_approach, reprise_and_develop).
ucla_scoring_technique(chase, accelerating_ostinato, increase_tempo_and_layers).
ucla_scoring_technique(reveal, harmonic_shift, sudden_modulation_or_silence).

%% film_school_convention(+School, -Convention, -Details)
%% General film school conventions. (C1578)
film_school_convention(berklee, click_track_sync, tight_synchronization_preferred).
film_school_convention(usc, free_timing, rubato_for_emotional_scenes).
film_school_convention(nyu, analytical_first, analyze_scene_before_composing).
film_school_convention(ucla, orchestral_tradition, full_orchestra_as_default).

%% ============================================================================
%% ADVANCED EMOTION-MUSIC PREDICATES (C1593-C1612)
%% ============================================================================

%% rhythm_regularity_to_stability(+Regularity, -StabilityLevel)
%% How rhythmic regularity maps to perceived stability. (C1593)
rhythm_regularity_to_stability(metronomic, very_stable).
rhythm_regularity_to_stability(regular, stable).
rhythm_regularity_to_stability(slightly_irregular, uneasy).
rhythm_regularity_to_stability(irregular, unstable).
rhythm_regularity_to_stability(chaotic, very_unstable).
rhythm_regularity_to_stability(rubato, expressive_flexible).

%% emotional_contrast(+Emotion1, +Emotion2, -TransitionType, -Music)
%% How to musically transition between contrasting emotions. (C1597)
emotional_contrast(joy, sadness, gradual, [mode_change, tempo_decrease, thin_texture]).
emotional_contrast(tension, relief, sudden, [dissonance_to_consonance, register_drop]).
emotional_contrast(calm, fear, creeping, [add_dissonance, lower_register, tremolo]).
emotional_contrast(anger, tenderness, dissolve, [brass_to_strings, loud_to_soft, staccato_to_legato]).
emotional_contrast(triumph, loss, collapse, [major_to_minor, full_to_solo, fanfare_to_elegy]).
emotional_contrast(humor, seriousness, cut, [woodwinds_to_strings, light_to_heavy]).

%% suspense_anticipation_model(+Event, +Delay, +Uncertainty, -Music)
%% Model for scoring suspense/anticipation. (C1599)
suspense_anticipation_model(known_threat, short, high, [tremolo_strings, rising_pitch, accelerating_pulse]).
suspense_anticipation_model(unknown_threat, long, very_high, [silence, isolated_sounds, no_pulse]).
suspense_anticipation_model(expected_event, medium, moderate, [ostinato_build, filter_sweep, crescendo]).
suspense_anticipation_model(false_alarm, any, decreasing, [sudden_silence, resolution_chord, comic_sting]).

%% koelsch_music_emotion(+Feature, -Process, -Emotion)
%% Koelsch's framework for music-emotion processing. (C1610)
koelsch_music_emotion(consonance, brainstem_reflex, pleasantness).
koelsch_music_emotion(dissonance, brainstem_reflex, unpleasantness).
koelsch_music_emotion(familiar_melody, episodic_memory, nostalgia).
koelsch_music_emotion(unexpected_harmony, expectancy_violation, surprise).
koelsch_music_emotion(groove_rhythm, motor_resonance, vitality).
koelsch_music_emotion(slow_minor, evaluative_conditioning, sadness).
koelsch_music_emotion(fast_major, evaluative_conditioning, happiness).

%% zentner_geneva_model(+MusicType, -Induced, -Perceived)
%% Geneva Emotional Music Scale model. (C1611)
zentner_geneva_model(gentle_classical, wonder, serenity).
zentner_geneva_model(powerful_orchestral, power, awe).
zentner_geneva_model(tender_vocal, tenderness, intimacy).
zentner_geneva_model(energetic_rhythmic, joyful_activation, excitement).
zentner_geneva_model(melancholic_minor, nostalgia, sadness).
zentner_geneva_model(sublime_harmony, transcendence, elevation).

%% sloboda_tears_chills(+MusicalDevice, -PhysicalResponse, -Mechanism)
%% Sloboda's research on physical responses to music. (C1612)
sloboda_tears_chills(appoggiatura, tears, melodic_tension_resolution).
sloboda_tears_chills(unexpected_harmony, chills, expectancy_violation).
sloboda_tears_chills(enharmonic_change, chills, tonal_surprise).
sloboda_tears_chills(crescendo_to_climax, chills, arousal_buildup).
sloboda_tears_chills(melodic_sequence, tears, predictable_emotion_build).
sloboda_tears_chills(solo_entry_after_silence, chills, contrast_and_surprise).

%% ============================================================================
%% DETAILED GENRE SCORING (C1622-C1650)
%% ============================================================================

%% horror_cluster(+ClusterType, -Instruments, -Voicing)
%% Cluster chord types for horror. (C1622)
horror_cluster(tone_cluster, strings, [semitone_stacking, tremolo, sul_ponticello]).
horror_cluster(quarter_tone_cluster, strings, [microtonal_spread, slow_glissando]).
horror_cluster(brass_cluster, brass, [muted, low_register, crescendo_to_fff]).
horror_cluster(prepared_piano, piano, [muted_strings, metallic_buzz, random_rhythm]).

%% horror_drone(+DroneType, -Harmonics, -Movement)
%% Drone types for horror scoring. (C1624)
horror_drone(sub_bass, [fundamental_only], static).
horror_drone(harmonic, [odd_harmonics_only], slowly_shifting).
horror_drone(dissonant, [minor_second_apart], pulsating).
horror_drone(evolving, [spectral_morphing], gradually_brightening).
horror_drone(electronic, [filtered_noise], texture_changing).

%% tension_without_release(+TensionLevel, -Duration, -Technique)
%% Sustained tension without resolution for horror/thriller. (C1625)
tension_without_release(low, extended, pedal_point_with_dissonant_upper_voices).
tension_without_release(moderate, medium, unresolved_dominant_chain).
tension_without_release(high, short, diminished_clusters_crescendo).
tension_without_release(extreme, very_short, silence_then_stinger).

%% action_ostinato(+OstinatoType, -Rhythm, -Instrumentation)
%% Ostinato patterns for action scoring. (C1627)
action_ostinato(driving, sixteenth_notes, low_strings_and_brass).
action_ostinato(syncopated, dotted_eighth_sixteenth, full_orchestra).
action_ostinato(pulsing, quarter_notes, timpani_and_low_brass).
action_ostinato(irregular, five_eight, strings_and_percussion).
action_ostinato(layered, multiple_rates, full_ensemble_staggered).

%% action_brass_stab(+StabType, -Voicing, -Rhythm)
%% Brass stab patterns for action. (C1628)
action_brass_stab(power_stab, [octaves_and_fifths], on_downbeat).
action_brass_stab(cluster_stab, [semitone_cluster], syncopated).
action_brass_stab(fanfare_stab, [major_triad_open], accent_pattern).
action_brass_stab(low_stab, [bass_trombone_tuba_unison], heavy_accents).

%% fight_music_sync(+FightPhase, -MusicPhase, -Sync)
%% Synchronizing music with fight choreography. (C1630)
fight_music_sync(approach, tension_build, loose_sync).
fight_music_sync(first_blow, impact_hit, tight_sync).
fight_music_sync(exchange, rhythmic_drive, moderate_sync).
fight_music_sync(turning_point, harmonic_shift, hit_point).
fight_music_sync(victory, triumph_theme, loose_sync).
fight_music_sync(defeat, collapse, hit_point).

%% love_theme_structure(+Structure, -Development, -Climax)
%% Love theme structural patterns. (C1632)
love_theme_structure(simple_statement, gradual_orchestral_build, full_strings_climax).
love_theme_structure(dialogue_theme, alternating_instruments, joined_duet).
love_theme_structure(unrequited, solo_instrument, unresolved_harmony).
love_theme_structure(epic_love, full_orchestra_from_start, massive_emotional_peak).

%% romantic_string_writing(+Texture, -Voicing, -Movement)
%% String writing for romantic scenes. (C1633)
romantic_string_writing(lush, divisi_full_section, legato_sweeping).
romantic_string_writing(intimate, solo_or_quartet, espressivo_rubato).
romantic_string_writing(passionate, tremolo_full_section, crescendo_decrescendo).
romantic_string_writing(bittersweet, muted_section, gentle_dissonance).

%% bittersweet_harmony(+BaseHarmony, -AddedTensions, -Effect)
%% Bittersweet harmonic devices. (C1634)
bittersweet_harmony(major, [added_minor_seventh], wistful).
bittersweet_harmony(minor, [added_major_sixth], tender_sadness).
bittersweet_harmony(major, [suspended_fourth_no_resolve], longing).
bittersweet_harmony(minor, [added_ninth], gentle_melancholy).

%% comedic_timing(+VisualBeat, -MusicBeat, -Offset)
%% Music timing for comedy. (C1636)
comedic_timing(pratfall, accent_hit, exactly_on_impact).
comedic_timing(double_take, sting_after_pause, slight_delay).
comedic_timing(slow_realization, ascending_chromatic, gradual).
comedic_timing(punchline, rimshot_equivalent, immediate).
comedic_timing(awkward_silence, no_music, let_scene_breathe).

%% cartoon_music_device(+Device, -Trigger, -Sound)
%% Classic cartoon music devices. (C1637)
cartoon_music_device(slide_whistle, falling_or_rising, pitch_glissando).
cartoon_music_device(pizzicato_walk, tiptoeing, plucked_strings).
cartoon_music_device(xylophone_run, running, rapid_ascending_scale).
cartoon_music_device(trombone_wah, disappointment, descending_glissando).
cartoon_music_device(cymbal_crash, collision, percussion_hit).
cartoon_music_device(harp_gliss, dream_sequence, ascending_glissando).

%% ironic_underscore(+SceneTone, -MusicTone, -IronicEffect)
%% Ironic music-scene contrast. (C1638)
ironic_underscore(violent, cheerful_music, disturbing_contrast).
ironic_underscore(sad, upbeat_music, emotional_denial).
ironic_underscore(romantic, discordant_music, doomed_relationship).
ironic_underscore(triumphant, minor_key_music, pyrrhic_victory).

%% drama_scoring_technique(+Technique, -Implementation, -Effect)
%% General drama scoring techniques. (C1639)
drama_scoring_technique(restraint, minimal_orchestration, emotional_space).
drama_scoring_technique(subtext_scoring, contradicting_surface, hidden_meaning).
drama_scoring_technique(source_to_score, diegetic_becomes_nondiegetic, blurred_reality).
drama_scoring_technique(silence_as_score, strategic_absence, maximum_impact).

%% dramatic_pause(+Context, -Duration, -ReentryType)
%% Using silence/pauses dramatically. (C1640)
dramatic_pause(before_revelation, 2_4_seconds, sudden_full_orchestra).
dramatic_pause(after_shock, 1_2_seconds, quiet_sustained_note).
dramatic_pause(emotional_weight, 3_5_seconds, solo_instrument_entry).
dramatic_pause(comedic, half_second, sting_or_button).

%% emotional_swell(+BuildType, -PeakPoint, -Resolution)
%% Emotional swell patterns. (C1641)
emotional_swell(gradual_crescendo, phrase_climax, gentle_decrescendo).
emotional_swell(layered_entry, full_orchestra_moment, sudden_drop).
emotional_swell(harmonic_tension, dissonance_peak, resolution_to_consonance).
emotional_swell(rhythmic_drive, rhythmic_climax, ritardando).

%% subtle_underscore(+SceneContent, -MusicIntensity, -Technique)
%% Subtle underscoring for intimate scenes. (C1642)
subtle_underscore(dialogue, very_quiet, single_sustained_note).
subtle_underscore(emotional_moment, quiet, solo_piano_or_guitar).
subtle_underscore(contemplation, barely_audible, ambient_texture).
subtle_underscore(tension, subliminal, low_frequency_pulse).

%% electronic_orchestral_hybrid(+Balance, -Textures, -Integration)
%% Sci-fi hybrid scoring. (C1644)
electronic_orchestral_hybrid(electronic_heavy, [synth_pads, processed_percussion, orchestral_accents], electronic_foundation).
electronic_orchestral_hybrid(balanced, [orchestra_core, synth_layers, processed_doubles], interwoven).
electronic_orchestral_hybrid(orchestral_heavy, [full_orchestra, subtle_electronics, processed_reverb], orchestral_foundation).

%% alien_sound_design(+Concept, -Synthesis, -Musical)
%% Alien/otherworldly sound design for sci-fi. (C1645)
alien_sound_design(alien_language, granular_vocal_processing, melodic_speech_contour).
alien_sound_design(alien_technology, fm_synthesis_complex, inharmonic_tonal).
alien_sound_design(alien_landscape, spectral_processing, evolving_texture).
alien_sound_design(alien_emotion, pitch_shifted_orchestral, uncanny_valley).

%% space_ambience(+Type, -Elements, -Emotional)
%% Space ambience scoring. (C1646)
space_ambience(vast_emptiness, [sustained_pad, silence, isolated_tones], awe_and_loneliness).
space_ambience(cosmic_wonder, [shimmering_strings, celesta, harp_harmonics], transcendence).
space_ambience(danger, [low_pulse, dissonant_cluster, silence], dread).
space_ambience(discovery, [ascending_motif, brightening_harmony, crescendo], excitement).

%% epic_theme_structure(+ThemeType, -Orchestration, -Development)
%% Fantasy epic theme patterns. (C1648)
epic_theme_structure(hero_theme, [brass_melody, full_strings, percussion], statement_then_variation).
epic_theme_structure(evil_theme, [low_brass, choir, dissonant_strings], inversion_and_fragmentation).
epic_theme_structure(adventure_theme, [horn_call, woodwind_answer, full_orchestra], modulating_sequences).
epic_theme_structure(fellowship_theme, [warm_strings, horn, gentle_woodwinds], simple_to_grand).

%% magical_element(+MagicType, -Sound, -Instrumentation)
%% Musical representation of magic. (C1649)
magical_element(sparkle, celesta_and_harp_harmonics, high_register_shimmer).
magical_element(power, brass_chord_with_choir, crescendo_with_light_motif).
magical_element(dark_magic, low_strings_col_legno, dissonant_choir).
magical_element(transformation, chromatic_run_full_orchestra, tonal_shift).
magical_element(healing, warm_strings_ascending, major_resolution).

%% world_building_music(+Culture, -MusicalElements, -Authenticity)
%% Music for fictional world-building. (C1650)
world_building_music(medieval_fantasy, [modal_harmony, recorder, lute, drone], historically_inspired).
world_building_music(futuristic, [synthesizers, processed_orchestra, unusual_meters], speculative).
world_building_music(ancient_civilization, [pentatonic, percussion, chant, open_fifths], archetypal).
world_building_music(steampunk, [mechanical_sounds, victorian_parlor, brass_band], anachronistic).

%% ============================================================================
%% ADDITIONAL COMPOSER TECHNIQUE PREDICATES (C1663-C1686)
%% ============================================================================

%% williams_action_ostinato(+Pattern, -Development, -Orchestration)
%% Williams' action ostinato patterns. (C1663)
williams_action_ostinato(rising_fifth, sequence_up_by_step, low_strings_then_brass).
williams_action_ostinato(syncopated_march, add_countermelody, full_orchestra).
williams_action_ostinato(chromatic_drive, accelerando, strings_to_tutti).

%% williams_romantic_melody(+Contour, -Harmony, -Orchestration)
%% Williams' romantic melody characteristics. (C1664)
williams_romantic_melody(wide_leaping, chromatic_mediant, solo_violin_then_strings).
williams_romantic_melody(stepwise_ascending, secondary_dominants, oboe_then_full_strings).
williams_romantic_melody(arch_shape, circle_of_fifths, french_horn_melody).

%% zimmer_ostinato_layer(+Layer, -Rhythm, -Texture)
%% Zimmer's layered ostinato approach. (C1666)
zimmer_ostinato_layer(foundation, quarter_note_pulse, cello_bass).
zimmer_ostinato_layer(rhythmic, eighth_note_pattern, percussion_strings).
zimmer_ostinato_layer(melodic, long_note_theme, brass_above_texture).
zimmer_ostinato_layer(textural, tremolo_or_trill, high_strings_shimmer).

%% zimmer_bass_design(+Type, -Synthesis, -Processing)
%% Zimmer's bass sound design. (C1667)
zimmer_bass_design(inception_braaam, low_brass_sampled, extreme_compression_reverb).
zimmer_bass_design(sub_pulse, synthesizer_sine, sidechain_compression).
zimmer_bass_design(cello_bass, sampled_cello, distortion_octaver).

%% zimmer_hybrid_orchestration(+Acoustic, -Electronic, -Balance)
%% Zimmer's acoustic-electronic balance. (C1668)
zimmer_hybrid_orchestration(strings_section, synth_pad_double, electronic_enhances_acoustic).
zimmer_hybrid_orchestration(brass_hits, processed_impacts, electronic_adds_weight).
zimmer_hybrid_orchestration(percussion, electronic_beats, interlocked_rhythms).

%% horner_technique(+Technique, -Context, -Implementation)
%% James Horner's scoring techniques. (C1669)
horner_technique(danger_motif, approaching_threat, four_note_descending_pattern).
horner_technique(ethnic_texture, cultural_setting, authentic_instrument_integration).
horner_technique(noble_theme, heroic_moment, french_horn_melody_with_strings).
horner_technique(emotional_piano, intimate_scene, solo_piano_with_strings_entering).

%% horner_danger_motif(+Intervals, -Rhythm, -Instrumentation)
%% Horner's signature danger motif. (C1670)
horner_danger_motif([minor_second, minor_third, minor_second], short_short_long, brass_and_strings).
horner_danger_motif([tritone, minor_second], syncopated, low_brass).

%% horner_ethnic_integration(+Culture, -Elements, -OrchestralBlend)
%% Horner's ethnic music integration. (C1671)
horner_ethnic_integration(celtic, [uilleann_pipes, fiddle, bodhran], strings_and_woodwinds_blend).
horner_ethnic_integration(japanese, [shakuhachi, taiko], strings_and_percussion_blend).
horner_ethnic_integration(scottish, [bagpipe_melody, snare_drum], brass_and_strings_support).

%% morricone_sparse_texture(+Elements, -Space, -Tension)
%% Morricone's sparse scoring approach. (C1673)
morricone_sparse_texture([single_instrument], maximum_space, contemplative).
morricone_sparse_texture([two_contrasting_timbres], large_gaps, dramatic_tension).
morricone_sparse_texture([rhythm_only], open, anticipation).

%% morricone_vocal_use(+VocalType, -Role, -Treatment)
%% Morricone's use of voice. (C1674)
morricone_vocal_use(wordless_soprano, ethereal_texture, reverb_and_delay).
morricone_vocal_use(whistle, melodic_lead, dry_and_intimate).
morricone_vocal_use(choir, dramatic_weight, massive_reverb).
morricone_vocal_use(solo_male, narrative, close_and_warm).

%% morricone_electric_guitar(+Style, -Processing, -Context)
%% Morricone's electric guitar use. (C1675)
morricone_electric_guitar(twangy, spring_reverb, western_theme).
morricone_electric_guitar(distorted, fuzz, tension_scenes).
morricone_electric_guitar(clean_arpeggiated, chorus, romantic_scenes).

%% goldsmith_technique(+Technique, -Context, -Implementation)
%% Jerry Goldsmith's scoring techniques. (C1676)
goldsmith_technique(modernist_dissonance, tension_scene, twelve_tone_influenced_clusters).
goldsmith_technique(ethnic_authenticity, cultural_film, research_based_instrumentation).
goldsmith_technique(electronic_pioneer, sci_fi, early_synth_integration_with_orchestra).
goldsmith_technique(rhythmic_complexity, action, polyrhythmic_orchestral_writing).

%% goldsmith_modernism(+Technique, -Integration, -Effect)
%% Goldsmith's modernist integration. (C1677)
goldsmith_modernism(serial_technique, partial_rows_in_melody, intellectual_tension).
goldsmith_modernism(aleatoric, controlled_randomness_in_strings, unsettling).
goldsmith_modernism(prepared_piano, percussive_texture, unusual_timbre).

%% elfman_quirky_orchestration(+Element, -Treatment, -Effect)
%% Elfman's distinctive orchestration. (C1679)
elfman_quirky_orchestration(celesta, doubled_with_pizzicato, whimsical).
elfman_quirky_orchestration(wordless_choir, staccato_patterns, gothic_energy).
elfman_quirky_orchestration(tubular_bells, isolated_hits, ominous_whimsy).
elfman_quirky_orchestration(xylophone, rapid_runs, manic_energy).

%% elfman_choir_use(+ChoirType, -Role, -Gothic)
%% Elfman's choir writing. (C1680)
elfman_choir_use(boys_choir, ethereal_purity, gothic_innocence).
elfman_choir_use(full_choir, rhythmic_chanting, dark_power).
elfman_choir_use(wordless_soprano, floating_melody, otherworldly).

%% howard_technique(+Technique, -Context, -Implementation)
%% James Newton Howard's techniques. (C1681)
howard_technique(orchestral_color, any_genre, rich_harmonic_palette).
howard_technique(piano_integration, dramatic_scene, piano_as_emotional_anchor).
howard_technique(genre_fluidity, varied_filmography, adapts_style_to_film).

%% howard_orchestral_color(+Palette, -Texture, -Emotion)
%% Howard's orchestral color palette. (C1682)
howard_orchestral_color(warm_strings, legato_full_section, comfort_and_hope).
howard_orchestral_color(bright_woodwinds, staccato_mixed, playful_wonder).
howard_orchestral_color(dark_brass, muted_low, foreboding).
howard_orchestral_color(gentle_piano, sparse_chords, vulnerability).

%% desplat_technique(+Technique, -Context, -Implementation)
%% Alexandre Desplat's techniques. (C1683)
desplat_technique(chamber_scoring, intimate_drama, small_ensemble_focus).
desplat_technique(rhythmic_precision, thriller, metronomic_ostinato).
desplat_technique(french_color, any, impressionist_harmony_woodwinds).

%% desplat_chamber_intimacy(+Ensemble, -Texture, -Emotion)
%% Desplat's chamber music approach. (C1684)
desplat_chamber_intimacy(string_quartet, conversational, intimate_drama).
desplat_chamber_intimacy(piano_and_strings, accompanied_solo, personal_reflection).
desplat_chamber_intimacy(woodwind_trio, light_interplay, gentle_whimsy).

%% newman_technique(+Technique, -Context, -Implementation)
%% Thomas Newman's techniques. (C1685)
newman_technique(ambient_americana, suburban_drama, piano_pads_space).
newman_technique(percussion_loop, rhythmic_underscore, sampled_and_organic).
newman_technique(dead_piano, intimate_scene, damped_preparation_sound).

%% newman_americana(+Element, -Treatment, -Nostalgia)
%% Newman's Americana scoring. (C1686)
newman_americana(piano_melody, sparse_reverberant, wistful).
newman_americana(marimba_pattern, looped_ostinato, gentle).
newman_americana(acoustic_guitar, fingerpicked, heartfelt).
newman_americana(distant_pad, synthesized_warm, dreamy).

%% ============================================================================
%% SOURCE SCORING & SYNC (C1555-C1565)
%% ============================================================================

%% source_scoring(+SourceSound, -Treatment, -Result)
%% Source (diegetic) scoring techniques. (C1555)
source_scoring(radio_in_scene, filter_to_lo_fi, realistic_source).
source_scoring(band_on_stage, full_fidelity, live_performance_feel).
source_scoring(distant_music, reverb_and_low_pass, spatial_distance).
source_scoring(headphones, stereo_intimate, subjective_audio).
source_scoring(source_to_score, gradual_filter_removal, reality_to_emotion).

%% temp_track_analysis(+TempTrack, -Features, -Extracted)
%% Analyzing temp tracks to understand director intent. (C1561)
temp_track_analysis(orchestral_temp, [tempo, key, instrumentation, dynamics], orchestral_brief).
temp_track_analysis(electronic_temp, [bpm, texture, energy, sound_design], electronic_brief).
temp_track_analysis(song_temp, [mood, energy, lyrics_relevance, genre], song_replacement_brief).

%% streamer_and_punch(+StartTC, +EndTC, -Duration, -Tempo)
%% Streamer and punch synchronization calculation. (C1563)
streamer_and_punch(tc(0,0,0,0), tc(0,0,2,0), 2_seconds, calculated_from_bar_length).
streamer_and_punch(tc(0,0,0,0), tc(0,0,5,0), 5_seconds, calculated_from_bar_length).

%% free_timing_cue(+Conductor, -Streamers, -FlexPoints)
%% Free timing cue with conductor streamers. (C1565)
free_timing_cue(conductor_led, [streamer_at_hit_points], [rubato_between_hits, fermata_at_key_moments]).
free_timing_cue(click_with_flex, [streamers_at_major_syncs], [tempo_changes_at_sections]).
