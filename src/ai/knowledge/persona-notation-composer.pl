%% ============================================================================
%% Notation Composer Persona Knowledge Base
%%
%% M001-M080: Prolog facts and rules for the notation-composer persona.
%%
%% Covers: notation workflows, score preparation, engraving rules,
%% orchestration guidelines, and form templates.
%%
%% @module @cardplay/ai/knowledge/persona-notation-composer
%% ============================================================================

%% ---------------------------------------------------------------------------
%% M002: notation_workflow/2 – Common notation tasks
%% ---------------------------------------------------------------------------
notation_workflow(score_entry, 'Enter notes, rests, dynamics into a score').
notation_workflow(part_extraction, 'Extract individual instrument parts from score').
notation_workflow(page_layout, 'Arrange systems and pages for printing').
notation_workflow(engraving, 'Fine-tune spacing, slurs, beams for publication quality').
notation_workflow(orchestration, 'Assign melodies and harmonies to instruments').
notation_workflow(transposition, 'Transpose parts for transposing instruments').
notation_workflow(proofreading, 'Check for notation errors and inconsistencies').
notation_workflow(rehearsal_prep, 'Add rehearsal marks, cues, and page turns').

%% ---------------------------------------------------------------------------
%% M003: score_preparation_workflow/1 – Steps for score prep
%% ---------------------------------------------------------------------------
score_preparation_workflow([
    enter_notes,
    add_dynamics,
    add_articulations,
    add_slurs_ties,
    add_text_markings,
    add_rehearsal_marks,
    extract_parts,
    check_page_turns,
    final_proofreading,
    export_pdf
]).

%% ---------------------------------------------------------------------------
%% M004: engraving_rule/2 – High-quality score formatting rules
%% ---------------------------------------------------------------------------
engraving_rule(stem_direction, 'Notes above middle line: stem down; below: stem up').
engraving_rule(beam_grouping, 'Group beams according to meter (e.g., 4 8ths in 4/4 = 2+2)').
engraving_rule(slur_placement, 'Slurs curve away from stems; avoid collisions with notes').
engraving_rule(dynamic_placement, 'Dynamics below staff for single-voice; between staves for piano').
engraving_rule(accidental_spacing, 'Leave enough space for accidentals; stagger in chords').
engraving_rule(lyric_alignment, 'Center syllables under noteheads; hyphens between syllables').
engraving_rule(tie_direction, 'Ties follow stem direction; inner voices curve toward notehead').
engraving_rule(rest_placement, 'Whole/half rests centered in measure; quarter+ rests at beat position').

%% ---------------------------------------------------------------------------
%% M005: part_layout_rule/3 – Individual instrument part rules
%% ---------------------------------------------------------------------------
part_layout_rule(page_turns, wind_instrument, 'Ensure page turns at rests (players need hands to turn)').
part_layout_rule(page_turns, string_instrument, 'Prefer turns during rests or sustained notes').
part_layout_rule(cue_notes, any, 'Add cue notes before entries after long rests (>8 bars)').
part_layout_rule(multi_rest, any, 'Consolidate consecutive empty bars as multi-rest').
part_layout_rule(rehearsal_marks, any, 'Start new system at rehearsal marks when possible').
part_layout_rule(transposition, transposing_instrument, 'Transpose to concert pitch for score, written pitch for part').

%% ---------------------------------------------------------------------------
%% M006-M008: Placement rules
%% ---------------------------------------------------------------------------
rehearsal_mark_placement(section_boundary, 'Place at major section changes').
rehearsal_mark_placement(every_n_bars, 'Place approximately every 10-20 bars').
rehearsal_mark_placement(tempo_change, 'Place at tempo changes').

dynamics_placement(below_staff, 'Standard: dynamics below the staff').
dynamics_placement(between_staves, 'Piano/organ: dynamics between staves').
dynamics_placement(above_staff, 'Vocal parts: dynamics above staff (lyrics below)').

articulation_consistency(staccato, 'Dot above/below notehead, opposite stem direction').
articulation_consistency(accent, 'Horizontal wedge above/below notehead').
articulation_consistency(tenuto, 'Dash above/below notehead').
articulation_consistency(marcato, 'Vertical wedge (hat) above notehead always').

%% ---------------------------------------------------------------------------
%% M009-M010: Board deck configuration
%% ---------------------------------------------------------------------------
notation_board_deck(score_notation, required, 70).    % 70% width
notation_board_deck(properties_inspector, required, 30). % 30% width
notation_board_deck(instrument_browser, recommended, 20).
notation_board_deck(harmony_display, recommended, 25).
notation_board_deck(phrase_library, optional, 20).
notation_board_deck(ai_advisor, optional, 20).

%% ---------------------------------------------------------------------------
%% M028-M030: Orchestration guidelines
%% ---------------------------------------------------------------------------
orchestration_guideline(violin, range(55, 103), intermediate).   % G3 to G7
orchestration_guideline(viola, range(48, 91), intermediate).     % C3 to G6
orchestration_guideline(cello, range(36, 79), intermediate).     % C2 to G5
orchestration_guideline(double_bass, range(28, 67), intermediate). % E1 to G4
orchestration_guideline(flute, range(60, 96), beginner).         % C4 to C7
orchestration_guideline(oboe, range(58, 91), intermediate).      % Bb3 to G6
orchestration_guideline(clarinet, range(50, 94), intermediate).  % D3 to Bb6
orchestration_guideline(bassoon, range(34, 72), intermediate).   % Bb1 to C5
orchestration_guideline(french_horn, range(41, 77), advanced).   % F2 to F5
orchestration_guideline(trumpet, range(54, 82), intermediate).   % F#3 to Bb5
orchestration_guideline(trombone, range(40, 72), intermediate).  % E2 to C5
orchestration_guideline(tuba, range(28, 60), intermediate).      % E1 to C4
orchestration_guideline(piano, range(21, 108), beginner).        % A0 to C8
orchestration_guideline(harp, range(24, 103), advanced).         % C1 to G7

doubling_rule(octave_doubling, 'Double melody in octaves for power').
doubling_rule(thirds_doubling, 'Double in thirds for warmth (string sections)').
doubling_rule(unison_doubling, 'Unison doubles for brightness and presence').
doubling_rule(wind_string_double, 'Double wind melody with strings for blend').

spacing_rule(close_position, 'Voices within an octave; dense, keyboard-like').
spacing_rule(open_position, 'Voices spread beyond an octave; orchestral, spacious').
spacing_rule(drop_2, 'Second voice from top dropped an octave; jazz voicing').

%% ---------------------------------------------------------------------------
%% M031: Tempo marking conventions by style period
%% ---------------------------------------------------------------------------
tempo_marking_convention(baroque, 'Italian terms: Allegro, Adagio, etc.').
tempo_marking_convention(classical, 'Italian terms with metronome marks').
tempo_marking_convention(romantic, 'Expressive Italian/German terms with MM').
tempo_marking_convention(modern, 'MM marking primary; descriptive text optional').
tempo_marking_convention(film, 'MM marking with descriptive English text').

%% ---------------------------------------------------------------------------
%% M035-M038: Multi-movement and score structure
%% ---------------------------------------------------------------------------
multi_movement_structure(symphony, [
    movement(1, allegro, sonata_form),
    movement(2, adagio, ternary_or_variation),
    movement(3, menuet_or_scherzo, ternary),
    movement(4, allegro, sonata_or_rondo)
]).
multi_movement_structure(sonata, [
    movement(1, allegro, sonata_form),
    movement(2, slow, ternary_or_variation),
    movement(3, fast, rondo_or_sonata)
]).
multi_movement_structure(concerto, [
    movement(1, allegro, sonata_with_double_exposition),
    movement(2, slow, ternary_or_variation),
    movement(3, fast, rondo)
]).
multi_movement_structure(suite, [
    movement(1, moderate, prelude),
    movement(2, moderate, allemande),
    movement(3, moderate, courante),
    movement(4, slow, sarabande),
    movement(5, fast, gigue)
]).

%% ---------------------------------------------------------------------------
%% M051-M054: Voice independence and counterpoint
%% ---------------------------------------------------------------------------
voice_independence_rule(no_parallel_fifths, 'Avoid parallel perfect fifths between voices').
voice_independence_rule(no_parallel_octaves, 'Avoid parallel octaves between voices').
voice_independence_rule(contrary_motion, 'Prefer contrary motion between outer voices').
voice_independence_rule(voice_crossing, 'Avoid voice crossing except for brief passing').
voice_independence_rule(spacing, 'Keep adjacent upper voices within an octave').

harmonic_rhythm_appropriateness(baroque, one_chord_per_beat, normal).
harmonic_rhythm_appropriateness(classical, one_chord_per_bar, normal).
harmonic_rhythm_appropriateness(classical, two_chords_per_bar, cadence).
harmonic_rhythm_appropriateness(romantic, one_chord_per_bar, normal).
harmonic_rhythm_appropriateness(romantic, sustained_pedal, dramatic).

cadence_placement_rule(authentic, 'End of phrase, section, or piece').
cadence_placement_rule(half, 'End of antecedent phrase (question phrase)').
cadence_placement_rule(deceptive, 'Where authentic expected, for surprise/extension').
cadence_placement_rule(plagal, 'After authentic cadence, as confirmation (Amen cadence)').

modulation_appropriateness(major_to_dominant, common, 'Most natural modulation').
modulation_appropriateness(major_to_relative_minor, common, 'Smooth, shares many notes').
modulation_appropriateness(major_to_subdominant, common, 'Stepwise relationship').
modulation_appropriateness(minor_to_relative_major, common, 'Natural in minor keys').
modulation_appropriateness(chromatic_third, uncommon, 'Dramatic, Romantic-era effect').
modulation_appropriateness(tritone, rare, 'Extreme, used for shock or color').

%% ---------------------------------------------------------------------------
%% M069-M072: Classical form rules
%% ---------------------------------------------------------------------------
form_section_rule(sonata_form, exposition, [first_theme, transition, second_theme, closing]).
form_section_rule(sonata_form, development, [fragmentation, sequence, modulation, retransition]).
form_section_rule(sonata_form, recapitulation, [first_theme, transition_modified, second_theme_tonic, coda]).

form_section_rule(rondo, sections, [a, b, a, c, a, coda]).
form_section_rule(ternary, sections, [a, b, a]).
form_section_rule(binary, sections, [a, b]).
form_section_rule(variation, sections, [theme, var1, var2, var3, coda]).

development_technique(fragmentation, 'Break theme into smaller motifs').
development_technique(sequence, 'Repeat motif at different pitch levels').
development_technique(augmentation, 'Lengthen note values').
development_technique(diminution, 'Shorten note values').
development_technique(inversion, 'Flip interval directions').
development_technique(stretto, 'Overlap entries of subject').
development_technique(false_recapitulation, 'Begin recap in wrong key').

fugue_subject_rule(length, '2-4 bars is typical').
fugue_subject_rule(range, 'Stay within an octave').
fugue_subject_rule(character, 'Distinctive rhythm and contour').
fugue_subject_rule(answer, 'Real answer if tonal, tonal answer if subject spans tonic-dominant').
fugue_subject_rule(countersubject, 'Invertible counterpoint with subject').

%% ---------------------------------------------------------------------------
%% M011: Notation-specific keyboard shortcuts
%% ---------------------------------------------------------------------------
notation_shortcut(beam_grouping, 'Ctrl+B to toggle beam grouping on selection').
notation_shortcut(slur_placement, 'S to add slur from first to last selected note').
notation_shortcut(tie, 'T to tie selected note to next note of same pitch').
notation_shortcut(flip_stem, 'X to flip stem direction on selected notes').
notation_shortcut(enharmonic_toggle, 'J to toggle enharmonic spelling (C# <-> Db)').
notation_shortcut(note_input, '1-9 for note duration (1=whole, 4=quarter, 8=eighth)').
notation_shortcut(rest_input, '0 or R to enter rest of current duration').
notation_shortcut(dot, 'Period to toggle dot on selected note/rest').
notation_shortcut(accidental_sharp, 'Up arrow in pitch mode to sharpen by semitone').
notation_shortcut(accidental_flat, 'Down arrow in pitch mode to flatten by semitone').
notation_shortcut(voice_select, 'Ctrl+1 through Ctrl+4 to switch voice layer').
notation_shortcut(tuplet, 'Ctrl+T to create tuplet from selection').
notation_shortcut(dynamics_hairpin, 'H to add hairpin (crescendo/diminuendo) over selection').
notation_shortcut(rehearsal_mark, 'Ctrl+M to insert rehearsal mark').
notation_shortcut(transpose_up, 'Shift+Up to transpose selection up by step').
notation_shortcut(transpose_down, 'Shift+Down to transpose selection down by step').

%% ---------------------------------------------------------------------------
%% M036: Score metadata rules
%% ---------------------------------------------------------------------------
score_metadata_field(title, required).
score_metadata_field(composer, required).
score_metadata_field(arranger, optional).
score_metadata_field(copyright, recommended).
score_metadata_field(dedication, optional).
score_metadata_field(instrument, required).
score_metadata_field(tempo_marking, recommended).
score_metadata_field(key_signature, required).
score_metadata_field(time_signature, required).
score_metadata_field(opus_number, optional).

%% ---------------------------------------------------------------------------
%% M037: Rehearsal letter placement rules
%% ---------------------------------------------------------------------------
rehearsal_letter_rule(sequential, 'Use A, B, C, ... in order').
rehearsal_letter_rule(section_start, 'Place at beginning of each formal section').
rehearsal_letter_rule(key_change, 'Place at key changes for reference').
rehearsal_letter_rule(tempo_change, 'Place at significant tempo changes').
rehearsal_letter_rule(above_top_staff, 'Rehearsal marks appear above top staff of system').

%% ---------------------------------------------------------------------------
%% M038: System break and page turn rules
%% ---------------------------------------------------------------------------
system_break_rule(phrase_boundary, 'Prefer breaks at phrase endings').
system_break_rule(rest_position, 'Break at long rests when possible').
system_break_rule(avoid_mid_slur, 'Avoid breaking in middle of slur').
system_break_rule(even_distribution, 'Distribute measures evenly across systems').

page_turn_rule(rest_opportunity, 'Page turns must occur where performer has a rest').
page_turn_rule(left_to_right, 'Odd pages on right, even on left (performer turns right to left)').
page_turn_rule(minimum_rest, 'At least 2 beats of rest for comfortable page turn').
page_turn_rule(avoid_mid_phrase, 'Never force page turn in middle of a phrase').
