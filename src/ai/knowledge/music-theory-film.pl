%% music-theory-film.pl - Film Music Theory Knowledge Base for CardPlay AI
%%
%% Provides film scoring theory predicates for:
%% - Mood taxonomy and device mappings (C361-C394)
%% - Film progression recommendations (C398)
%% - Film voicing recommendations (C399)
%% - Register plans (C401)
%% - Dynamic contour rules (C402-C403)
%% - Density curves (C404-C405)
%% - Harmonic pacing rules (C416-C417)
%% - Hit point placement (C418-C419)
%% - Chromatic mediant networks (C433-C434)
%% - Planing sequences (C435-C436)
%% - Pedal textures (C437-C438)
%% - Cluster voicings (C439-C440)
%% - Quartal voicings (C441-C442)
%% - Scene arc templates (C451-C452)
%% - Orchestration budget (C454-C455)
%% - Timbre descriptors (C456-C457)
%% - Harmonic color / extension moods (C458-C459)
%% - Cue ending recommendations (C462)
%%
%% Depends on: music-theory.pl, music-spec.pl

%% ============================================================================
%% MOOD TAXONOMY (C362)
%% ============================================================================

film_mood(heroic).
film_mood(ominous).
film_mood(tender).
film_mood(wonder).
film_mood(mystery).
film_mood(sorrow).
film_mood(comedy).
film_mood(action).
film_mood(epic).

%% ============================================================================
%% DEVICE TAXONOMY (C363-C385)
%% ============================================================================

film_device(pedal_point).
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
film_device(quartal_harmony).
film_device(added_second_sixth).
film_device(suspended_harmony).
film_device(deceptive_resolution).
film_device(resolved_dissonance).
film_device(harmonic_stasis).
film_device(cadence_deferral).
film_device(trailer_rise).
film_device(epic_plagal).          % bVI-bVII-I
film_device(minor_epic_loop).      % i-bVI-bIII-bVII
film_device(dark_oscillation).     % i-bVII-bVI-bVII
film_device(neo_riemannian).       % P/L/R transformations
film_device(leitmotif_interval).

%% ============================================================================
%% ROLE TAXONOMY (C387)
%% ============================================================================

film_role(melody).
film_role(countermelody).
film_role(pad).
film_role(bass).
film_role(percussion).
film_role(ostinato_role).

%% ============================================================================
%% ORCHESTRATION FAMILY TAXONOMY (C388)
%% ============================================================================

orchestration_family(strings).
orchestration_family(brass).
orchestration_family(woodwinds).
orchestration_family(choir).
orchestration_family(synths).
orchestration_family(percussion).
orchestration_family(piano).
orchestration_family(harp).

%% ============================================================================
%% MOOD → MODE MAPPINGS (C389)
%% ============================================================================

mood_prefers_mode(heroic, mixolydian, 0.8).
mood_prefers_mode(heroic, lydian, 0.7).
mood_prefers_mode(heroic, major, 0.6).
mood_prefers_mode(ominous, phrygian, 0.9).
mood_prefers_mode(ominous, locrian, 0.6).
mood_prefers_mode(tender, major, 0.8).
mood_prefers_mode(tender, lydian, 0.5).
mood_prefers_mode(wonder, lydian, 0.9).
mood_prefers_mode(wonder, major, 0.6).
mood_prefers_mode(mystery, whole_tone, 0.7).
mood_prefers_mode(mystery, dorian, 0.5).
mood_prefers_mode(sorrow, natural_minor, 0.8).
mood_prefers_mode(sorrow, dorian, 0.6).
mood_prefers_mode(comedy, major, 0.7).
mood_prefers_mode(comedy, mixolydian, 0.5).
mood_prefers_mode(action, phrygian, 0.6).
mood_prefers_mode(action, natural_minor, 0.7).
mood_prefers_mode(epic, mixolydian, 0.8).
mood_prefers_mode(epic, dorian, 0.7).

%% ============================================================================
%% MOOD → DEVICE MAPPINGS (C390)
%% ============================================================================

mood_prefers_device(heroic, pedal_point, 0.7).
mood_prefers_device(heroic, chromatic_mediant, 0.6).
mood_prefers_device(heroic, epic_plagal, 0.8).
mood_prefers_device(ominous, phrygian_color, 0.9).
mood_prefers_device(ominous, cluster_tension, 0.8).
mood_prefers_device(ominous, harmonic_stasis, 0.7).
mood_prefers_device(tender, suspended_harmony, 0.7).
mood_prefers_device(tender, resolved_dissonance, 0.6).
mood_prefers_device(wonder, lydian_tonic, 0.9).
mood_prefers_device(wonder, quartal_harmony, 0.6).
mood_prefers_device(mystery, planing, 0.8).
mood_prefers_device(mystery, whole_tone_wash, 0.7).
mood_prefers_device(sorrow, modal_mixture, 0.8).
mood_prefers_device(sorrow, deceptive_resolution, 0.6).
mood_prefers_device(comedy, deceptive_resolution, 0.7).
mood_prefers_device(action, ostinato, 0.9).
mood_prefers_device(action, octatonic_action, 0.7).
mood_prefers_device(action, trailer_rise, 0.6).
mood_prefers_device(epic, pedal_point, 0.8).
mood_prefers_device(epic, chromatic_mediant, 0.7).
mood_prefers_device(epic, minor_epic_loop, 0.6).

%% ============================================================================
%% MOOD → INSTRUMENT ROLE MAPPINGS (C391)
%% ============================================================================

mood_prefers_role(heroic, melody, brass).
mood_prefers_role(heroic, pad, strings).
mood_prefers_role(heroic, bass, strings).
mood_prefers_role(heroic, percussion, percussion).
mood_prefers_role(ominous, pad, strings).
mood_prefers_role(ominous, melody, woodwinds).
mood_prefers_role(ominous, bass, synths).
mood_prefers_role(tender, melody, strings).
mood_prefers_role(tender, pad, piano).
mood_prefers_role(tender, countermelody, woodwinds).
mood_prefers_role(wonder, melody, woodwinds).
mood_prefers_role(wonder, pad, strings).
mood_prefers_role(wonder, countermelody, harp).
mood_prefers_role(mystery, melody, woodwinds).
mood_prefers_role(mystery, pad, synths).
mood_prefers_role(sorrow, melody, strings).
mood_prefers_role(sorrow, pad, strings).
mood_prefers_role(sorrow, countermelody, piano).
mood_prefers_role(comedy, melody, woodwinds).
mood_prefers_role(comedy, pad, strings).
mood_prefers_role(action, melody, brass).
mood_prefers_role(action, ostinato_role, strings).
mood_prefers_role(action, percussion, percussion).
mood_prefers_role(epic, melody, brass).
mood_prefers_role(epic, pad, choir).
mood_prefers_role(epic, bass, strings).

%% ============================================================================
%% DEVICE → HARMONIC CONSTRAINTS (C392)
%% ============================================================================

device_harmonic_constraint(planing, avoid_functional_resolution).
device_harmonic_constraint(whole_tone_wash, avoid_clear_tonic).
device_harmonic_constraint(harmonic_stasis, slow_chord_change).
device_harmonic_constraint(pedal_point, sustained_bass).
device_harmonic_constraint(ostinato, repeating_cell).
device_harmonic_constraint(cadence_deferral, avoid_pac).
device_harmonic_constraint(cluster_tension, dense_voicing).
device_harmonic_constraint(quartal_harmony, stacked_fourths).

%% ============================================================================
%% DEVICE → TEXTURE CONSTRAINTS (C393)
%% ============================================================================

device_texture_constraint(ostinato, steady_rhythmic_grid).
device_texture_constraint(pedal_point, sustained_low_voice).
device_texture_constraint(planing, parallel_motion).
device_texture_constraint(cluster_tension, dense_vertical).
device_texture_constraint(trailer_rise, increasing_density).
device_texture_constraint(harmonic_stasis, textural_motion).

%% ============================================================================
%% DEVICE → ARRANGER STYLE HINTS (C394)
%% ============================================================================

device_arranger_hint(trailer_rise, trailer).
device_arranger_hint(harmonic_stasis, minimal_underscore).
device_arranger_hint(ostinato, rhythmic_underscore).
device_arranger_hint(pedal_point, ambient_pad).
device_arranger_hint(epic_plagal, epic_finale).
device_arranger_hint(planing, impressionist).

%% ============================================================================
%% RECOMMEND FILM DEVICES (C395)
%% ============================================================================

%% recommend_film_devices(+Spec, -Devices, -Reasons)
recommend_film_devices(Spec, Devices, Reasons) :-
  Spec = music_spec(_, _, _, _, _, _, constraints(Cs)),
  findall(D, (
    member(film_mood(Mood), Cs),
    mood_prefers_device(Mood, D, W),
    W >= 0.6
  ), Devices),
  Devices \= [],
  format(atom(R), 'Devices recommended based on mood constraints', []),
  Reasons = [R].

%% recommend_film_mode(+Spec, -Mode, -Reasons)  (C396)
recommend_film_mode(Spec, Mode, Reasons) :-
  Spec = music_spec(_, _, _, _, _, _, constraints(Cs)),
  member(film_mood(Mood), Cs),
  mood_prefers_mode(Mood, Mode, Weight),
  Weight >= 0.6,
  format(atom(R), 'Mode ~w suggested for ~w mood (weight ~2f)', [Mode, Mood, Weight]),
  Reasons = [because(R)].

%% recommend_film_orchestration(+Spec, -Roles, -Instruments, -Reasons)  (C397)
recommend_film_orchestration(Spec, Roles, Instruments, Reasons) :-
  Spec = music_spec(_, _, _, _, _, _, constraints(Cs)),
  member(film_mood(Mood), Cs),
  findall(role(Role, Family), mood_prefers_role(Mood, Role, Family), RolePairs),
  maplist(role_name, RolePairs, Roles),
  maplist(role_family, RolePairs, Instruments),
  format(atom(R), 'Orchestration for ~w mood', [Mood]),
  Reasons = [because(R)].

role_name(role(R, _), R).
role_family(role(_, F), F).

%% ============================================================================
%% FILM PROGRESSION RECOMMENDATIONS (C398)
%% ============================================================================

%% recommend_film_progression(+Mood, +Key, -Chords, -Reasons)
recommend_film_progression(heroic, Key, [Key-major, Key-major, Key-major, Key-major], Reasons) :-
  Reasons = [because('Heroic: I-bVI-bVII-I (epic plagal)')].
recommend_film_progression(ominous, _Key, [i, bII, i, bII], Reasons) :-
  Reasons = [because('Ominous: i-bII-i-bII (Phrygian oscillation)')].
recommend_film_progression(tender, _Key, [I, vi, IV, V], Reasons) :-
  I = 'I', IV = 'IV', V = 'V',
  Reasons = [because('Tender: I-vi-IV-V (classic ballad)')].
recommend_film_progression(wonder, _Key, ['I', 'IVmaj7', 'I', 'IVmaj7'], Reasons) :-
  Reasons = [because('Wonder: Lydian I-IV tonal oscillation')].
recommend_film_progression(mystery, _Key, ['Im', 'bIIImaj7', 'IVm7', 'bVImaj7'], Reasons) :-
  Reasons = [because('Mystery: minor with chromatic mediants')].
recommend_film_progression(sorrow, _Key, ['i', 'bVI', 'bIII', 'bVII'], Reasons) :-
  Reasons = [because('Sorrow: minor epic descending loop')].
recommend_film_progression(action, _Key, ['i', 'bVI', 'bVII', 'i'], Reasons) :-
  Reasons = [because('Action: minor power loop')].
recommend_film_progression(epic, _Key, ['I', 'bVI', 'bVII', 'I'], Reasons) :-
  Reasons = [because('Epic: bVI-bVII-I plagal rise')].
recommend_film_progression(comedy, _Key, ['I', 'V/vi', 'vi', 'IV'], Reasons) :-
  Reasons = [because('Comedy: playful secondary dominant detour')].

%% ============================================================================
%% FILM VOICING RECOMMENDATIONS (C399)
%% ============================================================================

%% recommend_film_voicing(+Device, +Chord, -Voicing, -Reasons)
recommend_film_voicing(quartal_harmony, _Chord, stacked_fourths, Reasons) :-
  Reasons = [because('Quartal: stack perfect/augmented fourths')].
recommend_film_voicing(cluster_tension, _Chord, semitone_cluster, Reasons) :-
  Reasons = [because('Cluster: dense semitone/whole-tone packing')].
recommend_film_voicing(suspended_harmony, _Chord, sus4_open, Reasons) :-
  Reasons = [because('Suspended: sus4 with open spacing')].
recommend_film_voicing(added_second_sixth, _Chord, add2_add6, Reasons) :-
  Reasons = [because('Added-note: triad + 2nd or 6th for color')].
recommend_film_voicing(pedal_point, _Chord, root_pedal_spread, Reasons) :-
  Reasons = [because('Pedal: root sustained, upper voices spread')].
recommend_film_voicing(planing, _Chord, parallel_triads, Reasons) :-
  Reasons = [because('Planing: parallel triads in constant quality')].
recommend_film_voicing(_, _Chord, standard_spread, Reasons) :-
  Reasons = [because('Default: standard orchestral spread voicing')].

%% ============================================================================
%% REGISTER PLAN (C400-C401)
%% ============================================================================

%% register_plan(+Mood, +Role, -Range, -Reasons)
%% Range = range(LowMidi, HighMidi)
register_plan(heroic, melody, range(60, 84), Reasons) :-
  Reasons = [because('Heroic melody: mid-to-high brass register')].
register_plan(heroic, pad, range(48, 72), Reasons) :-
  Reasons = [because('Heroic pad: warm mid strings')].
register_plan(heroic, bass, range(28, 48), Reasons) :-
  Reasons = [because('Heroic bass: deep strings/timpani')].
register_plan(ominous, melody, range(36, 60), Reasons) :-
  Reasons = [because('Ominous melody: low register for darkness')].
register_plan(ominous, pad, range(48, 72), Reasons) :-
  Reasons = [because('Ominous pad: mid tremolo strings')].
register_plan(tender, melody, range(60, 84), Reasons) :-
  Reasons = [because('Tender melody: lyrical mid-high register')].
register_plan(tender, pad, range(48, 72), Reasons) :-
  Reasons = [because('Tender pad: warm piano/strings')].
register_plan(wonder, melody, range(72, 96), Reasons) :-
  Reasons = [because('Wonder melody: high, bright register')].
register_plan(wonder, pad, range(48, 72), Reasons) :-
  Reasons = [because('Wonder pad: open strings')].
register_plan(mystery, melody, range(48, 72), Reasons) :-
  Reasons = [because('Mystery melody: mid woodwind register')].
register_plan(sorrow, melody, range(48, 72), Reasons) :-
  Reasons = [because('Sorrow melody: mid legato strings')].
register_plan(action, melody, range(60, 84), Reasons) :-
  Reasons = [because('Action melody: powerful mid-high brass')].
register_plan(epic, melody, range(60, 96), Reasons) :-
  Reasons = [because('Epic melody: wide brass/choir register')].
register_plan(epic, pad, range(36, 72), Reasons) :-
  Reasons = [because('Epic pad: full-range strings + choir')].

%% Fallback register plan
register_plan(_, melody, range(60, 84), [because('Default melody register')]).
register_plan(_, pad, range(48, 72), [because('Default pad register')]).
register_plan(_, bass, range(28, 48), [because('Default bass register')]).
register_plan(_, percussion, range(36, 72), [because('Default percussion register')]).
register_plan(_, countermelody, range(55, 79), [because('Default countermelody register')]).
register_plan(_, ostinato_role, range(48, 72), [because('Default ostinato register')]).

%% ============================================================================
%% DYNAMIC CONTOUR (C402-C403)
%% ============================================================================

%% dynamic_plan(+Mood, -Contour, -Reasons)
%% Contour = list of dynamic sections
dynamic_plan(heroic, [mp, mf, f, ff], Reasons) :-
  Reasons = [because('Heroic: gradual build to fortissimo')].
dynamic_plan(ominous, [pp, p, mp, ff], Reasons) :-
  Reasons = [because('Ominous: quiet tension with sudden forte')].
dynamic_plan(tender, [p, mp, p, pp], Reasons) :-
  Reasons = [because('Tender: gentle arc, soft ending')].
dynamic_plan(wonder, [mp, mf, f, mf], Reasons) :-
  Reasons = [because('Wonder: swell and settle')].
dynamic_plan(mystery, [pp, pp, p, pp], Reasons) :-
  Reasons = [because('Mystery: sustained quiet with subtle shifts')].
dynamic_plan(sorrow, [p, mp, mf, p], Reasons) :-
  Reasons = [because('Sorrow: restrained arc')].
dynamic_plan(action, [f, ff, f, ff], Reasons) :-
  Reasons = [because('Action: sustained loud with peaks')].
dynamic_plan(epic, [mf, f, ff, fff], Reasons) :-
  Reasons = [because('Epic: relentless build to triple forte')].
dynamic_plan(comedy, [mf, f, mp, f], Reasons) :-
  Reasons = [because('Comedy: playful dynamic contrasts')].

%% ============================================================================
%% DENSITY CURVE (C404-C405)
%% ============================================================================

%% density_curve(+Mood, -Sections, -Curve)
%% Curve = list of density values 0.0-1.0 per section
density_curve(heroic, 4, [0.3, 0.5, 0.7, 1.0]).
density_curve(ominous, 4, [0.1, 0.2, 0.2, 0.8]).
density_curve(tender, 4, [0.2, 0.4, 0.3, 0.1]).
density_curve(wonder, 4, [0.3, 0.5, 0.6, 0.4]).
density_curve(mystery, 4, [0.1, 0.15, 0.2, 0.1]).
density_curve(sorrow, 4, [0.2, 0.3, 0.4, 0.2]).
density_curve(action, 4, [0.6, 0.8, 0.7, 1.0]).
density_curve(epic, 4, [0.4, 0.6, 0.8, 1.0]).
density_curve(comedy, 4, [0.4, 0.6, 0.3, 0.5]).

%% ============================================================================
%% HARMONIC PACING RULES (C416-C417)
%% ============================================================================

%% avoid_strong_cadence(+Spec, -Reasons)
%% True when the spec's mood/style suggests avoiding strong cadences (underscore).
avoid_strong_cadence(Spec, Reasons) :-
  Spec = music_spec(_, _, _, _, Style, _, constraints(Cs)),
  ( Style = underscore
  ; member(film_device(cadence_deferral), Cs)
  ; member(film_device(harmonic_stasis), Cs)
  ),
  Reasons = [because('Underscore/stasis context: avoid strong PAC mid-cue')].

%% harmonic_pacing_rule(+Mood, +Section, -ChordsPerBar, -Reasons)
harmonic_pacing_rule(heroic, intro, 1, [because('Heroic intro: one chord per bar for grandeur')]).
harmonic_pacing_rule(heroic, climax, 2, [because('Heroic climax: faster harmonic motion')]).
harmonic_pacing_rule(ominous, _, 0.5, [because('Ominous: slow harmonic change (2 bars/chord)')]).
harmonic_pacing_rule(tender, _, 1, [because('Tender: gentle one chord per bar')]).
harmonic_pacing_rule(action, _, 2, [because('Action: fast harmonic rhythm')]).
harmonic_pacing_rule(epic, buildup, 1, [because('Epic buildup: steady harmonic march')]).
harmonic_pacing_rule(epic, climax, 2, [because('Epic climax: accelerated harmony')]).
harmonic_pacing_rule(mystery, _, 0.5, [because('Mystery: static, slow chord changes')]).
harmonic_pacing_rule(wonder, _, 1, [because('Wonder: floating one-chord-per-bar')]).
harmonic_pacing_rule(sorrow, _, 1, [because('Sorrow: measured harmonic pace')]).
harmonic_pacing_rule(comedy, _, 2, [because('Comedy: quick harmonic turns')]).

%% ============================================================================
%% HIT POINT PLACEMENT (C418-C419)
%% ============================================================================

%% hit_point(+TimeTicks, +Type, -Description)
%% Type: accent | stinger | transition | reveal
hit_point(Time, accent, Desc) :-
  format(atom(Desc), 'Accent hit at tick ~w', [Time]).
hit_point(Time, stinger, Desc) :-
  format(atom(Desc), 'Stinger hit at tick ~w', [Time]).
hit_point(Time, transition, Desc) :-
  format(atom(Desc), 'Transition hit at tick ~w', [Time]).
hit_point(Time, reveal, Desc) :-
  format(atom(Desc), 'Reveal hit at tick ~w', [Time]).

%% place_hit_chord(+HitType, +Key, +Mood, -Chord)
%% Recommend a chord for a hit point based on type and mood.
place_hit_chord(accent, _Key, heroic, 'I').
place_hit_chord(accent, _Key, ominous, 'bII').
place_hit_chord(accent, _Key, action, 'i').
place_hit_chord(stinger, _Key, heroic, 'V').
place_hit_chord(stinger, _Key, ominous, 'vii_dim').
place_hit_chord(stinger, _Key, mystery, 'bVI').
place_hit_chord(transition, _Key, _, 'V').
place_hit_chord(reveal, _Key, wonder, 'I_lydian').
place_hit_chord(reveal, _Key, heroic, 'I').
place_hit_chord(reveal, _Key, ominous, 'bVI').

%% ============================================================================
%% LEITMOTIF OPERATIONS (C413-C415, C420-C424)
%% ============================================================================

%% motif_for_mood(+Mood, -TransformOp, -Reasons)  (C413)
motif_for_mood(heroic, augmentation, [because('Heroic: augmented motif for grandeur')]).
motif_for_mood(ominous, inversion, [because('Ominous: inverted motif for unease')]).
motif_for_mood(tender, diminution, [because('Tender: gentle, quicker motif statement')]).
motif_for_mood(sorrow, retrograde, [because('Sorrow: reversed motif for reflection')]).
motif_for_mood(action, rhythmic_diminution, [because('Action: compressed rhythm for intensity')]).
motif_for_mood(wonder, transposition_up, [because('Wonder: upward transposition for lift')]).
motif_for_mood(mystery, fragmentation, [because('Mystery: partial motif for ambiguity')]).
motif_for_mood(comedy, rhythmic_displacement, [because('Comedy: off-beat motif for humor')]).

%% motif_transform(+Motif, +Op, -NewMotif, -Reasons)  (C414-C415)
%% Motif = list of intervals; Op: augmentation | diminution | inversion | retrograde | reharmonization
motif_transform(Intervals, inversion, Inverted, [because('Intervals inverted')]) :-
  maplist(negate_interval, Intervals, Inverted).
motif_transform(Intervals, retrograde, Reversed, [because('Intervals reversed')]) :-
  reverse(Intervals, Reversed).
motif_transform(Intervals, augmentation, Augmented, [because('Durations doubled')]) :-
  maplist(double_val, Intervals, Augmented).
motif_transform(Intervals, diminution, Diminished, [because('Durations halved')]) :-
  maplist(halve_val, Intervals, Diminished).
motif_transform(Intervals, transposition_up, Transposed, [because('Transposed up a step')]) :-
  maplist(add_two, Intervals, Transposed).

negate_interval(I, NI) :- NI is -I.
double_val(I, D) :- D is I * 2.
halve_val(I, H) :- H is I // 2.
add_two(I, T) :- T is I + 2.

%% Mickey-mousing toggle (C420)
mickey_mousing(tight, 'Tight rhythmic sync with picture markers').
mickey_mousing(moderate, 'Moderate sync: hit points only').
mickey_mousing(loose, 'Loose: ambient underscore, no sync').

%% Text painting / gesture mapping (C421-C422)
gesture_to_device(rising, trailer_rise, 0.9).
gesture_to_device(falling, deceptive_resolution, 0.7).
gesture_to_device(sustained, pedal_point, 0.8).
gesture_to_device(pulsing, ostinato, 0.9).
gesture_to_device(expanding, chromatic_mediant, 0.7).
gesture_to_device(contracting, cluster_tension, 0.6).
gesture_to_device(floating, whole_tone_wash, 0.8).
gesture_to_device(stabbing, stinger_chord, 0.9).

%% Diegetic vs nondiegetic hints (C423-C424)
diegetic_hint(source_music, diegetic, 'Music exists within the film world').
diegetic_hint(underscore, nondiegetic, 'Score heard only by the audience').
diegetic_hint(meta_diegetic, ambiguous, 'Blurred line between source and score').

%% ============================================================================
%% GENRE FILM IDIOM PACKS (C425-C432)
%% ============================================================================

constraint_pack(horror, [
  film_mood(ominous),
  film_device(phrygian_color),
  film_device(cluster_tension),
  culture(western),
  style(cinematic)
]).

constraint_pack(fantasy, [
  film_mood(wonder),
  film_device(lydian_tonic),
  film_device(pedal_point),
  culture(western),
  style(cinematic)
]).

constraint_pack(sci_fi, [
  film_mood(mystery),
  film_device(whole_tone_wash),
  film_device(planing),
  culture(western),
  style(cinematic)
]).

constraint_pack(romance, [
  film_mood(tender),
  film_device(modal_mixture),
  film_device(suspended_harmony),
  culture(western),
  style(cinematic)
]).

constraint_pack(action_film, [
  film_mood(action),
  film_device(ostinato),
  film_device(octatonic_action),
  culture(western),
  style(trailer)
]).

constraint_pack(comedy_film, [
  film_mood(comedy),
  film_device(deceptive_resolution),
  culture(western),
  style(cinematic)
]).

%% ============================================================================
%% CHROMATIC MEDIANT NETWORK (C433-C434)
%% ============================================================================

%% chromatic_mediant(+KeyA, -KeyB)
%% KeyA and KeyB are related by major or minor third root motion.
chromatic_mediant(Key, Mediant) :-
  note_index(Key, I),
  member(Offset, [3, 4, 8, 9]),  % minor 3rd, major 3rd, minor 6th, major 6th
  MI is (I + Offset) mod 12,
  note_index(Mediant, MI),
  Key \= Mediant.

%% mediant_path(+KeyA, +KeyB, -Path)
%% Find a path of chromatic mediants between two keys (max 3 steps).
mediant_path(K, K, [K]).
mediant_path(K1, K2, [K1|Rest]) :-
  chromatic_mediant(K1, Mid),
  Mid \= K1,
  mediant_path_inner(Mid, K2, Rest, 2).

mediant_path_inner(K, K, [K], _).
mediant_path_inner(K1, K2, [K1|Rest], Depth) :-
  Depth > 0,
  D1 is Depth - 1,
  chromatic_mediant(K1, Mid),
  Mid \= K1,
  mediant_path_inner(Mid, K2, Rest, D1).

%% ============================================================================
%% PLANING SEQUENCE (C435-C436)
%% ============================================================================

%% planing_sequence(+StartRoot, +Quality, +Direction, -Chords)
%% Generate parallel chord motion (planing) from a start.
%% Direction: up | down; generates 4 parallel chords moving by whole step.
planing_sequence(Start, Quality, up, Chords) :-
  note_index(Start, I),
  I2 is (I + 2) mod 12, I3 is (I + 4) mod 12, I4 is (I + 6) mod 12,
  note_index(N2, I2), note_index(N3, I3), note_index(N4, I4),
  Chords = [chord(Start, Quality), chord(N2, Quality), chord(N3, Quality), chord(N4, Quality)].
planing_sequence(Start, Quality, down, Chords) :-
  note_index(Start, I),
  I2 is (I + 10) mod 12, I3 is (I + 8) mod 12, I4 is (I + 6) mod 12,
  note_index(N2, I2), note_index(N3, I3), note_index(N4, I4),
  Chords = [chord(Start, Quality), chord(N2, Quality), chord(N3, Quality), chord(N4, Quality)].

%% ============================================================================
%% PEDAL TEXTURE (C437-C438)
%% ============================================================================

%% generate_pedal_texture(+PedalNote, +Chords, -Texture, -Reasons)
%% Sustain PedalNote while upper voices move through Chords.
generate_pedal_texture(PedalNote, Chords, texture(PedalNote, Chords), Reasons) :-
  length(Chords, N),
  format(atom(R), 'Pedal on ~w with ~w upper-voice chords', [PedalNote, N]),
  Reasons = [because(R)].

%% ============================================================================
%% CLUSTER VOICING (C439-C440)
%% ============================================================================

%% generate_cluster_voicing(+CenterPitch, +Density, -Notes, -Reasons)
%% Density: tight (semitones) | wide (whole tones)
generate_cluster_voicing(Center, tight, Notes, Reasons) :-
  N1 is Center - 2, N2 is Center - 1, N3 is Center + 1, N4 is Center + 2,
  Notes = [N1, N2, Center, N3, N4],
  Reasons = [because('Tight semitone cluster around center')].
generate_cluster_voicing(Center, wide, Notes, Reasons) :-
  N1 is Center - 4, N2 is Center - 2, N3 is Center + 2, N4 is Center + 4,
  Notes = [N1, N2, Center, N3, N4],
  Reasons = [because('Wide whole-tone cluster around center')].

%% ============================================================================
%% QUARTAL VOICING (C441-C442)
%% ============================================================================

%% generate_quartal_voicing(+BasePitch, +NumNotes, -Notes, -Reasons)
%% Stack perfect fourths (5 semitones) from base.
generate_quartal_voicing(Base, N, Notes, Reasons) :-
  N > 0,
  quartal_stack(Base, N, Notes),
  format(atom(R), '~w-note quartal stack from MIDI ~w', [N, Base]),
  Reasons = [because(R)].

quartal_stack(_, 0, []).
quartal_stack(P, N, [P|Rest]) :-
  N > 0,
  N1 is N - 1,
  P1 is P + 5,
  quartal_stack(P1, N1, Rest).

%% ============================================================================
%% SCENE ARC TEMPLATES (C451-C452)
%% ============================================================================

%% scene_arc_template(+ArcType, -Sections, -Reasons)
scene_arc_template(rising_action, Sections, Reasons) :-
  Sections = [
    section(setup, low_energy, 0.2),
    section(development, building, 0.5),
    section(climax, peak, 1.0),
    section(resolution, settling, 0.4)
  ],
  Reasons = [because('Rising action: gradual build to climax')].

scene_arc_template(tension_release, Sections, Reasons) :-
  Sections = [
    section(tension_build, increasing, 0.3),
    section(peak_tension, high, 0.9),
    section(release, sudden_drop, 0.1),
    section(aftermath, quiet, 0.2)
  ],
  Reasons = [because('Tension-release: build then sudden drop')].

scene_arc_template(slow_burn, Sections, Reasons) :-
  Sections = [
    section(intro, minimal, 0.1),
    section(simmer, gradual, 0.3),
    section(intensify, building, 0.6),
    section(boil, peak, 1.0)
  ],
  Reasons = [because('Slow burn: very gradual escalation')].

scene_arc_template(bookend, Sections, Reasons) :-
  Sections = [
    section(opening, theme, 0.5),
    section(departure, contrasting, 0.7),
    section(development, exploring, 0.8),
    section(return, theme_reprise, 0.5)
  ],
  Reasons = [because('Bookend: thematic return framing')].

scene_arc_template(stinger, Sections, Reasons) :-
  Sections = [
    section(quiet, ambient, 0.1),
    section(quiet2, ambient, 0.1),
    section(buildup, rising, 0.4),
    section(hit, maximum, 1.0)
  ],
  Reasons = [because('Stinger: quiet then sudden maximum impact')].

%% ============================================================================
%% ORCHESTRATION BUDGET (C454-C455)
%% ============================================================================

%% orchestration_budget(+Level, -MaxVoices, -Reasons)
%% Level: minimal | standard | full | epic
orchestration_budget(minimal, 3, [because('Minimal: solo + pad + bass')]).
orchestration_budget(standard, 6, [because('Standard: melody + counter + pad + bass + perc + ost')]).
orchestration_budget(full, 10, [because('Full: complete orchestral sections')]).
orchestration_budget(epic, 16, [because('Epic: layered full orchestra + choir + synths')]).

%% ============================================================================
%% TIMBRE DESCRIPTORS (C456-C457)
%% ============================================================================

%% timbre_descriptor(+Descriptor, -Description)
timbre_descriptor(warm, 'Low overtones, smooth spectrum').
timbre_descriptor(bright, 'Strong upper harmonics').
timbre_descriptor(dark, 'Attenuated highs, emphasized lows').
timbre_descriptor(airy, 'Breathy, with noise component').
timbre_descriptor(metallic, 'Inharmonic overtones, bell-like').
timbre_descriptor(glassy, 'Pure tone, few overtones').

%% descriptor_to_instruments(+Descriptor, +Culture, -Instruments)
descriptor_to_instruments(warm, western, [cello, french_horn, clarinet]).
descriptor_to_instruments(bright, western, [trumpet, violin, piccolo]).
descriptor_to_instruments(dark, western, [contrabass, bass_clarinet, tuba]).
descriptor_to_instruments(airy, western, [flute, choir_ah, string_harmonics]).
descriptor_to_instruments(metallic, western, [celesta, glockenspiel, vibraphone]).
descriptor_to_instruments(glassy, western, [glass_harmonica, sine_synth, harmonic_strings]).

%% ============================================================================
%% EXTENSION COLOR / MOOD (C458-C459)
%% ============================================================================

%% extension_color(+Extension, +Mood, -Weight)
%% How well a chord extension fits a given mood.
extension_color(maj7, wonder, 0.9).
extension_color(maj7, tender, 0.8).
extension_color(dom7, action, 0.7).
extension_color(dom7, heroic, 0.6).
extension_color(min7, sorrow, 0.8).
extension_color(min7, mystery, 0.7).
extension_color(dim7, ominous, 0.9).
extension_color(aug, mystery, 0.7).
extension_color(sus4, wonder, 0.6).
extension_color(sus4, epic, 0.5).
extension_color(add9, tender, 0.8).
extension_color(add9, wonder, 0.7).
extension_color(min_maj7, sorrow, 0.7).
extension_color(min_maj7, mystery, 0.6).

%% ============================================================================
%% CUE ENDING RECOMMENDATIONS (C462)
%% ============================================================================

%% recommend_cue_ending(+Mood, -EndingStrategy, -Reasons)
recommend_cue_ending(heroic, full_cadence_fff, [because('Heroic: full PAC at fortissimo')]).
recommend_cue_ending(ominous, fade_to_silence, [because('Ominous: fade into silence')]).
recommend_cue_ending(tender, ritardando_pp, [because('Tender: ritardando to pianissimo')]).
recommend_cue_ending(wonder, sustained_chord, [because('Wonder: held chord with reverb')]).
recommend_cue_ending(mystery, unresolved, [because('Mystery: end on unresolved harmony')]).
recommend_cue_ending(sorrow, dying_away, [because('Sorrow: morendo, dying away')]).
recommend_cue_ending(action, stinger_hit, [because('Action: final percussion stinger')]).
recommend_cue_ending(epic, chorale_finish, [because('Epic: full choir/brass chorale finish')]).
recommend_cue_ending(comedy, button_tag, [because('Comedy: short comedic button/tag')]).

%% ============================================================================
%% RECOMMEND TONALITY MODEL FOR FILM (C216-C217 partial)
%% ============================================================================

%% recommend_tonality_model(+Spec, -Model, -Reasons)
recommend_tonality_model(Spec, spiral_array, Reasons) :-
  Spec = music_spec(_, _, _, _, Style, _, _),
  member(Style, [cinematic, trailer, underscore]),
  Reasons = [because('Spiral Array best captures chromatic film harmony')].
recommend_tonality_model(Spec, dft_phase, Reasons) :-
  Spec = music_spec(_, _, _, _, _, Culture, _),
  member(Culture, [carnatic, chinese]),
  Reasons = [because('DFT phase works well for non-functional/modal tonality')].
recommend_tonality_model(Spec, ks_profile, Reasons) :-
  Spec = music_spec(_, _, _, _, Style, Culture, _),
  ( Style = galant ; Style = classical ; Culture = western ),
  Reasons = [because('Krumhansl-Schmuckler optimal for functional Western tonality')].

%% ============================================================================
%% SPEC CONFLICT RULES FOR FILM (C467-C468)
%% ============================================================================

spec_conflict(film_device(planing), schema(_),
  'Planing avoids functional harmony; conflicts with galant schema expectations').
spec_conflict(film_device(whole_tone_wash), schema(_),
  'Whole-tone wash is non-diatonic; conflicts with galant schema degrees').
spec_conflict(film_device(harmonic_stasis), harmonic_rhythm(HR),
  Reason) :-
  HR >= 2,
  format(atom(Reason), 'Harmonic stasis conflicts with fast harmonic rhythm (~w chords/bar)', [HR]).
