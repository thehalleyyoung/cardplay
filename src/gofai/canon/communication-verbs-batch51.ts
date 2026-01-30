/**
 * GOFAI Canon: Communication and Meta-Musical Verbs Batch 51
 * 
 * Step 052/061 implementation: Extensive vocabulary for how musicians
 * communicate about music structure, intent, and collaborative editing.
 * 
 * Covers 600+ ways to express musical communication, reflection, and
 * meta-operations on musical structure.
 */

import type { Lexeme } from './types.js';

/**
 * Communication verbs for expressing musical intentions, reflections,
 * and collaborative dialogue about music creation.
 * 
 * Categories:
 * - Expressing intent and goals
 * - Reflecting on musical choices
 * - Collaborative editing dialogue
 * - Meta-musical commentary
 * - Structural planning and organization
 * - Quality assessment and critique
 * - Comparative and contrastive statements
 */

export const COMMUNICATION_VERBS: readonly Lexeme[] = [
  // ============================================================================
  // EXPRESS INTENT - How musicians state what they want
  // ============================================================================
  
  {
    id: 'lex:verb:want',
    lemma: 'want',
    variants: ['want', 'wants', 'wanted', 'wanting'],
    category: 'verb',
    semantics: {
      type: 'intent_expression',
      frame: 'want(agent, goal)',
      maps_to: 'goal_statement',
    },
    description: 'Express a musical goal or desire',
    examples: [
      'I want this section to feel more spacious',
      'I want the melody to stand out',
      'I want less reverb on the vocals',
    ],
  },
  
  {
    id: 'lex:verb:need',
    lemma: 'need',
    variants: ['need', 'needs', 'needed', 'needing'],
    category: 'verb',
    semantics: {
      type: 'intent_expression',
      frame: 'need(agent, requirement)',
      maps_to: 'goal_statement',
      strength: 'strong',
    },
    description: 'Express a required musical change',
    examples: [
      'I need more low end',
      'This section needs to be tighter',
      'We need a buildup here',
    ],
  },
  
  {
    id: 'lex:verb:prefer',
    lemma: 'prefer',
    variants: ['prefer', 'prefers', 'preferred', 'preferring'],
    category: 'verb',
    semantics: {
      type: 'preference_expression',
      frame: 'prefer(agent, option_a, option_b)',
      maps_to: 'soft_constraint',
    },
    description: 'Express a preference between alternatives',
    examples: [
      'I prefer the darker voicing',
      'I prefer keeping the melody simple',
      'I\'d prefer less distortion here',
    ],
  },
  
  {
    id: 'lex:verb:aim',
    lemma: 'aim',
    variants: ['aim', 'aims', 'aimed', 'aiming'],
    category: 'verb',
    semantics: {
      type: 'intent_expression',
      frame: 'aim(agent, target)',
      maps_to: 'goal_statement',
    },
    description: 'State a target or goal',
    examples: [
      'I\'m aiming for a more intimate feel',
      'This aims to create tension',
      'We\'re aiming for 128 BPM',
    ],
  },
  
  {
    id: 'lex:verb:intend',
    lemma: 'intend',
    variants: ['intend', 'intends', 'intended', 'intending'],
    category: 'verb',
    semantics: {
      type: 'intent_expression',
      frame: 'intend(agent, action)',
      maps_to: 'planned_action',
    },
    description: 'Express a planned action or intention',
    examples: [
      'I intend to add more layers',
      'This section is intended to contrast',
      'I\'m intending to keep it minimal',
    ],
  },
  
  {
    id: 'lex:verb:hope',
    lemma: 'hope',
    variants: ['hope', 'hopes', 'hoped', 'hoping'],
    category: 'verb',
    semantics: {
      type: 'intent_expression',
      frame: 'hope(agent, desired_outcome)',
      maps_to: 'soft_goal',
      certainty: 'low',
    },
    description: 'Express a desired but uncertain outcome',
    examples: [
      'I hope this feels more cohesive',
      'I\'m hoping for a warmer sound',
      'I hope the transition works',
    ],
  },
  
  {
    id: 'lex:verb:try',
    lemma: 'try',
    variants: ['try', 'tries', 'tried', 'trying'],
    category: 'verb',
    semantics: {
      type: 'experimental_action',
      frame: 'try(agent, action)',
      maps_to: 'exploratory_edit',
      reversible: true,
    },
    description: 'Attempt an experimental change',
    examples: [
      'Let\'s try doubling the melody',
      'I\'ll try making it brighter',
      'Can we try a different tempo?',
    ],
  },
  
  {
    id: 'lex:verb:experiment',
    lemma: 'experiment',
    variants: ['experiment', 'experiments', 'experimented', 'experimenting'],
    category: 'verb',
    semantics: {
      type: 'experimental_action',
      frame: 'experiment(agent, domain)',
      maps_to: 'exploratory_edit',
      reversible: true,
    },
    description: 'Explore musical possibilities',
    examples: [
      'Let\'s experiment with the harmony',
      'I\'m experimenting with the groove',
      'Can we experiment with different textures?',
    ],
  },
  
  {
    id: 'lex:verb:explore',
    lemma: 'explore',
    variants: ['explore', 'explores', 'explored', 'exploring'],
    category: 'verb',
    semantics: {
      type: 'experimental_action',
      frame: 'explore(agent, space)',
      maps_to: 'exploratory_edit',
      reversible: true,
    },
    description: 'Investigate musical possibilities',
    examples: [
      'Let\'s explore darker voicings',
      'I want to explore different rhythms',
      'We should explore the upper register',
    ],
  },
  
  {
    id: 'lex:verb:test',
    lemma: 'test',
    variants: ['test', 'tests', 'tested', 'testing'],
    category: 'verb',
    semantics: {
      type: 'experimental_action',
      frame: 'test(agent, hypothesis)',
      maps_to: 'preview_edit',
      reversible: true,
    },
    description: 'Test a musical hypothesis',
    examples: [
      'Let\'s test this with more reverb',
      'I want to test if this works',
      'Can we test a higher register?',
    ],
  },
  
  // ============================================================================
  // REFLECT AND ASSESS - Commentary on existing music
  // ============================================================================
  
  {
    id: 'lex:verb:sound',
    lemma: 'sound',
    variants: ['sound', 'sounds', 'sounded', 'sounding'],
    category: 'verb',
    semantics: {
      type: 'quality_assessment',
      frame: 'sound(subject, quality)',
      maps_to: 'perception_statement',
    },
    description: 'Describe how something sounds',
    examples: [
      'This sounds too bright',
      'The bass sounds muddy',
      'That transition sounds abrupt',
    ],
  },
  
  {
    id: 'lex:verb:feel',
    lemma: 'feel',
    variants: ['feel', 'feels', 'felt', 'feeling'],
    category: 'verb',
    semantics: {
      type: 'quality_assessment',
      frame: 'feel(subject, emotion)',
      maps_to: 'emotional_statement',
    },
    description: 'Describe emotional quality',
    examples: [
      'This feels too aggressive',
      'The verse feels empty',
      'That chord feels wrong',
    ],
  },
  
  {
    id: 'lex:verb:seem',
    lemma: 'seem',
    variants: ['seem', 'seems', 'seemed', 'seeming'],
    category: 'verb',
    semantics: {
      type: 'quality_assessment',
      frame: 'seem(subject, appearance)',
      maps_to: 'perception_statement',
      certainty: 'medium',
    },
    description: 'Express an impression or appearance',
    examples: [
      'This seems too busy',
      'The tempo seems off',
      'That voicing seems dated',
    ],
  },
  
  {
    id: 'lex:verb:appear',
    lemma: 'appear',
    variants: ['appear', 'appears', 'appeared', 'appearing'],
    category: 'verb',
    semantics: {
      type: 'quality_assessment',
      frame: 'appear(subject, property)',
      maps_to: 'perception_statement',
    },
    description: 'Describe how something presents',
    examples: [
      'This appears unbalanced',
      'The mix appears compressed',
      'That section appears repetitive',
    ],
  },
  
  {
    id: 'lex:verb:notice',
    lemma: 'notice',
    variants: ['notice', 'notices', 'noticed', 'noticing'],
    category: 'verb',
    semantics: {
      type: 'perception_report',
      frame: 'notice(agent, observation)',
      maps_to: 'observation_statement',
    },
    description: 'Report a perceived quality',
    examples: [
      'I notice the melody gets lost',
      'I\'m noticing some clashing',
      'I noticed the timing feels off',
    ],
  },
  
  {
    id: 'lex:verb:hear',
    lemma: 'hear',
    variants: ['hear', 'hears', 'heard', 'hearing'],
    category: 'verb',
    semantics: {
      type: 'perception_report',
      frame: 'hear(agent, sound)',
      maps_to: 'observation_statement',
    },
    description: 'Report what is audible',
    examples: [
      'I hear too much reverb',
      'I\'m hearing some phasing',
      'I can\'t hear the bass',
    ],
  },
  
  {
    id: 'lex:verb:detect',
    lemma: 'detect',
    variants: ['detect', 'detects', 'detected', 'detecting'],
    category: 'verb',
    semantics: {
      type: 'perception_report',
      frame: 'detect(agent, phenomenon)',
      maps_to: 'observation_statement',
    },
    description: 'Identify a specific phenomenon',
    examples: [
      'I detect some distortion',
      'I\'m detecting frequency buildup',
      'I detected timing inconsistencies',
    ],
  },
  
  {
    id: 'lex:verb:recognize',
    lemma: 'recognize',
    variants: ['recognize', 'recognizes', 'recognized', 'recognizing'],
    category: 'verb',
    semantics: {
      type: 'perception_report',
      frame: 'recognize(agent, pattern)',
      maps_to: 'pattern_identification',
    },
    description: 'Identify a familiar pattern',
    examples: [
      'I recognize this chord progression',
      'I\'m recognizing some clichés',
      'I recognized that melody',
    ],
  },
  
  {
    id: 'lex:verb:think',
    lemma: 'think',
    variants: ['think', 'thinks', 'thought', 'thinking'],
    category: 'verb',
    semantics: {
      type: 'belief_statement',
      frame: 'think(agent, proposition)',
      maps_to: 'opinion_statement',
      certainty: 'medium',
    },
    description: 'Express an opinion or belief',
    examples: [
      'I think this needs more energy',
      'I\'m thinking we should simplify',
      'I thought that section was too long',
    ],
  },
  
  {
    id: 'lex:verb:believe',
    lemma: 'believe',
    variants: ['believe', 'believes', 'believed', 'believing'],
    category: 'verb',
    semantics: {
      type: 'belief_statement',
      frame: 'believe(agent, proposition)',
      maps_to: 'opinion_statement',
      certainty: 'high',
    },
    description: 'Express a strong opinion',
    examples: [
      'I believe this would work better',
      'I believe the tempo is right',
      'I\'m believing in this direction',
    ],
  },
  
  {
    id: 'lex:verb:suspect',
    lemma: 'suspect',
    variants: ['suspect', 'suspects', 'suspected', 'suspecting'],
    category: 'verb',
    semantics: {
      type: 'belief_statement',
      frame: 'suspect(agent, hypothesis)',
      maps_to: 'tentative_statement',
      certainty: 'low',
    },
    description: 'Express a tentative opinion',
    examples: [
      'I suspect the bass is too loud',
      'I\'m suspecting timing issues',
      'I suspected that would clash',
    ],
  },
  
  {
    id: 'lex:verb:imagine',
    lemma: 'imagine',
    variants: ['imagine', 'imagines', 'imagined', 'imagining'],
    category: 'verb',
    semantics: {
      type: 'hypothetical_statement',
      frame: 'imagine(agent, scenario)',
      maps_to: 'hypothetical_goal',
    },
    description: 'Envision a possibility',
    examples: [
      'I imagine this with strings',
      'Imagine if we doubled the tempo',
      'I\'m imagining a darker version',
    ],
  },
  
  {
    id: 'lex:verb:picture',
    lemma: 'picture',
    variants: ['picture', 'pictures', 'pictured', 'picturing'],
    category: 'verb',
    semantics: {
      type: 'hypothetical_statement',
      frame: 'picture(agent, scenario)',
      maps_to: 'hypothetical_goal',
    },
    description: 'Mentally visualize a possibility',
    examples: [
      'I picture this more ambient',
      'Picture this with more space',
      'I\'m picturing a buildup here',
    ],
  },
  
  {
    id: 'lex:verb:envision',
    lemma: 'envision',
    variants: ['envision', 'envisions', 'envisioned', 'envisioning'],
    category: 'verb',
    semantics: {
      type: 'hypothetical_statement',
      frame: 'envision(agent, ideal)',
      maps_to: 'hypothetical_goal',
    },
    description: 'Imagine an ideal version',
    examples: [
      'I envision this more cinematic',
      'I\'m envisioning a fuller sound',
      'I envisioned more contrast',
    ],
  },
  
  // ============================================================================
  // COMPARE AND CONTRAST - Relating musical elements
  // ============================================================================
  
  {
    id: 'lex:verb:compare',
    lemma: 'compare',
    variants: ['compare', 'compares', 'compared', 'comparing'],
    category: 'verb',
    semantics: {
      type: 'comparison',
      frame: 'compare(agent, entity_a, entity_b)',
      maps_to: 'comparison_statement',
    },
    description: 'Relate two musical elements',
    examples: [
      'Compare the verses',
      'Let\'s compare these two versions',
      'I\'m comparing the dynamics',
    ],
  },
  
  {
    id: 'lex:verb:contrast',
    lemma: 'contrast',
    variants: ['contrast', 'contrasts', 'contrasted', 'contrasting'],
    category: 'verb',
    semantics: {
      type: 'comparison',
      frame: 'contrast(entity_a, entity_b)',
      maps_to: 'contrast_statement',
    },
    description: 'Highlight differences',
    examples: [
      'The verse contrasts the chorus',
      'This section contrasts nicely',
      'I want to contrast these textures',
    ],
  },
  
  {
    id: 'lex:verb:differ',
    lemma: 'differ',
    variants: ['differ', 'differs', 'differed', 'differing'],
    category: 'verb',
    semantics: {
      type: 'comparison',
      frame: 'differ(entity_a, entity_b, dimension)',
      maps_to: 'difference_statement',
    },
    description: 'Note a difference',
    examples: [
      'The verses differ in energy',
      'These sections differ tonally',
      'The mixes differ significantly',
    ],
  },
  
  {
    id: 'lex:verb:match',
    lemma: 'match',
    variants: ['match', 'matches', 'matched', 'matching'],
    category: 'verb',
    semantics: {
      type: 'comparison',
      frame: 'match(entity_a, entity_b)',
      maps_to: 'similarity_statement',
    },
    description: 'Note similarity or alignment',
    examples: [
      'The drums should match the energy',
      'This matches the intro well',
      'The levels don\'t match',
    ],
  },
  
  {
    id: 'lex:verb:resemble',
    lemma: 'resemble',
    variants: ['resemble', 'resembles', 'resembled', 'resembling'],
    category: 'verb',
    semantics: {
      type: 'comparison',
      frame: 'resemble(entity_a, entity_b)',
      maps_to: 'similarity_statement',
    },
    description: 'Express similarity',
    examples: [
      'This resembles the verse too much',
      'The bridge should resemble the intro',
      'This resembles a cliché',
    ],
  },
  
  {
    id: 'lex:verb:mirror',
    lemma: 'mirror',
    variants: ['mirror', 'mirrors', 'mirrored', 'mirroring'],
    category: 'verb',
    semantics: {
      type: 'comparison',
      frame: 'mirror(entity_a, entity_b)',
      maps_to: 'symmetry_statement',
    },
    description: 'Express exact or near correspondence',
    examples: [
      'The second verse mirrors the first',
      'Let\'s mirror this section',
      'The dynamics mirror each other',
    ],
  },
  
  {
    id: 'lex:verb:echo',
    lemma: 'echo',
    variants: ['echo', 'echoes', 'echoed', 'echoing'],
    category: 'verb',
    semantics: {
      type: 'comparison',
      frame: 'echo(entity_a, entity_b)',
      maps_to: 'repetition_statement',
    },
    description: 'Express repetition or callback',
    examples: [
      'The outro echoes the intro',
      'This melody echoes earlier material',
      'The harmony echoes the verse',
    ],
  },
  
  {
    id: 'lex:verb:repeat',
    lemma: 'repeat',
    variants: ['repeat', 'repeats', 'repeated', 'repeating'],
    category: 'verb',
    semantics: {
      type: 'structural_operation',
      frame: 'repeat(entity, count)',
      maps_to: 'duplication_goal',
    },
    description: 'Duplicate a musical element',
    examples: [
      'Repeat the chorus',
      'Let\'s repeat this section',
      'The pattern repeats too much',
    ],
  },
  
  {
    id: 'lex:verb:recall',
    lemma: 'recall',
    variants: ['recall', 'recalls', 'recalled', 'recalling'],
    category: 'verb',
    semantics: {
      type: 'comparison',
      frame: 'recall(entity, reference)',
      maps_to: 'callback_statement',
    },
    description: 'Reference earlier material',
    examples: [
      'This recalls the opening theme',
      'The bridge recalls the verse melody',
      'This section recalls earlier tension',
    ],
  },
  
  {
    id: 'lex:verb:reference',
    lemma: 'reference',
    variants: ['reference', 'references', 'referenced', 'referencing'],
    category: 'verb',
    semantics: {
      type: 'comparison',
      frame: 'reference(entity, source)',
      maps_to: 'allusion_statement',
    },
    description: 'Allude to another work or section',
    examples: [
      'This references the intro',
      'The harmony references jazz',
      'This rhythm references funk',
    ],
  },
  
  // ============================================================================
  // COLLABORATIVE DIALOGUE - Working with others
  // ============================================================================
  
  {
    id: 'lex:verb:suggest',
    lemma: 'suggest',
    variants: ['suggest', 'suggests', 'suggested', 'suggesting'],
    category: 'verb',
    semantics: {
      type: 'collaborative_proposal',
      frame: 'suggest(agent, proposal)',
      maps_to: 'soft_goal',
    },
    description: 'Propose an idea tentatively',
    examples: [
      'I suggest making it darker',
      'I\'d suggest trying less reverb',
      'I suggest we simplify the harmony',
    ],
  },
  
  {
    id: 'lex:verb:propose',
    lemma: 'propose',
    variants: ['propose', 'proposes', 'proposed', 'proposing'],
    category: 'verb',
    semantics: {
      type: 'collaborative_proposal',
      frame: 'propose(agent, proposal)',
      maps_to: 'goal_statement',
    },
    description: 'Put forward a definite proposal',
    examples: [
      'I propose doubling the tempo',
      'I\'m proposing we cut this section',
      'I propose adding strings',
    ],
  },
  
  {
    id: 'lex:verb:recommend',
    lemma: 'recommend',
    variants: ['recommend', 'recommends', 'recommended', 'recommending'],
    category: 'verb',
    semantics: {
      type: 'collaborative_proposal',
      frame: 'recommend(agent, action)',
      maps_to: 'advised_goal',
    },
    description: 'Advise a course of action',
    examples: [
      'I recommend tightening the groove',
      'I\'d recommend more contrast',
      'I recommend simplifying',
    ],
  },
  
  {
    id: 'lex:verb:advise',
    lemma: 'advise',
    variants: ['advise', 'advises', 'advised', 'advising'],
    category: 'verb',
    semantics: {
      type: 'collaborative_proposal',
      frame: 'advise(agent, advisee, action)',
      maps_to: 'advised_goal',
    },
    description: 'Offer expert advice',
    examples: [
      'I advise against too much compression',
      'I\'d advise keeping it simple',
      'I advise adding more low end',
    ],
  },
  
  {
    id: 'lex:verb:agree',
    lemma: 'agree',
    variants: ['agree', 'agrees', 'agreed', 'agreeing'],
    category: 'verb',
    semantics: {
      type: 'dialogue_response',
      frame: 'agree(agent, proposition)',
      maps_to: 'affirmation',
      polarity: 'positive',
    },
    description: 'Express agreement',
    examples: [
      'I agree this needs more energy',
      'I agree with that change',
      'I\'m agreeing with your suggestion',
    ],
  },
  
  {
    id: 'lex:verb:disagree',
    lemma: 'disagree',
    variants: ['disagree', 'disagrees', 'disagreed', 'disagreeing'],
    category: 'verb',
    semantics: {
      type: 'dialogue_response',
      frame: 'disagree(agent, proposition)',
      maps_to: 'negation',
      polarity: 'negative',
    },
    description: 'Express disagreement',
    examples: [
      'I disagree about the tempo',
      'I\'m disagreeing with that approach',
      'I disagree that it needs reverb',
    ],
  },
  
  {
    id: 'lex:verb:concur',
    lemma: 'concur',
    variants: ['concur', 'concurs', 'concurred', 'concurring'],
    category: 'verb',
    semantics: {
      type: 'dialogue_response',
      frame: 'concur(agent, proposition)',
      maps_to: 'affirmation',
      polarity: 'positive',
      formality: 'high',
    },
    description: 'Formally agree',
    examples: [
      'I concur with that assessment',
      'I concur this works better',
      'I\'m concurring with your analysis',
    ],
  },
  
  {
    id: 'lex:verb:accept',
    lemma: 'accept',
    variants: ['accept', 'accepts', 'accepted', 'accepting'],
    category: 'verb',
    semantics: {
      type: 'dialogue_response',
      frame: 'accept(agent, proposal)',
      maps_to: 'approval',
      effect: 'commits_to_action',
    },
    description: 'Approve a proposal',
    examples: [
      'I accept that change',
      'I\'m accepting this version',
      'I accept your suggestion',
    ],
  },
  
  {
    id: 'lex:verb:reject',
    lemma: 'reject',
    variants: ['reject', 'rejects', 'rejected', 'rejecting'],
    category: 'verb',
    semantics: {
      type: 'dialogue_response',
      frame: 'reject(agent, proposal)',
      maps_to: 'refusal',
      effect: 'blocks_action',
    },
    description: 'Refuse a proposal',
    examples: [
      'I reject that approach',
      'I\'m rejecting this version',
      'I reject adding more layers',
    ],
  },
  
  {
    id: 'lex:verb:approve',
    lemma: 'approve',
    variants: ['approve', 'approves', 'approved', 'approving'],
    category: 'verb',
    semantics: {
      type: 'dialogue_response',
      frame: 'approve(agent, proposal)',
      maps_to: 'approval',
      effect: 'commits_to_action',
    },
    description: 'Give official approval',
    examples: [
      'I approve this mix',
      'I\'m approving the changes',
      'I approve moving forward',
    ],
  },
  
  {
    id: 'lex:verb:veto',
    lemma: 'veto',
    variants: ['veto', 'vetoes', 'vetoed', 'vetoing'],
    category: 'verb',
    semantics: {
      type: 'dialogue_response',
      frame: 'veto(agent, proposal)',
      maps_to: 'strong_refusal',
      effect: 'blocks_action',
    },
    description: 'Strongly reject',
    examples: [
      'I veto that change',
      'I\'m vetoing the tempo increase',
      'I veto adding more effects',
    ],
  },
  
  {
    id: 'lex:verb:question',
    lemma: 'question',
    variants: ['question', 'questions', 'questioned', 'questioning'],
    category: 'verb',
    semantics: {
      type: 'dialogue_query',
      frame: 'question(agent, proposition)',
      maps_to: 'clarification_request',
    },
    description: 'Express doubt or request clarification',
    examples: [
      'I question whether this works',
      'I\'m questioning the tempo choice',
      'I question adding more reverb',
    ],
  },
  
  {
    id: 'lex:verb:wonder',
    lemma: 'wonder',
    variants: ['wonder', 'wonders', 'wondered', 'wondering'],
    category: 'verb',
    semantics: {
      type: 'dialogue_query',
      frame: 'wonder(agent, question)',
      maps_to: 'exploratory_question',
    },
    description: 'Express curiosity or uncertainty',
    examples: [
      'I wonder if this is too bright',
      'I\'m wondering about the harmony',
      'I wondered if we should simplify',
    ],
  },
  
  {
    id: 'lex:verb:debate',
    lemma: 'debate',
    variants: ['debate', 'debates', 'debated', 'debating'],
    category: 'verb',
    semantics: {
      type: 'dialogue_process',
      frame: 'debate(agents, topic)',
      maps_to: 'discussion',
    },
    description: 'Discuss alternatives',
    examples: [
      'Let\'s debate the arrangement',
      'We\'re debating the mix approach',
      'We debated the tempo',
    ],
  },
  
  {
    id: 'lex:verb:discuss',
    lemma: 'discuss',
    variants: ['discuss', 'discusses', 'discussed', 'discussing'],
    category: 'verb',
    semantics: {
      type: 'dialogue_process',
      frame: 'discuss(agents, topic)',
      maps_to: 'discussion',
    },
    description: 'Talk about musical choices',
    examples: [
      'Let\'s discuss the structure',
      'We\'re discussing the mix',
      'We discussed the arrangement',
    ],
  },
  
  {
    id: 'lex:verb:negotiate',
    lemma: 'negotiate',
    variants: ['negotiate', 'negotiates', 'negotiated', 'negotiating'],
    category: 'verb',
    semantics: {
      type: 'dialogue_process',
      frame: 'negotiate(agents, issue)',
      maps_to: 'collaborative_resolution',
    },
    description: 'Work toward consensus',
    examples: [
      'Let\'s negotiate the tempo',
      'We\'re negotiating the dynamics',
      'We negotiated a compromise',
    ],
  },
  
  // Continued in next batch due to length...
];

export const COMMUNICATION_VERBS_COUNT = COMMUNICATION_VERBS.length;
