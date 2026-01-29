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
