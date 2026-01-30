/**
 * GOFAI Eval Ambiguity Suite — Utterances That Must Trigger Clarification
 *
 * Step 030 [Eval][Prag]: Create an "ambiguity suite" of utterances that
 * MUST trigger clarification (not allowed to auto-resolve).
 *
 * ## Design Principles
 *
 * 1. **No silent resolution**: Every utterance in this suite has at least
 *    two materially different interpretations. The system MUST NOT pick
 *    one silently — it must present a clarification question.
 *
 * 2. **Material difference**: Two interpretations are "materially different"
 *    if they produce different edit packages (different events/params
 *    modified, different amounts, different targets).
 *
 * 3. **Categorized ambiguity types**: Each entry is tagged with the kind
 *    of ambiguity it exercises:
 *    - **lexical**: a word has multiple musical senses ("dark" = timbre vs harmony)
 *    - **scope**: unclear what range/section/layer is affected
 *    - **referential**: "it/that/this" could bind to multiple entities
 *    - **degree**: the amount of change is critically underspecified
 *    - **structural**: the phrase structure allows different readings
 *    - **pragmatic**: context-dependent interpretation would be needed
 *    - **temporal**: time reference is ambiguous (macro vs micro)
 *    - **modal**: the speech act type is ambiguous (request vs question)
 *
 * 4. **Expected clarification shape**: Each entry specifies the expected
 *    form of clarification question (axis sense, scope, referent, etc.).
 *
 * 5. **Contrast with auto-resolvable**: This suite is the complement of
 *    the "safe defaults" dataset. Items here are NOT safe to default.
 *
 * @module gofai/eval/ambiguity-suite
 */

// =============================================================================
// Ambiguity Suite Types
// =============================================================================

/**
 * Unique identifier for an ambiguity test case.
 */
export type AmbiguityTestId = string & { readonly __brand: 'AmbiguityTestId' };

/**
 * Create an AmbiguityTestId.
 */
export function ambiguityTestId(id: string): AmbiguityTestId {
  return id as AmbiguityTestId;
}

/**
 * The type of ambiguity an utterance exercises.
 */
export type AmbiguityType =
  | 'lexical'         // word has multiple senses
  | 'scope'           // unclear target range/section/layer
  | 'referential'     // pronoun/demonstrative could bind to multiple things
  | 'degree'          // amount is critically underspecified for this context
  | 'structural'      // phrase structure has multiple readings
  | 'pragmatic'       // requires context to disambiguate
  | 'temporal'        // time reference ambiguous (macro vs micro)
  | 'modal'           // speech act type ambiguous
  | 'constraint'      // constraint scope or mode ambiguous
  | 'axis_polysemy'   // perceptual axis maps to multiple mechanisms
  | 'entity'          // entity reference matches multiple project items
  | 'quantifier';     // "all/some/every" scope ambiguous

/**
 * The expected shape of the clarification question.
 */
export type ClarificationShape =
  | 'axis_sense'          // "By 'darker', do you mean timbre, harmony, or register?"
  | 'scope_section'       // "Which section do you want to change?"
  | 'scope_layer'         // "Which layer/track?"
  | 'scope_range'         // "What bar range?"
  | 'referent_binding'    // "What does 'it/that/this' refer to?"
  | 'degree_amount'       // "How much? (tiny/small/moderate/large)"
  | 'structural_reading'  // "Do you mean [A] or [B]?"
  | 'preservation_mode'   // "Keep it exact, functionally equivalent, or recognizable?"
  | 'mechanism_choice'    // "Should I do this via [X] or [Y]?"
  | 'temporal_scale'      // "Do you mean earlier in song form or earlier within the bar?"
  | 'entity_disambiguation' // "Which 'chorus' — Chorus 1 or Chorus 2?"
  | 'constraint_scope'    // "Preserve the melody in just this section or globally?"
  | 'action_type'         // "Do you want to inspect, preview, or apply?"
  | 'multiple_axes';      // "This could affect [axis A] or [axis B] — which?"

/**
 * A candidate interpretation of an ambiguous utterance.
 */
export interface AmbiguityCandidate {
  /** Short label for this interpretation. */
  readonly label: string;
  /** What CPL this interpretation would produce (summary). */
  readonly cplSummary: string;
  /** What the edit would actually do (plain English). */
  readonly editDescription: string;
}

/**
 * A single ambiguity test case.
 */
export interface AmbiguityTestCase {
  /** Unique ID. */
  readonly id: AmbiguityTestId;
  /** The ambiguous utterance. */
  readonly utterance: string;
  /** Type(s) of ambiguity present. */
  readonly ambiguityTypes: readonly AmbiguityType[];
  /** Expected clarification shape(s). */
  readonly clarificationShapes: readonly ClarificationShape[];
  /** The candidate interpretations (at least 2). */
  readonly candidates: readonly AmbiguityCandidate[];
  /** Why auto-resolving this would be unsafe. */
  readonly unsafetyReason: string;
  /** Optional project context that makes the ambiguity arise. */
  readonly requiredContext: string | undefined;
  /** Notes for test authors. */
  readonly notes: string;
}


// =============================================================================
// Helpers
// =============================================================================

function atc(
  id: string,
  utterance: string,
  ambiguityTypes: readonly AmbiguityType[],
  clarificationShapes: readonly ClarificationShape[],
  candidates: readonly AmbiguityCandidate[],
  unsafetyReason: string,
  notes: string,
  requiredContext?: string,
): AmbiguityTestCase {
  return {
    id: ambiguityTestId(id),
    utterance,
    ambiguityTypes,
    clarificationShapes,
    candidates,
    unsafetyReason,
    requiredContext: requiredContext ?? undefined,
    notes,
  };
}

function cand(
  label: string,
  cplSummary: string,
  editDescription: string,
): AmbiguityCandidate {
  return { label, cplSummary, editDescription };
}


// =============================================================================
// Category 1: Lexical / Axis Polysemy Ambiguities
// Words that map to multiple perceptual axes or mechanisms
// =============================================================================

export const LEXICAL_AMBIGUITIES: readonly AmbiguityTestCase[] = [

  atc('amb-lex-001',
    'Make it darker',
    ['lexical', 'axis_polysemy'],
    ['axis_sense'],
    [
      cand('Timbre/spectral', 'decrease(brightness)', 'Roll off high frequencies, reduce spectral energy above 2kHz'),
      cand('Harmonic', 'change(harmony, darker_voicings)', 'Use minor substitutions, lower extensions, darker chord voicings'),
      cand('Register', 'decrease(register)', 'Shift parts to lower octaves'),
      cand('Textural', 'decrease(brightness) + decrease(busyness)', 'Reduce high-frequency layers and thin upper arrangement'),
    ],
    'These produce very different edits: EQ vs reharmonization vs octave shifting vs arrangement thinning',
    '"Darker" is the canonical example of axis polysemy in music production',
  ),

  atc('amb-lex-002',
    'Make it bigger',
    ['lexical', 'axis_polysemy'],
    ['axis_sense'],
    [
      cand('Width/stereo', 'increase(width)', 'Widen stereo image, add spatial effects'),
      cand('Energy/loudness', 'increase(energy)', 'Increase overall level and intensity'),
      cand('Density', 'increase(density)', 'Add more layers, double parts, fill arrangement'),
      cand('Low-end weight', 'increase(impact)', 'Add sub-bass weight and low-end presence'),
    ],
    '"Bigger" is critically ambiguous: width vs loudness vs density vs weight are very different edits',
    'One of the most common vague adjectives in studio communication',
  ),

  atc('amb-lex-003',
    'Make it warmer',
    ['lexical', 'axis_polysemy'],
    ['axis_sense'],
    [
      cand('Spectral warmth', 'increase(warmth)', 'Boost low-mids, reduce harsh high frequencies'),
      cand('Harmonic warmth', 'change(harmony, warmer)', 'Add 3rds, 6ths, use warmer voicings'),
      cand('Saturation', 'add(saturation)', 'Add analog-style harmonic distortion/saturation'),
    ],
    'Spectral EQ vs harmonic changes vs saturation are entirely different signal paths',
    '"Warm" spans timbre, harmony, and processing domains',
  ),

  atc('amb-lex-004',
    'Bring it in earlier',
    ['temporal', 'structural'],
    ['temporal_scale'],
    [
      cand('Song form (macro)', 'shift(scope, earlier_in_form)', 'Move the section/element to an earlier point in song structure'),
      cand('Within bar (micro)', 'shift(timing, earlier_in_beat)', 'Shift the note/event earlier within its bar/beat'),
    ],
    'Moving a section 8 bars earlier is drastically different from shifting microtiming by ticks',
    'Classic macro vs micro temporal ambiguity',
  ),

  atc('amb-lex-005',
    'Tighten it up',
    ['lexical', 'axis_polysemy'],
    ['axis_sense'],
    [
      cand('Groove tightness', 'increase(groove_tightness)', 'Quantize closer to grid, reduce timing variance'),
      cand('Dynamic tightness', 'increase(dynamic_control)', 'Compress dynamics, reduce level variation'),
      cand('Arrangement tightness', 'decrease(busyness)', 'Remove extraneous parts, simplify'),
      cand('Mix tightness', 'decrease(width) + decrease(reverb)', 'Tighten stereo image, reduce spatial effects'),
    ],
    'Timing quantization vs compression vs arrangement editing vs mix narrowing',
    '"Tighten" is heavily context-dependent across production domains',
  ),

  atc('amb-lex-006',
    'Clean it up',
    ['lexical', 'axis_polysemy'],
    ['mechanism_choice'],
    [
      cand('Timing cleanup', 'increase(groove_tightness)', 'Quantize timing, fix sloppy notes'),
      cand('Mix cleanup', 'decrease(muddiness)', 'EQ cleanup, remove frequency masking'),
      cand('Arrangement cleanup', 'decrease(busyness)', 'Remove unnecessary elements'),
      cand('Noise cleanup', 'remove(noise)', 'Remove audio artifacts, hiss, clicks'),
    ],
    'Each interpretation affects entirely different aspects of the project',
    '"Clean up" is one of the vaguest production directives',
  ),

  atc('amb-lex-007',
    'Make it more open',
    ['lexical', 'axis_polysemy'],
    ['axis_sense'],
    [
      cand('Voicing openness', 'change(harmony, open_voicings)', 'Use wider interval spacing in chords'),
      cand('Spatial openness', 'increase(width) + increase(depth)', 'Widen stereo and add spatial depth'),
      cand('Arrangement openness', 'decrease(density)', 'Create more space between elements'),
    ],
    'Harmonic voicing vs spatial/mix vs arrangement density are different changes',
    '"Open" bridges harmony, production, and arrangement vocabularies',
  ),

  atc('amb-lex-008',
    'Make it heavier',
    ['lexical', 'axis_polysemy'],
    ['axis_sense'],
    [
      cand('Low-end weight', 'increase(impact) + increase(low_end)', 'Add sub-bass, boost low frequencies'),
      cand('Distortion/aggression', 'increase(aggression)', 'Add distortion, harder transients'),
      cand('Density/fullness', 'increase(density)', 'Fill out the arrangement with more parts'),
      cand('Rhythmic heaviness', 'increase(groove_weight)', 'Accent downbeats, heavier kick pattern'),
    ],
    '"Heavier" spans spectral, distortion, arrangement, and rhythmic domains',
    'Common in rock/metal/electronic production',
  ),

  atc('amb-lex-009',
    'Make it smoother',
    ['lexical', 'axis_polysemy'],
    ['axis_sense'],
    [
      cand('Spectral smoothness', 'decrease(harshness)', 'Reduce harsh frequencies, EQ smoothing'),
      cand('Timing smoothness', 'increase(legato)', 'More connected note transitions, less staccato'),
      cand('Dynamic smoothness', 'decrease(dynamic_range)', 'Compress, reduce dynamic jumps'),
      cand('Transition smoothness', 'change(transitions, smoother)', 'Add crossfades, soften section transitions'),
    ],
    'EQ vs articulation vs compression vs transitions are different edits',
    '"Smooth" applies across multiple production dimensions',
  ),

  atc('amb-lex-010',
    'Make it fuller',
    ['lexical', 'axis_polysemy'],
    ['axis_sense'],
    [
      cand('Frequency fullness', 'increase(fullness)', 'Fill spectral gaps, boost harmonics'),
      cand('Arrangement fullness', 'increase(density)', 'Add layers, double parts'),
      cand('Harmonic fullness', 'change(harmony, richer)', 'Use richer voicings, add extensions'),
      cand('Low-end fullness', 'increase(low_end)', 'Boost bass frequencies'),
    ],
    '"Fuller" could mean spectral EQ, arrangement, harmony, or bass emphasis',
    'Very common request in mixing sessions',
  ),

  atc('amb-lex-011',
    'It needs more space',
    ['lexical', 'axis_polysemy'],
    ['axis_sense'],
    [
      cand('Reverb/spatial', 'increase(depth)', 'Add reverb, increase spatial effects'),
      cand('Arrangement space', 'decrease(density)', 'Thin out arrangement, remove elements'),
      cand('Stereo space', 'increase(width)', 'Widen stereo image'),
      cand('Dynamic space', 'increase(dynamic_range)', 'More quiet moments, less compression'),
    ],
    '"Space" is one of the most overloaded terms in music production',
    'Reverb vs thinning vs widening vs dynamics are very different',
  ),

  atc('amb-lex-012',
    'Make it more aggressive',
    ['lexical', 'axis_polysemy'],
    ['mechanism_choice'],
    [
      cand('Distortion/saturation', 'increase(aggression)', 'Add distortion, drive, saturation'),
      cand('Transient aggression', 'increase(impact)', 'Sharper transients, harder attack'),
      cand('Tempo/energy', 'increase(energy) + increase(tempo)', 'Faster, more energetic'),
      cand('Harmonic aggression', 'change(harmony, dissonant)', 'More dissonant intervals, tritones'),
    ],
    'Distortion vs transients vs tempo vs harmony serve "aggressive" very differently',
    'Genre-dependent: aggressive in metal ≠ aggressive in techno',
  ),
];


// =============================================================================
// Category 2: Scope Ambiguities
// Unclear what section, layer, or range is targeted
// =============================================================================

export const SCOPE_AMBIGUITIES: readonly AmbiguityTestCase[] = [

  atc('amb-scope-001',
    'Make the chorus brighter',
    ['scope', 'entity'],
    ['entity_disambiguation'],
    [
      cand('Chorus 1', 'change(scope=chorus_1, brightness, increase)', 'Brighten only the first chorus'),
      cand('Chorus 2', 'change(scope=chorus_2, brightness, increase)', 'Brighten only the second chorus'),
      cand('All choruses', 'change(scope=all_choruses, brightness, increase)', 'Brighten every chorus section'),
    ],
    'If a project has multiple choruses, "the chorus" is genuinely ambiguous',
    'Requires project context with ≥2 chorus sections',
    'Project has Chorus 1 (bars 17-32) and Chorus 2 (bars 49-64)',
  ),

  atc('amb-scope-002',
    'Turn down the drums',
    ['scope'],
    ['scope_layer'],
    [
      cand('Drum bus/group', 'decrease(drums_group, volume)', 'Turn down the entire drum group'),
      cand('Kick only', 'decrease(kick, volume)', 'Turn down only the kick drum'),
      cand('All percussion tracks', 'decrease(all_percussion, volume)', 'Turn down every percussion track individually'),
    ],
    'If drums are spread across multiple tracks, "the drums" may need clarification',
    'Common in projects with separate kick/snare/hats/overheads tracks',
    'Project has: Kick, Snare, Hats, Overheads, Percussion tracks',
  ),

  atc('amb-scope-003',
    'Add reverb',
    ['scope'],
    ['scope_layer'],
    [
      cand('To the selected track', 'add_effect(selection, reverb)', 'Add reverb to whatever is selected'),
      cand('To the vocal', 'add_effect(vocal, reverb)', 'Add reverb to the vocal track'),
      cand('To the whole mix', 'add_effect(master, reverb)', 'Add reverb on the master bus'),
      cand('To the last-edited track', 'add_effect(last_edited, reverb)', 'Add reverb to most recent focus'),
    ],
    'Without a clear target, adding an effect could go anywhere',
    'No UI selection, no recent edit context, and multiple tracks exist',
    'No current selection or recent edit history',
  ),

  atc('amb-scope-004',
    'Delete the notes',
    ['scope', 'referential'],
    ['scope_range', 'referent_binding'],
    [
      cand('Selected notes', 'delete(selection)', 'Delete currently selected notes'),
      cand('All notes in view', 'delete(visible_range)', 'Delete all notes in current view'),
      cand('All notes in track', 'delete(current_track, all)', 'Delete all notes on the current track'),
    ],
    'Deleting is destructive — wrong scope could wipe wanted material',
    '"The notes" with no qualifier is dangerously scope-ambiguous for destructive operations',
    'Multiple tracks visible, some notes selected, some not',
  ),

  atc('amb-scope-005',
    'Move it up',
    ['scope', 'temporal', 'structural'],
    ['structural_reading', 'scope_layer'],
    [
      cand('Pitch up', 'transpose(scope, up, moderate)', 'Transpose selected notes/section up'),
      cand('Earlier in timeline', 'shift(scope, earlier)', 'Move the section earlier in the arrangement'),
      cand('Higher in track order', 'reorder(scope, up)', 'Move the track higher in the mixer/track list'),
    ],
    '"Up" is directionally ambiguous: pitch vs time vs visual position',
    'Without context, "up" could mean pitch, time, or visual position',
  ),
];


// =============================================================================
// Category 3: Referential Ambiguities
// Pronouns/demonstratives that could bind to multiple things
// =============================================================================

export const REFERENTIAL_AMBIGUITIES: readonly AmbiguityTestCase[] = [

  atc('amb-ref-001',
    'Make it louder',
    ['referential'],
    ['referent_binding'],
    [
      cand('Last focused track', 'increase(last_focused, volume)', 'Increase volume of the most recently focused track'),
      cand('Overall mix', 'increase(master, volume)', 'Increase master output level'),
      cand('Current selection', 'increase(selection, velocity)', 'Increase velocity of selected notes'),
    ],
    '"It" without clear antecedent could be any of these in a complex session',
    'Ambiguous when no recent dialogue history provides an antecedent for "it"',
    'No recent dialogue turns, multiple tracks, no selection',
  ),

  atc('amb-ref-002',
    'Do that again',
    ['referential', 'pragmatic'],
    ['referent_binding'],
    [
      cand('Last edit action', 'replay(last_edit)', 'Repeat the most recent edit package'),
      cand('Last dialogue intent', 'replay(last_intent)', 'Re-execute the last parsed intent on same scope'),
      cand('Last plan step', 'replay(last_plan_step)', 'Repeat only the final step of the last multi-step plan'),
    ],
    'If the last operation was multi-step, "that" is ambiguous between whole and part',
    'Requires disambiguation when last operation was a compound edit',
    'Last operation was a 3-step plan: quantize + EQ + compress on drums',
  ),

  atc('amb-ref-003',
    'Change that',
    ['referential'],
    ['referent_binding'],
    [
      cand('Last mentioned entity', 'change(last_mentioned)', 'Modify the most recently discussed element'),
      cand('UI selection', 'change(selection)', 'Modify what is currently selected in the UI'),
      cand('Last viewed section', 'change(last_viewed)', 'Modify the section currently in view'),
    ],
    'Without clear referent, could target any salient entity',
    '"That" requires salience resolution across multiple contexts',
    'Dialogue mentioned "the vocal", UI shows drums selected, timeline shows chorus',
  ),

  atc('amb-ref-004',
    'Copy it there',
    ['referential', 'scope'],
    ['referent_binding', 'scope_range'],
    [
      cand('Selection → clicked position', 'copy(selection, click_pos)', 'Copy selected material to the clicked location'),
      cand('Last edited → current view', 'copy(last_edited, current_view)', 'Copy last edited material to current view position'),
    ],
    'Both "it" (source) and "there" (destination) need resolution',
    'Double deictic reference with no clear antecedents',
    'Multiple possible sources and destinations',
  ),

  atc('amb-ref-005',
    'Apply the same changes to the other one',
    ['referential', 'entity'],
    ['referent_binding', 'entity_disambiguation'],
    [
      cand('Other chorus', 'replay(last_edit, other_chorus)', 'Apply last edit to the other chorus section'),
      cand('Other verse', 'replay(last_edit, other_verse)', 'Apply last edit to the other verse section'),
      cand('Other track', 'replay(last_edit, other_track)', 'Apply last edit to the paired/complementary track'),
    ],
    '"The other one" requires knowing what set "this one" belongs to',
    'Requires inference about what category the current target belongs to',
    'Just edited Chorus 1; project has Chorus 2, Verse 2, and a second guitar track',
  ),
];


// =============================================================================
// Category 4: Structural Ambiguities
// Phrase structure allows multiple readings
// =============================================================================

export const STRUCTURAL_AMBIGUITIES: readonly AmbiguityTestCase[] = [

  atc('amb-struct-001',
    'Make the bass and drums tighter in the chorus',
    ['structural'],
    ['structural_reading'],
    [
      cand('(bass AND drums) in chorus', 'tighten([bass, drums], chorus)',
        'Tighten both bass and drums within the chorus'),
      cand('bass AND (drums in chorus)', 'tighten(bass, global) + tighten(drums, chorus)',
        'Tighten bass everywhere, tighten drums only in chorus'),
    ],
    'Scope attachment ambiguity: does "in the chorus" modify both or only drums?',
    'Classic PP-attachment ambiguity in coordinate structures',
  ),

  atc('amb-struct-002',
    'Remove the reverb and delay on the vocal',
    ['structural'],
    ['structural_reading'],
    [
      cand('Remove (reverb AND delay) on vocal', 'remove([reverb, delay], vocal)',
        'Remove both effects from the vocal'),
      cand('Remove reverb everywhere AND delay on vocal', 'remove(reverb, global) + remove(delay, vocal)',
        'Remove all reverb, remove delay only from vocal'),
    ],
    'Scope of "on the vocal" could modify both or only the second conjunct',
    'Conjunction + PP scope ambiguity',
  ),

  atc('amb-struct-003',
    'Only change the rhythm in the verse',
    ['structural'],
    ['structural_reading', 'constraint_scope'],
    [
      cand('"Only" focuses on "rhythm"', 'change(rhythm, verse) + preserve(everything_else)',
        'In the verse, change only the rhythm (keep melody, harmony, etc.)'),
      cand('"Only" focuses on "in the verse"', 'change(rhythm, only_verse)',
        'Change the rhythm but only in the verse (not other sections)'),
    ],
    '"Only" is a focus-sensitive operator with scope ambiguity',
    'Focus sensitivity: does "only" restrict the target or the scope?',
  ),

  atc('amb-struct-004',
    'Don\'t change the melody or the rhythm',
    ['structural'],
    ['structural_reading'],
    [
      cand('Don\'t (change melody or rhythm)', 'preserve(melody) + preserve(rhythm)',
        'Preserve both melody and rhythm (neither should change)'),
      cand('(Don\'t change melody) or (the rhythm)', 'preserve(melody) + unspecified(rhythm)',
        'Preserve melody; "the rhythm" is a separate, possibly unrelated phrase'),
    ],
    'Negation scope over conjunction is structurally ambiguous',
    'In practice the first reading is almost always intended, but the parser must verify',
  ),

  atc('amb-struct-005',
    'I want it to sound like a bigger, darker version of what we had before',
    ['structural', 'referential', 'lexical'],
    ['axis_sense', 'referent_binding'],
    [
      cand('Bigger AND darker vs before', 'increase(size) + decrease(brightness) relative_to(previous)',
        'Both "bigger" and "darker" relative to previous state'),
      cand('Bigger-darker as compound quality', 'set(mood, big_dark) relative_to(previous)',
        'A single compound aesthetic target'),
    ],
    'Multiple adjectives + "before" reference compound the ambiguity',
    'Stacked adjectives with referential comparison',
    'Previous state exists in edit history',
  ),
];


// =============================================================================
// Category 5: Pragmatic Ambiguities
// Context-dependent interpretations, modality, speech acts
// =============================================================================

export const PRAGMATIC_AMBIGUITIES: readonly AmbiguityTestCase[] = [

  atc('amb-prag-001',
    'The bass is too loud',
    ['pragmatic', 'modal'],
    ['action_type'],
    [
      cand('Request to reduce', 'decrease(bass, volume)', 'Interpret as implicit request: turn down the bass'),
      cand('Observation/complaint', 'inspect(bass, volume)', 'Interpret as observation — show current level, don\'t change'),
    ],
    'A descriptive statement could be an implicit request or just an observation',
    'Indirect speech acts: statements as requests (or not)',
  ),

  atc('amb-prag-002',
    'What if we added strings?',
    ['pragmatic', 'modal'],
    ['action_type'],
    [
      cand('Counterfactual exploration', 'preview(add_layer(strings))', 'Show what it would look like with strings, without applying'),
      cand('Request to add', 'add_layer(strings)', 'Interpret as a softened request to add strings'),
    ],
    '"What if" could be counterfactual exploration or hedged request',
    'Modal subordination: is this hypothetical or a softened directive?',
  ),

  atc('amb-prag-003',
    'Maybe try making it brighter?',
    ['pragmatic', 'modal'],
    ['action_type'],
    [
      cand('Tentative suggestion', 'preview(increase(brightness))', 'Preview brightness increase without committing'),
      cand('Polite request', 'increase(brightness)', 'Apply brightness increase (hedging is just politeness)'),
    ],
    'Hedging markers ("maybe", "try") could indicate uncertainty or just politeness',
    'Distinguishing genuine uncertainty from social hedging',
  ),

  atc('amb-prag-004',
    'Can you show me the chords?',
    ['modal'],
    ['action_type'],
    [
      cand('Inspect chords', 'inspect(chords)', 'Display chord analysis of current section'),
      cand('Make chords visible in UI', 'show(chord_track)', 'Show/unhide the chord track in the editor'),
      cand('Play back chords only', 'solo(chords)', 'Isolate and play back just the chord part'),
    ],
    '"Show" could mean display data, reveal in UI, or isolate for playback',
    'Multiple senses of "show" in a music production context',
  ),

  atc('amb-prag-005',
    'I liked what we had before better',
    ['pragmatic', 'referential'],
    ['referent_binding', 'action_type'],
    [
      cand('Undo request', 'undo(last_edit)', 'Revert to previous state'),
      cand('Comparison observation', 'compare(current, previous)', 'Show a comparison but don\'t revert'),
      cand('Preference statement', 'set_preference(prefer_previous)', 'Note the preference for future reference'),
    ],
    'Could be an undo request, a comparison request, or just a logged preference',
    'Preference expressions as indirect speech acts',
    'Previous edit history exists with at least one undo-able state',
  ),

  atc('amb-prag-006',
    'Keep going',
    ['pragmatic', 'referential'],
    ['referent_binding'],
    [
      cand('Continue same edits to next section', 'extend(last_edit, next_section)',
        'Apply the same changes to the next section in sequence'),
      cand('Continue iterating on same target', 'repeat(last_intent)',
        'Apply the same change again (more of the same)'),
      cand('Approval of current state', 'confirm(current_state)',
        'Acknowledge current state and proceed to next task'),
    ],
    '"Keep going" requires knowing what the current activity/direction is',
    'Highly context-dependent directive',
    'In the middle of iterative edits across sections',
  ),
];


// =============================================================================
// Category 6: Constraint / Preservation Ambiguities
// Unclear what mode or scope of preservation is intended
// =============================================================================

export const CONSTRAINT_AMBIGUITIES: readonly AmbiguityTestCase[] = [

  atc('amb-con-001',
    'Keep the melody',
    ['constraint'],
    ['preservation_mode'],
    [
      cand('Exact preservation', 'preserve(melody, exact)', 'Keep every note pitch and timing identical'),
      cand('Functional preservation', 'preserve(melody, functional)', 'Keep melodic contour and harmonic function but allow adaptation'),
      cand('Recognizable preservation', 'preserve(melody, recognizable)', 'Keep it recognizable but allow embellishment and variation'),
    ],
    'The strictness of "keep" matters enormously for what edits are allowed',
    '"Keep" without qualification is ambiguous across preservation modes',
  ),

  atc('amb-con-002',
    'Don\'t change too much',
    ['constraint', 'degree'],
    ['degree_amount'],
    [
      cand('Minimal changes only', 'preference(least_change, strong)', 'Only allow the smallest possible edits'),
      cand('Moderate constraint', 'preference(least_change, moderate)', 'Allow moderate changes but prefer smaller ones'),
    ],
    '"Too much" is inherently vague — users have different thresholds',
    'Degree of constraint is critically underspecified',
  ),

  atc('amb-con-003',
    'Keep the chords but make it more interesting',
    ['constraint', 'lexical'],
    ['preservation_mode', 'mechanism_choice'],
    [
      cand('Keep exact chords, change rhythm/voicing', 'preserve(chords, exact) + increase(interest, via=rhythm)',
        'Same chords but more rhythmic interest'),
      cand('Keep chord function, allow substitutions', 'preserve(chords, functional) + increase(interest, via=harmony)',
        'Allow chord substitutions that maintain function'),
      cand('Keep chords, add layers', 'preserve(chords, exact) + increase(interest, via=arrangement)',
        'Same chords but add new elements around them'),
    ],
    '"Keep the chords" + "more interesting" creates tension — what can change?',
    'Constraint vs goal tension requiring mechanism clarification',
  ),

  atc('amb-con-004',
    'Preserve the feel but change the sound',
    ['constraint', 'lexical'],
    ['axis_sense', 'preservation_mode'],
    [
      cand('Keep groove, change timbre', 'preserve(groove) + change(timbre)',
        'Preserve rhythm/timing, change instrument sounds'),
      cand('Keep energy, change arrangement', 'preserve(energy) + change(arrangement)',
        'Preserve energy level, restructure the arrangement'),
      cand('Keep emotion, change production', 'preserve(mood) + change(production)',
        'Preserve emotional quality, change production techniques'),
    ],
    '"Feel" and "sound" are both vague terms — their boundary is unclear',
    '"Feel" vs "sound" distinction is notoriously ambiguous in production',
  ),

  atc('amb-con-005',
    'Make it sound like a different song but keep it recognizable',
    ['constraint', 'degree'],
    ['preservation_mode', 'degree_amount'],
    [
      cand('Major rearrangement', 'change(arrangement, major) + preserve(melody, recognizable)',
        'Restructure arrangement but keep melodic identity'),
      cand('Genre shift', 'change(genre) + preserve(structure, recognizable)',
        'Change genre/style but keep song structure'),
      cand('Remix-level changes', 'change(everything, large) + preserve(hooks, recognizable)',
        'Allow extensive changes but keep signature hooks'),
    ],
    'These are contradictory goals that need explicit resolution',
    'Paradoxical request requiring explicit negotiation of boundaries',
  ),
];


// =============================================================================
// Category 7: Temporal Ambiguities
// Time references with multiple scales or interpretations
// =============================================================================

export const TEMPORAL_AMBIGUITIES: readonly AmbiguityTestCase[] = [

  atc('amb-temp-001',
    'Shift it forward',
    ['temporal'],
    ['temporal_scale'],
    [
      cand('Later in song form', 'shift(scope, later_in_form)', 'Move section/material later in the arrangement'),
      cand('Forward in time within bar', 'shift(scope, later_in_beat)', 'Push notes slightly later (behind the beat)'),
    ],
    'Macro (arrangement) vs micro (groove) timing shift',
    '"Forward" in time is ambiguous between arrangement and microtiming',
  ),

  atc('amb-temp-002',
    'Start it sooner',
    ['temporal', 'scope'],
    ['temporal_scale', 'scope_section'],
    [
      cand('Section starts earlier', 'shift(section, earlier)', 'Move the section start point earlier in the arrangement'),
      cand('Notes start earlier', 'shift(notes, earlier)', 'Shift note onsets earlier within their bar'),
      cand('Instrument entry earlier', 'shift(entry_point, earlier)', 'Bring in the instrument at an earlier section'),
    ],
    '"Sooner" could mean arrangement position, microtiming, or entry point',
    'Three-way ambiguity across temporal scales',
  ),

  atc('amb-temp-003',
    'Make it last longer',
    ['temporal', 'structural'],
    ['structural_reading'],
    [
      cand('Extend section duration', 'extend(section, longer)', 'Make the section more bars long'),
      cand('Longer note sustain', 'increase(sustain)', 'Make notes sustain longer'),
      cand('Slower decay/release', 'increase(release)', 'Longer release time on sounds'),
    ],
    '"Last longer" could apply to form, notes, or envelope',
    'Duration ambiguity across structural levels',
  ),
];


// =============================================================================
// Category 8: Quantifier / Distribution Ambiguities
// =============================================================================

export const QUANTIFIER_AMBIGUITIES: readonly AmbiguityTestCase[] = [

  atc('amb-quant-001',
    'Change every other note',
    ['quantifier', 'scope'],
    ['structural_reading'],
    [
      cand('By position (1st, 3rd, 5th...)', 'select(notes, every_other_from_start)',
        'Modify notes at positions 1, 3, 5... (odd positions)'),
      cand('By position (2nd, 4th, 6th...)', 'select(notes, every_other_from_second)',
        'Modify notes at positions 2, 4, 6... (even positions)'),
    ],
    'Starting position of "every other" is ambiguous',
    'Off-by-one ambiguity in quantifier interpretation',
  ),

  atc('amb-quant-002',
    'Move some of the notes up',
    ['quantifier', 'scope'],
    ['scope_range', 'degree_amount'],
    [
      cand('A few random notes', 'transpose(random_subset, up)', 'Select and raise a few notes'),
      cand('The selected notes', 'transpose(selection, up)', 'Raise whatever is currently selected'),
      cand('Some specific notes (unspecified)', 'clarify(which_notes)', 'Need to know which specific notes'),
    ],
    '"Some" is indeterminate — the system cannot know which notes without more info',
    'Vague quantifier with no clear selection criterion',
  ),
];


// =============================================================================
// Aggregate export
// =============================================================================

/**
 * All ambiguity test cases across all categories.
 */
export const ALL_AMBIGUITY_TESTS: readonly AmbiguityTestCase[] = [
  ...LEXICAL_AMBIGUITIES,
  ...SCOPE_AMBIGUITIES,
  ...REFERENTIAL_AMBIGUITIES,
  ...STRUCTURAL_AMBIGUITIES,
  ...PRAGMATIC_AMBIGUITIES,
  ...CONSTRAINT_AMBIGUITIES,
  ...TEMPORAL_AMBIGUITIES,
  ...QUANTIFIER_AMBIGUITIES,
];

/**
 * Get an ambiguity test case by ID.
 */
export function getAmbiguityTest(id: AmbiguityTestId): AmbiguityTestCase | undefined {
  return ALL_AMBIGUITY_TESTS.find(tc => tc.id === id);
}

/**
 * Get all ambiguity tests of a given type.
 */
export function getAmbiguityTestsByType(type: AmbiguityType): readonly AmbiguityTestCase[] {
  return ALL_AMBIGUITY_TESTS.filter(tc => tc.ambiguityTypes.includes(type));
}

/**
 * Total count of ambiguity test cases.
 */
export function ambiguityTestCount(): number {
  return ALL_AMBIGUITY_TESTS.length;
}

/**
 * Validate that every test case has at least 2 candidates.
 */
export function validateAmbiguityTests(): readonly string[] {
  const violations: string[] = [];
  for (const tc of ALL_AMBIGUITY_TESTS) {
    if (tc.candidates.length < 2) {
      violations.push(`${tc.id}: has ${tc.candidates.length} candidates, needs >= 2`);
    }
    if (tc.ambiguityTypes.length === 0) {
      violations.push(`${tc.id}: has no ambiguity types tagged`);
    }
    if (tc.clarificationShapes.length === 0) {
      violations.push(`${tc.id}: has no clarification shapes specified`);
    }
  }
  return violations;
}
