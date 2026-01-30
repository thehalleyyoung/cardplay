/**
 * GOFAI Eval Paraphrase Suite — Batch 2 (Seeds 031–050)
 *
 * Step 029 [Eval] continued: Paraphrases for seeds 031–050, covering
 * mute/solo, panning, doubling, filtering, articulation, humanize,
 * quantize, perceptual goals, production edits, and tempo/key changes.
 *
 * @module gofai/eval/paraphrase-suite-batch2
 */

import { seedExampleId } from './seed-dataset';
import {
  type ParaphraseSet,
  type Paraphrase,
  paraphraseId,
  type VariationType,
} from './paraphrase-suite';

// =============================================================================
// Helpers (re-declared locally for independence)
// =============================================================================

function p(
  id: string,
  text: string,
  variations: readonly VariationType[],
  note?: string,
): Paraphrase {
  return {
    id: paraphraseId(id),
    text,
    variations,
    note: note ?? undefined,
  };
}

function pset(
  seedId: string,
  originalInstruction: string,
  paraphrases: readonly Paraphrase[],
): ParaphraseSet {
  return {
    seedId: seedExampleId(seedId),
    originalInstruction,
    paraphrases,
  };
}


// =============================================================================
// Batch 4: Paraphrases for Seed Examples 031–040
// (Mute/Solo, panning, doubling, filtering, articulation)
// =============================================================================

export const PARAPHRASE_BATCH_4: readonly ParaphraseSet[] = [

  // --- seed-031: "Mute the hats" ---
  pset('seed-031', 'Mute the hats', [
    p('para-031-01', 'Kill the hats',
      ['jargon_variant'],
      '"Kill" = mute in studio slang'),
    p('para-031-02', 'Turn off the hi-hats',
      ['lexical_substitution'],
      '"Turn off" = mute; "hi-hats" = "hats"'),
    p('para-031-03', 'Silence the hats',
      ['lexical_substitution'],
      '"Silence" = mute'),
    p('para-031-04', 'Cut the hi-hats',
      ['jargon_variant', 'lexical_substitution'],
      '"Cut" in mixer context = mute'),
    p('para-031-05', 'I don\'t want to hear the hats',
      ['voice_change', 'negation_flip', 'elaboration'],
      'First-person negative desire → mute'),
    p('para-031-06', 'Take the hats out',
      ['jargon_variant'],
      '"Take out" = mute/remove from mix'),
    p('para-031-07', 'No hats',
      ['ellipsis'],
      'Minimal imperative'),
  ]),

  // --- seed-032: "Solo the bass" ---
  pset('seed-032', 'Solo the bass', [
    p('para-032-01', 'I want to hear just the bass',
      ['voice_change', 'elaboration'],
      'First-person + "just" scope restriction'),
    p('para-032-02', 'Isolate the bass',
      ['lexical_substitution'],
      '"Isolate" = solo'),
    p('para-032-03', 'Only the bass, please',
      ['ellipsis', 'hedging'],
      'Minimal with scope restriction'),
    p('para-032-04', 'Mute everything except the bass',
      ['compound_rephrasing'],
      'Inverse framing: mute all others'),
    p('para-032-05', 'Let me hear the bass by itself',
      ['voice_change', 'elaboration'],
      'First-person + isolation phrasing'),
    p('para-032-06', 'Bass only',
      ['ellipsis'],
      'Terse two-word command'),
  ]),

  // --- seed-033: "Pan the lead guitar to the right" ---
  pset('seed-033', 'Pan the lead guitar to the right', [
    p('para-033-01', 'Move the lead guitar to the right side',
      ['lexical_substitution', 'elaboration'],
      '"Move" = pan; "right side" = right'),
    p('para-033-02', 'Put the lead guitar on the right',
      ['lexical_substitution'],
      '"Put on" = pan to'),
    p('para-033-03', 'Hard right on the lead guitar',
      ['jargon_variant', 'ellipsis'],
      '"Hard right" = pan fully right; may need amount clarification'),
    p('para-033-04', 'Pan the lead right',
      ['ellipsis'],
      'Dropping "guitar" — common abbreviation'),
    p('para-033-05', 'I want the lead guitar on the right',
      ['voice_change'],
      'First-person desire'),
    p('para-033-06', 'Shift the lead guitar to the right channel',
      ['lexical_substitution', 'elaboration'],
      '"Channel" = stereo position'),
  ]),

  // --- seed-034: "Double the vocal part" ---
  pset('seed-034', 'Double the vocal part', [
    p('para-034-01', 'Add a double on the vocal',
      ['nominalization', 'lexical_substitution'],
      '"A double" = doubling as noun'),
    p('para-034-02', 'Duplicate the vocal',
      ['lexical_substitution'],
      '"Duplicate" = double'),
    p('para-034-03', 'Layer another vocal on top',
      ['jargon_variant', 'elaboration'],
      '"Layer on top" = double'),
    p('para-034-04', 'I want the vocal doubled',
      ['voice_change', 'passive_construction'],
      'Passive form of doubling'),
    p('para-034-05', 'Stack the vocals',
      ['jargon_variant'],
      '"Stack" = layer/double in production'),
    p('para-034-06', 'Add a vocal double track',
      ['elaboration', 'jargon_variant'],
      'Explicit "double track" concept'),
  ]),

  // --- seed-035: "Bring up the kick" ---
  pset('seed-035', 'Bring up the kick', [
    p('para-035-01', 'Turn up the kick',
      ['lexical_substitution'],
      '"Turn up" = bring up'),
    p('para-035-02', 'Make the kick louder',
      ['lexical_substitution'],
      '"Louder" = higher level'),
    p('para-035-03', 'Boost the kick drum',
      ['lexical_substitution'],
      '"Boost" = increase; "kick drum" = kick'),
    p('para-035-04', 'I need more kick',
      ['voice_change', 'ellipsis'],
      'First-person need + minimal'),
    p('para-035-05', 'The kick needs to be louder',
      ['voice_change'],
      'Declarative need'),
    p('para-035-06', 'Give me more kick in the mix',
      ['jargon_variant', 'elaboration'],
      'Mix engineer phrasing'),
    p('para-035-07', 'Push the kick forward',
      ['jargon_variant', 'metaphorical'],
      '"Push forward" = make more prominent'),
  ]),

  // --- seed-036: "Cut the low end on the vocal" ---
  pset('seed-036', 'Cut the low end on the vocal', [
    p('para-036-01', 'Roll off the lows on the vocal',
      ['jargon_variant'],
      '"Roll off" = gradual cut using EQ'),
    p('para-036-02', 'High-pass the vocal',
      ['jargon_variant'],
      'Technical: HPF = cut low end'),
    p('para-036-03', 'Remove the low frequencies from the vocal',
      ['lexical_substitution', 'elaboration'],
      '"Low frequencies" = "low end"'),
    p('para-036-04', 'Filter out the bottom end of the vocal',
      ['lexical_substitution', 'jargon_variant'],
      '"Bottom end" = "low end"; "filter out" = "cut"'),
    p('para-036-05', 'The vocal has too much low end — cut it',
      ['voice_change', 'elaboration'],
      'Problem statement + action'),
    p('para-036-06', 'Take out the mud on the vocal',
      ['jargon_variant', 'metaphorical'],
      '"Mud" = unwanted low-mid frequencies'),
  ]),

  // --- seed-037: "Add a high-pass filter to the pad at 200 Hz" ---
  pset('seed-037', 'Add a high-pass filter to the pad at 200 Hz', [
    p('para-037-01', 'HPF the pad at 200',
      ['jargon_variant', 'ellipsis'],
      '"HPF" abbreviation; Hz implicit'),
    p('para-037-02', 'Put a 200 Hz high-pass on the pad',
      ['syntactic_reorder'],
      'Value-first ordering'),
    p('para-037-03', 'Filter the pad — high-pass at 200 Hz',
      ['compound_rephrasing'],
      'Two-clause form'),
    p('para-037-04', 'Cut everything below 200 Hz on the pad',
      ['lexical_substitution', 'elaboration'],
      'Describes the effect rather than the tool'),
    p('para-037-05', 'I need a high-pass at 200 on the pad track',
      ['voice_change', 'elaboration'],
      'First-person + "track" qualifier'),
    p('para-037-06', 'Roll off the pad below 200 Hz',
      ['jargon_variant'],
      '"Roll off below" = HPF at frequency'),
  ]),

  // --- seed-038: "Make the strings more legato" ---
  pset('seed-038', 'Make the strings more legato', [
    p('para-038-01', 'Smoother strings',
      ['ellipsis', 'lexical_substitution'],
      '"Smoother" ≈ more legato in phrasing'),
    p('para-038-02', 'The strings should be more connected',
      ['voice_change', 'lexical_substitution'],
      '"Connected" = legato'),
    p('para-038-03', 'Play the strings legato',
      ['lexical_substitution'],
      'Performance instruction form'),
    p('para-038-04', 'I want the strings to flow more',
      ['voice_change', 'metaphorical'],
      '"Flow" = legato quality'),
    p('para-038-05', 'Increase the sustain overlap on the strings',
      ['jargon_variant', 'elaboration'],
      'Technical: note overlap = legato'),
    p('para-038-06', 'Less staccato on the strings',
      ['negation_flip'],
      '"Less staccato" = more legato (antonym)'),
  ]),

  // --- seed-039: "Humanize the drums" ---
  pset('seed-039', 'Humanize the drums', [
    p('para-039-01', 'Make the drums more human',
      ['lexical_substitution'],
      'Adjective form: "more human"'),
    p('para-039-02', 'Add some feel to the drums',
      ['jargon_variant', 'lexical_substitution'],
      '"Feel" = humanized quality'),
    p('para-039-03', 'Loosen up the drums a bit',
      ['jargon_variant', 'degree_rephrasing'],
      '"Loosen up" implies less rigid timing'),
    p('para-039-04', 'The drums sound too robotic — add some variation',
      ['voice_change', 'elaboration'],
      'Problem statement + action'),
    p('para-039-05', 'Make the drums feel less mechanical',
      ['negation_flip'],
      '"Less mechanical" = more human'),
    p('para-039-06', 'Add micro-timing variations to the drums',
      ['jargon_variant', 'elaboration'],
      'Technical: micro-timing = humanize mechanism'),
    p('para-039-07', 'Dequantize the drums slightly',
      ['jargon_variant', 'degree_rephrasing'],
      '"Dequantize" = opposite of quantize = humanize'),
  ]),

  // --- seed-040: "Quantize the bass to sixteenth notes" ---
  pset('seed-040', 'Quantize the bass to sixteenth notes', [
    p('para-040-01', 'Snap the bass to sixteenths',
      ['jargon_variant', 'ellipsis'],
      '"Snap to" = quantize to grid'),
    p('para-040-02', 'Tighten the bass to a sixteenth-note grid',
      ['lexical_substitution', 'elaboration'],
      '"Tighten to grid" = quantize'),
    p('para-040-03', 'Lock the bass to sixteenth notes',
      ['jargon_variant'],
      '"Lock to" = quantize'),
    p('para-040-04', 'Align the bass with sixteenth notes',
      ['lexical_substitution'],
      '"Align with" = quantize to'),
    p('para-040-05', 'Make the bass sit on the sixteenth-note grid',
      ['jargon_variant', 'metaphorical'],
      '"Sit on grid" = be quantized'),
    p('para-040-06', 'I want the bass perfectly on sixteenths',
      ['voice_change', 'ellipsis'],
      'First-person + implied quantize'),
  ]),
];


// =============================================================================
// Batch 5: Paraphrases for Seed Examples 041–050
// (Perceptual goals, production edits, tempo/key, crescendo)
// =============================================================================

export const PARAPHRASE_BATCH_5: readonly ParaphraseSet[] = [

  // --- seed-041: "Give it more low-end punch" ---
  pset('seed-041', 'Give it more low-end punch', [
    p('para-041-01', 'More punch in the low end',
      ['ellipsis', 'syntactic_reorder'],
      'Minimal reorder'),
    p('para-041-02', 'Beef up the bass frequencies',
      ['jargon_variant', 'lexical_substitution'],
      '"Beef up" = add punch; "bass frequencies" = low end'),
    p('para-041-03', 'I want the lows to hit harder',
      ['voice_change', 'jargon_variant'],
      '"Hit harder" = more punch'),
    p('para-041-04', 'Make the bottom end punchier',
      ['lexical_substitution'],
      '"Bottom end" = low end; adjective form'),
    p('para-041-05', 'Add some weight and punch to the low end',
      ['elaboration', 'lexical_substitution'],
      '"Weight" reinforces low-end quality'),
    p('para-041-06', 'The low end needs more impact',
      ['voice_change', 'lexical_substitution'],
      '"Impact" ≈ punch'),
  ]),

  // --- seed-042: "Make the mix more spacious" ---
  pset('seed-042', 'Make the mix more spacious', [
    p('para-042-01', 'Open up the mix',
      ['jargon_variant', 'metaphorical'],
      '"Open up" = more spacious'),
    p('para-042-02', 'Give the mix more room',
      ['lexical_substitution', 'metaphorical'],
      '"More room" = spacious'),
    p('para-042-03', 'Widen the mix and add some air',
      ['jargon_variant', 'elaboration'],
      '"Widen" + "air" = spaciousness components'),
    p('para-042-04', 'The mix feels too cramped',
      ['voice_change', 'negation_flip'],
      '"Too cramped" → need more space'),
    p('para-042-05', 'I need more space in the mix',
      ['voice_change', 'nominalization'],
      'First-person + "space" noun'),
    p('para-042-06', 'Let the mix breathe more',
      ['jargon_variant', 'metaphorical'],
      '"Breathe" = have space in studio terminology'),
  ]),

  // --- seed-043: "Thin out the arrangement in the verse" ---
  pset('seed-043', 'Thin out the arrangement in the verse', [
    p('para-043-01', 'Strip back the verse',
      ['jargon_variant', 'ellipsis'],
      '"Strip back" = thin out'),
    p('para-043-02', 'Simplify the arrangement in the verse',
      ['lexical_substitution'],
      '"Simplify" = thin out'),
    p('para-043-03', 'Less going on in the verse, please',
      ['ellipsis', 'hedging'],
      'Informal description of thinning'),
    p('para-043-04', 'I want the verse to be sparser',
      ['voice_change', 'lexical_substitution'],
      '"Sparser" = thinner arrangement'),
    p('para-043-05', 'Pull some elements out of the verse',
      ['jargon_variant', 'elaboration'],
      '"Pull out elements" = thin out'),
    p('para-043-06', 'The verse has too much going on — reduce it',
      ['voice_change', 'elaboration'],
      'Problem statement + action'),
  ]),

  // --- seed-044: "Add swing to the hi-hats" ---
  pset('seed-044', 'Add swing to the hi-hats', [
    p('para-044-01', 'Swing the hats',
      ['ellipsis'],
      'Verb form: "swing" = add swing'),
    p('para-044-02', 'Put some swing on the hi-hats',
      ['lexical_substitution'],
      '"Put some" = add'),
    p('para-044-03', 'Give the hats a swing feel',
      ['jargon_variant'],
      '"Swing feel" is the musical quality'),
    p('para-044-04', 'I want the hi-hats to swing more',
      ['voice_change'],
      'First-person comparative'),
    p('para-044-05', 'Make the hats more swung',
      ['lexical_substitution'],
      'Past participle adjective form'),
    p('para-044-06', 'The hi-hats should be shuffled a bit',
      ['voice_change', 'jargon_variant'],
      '"Shuffled" ≈ swing in rhythm terminology'),
  ]),

  // --- seed-045: "Make the melody more memorable" ---
  pset('seed-045', 'Make the melody more memorable', [
    p('para-045-01', 'The melody needs to be catchier',
      ['voice_change', 'lexical_substitution'],
      '"Catchier" ≈ more memorable'),
    p('para-045-02', 'I want a more memorable melody',
      ['voice_change'],
      'First-person desire'),
    p('para-045-03', 'Make the melody stick more',
      ['jargon_variant', 'metaphorical'],
      '"Stick" = be memorable'),
    p('para-045-04', 'Give the melody more hook quality',
      ['jargon_variant', 'elaboration'],
      '"Hook quality" = memorability'),
    p('para-045-05', 'The melody should be more singable',
      ['voice_change', 'lexical_substitution'],
      '"Singable" maps to memorability'),
    p('para-045-06', 'Can you make the melody more ear-catching?',
      ['hedging', 'lexical_substitution'],
      'Polite + "ear-catching" = memorable'),
  ]),

  // --- seed-046: "Boost the presence of the vocal" ---
  pset('seed-046', 'Boost the presence of the vocal', [
    p('para-046-01', 'Make the vocal more present',
      ['lexical_substitution'],
      'Adjective form: "present"'),
    p('para-046-02', 'Bring the vocal forward in the mix',
      ['jargon_variant', 'metaphorical'],
      '"Forward in mix" = more presence'),
    p('para-046-03', 'The vocal needs more presence',
      ['voice_change'],
      'Declarative need'),
    p('para-046-04', 'Push the vocal out front',
      ['jargon_variant', 'metaphorical'],
      '"Out front" = prominent position'),
    p('para-046-05', 'I want the vocal to cut through more',
      ['voice_change', 'jargon_variant'],
      '"Cut through" = be audible above other elements'),
    p('para-046-06', 'Add some presence to the vocals',
      ['lexical_substitution'],
      'Noun form + plural "vocals"'),
  ]),

  // --- seed-047: "Compress the drums harder" ---
  pset('seed-047', 'Compress the drums harder', [
    p('para-047-01', 'More compression on the drums',
      ['nominalization', 'ellipsis'],
      'Noun form of effect'),
    p('para-047-02', 'Squash the drums more',
      ['jargon_variant'],
      '"Squash" = heavy compression in studio slang'),
    p('para-047-03', 'Hit the drums with more compression',
      ['jargon_variant', 'metaphorical'],
      '"Hit with" = apply more'),
    p('para-047-04', 'I want the drums more compressed',
      ['voice_change', 'passive_construction'],
      'First-person + passive'),
    p('para-047-05', 'Clamp down on the drums more',
      ['jargon_variant', 'metaphorical'],
      '"Clamp down" = compress harder'),
    p('para-047-06', 'Increase the compression ratio on the drums',
      ['jargon_variant', 'elaboration'],
      'Technical parameter reference'),
  ]),

  // --- seed-048: "Add a crescendo over the last 4 bars" ---
  pset('seed-048', 'Add a crescendo over the last 4 bars', [
    p('para-048-01', 'Build up the volume over the last 4 bars',
      ['lexical_substitution', 'elaboration'],
      '"Build up volume" = crescendo'),
    p('para-048-02', 'Gradually get louder in the last 4 bars',
      ['lexical_substitution', 'elaboration'],
      'Describes the effect: gradual volume increase'),
    p('para-048-03', 'Swell the last 4 bars',
      ['jargon_variant'],
      '"Swell" = crescendo'),
    p('para-048-04', 'Fade in the last four bars',
      ['jargon_variant'],
      '"Fade in" ≈ crescendo (directional)'),
    p('para-048-05', 'I want a volume ramp up in the final 4 bars',
      ['voice_change', 'jargon_variant', 'elaboration'],
      '"Volume ramp up" = crescendo'),
    p('para-048-06', 'The last 4 bars should crescendo',
      ['voice_change'],
      'Declarative with "crescendo" as verb'),
  ]),

  // --- seed-049: "Change the key to E minor" ---
  pset('seed-049', 'Change the key to E minor', [
    p('para-049-01', 'Set the key to E minor',
      ['lexical_substitution'],
      '"Set" = change'),
    p('para-049-02', 'Transpose to E minor',
      ['lexical_substitution'],
      '"Transpose to" = change key to'),
    p('para-049-03', 'Put it in E minor',
      ['lexical_substitution', 'ellipsis'],
      '"Put in" = set key'),
    p('para-049-04', 'I want it in Em',
      ['voice_change', 'ellipsis', 'jargon_variant'],
      '"Em" = E minor abbreviation'),
    p('para-049-05', 'Move to the key of E minor',
      ['lexical_substitution'],
      '"Move to" = change to'),
    p('para-049-06', 'E minor',
      ['ellipsis'],
      'Minimal: just the target key'),
    p('para-049-07', 'Switch the key to E minor',
      ['lexical_substitution'],
      '"Switch" = change'),
  ]),

  // --- seed-050: "Slow it down by 10 BPM" ---
  pset('seed-050', 'Slow it down by 10 BPM', [
    p('para-050-01', 'Decrease the tempo by 10 BPM',
      ['lexical_substitution'],
      '"Decrease tempo" = slow down'),
    p('para-050-02', 'Drop the tempo 10 BPM',
      ['jargon_variant', 'ellipsis'],
      '"Drop" = decrease'),
    p('para-050-03', 'Take it down 10 BPM',
      ['jargon_variant'],
      '"Take it down" = slow down'),
    p('para-050-04', 'Reduce the tempo by ten beats per minute',
      ['lexical_substitution', 'elaboration'],
      'Formal + spelled-out units'),
    p('para-050-05', 'I want it 10 BPM slower',
      ['voice_change'],
      'First-person comparative'),
    p('para-050-06', '-10 BPM',
      ['ellipsis'],
      'Terse signed numeric command'),
    p('para-050-07', 'Bring the tempo down by 10',
      ['jargon_variant', 'ellipsis'],
      '"Bring down" = decrease; BPM implicit'),
  ]),
];


// =============================================================================
// Aggregate export for Batch 2
// =============================================================================

/**
 * All paraphrase sets from Batch 2 (seeds 031–050).
 */
export const PARAPHRASE_SETS_BATCH_2: readonly ParaphraseSet[] = [
  ...PARAPHRASE_BATCH_4,
  ...PARAPHRASE_BATCH_5,
];
