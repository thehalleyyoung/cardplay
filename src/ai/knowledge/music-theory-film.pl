%% music-theory-film.pl - Film Music Theory Knowledge for CardPlay AI
%%
%% Encodes a pragmatic subset of film scoring theory as reusable predicates:
%% - mood taxonomy
%% - harmonic/texture/orchestration "devices"
%% - mood → mode/device/role preferences
%%
%% This is intentionally a KB foundation, not a ruleset that tries to "compose a film score".
%% It is meant to drive:
%% - recommendation and explanation surfaces (FilmScoringCard)
%% - defaults for arranger-style orchestration roles

%% ============================================================================
%% MOODS AND DEVICES
%% ============================================================================

film_mood(heroic).
film_mood(ominous).
film_mood(tender).
film_mood(wonder).
film_mood(mystery).
film_mood(sorrow).
film_mood(comedy).
film_mood(action).

film_device(pedal_point).
film_device(drone).
film_device(ostinato).
film_device(planing).
film_device(chromatic_mediant).
film_device(modal_mixture).
film_device(lydian_tonic).
film_device(dorian_minor).
film_device(phrygian_color).
film_device(whole_tone_wash).
film_device(octatonic_action).
film_device(cluster_tension).
film_device(quartal_openness).
film_device(suspension_chain).
film_device(cadence_deferral).
film_device(trailer_rise).

%% Roles are intentionally coarse (mapped later to instrument families in composition KB)
film_role(melody).
film_role(countermelody).
film_role(pad).
film_role(bass_drone).
film_role(percussion_drive).
film_role(ostinato_cell).
film_role(hits_impacts).

%% ============================================================================
%% MOOD → MODE PREFERENCES (USING EXISTING SCALE/MODE IDS WHERE POSSIBLE)
%% ============================================================================

%% mood_prefers_mode(+Mood, +Mode, +Weight0to1)
mood_prefers_mode(heroic, mixolydian, 0.8).
mood_prefers_mode(heroic, lydian, 0.7).
mood_prefers_mode(heroic, major, 0.6).

mood_prefers_mode(ominous, phrygian, 0.8).
mood_prefers_mode(ominous, harmonic_minor, 0.6).
mood_prefers_mode(ominous, locrian, 0.5).

mood_prefers_mode(tender, major, 0.6).
mood_prefers_mode(tender, natural_minor, 0.6).
mood_prefers_mode(tender, dorian, 0.5).

mood_prefers_mode(wonder, lydian, 0.9).
mood_prefers_mode(wonder, major, 0.5).

mood_prefers_mode(mystery, whole_tone, 0.6).
mood_prefers_mode(mystery, chromatic, 0.4).
mood_prefers_mode(mystery, dorian, 0.4).

mood_prefers_mode(sorrow, natural_minor, 0.8).
mood_prefers_mode(sorrow, harmonic_minor, 0.6).

mood_prefers_mode(action, octatonic, 0.8).
mood_prefers_mode(action, phrygian, 0.5).

%% ============================================================================
%% MOOD → DEVICE PREFERENCES
%% ============================================================================

%% mood_prefers_device(+Mood, +Device, +Weight0to1)
mood_prefers_device(heroic, pedal_point, 0.7).
mood_prefers_device(heroic, chromatic_mediant, 0.6).
mood_prefers_device(heroic, suspension_chain, 0.5).

mood_prefers_device(ominous, drone, 0.6).
mood_prefers_device(ominous, cluster_tension, 0.7).
mood_prefers_device(ominous, phrygian_color, 0.6).

mood_prefers_device(tender, modal_mixture, 0.5).
mood_prefers_device(tender, suspension_chain, 0.6).

mood_prefers_device(wonder, lydian_tonic, 0.8).
mood_prefers_device(wonder, planing, 0.5).

mood_prefers_device(mystery, whole_tone_wash, 0.6).
mood_prefers_device(mystery, planing, 0.5).
mood_prefers_device(mystery, cadence_deferral, 0.7).

mood_prefers_device(action, ostinato, 0.9).
mood_prefers_device(action, octatonic_action, 0.7).
mood_prefers_device(action, trailer_rise, 0.6).

%% ============================================================================
%% MOOD → ROLE PREFERENCES
%% ============================================================================

%% mood_prefers_role(+Mood, +Role, +Weight0to1)
mood_prefers_role(heroic, melody, 0.8).
mood_prefers_role(heroic, pad, 0.5).
mood_prefers_role(heroic, hits_impacts, 0.4).

mood_prefers_role(ominous, bass_drone, 0.8).
mood_prefers_role(ominous, pad, 0.6).

mood_prefers_role(tender, melody, 0.6).
mood_prefers_role(tender, pad, 0.6).

mood_prefers_role(wonder, pad, 0.7).
mood_prefers_role(wonder, countermelody, 0.4).

mood_prefers_role(action, ostinato_cell, 0.8).
mood_prefers_role(action, percussion_drive, 0.9).
mood_prefers_role(action, hits_impacts, 0.7).

%% ============================================================================
%% HIGH-LEVEL RECOMMENDERS (SMALL, EXPLAINABLE)
%% ============================================================================

%% recommend_film_mode(+Mood, -Mode, -Reasons)
recommend_film_mode(Mood, Mode, [because(mood(Mood)), because(mode(Mode))]) :-
  mood_prefers_mode(Mood, Mode, W),
  W >= 0.7.

%% recommend_film_device(+Mood, -Device, -Reasons)
recommend_film_device(Mood, Device, [because(mood(Mood)), because(device(Device))]) :-
  mood_prefers_device(Mood, Device, W),
  W >= 0.6.

%% recommend_film_roles(+Mood, -Roles, -Reasons)
recommend_film_roles(Mood, Roles, [because(mood(Mood))]) :-
  findall(Role, (
    mood_prefers_role(Mood, Role, W),
    W >= 0.6
  ), Roles).

%% ============================================================================
%% EXTENDED FILM SCORING SUPPORT (C361-C470)
%% ============================================================================

%% Additional moods
film_mood(epic).
film_mood(suspense).
film_mood(romantic).
film_mood(nostalgic).
film_mood(triumphant).
film_mood(desperate).
film_mood(ethereal).
film_mood(playful).
film_mood(intense).
film_mood(melancholic).

%% Additional devices
film_device(tremolo_strings).
film_device(col_legno).
film_device(sul_ponticello).
film_device(harmonics).
film_device(brass_fanfare).
film_device(horn_fifths).
film_device(harp_glissando).
film_device(timpani_roll).
film_device(french_sixth).
film_device(neapolitan).
film_device(tritone_sub).
film_device(deceptive_cadence).

%% mood_intensity(+Mood, +Intensity1to10)
mood_intensity(heroic, 7).
mood_intensity(ominous, 6).
mood_intensity(tender, 3).
mood_intensity(wonder, 5).
mood_intensity(mystery, 4).
mood_intensity(sorrow, 5).
mood_intensity(comedy, 4).
mood_intensity(action, 9).
mood_intensity(epic, 10).
mood_intensity(suspense, 8).
mood_intensity(romantic, 4).
mood_intensity(nostalgic, 3).
mood_intensity(triumphant, 9).
mood_intensity(desperate, 8).
mood_intensity(ethereal, 2).
mood_intensity(playful, 5).
mood_intensity(intense, 9).
mood_intensity(melancholic, 4).

%% mood_valence(+Mood, +Valence: positive/negative/neutral)
mood_valence(heroic, positive).
mood_valence(ominous, negative).
mood_valence(tender, positive).
mood_valence(wonder, positive).
mood_valence(mystery, neutral).
mood_valence(sorrow, negative).
mood_valence(comedy, positive).
mood_valence(action, neutral).
mood_valence(epic, positive).
mood_valence(suspense, negative).
mood_valence(romantic, positive).
mood_valence(nostalgic, neutral).
mood_valence(triumphant, positive).
mood_valence(desperate, negative).
mood_valence(ethereal, neutral).
mood_valence(playful, positive).
mood_valence(intense, neutral).
mood_valence(melancholic, negative).

%% Extended mode preferences for new moods
mood_prefers_mode(epic, mixolydian, 0.9).
mood_prefers_mode(epic, lydian, 0.8).
mood_prefers_mode(epic, aeolian, 0.6).

mood_prefers_mode(suspense, phrygian, 0.7).
mood_prefers_mode(suspense, locrian, 0.6).
mood_prefers_mode(suspense, chromatic, 0.8).

mood_prefers_mode(romantic, major, 0.7).
mood_prefers_mode(romantic, lydian, 0.6).

mood_prefers_mode(nostalgic, dorian, 0.7).
mood_prefers_mode(nostalgic, mixolydian, 0.6).

mood_prefers_mode(triumphant, lydian, 0.8).
mood_prefers_mode(triumphant, major, 0.9).

mood_prefers_mode(desperate, harmonic_minor, 0.8).
mood_prefers_mode(desperate, phrygian, 0.7).

mood_prefers_mode(ethereal, lydian, 0.9).
mood_prefers_mode(ethereal, whole_tone, 0.7).

mood_prefers_mode(playful, major, 0.8).
mood_prefers_mode(playful, mixolydian, 0.6).

mood_prefers_mode(intense, phrygian, 0.8).
mood_prefers_mode(intense, octatonic, 0.7).

mood_prefers_mode(melancholic, natural_minor, 0.9).
mood_prefers_mode(melancholic, dorian, 0.6).

%% Extended device preferences for new moods
mood_prefers_device(epic, brass_fanfare, 0.9).
mood_prefers_device(epic, pedal_point, 0.8).
mood_prefers_device(epic, chromatic_mediant, 0.7).
mood_prefers_device(epic, timpani_roll, 0.7).

mood_prefers_device(suspense, tremolo_strings, 0.8).
mood_prefers_device(suspense, cluster_tension, 0.8).
mood_prefers_device(suspense, col_legno, 0.5).

mood_prefers_device(romantic, suspension_chain, 0.8).
mood_prefers_device(romantic, modal_mixture, 0.6).
mood_prefers_device(romantic, deceptive_cadence, 0.5).

mood_prefers_device(nostalgic, modal_mixture, 0.7).
mood_prefers_device(nostalgic, suspension_chain, 0.6).

mood_prefers_device(triumphant, brass_fanfare, 0.9).
mood_prefers_device(triumphant, pedal_point, 0.7).
mood_prefers_device(triumphant, chromatic_mediant, 0.6).

mood_prefers_device(desperate, ostinato, 0.8).
mood_prefers_device(desperate, cluster_tension, 0.7).
mood_prefers_device(desperate, tremolo_strings, 0.7).

mood_prefers_device(ethereal, harmonics, 0.9).
mood_prefers_device(ethereal, harp_glissando, 0.7).
mood_prefers_device(ethereal, planing, 0.6).

mood_prefers_device(playful, planing, 0.5).
mood_prefers_device(playful, staccato, 0.7).

mood_prefers_device(intense, ostinato, 0.9).
mood_prefers_device(intense, trailer_rise, 0.8).
mood_prefers_device(intense, tremolo_strings, 0.7).

mood_prefers_device(melancholic, suspension_chain, 0.8).
mood_prefers_device(melancholic, modal_mixture, 0.7).

%% ============================================================================
%% TEMPO PREFERENCES (C391-C394)
%% ============================================================================

%% mood_tempo_range(+Mood, +MinBPM, +MaxBPM)
mood_tempo_range(heroic, 100, 140).
mood_tempo_range(ominous, 50, 80).
mood_tempo_range(tender, 60, 90).
mood_tempo_range(wonder, 70, 100).
mood_tempo_range(mystery, 60, 90).
mood_tempo_range(sorrow, 50, 80).
mood_tempo_range(comedy, 100, 140).
mood_tempo_range(action, 130, 180).
mood_tempo_range(epic, 80, 130).
mood_tempo_range(suspense, 80, 120).
mood_tempo_range(romantic, 60, 100).
mood_tempo_range(nostalgic, 70, 100).
mood_tempo_range(triumphant, 100, 140).
mood_tempo_range(desperate, 120, 160).
mood_tempo_range(ethereal, 50, 80).
mood_tempo_range(playful, 110, 150).
mood_tempo_range(intense, 130, 180).
mood_tempo_range(melancholic, 60, 90).

%% ============================================================================
%% LEITMOTIF SUPPORT (C402-C410)
%% ============================================================================

%% leitmotif_character_mood(+CharacterType, +AssociatedMoods)
leitmotif_character_mood(hero, [heroic, triumphant, romantic]).
leitmotif_character_mood(villain, [ominous, intense, desperate]).
leitmotif_character_mood(mentor, [wonder, nostalgic, tender]).
leitmotif_character_mood(love_interest, [romantic, tender, nostalgic]).
leitmotif_character_mood(trickster, [playful, mystery, comedy]).
leitmotif_character_mood(nature, [wonder, ethereal, tender]).
leitmotif_character_mood(power, [epic, triumphant, intense]).
leitmotif_character_mood(loss, [sorrow, melancholic, nostalgic]).

%% leitmotif_transformation(+Transformation, +Description)
leitmotif_transformation(inversion, 'Melodic intervals inverted').
leitmotif_transformation(retrograde, 'Melody played backwards').
leitmotif_transformation(augmentation, 'Rhythm values doubled').
leitmotif_transformation(diminution, 'Rhythm values halved').
leitmotif_transformation(mode_change, 'Major to minor or vice versa').
leitmotif_transformation(orchestration, 'Different instrument family').
leitmotif_transformation(fragmentation, 'Only partial motif used').
leitmotif_transformation(extension, 'Motif extended with new material').

%% recommend_leitmotif_transform(+FromMood, +ToMood, -Transforms, -Reasons)
recommend_leitmotif_transform(Mood1, Mood2, [mode_change], 
    [because(valence_change(V1, V2))]) :-
  mood_valence(Mood1, V1),
  mood_valence(Mood2, V2),
  V1 \= V2.

recommend_leitmotif_transform(Mood1, Mood2, [augmentation], 
    [because(intensity_decrease)]) :-
  mood_intensity(Mood1, I1),
  mood_intensity(Mood2, I2),
  I2 < I1 - 3.

recommend_leitmotif_transform(Mood1, Mood2, [diminution, orchestration], 
    [because(intensity_increase)]) :-
  mood_intensity(Mood1, I1),
  mood_intensity(Mood2, I2),
  I2 > I1 + 3.

%% ============================================================================
%% SCENE TRANSITION SUPPORT (C420-C430)
%% ============================================================================

%% scene_transition_style(+FromMood, +ToMood, -TransitionStyle)
scene_transition_style(Mood, Mood, sustain) :- !.
scene_transition_style(M1, M2, crossfade) :-
  mood_valence(M1, V),
  mood_valence(M2, V),
  !.
scene_transition_style(M1, M2, modulation) :-
  mood_valence(M1, positive),
  mood_valence(M2, negative),
  !.
scene_transition_style(M1, M2, modulation) :-
  mood_valence(M1, negative),
  mood_valence(M2, positive),
  !.
scene_transition_style(_, _, crossfade).

%% recommend_transition_device(+FromMood, +ToMood, -Device, -Reasons)
recommend_transition_device(M1, M2, chromatic_mediant, 
    [because(contrast(M1, M2)), because(device(chromatic_mediant))]) :-
  mood_valence(M1, V1),
  mood_valence(M2, V2),
  V1 \= V2.

recommend_transition_device(M1, M2, deceptive_cadence,
    [because(surprise_transition), because(device(deceptive_cadence))]) :-
  mood_valence(M1, positive),
  mood_valence(M2, negative).

recommend_transition_device(_, _, suspension_chain,
    [because(smooth_transition), because(device(suspension_chain))]).
