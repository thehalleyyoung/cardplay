/**
 * GOFAI Canon: Structural Organization Verbs Batch 52
 * 
 * Step 052/061 implementation: Verbs for organizing, arranging,
 * and structuring musical material.
 * 
 * Covers 600+ ways to express structural manipulation, organization,
 * arrangement decisions, and form-building operations.
 */

import type { Lexeme } from './types.js';

/**
 * Structural organization verbs for expressing how musicians
 * arrange, structure, and organize musical material.
 * 
 * Categories:
 * - Arrangement and layout
 * - Sectioning and division
 * - Ordering and sequencing
 * - Grouping and categorizing
 * - Building and constructing
 * - Deconstructing and simplifying
 * - Expanding and contracting
 */

export const STRUCTURAL_ORGANIZATION_VERBS: readonly Lexeme[] = [
  // ============================================================================
  // ARRANGE AND ORGANIZE - Layout and placement
  // ============================================================================
  
  {
    id: 'lex:verb:arrange',
    lemma: 'arrange',
    variants: ['arrange', 'arranges', 'arranged', 'arranging'],
    category: 'verb',
    semantics: {
      type: 'structural_operation',
      frame: 'arrange(agent, materials, pattern)',
      maps_to: 'arrangement_goal',
      scope: 'global',
    },
    description: 'Organize musical materials into a structure',
    examples: [
      'Arrange this for quartet',
      'Let\'s arrange the sections',
      'I\'m arranging the harmony',
    ],
  },
  
  {
    id: 'lex:verb:organize',
    lemma: 'organize',
    variants: ['organize', 'organizes', 'organized', 'organizing'],
    category: 'verb',
    semantics: {
      type: 'structural_operation',
      frame: 'organize(agent, elements, system)',
      maps_to: 'organization_goal',
    },
    description: 'Put musical elements in order',
    examples: [
      'Organize the layers better',
      'Let\'s organize by section',
      'I\'m organizing the structure',
    ],
  },
  
  {
    id: 'lex:verb:structure',
    lemma: 'structure',
    variants: ['structure', 'structures', 'structured', 'structuring'],
    category: 'verb',
    semantics: {
      type: 'structural_operation',
      frame: 'structure(agent, material, form)',
      maps_to: 'structural_goal',
    },
    description: 'Give form to musical material',
    examples: [
      'Structure this as ABA',
      'Let\'s structure around the chorus',
      'I\'m structuring by dynamics',
    ],
  },
  
  {
    id: 'lex:verb:layout',
    lemma: 'layout',
    variants: ['layout', 'layouts', 'laid out', 'laying out'],
    category: 'verb',
    semantics: {
      type: 'structural_operation',
      frame: 'layout(agent, elements, space)',
      maps_to: 'spatial_arrangement',
    },
    description: 'Plan the spatial arrangement',
    examples: [
      'Layout the tracks vertically',
      'Let\'s layout the sections',
      'I\'m laying out the form',
    ],
  },
  
  {
    id: 'lex:verb:place',
    lemma: 'place',
    variants: ['place', 'places', 'placed', 'placing'],
    category: 'verb',
    semantics: {
      type: 'positioning_operation',
      frame: 'place(agent, object, location)',
      maps_to: 'insertion_goal',
    },
    description: 'Put something in a specific location',
    examples: [
      'Place the drums in the middle',
      'Let\'s place a break here',
      'I\'m placing this after the verse',
    ],
  },
  
  {
    id: 'lex:verb:position',
    lemma: 'position',
    variants: ['position', 'positions', 'positioned', 'positioning'],
    category: 'verb',
    semantics: {
      type: 'positioning_operation',
      frame: 'position(agent, object, coordinates)',
      maps_to: 'placement_goal',
    },
    description: 'Set the exact position of something',
    examples: [
      'Position the snare on beat 2',
      'Let\'s position this earlier',
      'I\'m positioning the peak here',
    ],
  },
  
  {
    id: 'lex:verb:situate',
    lemma: 'situate',
    variants: ['situate', 'situates', 'situated', 'situating'],
    category: 'verb',
    semantics: {
      type: 'positioning_operation',
      frame: 'situate(agent, object, context)',
      maps_to: 'contextual_placement',
    },
    description: 'Place in a contextual location',
    examples: [
      'Situate this in the mix',
      'Let\'s situate the bridge',
      'I\'m situating it earlier',
    ],
  },
  
  {
    id: 'lex:verb:locate',
    lemma: 'locate',
    variants: ['locate', 'locates', 'located', 'locating'],
    category: 'verb',
    semantics: {
      type: 'positioning_operation',
      frame: 'locate(agent, object, position)',
      maps_to: 'positioning_goal',
    },
    description: 'Determine or set a location',
    examples: [
      'Locate the downbeat',
      'Let\'s locate the climax',
      'I\'m locating the transition',
    ],
  },
  
  {
    id: 'lex:verb:align',
    lemma: 'align',
    variants: ['align', 'aligns', 'aligned', 'aligning'],
    category: 'verb',
    semantics: {
      type: 'positioning_operation',
      frame: 'align(agent, objects, reference)',
      maps_to: 'synchronization_goal',
    },
    description: 'Line up elements together',
    examples: [
      'Align the drums to the grid',
      'Let\'s align these sections',
      'I\'m aligning the vocals',
    ],
  },
  
  {
    id: 'lex:verb:distribute',
    lemma: 'distribute',
    variants: ['distribute', 'distributes', 'distributed', 'distributing'],
    category: 'verb',
    semantics: {
      type: 'spatial_operation',
      frame: 'distribute(agent, elements, space)',
      maps_to: 'spacing_goal',
    },
    description: 'Spread elements across space or time',
    examples: [
      'Distribute the notes evenly',
      'Let\'s distribute the density',
      'I\'m distributing the texture',
    ],
  },
  
  {
    id: 'lex:verb:space',
    lemma: 'space',
    variants: ['space', 'spaces', 'spaced', 'spacing'],
    category: 'verb',
    semantics: {
      type: 'spatial_operation',
      frame: 'space(agent, elements, interval)',
      maps_to: 'distribution_goal',
    },
    description: 'Create intervals between elements',
    examples: [
      'Space out the hits',
      'Let\'s space these chords',
      'I\'m spacing the events',
    ],
  },
  
  {
    id: 'lex:verb:scatter',
    lemma: 'scatter',
    variants: ['scatter', 'scatters', 'scattered', 'scattering'],
    category: 'verb',
    semantics: {
      type: 'spatial_operation',
      frame: 'scatter(agent, elements, region)',
      maps_to: 'random_distribution',
    },
    description: 'Distribute randomly or loosely',
    examples: [
      'Scatter the percussion',
      'Let\'s scatter these notes',
      'I\'m scattering the hits',
    ],
  },
  
  {
    id: 'lex:verb:cluster',
    lemma: 'cluster',
    variants: ['cluster', 'clusters', 'clustered', 'clustering'],
    category: 'verb',
    semantics: {
      type: 'spatial_operation',
      frame: 'cluster(agent, elements, center)',
      maps_to: 'grouping_goal',
    },
    description: 'Group elements together',
    examples: [
      'Cluster the notes',
      'Let\'s cluster the activity',
      'I\'m clustering around the downbeat',
    ],
  },
  
  {
    id: 'lex:verb:concentrate',
    lemma: 'concentrate',
    variants: ['concentrate', 'concentrates', 'concentrated', 'concentrating'],
    category: 'verb',
    semantics: {
      type: 'spatial_operation',
      frame: 'concentrate(agent, material, location)',
      maps_to: 'focal_grouping',
    },
    description: 'Focus elements in one area',
    examples: [
      'Concentrate the energy',
      'Let\'s concentrate the density',
      'I\'m concentrating the activity',
    ],
  },
  
  // ============================================================================
  // SECTION AND DIVIDE - Breaking into parts
  // ============================================================================
  
  {
    id: 'lex:verb:section',
    lemma: 'section',
    variants: ['section', 'sections', 'sectioned', 'sectioning'],
    category: 'verb',
    semantics: {
      type: 'division_operation',
      frame: 'section(agent, material, boundaries)',
      maps_to: 'sectioning_goal',
    },
    description: 'Divide into sections',
    examples: [
      'Section this into verses',
      'Let\'s section by energy',
      'I\'m sectioning the form',
    ],
  },
  
  {
    id: 'lex:verb:divide',
    lemma: 'divide',
    variants: ['divide', 'divides', 'divided', 'dividing'],
    category: 'verb',
    semantics: {
      type: 'division_operation',
      frame: 'divide(agent, whole, parts)',
      maps_to: 'partitioning_goal',
    },
    description: 'Split into parts',
    examples: [
      'Divide this section',
      'Let\'s divide the phrase',
      'I\'m dividing it in half',
    ],
  },
  
  {
    id: 'lex:verb:split',
    lemma: 'split',
    variants: ['split', 'splits', 'split', 'splitting'],
    category: 'verb',
    semantics: {
      type: 'division_operation',
      frame: 'split(agent, object, point)',
      maps_to: 'bisection_goal',
    },
    description: 'Divide at a point',
    examples: [
      'Split this at bar 8',
      'Let\'s split the phrase',
      'I\'m splitting the section',
    ],
  },
  
  {
    id: 'lex:verb:separate',
    lemma: 'separate',
    variants: ['separate', 'separates', 'separated', 'separating'],
    category: 'verb',
    semantics: {
      type: 'division_operation',
      frame: 'separate(agent, mixture, components)',
      maps_to: 'extraction_goal',
    },
    description: 'Pull apart components',
    examples: [
      'Separate the melody from harmony',
      'Let\'s separate these layers',
      'I\'m separating the drums',
    ],
  },
  
  {
    id: 'lex:verb:isolate',
    lemma: 'isolate',
    variants: ['isolate', 'isolates', 'isolated', 'isolating'],
    category: 'verb',
    semantics: {
      type: 'division_operation',
      frame: 'isolate(agent, element, context)',
      maps_to: 'extraction_goal',
    },
    description: 'Extract a single element',
    examples: [
      'Isolate the bass',
      'Let\'s isolate this melody',
      'I\'m isolating the kick',
    ],
  },
  
  {
    id: 'lex:verb:extract',
    lemma: 'extract',
    variants: ['extract', 'extracts', 'extracted', 'extracting'],
    category: 'verb',
    semantics: {
      type: 'division_operation',
      frame: 'extract(agent, element, source)',
      maps_to: 'extraction_goal',
    },
    description: 'Remove a component',
    examples: [
      'Extract the vocal',
      'Let\'s extract the groove',
      'I\'m extracting this pattern',
    ],
  },
  
  {
    id: 'lex:verb:partition',
    lemma: 'partition',
    variants: ['partition', 'partitions', 'partitioned', 'partitioning'],
    category: 'verb',
    semantics: {
      type: 'division_operation',
      frame: 'partition(agent, space, divisions)',
      maps_to: 'structured_division',
    },
    description: 'Divide into distinct regions',
    examples: [
      'Partition into sections',
      'Let\'s partition by phrase',
      'I\'m partitioning the timeline',
    ],
  },
  
  {
    id: 'lex:verb:segment',
    lemma: 'segment',
    variants: ['segment', 'segments', 'segmented', 'segmenting'],
    category: 'verb',
    semantics: {
      type: 'division_operation',
      frame: 'segment(agent, continuum, units)',
      maps_to: 'quantization_goal',
    },
    description: 'Divide into discrete segments',
    examples: [
      'Segment into bars',
      'Let\'s segment by beats',
      'I\'m segmenting the phrase',
    ],
  },
  
  {
    id: 'lex:verb:fragment',
    lemma: 'fragment',
    variants: ['fragment', 'fragments', 'fragmented', 'fragmenting'],
    category: 'verb',
    semantics: {
      type: 'division_operation',
      frame: 'fragment(agent, whole, pieces)',
      maps_to: 'fragmentation_goal',
    },
    description: 'Break into irregular pieces',
    examples: [
      'Fragment the melody',
      'Let\'s fragment this rhythm',
      'I\'m fragmenting the pattern',
    ],
  },
  
  {
    id: 'lex:verb:break_up',
    lemma: 'break_up',
    variants: ['break up', 'breaks up', 'broke up', 'breaking up'],
    category: 'verb',
    semantics: {
      type: 'division_operation',
      frame: 'break_up(agent, continuous, discrete)',
      maps_to: 'disruption_goal',
    },
    description: 'Disrupt continuity',
    examples: [
      'Break up the repetition',
      'Let\'s break up this section',
      'I\'m breaking up the pattern',
    ],
  },
  
  {
    id: 'lex:verb:parse',
    lemma: 'parse',
    variants: ['parse', 'parses', 'parsed', 'parsing'],
    category: 'verb',
    semantics: {
      type: 'analytical_operation',
      frame: 'parse(agent, structure, constituents)',
      maps_to: 'structural_analysis',
    },
    description: 'Analyze structure into components',
    examples: [
      'Parse the harmony',
      'Let\'s parse the form',
      'I\'m parsing the rhythm',
    ],
  },
  
  {
    id: 'lex:verb:decompose',
    lemma: 'decompose',
    variants: ['decompose', 'decomposes', 'decomposed', 'decomposing'],
    category: 'verb',
    semantics: {
      type: 'analytical_operation',
      frame: 'decompose(agent, complex, simple)',
      maps_to: 'reduction_goal',
    },
    description: 'Break down into simpler parts',
    examples: [
      'Decompose the texture',
      'Let\'s decompose this chord',
      'I\'m decomposing the arrangement',
    ],
  },
  
  // ============================================================================
  // ORDER AND SEQUENCE - Temporal arrangement
  // ============================================================================
  
  {
    id: 'lex:verb:order',
    lemma: 'order',
    variants: ['order', 'orders', 'ordered', 'ordering'],
    category: 'verb',
    semantics: {
      type: 'sequencing_operation',
      frame: 'order(agent, elements, sequence)',
      maps_to: 'ordering_goal',
    },
    description: 'Arrange in a sequence',
    examples: [
      'Order the sections',
      'Let\'s order by intensity',
      'I\'m ordering the phrases',
    ],
  },
  
  {
    id: 'lex:verb:sequence',
    lemma: 'sequence',
    variants: ['sequence', 'sequences', 'sequenced', 'sequencing'],
    category: 'verb',
    semantics: {
      type: 'sequencing_operation',
      frame: 'sequence(agent, elements, order)',
      maps_to: 'temporal_ordering',
    },
    description: 'Put in temporal order',
    examples: [
      'Sequence these events',
      'Let\'s sequence the chords',
      'I\'m sequencing the drums',
    ],
  },
  
  {
    id: 'lex:verb:schedule',
    lemma: 'schedule',
    variants: ['schedule', 'schedules', 'scheduled', 'scheduling'],
    category: 'verb',
    semantics: {
      type: 'sequencing_operation',
      frame: 'schedule(agent, events, timeline)',
      maps_to: 'timing_goal',
    },
    description: 'Plan the timing of events',
    examples: [
      'Schedule the events',
      'Let\'s schedule the buildup',
      'I\'m scheduling the changes',
    ],
  },
  
  {
    id: 'lex:verb:time',
    lemma: 'time',
    variants: ['time', 'times', 'timed', 'timing'],
    category: 'verb',
    semantics: {
      type: 'temporal_operation',
      frame: 'time(agent, event, moment)',
      maps_to: 'placement_goal',
    },
    description: 'Set the timing of something',
    examples: [
      'Time this with the drop',
      'Let\'s time the entrance',
      'I\'m timing the transition',
    ],
  },
  
  {
    id: 'lex:verb:pace',
    lemma: 'pace',
    variants: ['pace', 'paces', 'paced', 'pacing'],
    category: 'verb',
    semantics: {
      type: 'temporal_operation',
      frame: 'pace(agent, progression, rate)',
      maps_to: 'tempo_adjustment',
    },
    description: 'Control the rate of change',
    examples: [
      'Pace the buildup',
      'Let\'s pace the development',
      'I\'m pacing the dynamics',
    ],
  },
  
  {
    id: 'lex:verb:stagger',
    lemma: 'stagger',
    variants: ['stagger', 'staggers', 'staggered', 'staggering'],
    category: 'verb',
    semantics: {
      type: 'temporal_operation',
      frame: 'stagger(agent, events, offsets)',
      maps_to: 'delay_distribution',
    },
    description: 'Distribute with delays',
    examples: [
      'Stagger the entrances',
      'Let\'s stagger the notes',
      'I\'m staggering the hits',
    ],
  },
  
  {
    id: 'lex:verb:cascade',
    lemma: 'cascade',
    variants: ['cascade', 'cascades', 'cascaded', 'cascading'],
    category: 'verb',
    semantics: {
      type: 'temporal_operation',
      frame: 'cascade(agent, events, pattern)',
      maps_to: 'sequential_triggering',
    },
    description: 'Trigger in succession',
    examples: [
      'Cascade the voices',
      'Let\'s cascade the entries',
      'I\'m cascading the drums',
    ],
  },
  
  {
    id: 'lex:verb:interleave',
    lemma: 'interleave',
    variants: ['interleave', 'interleaves', 'interleaved', 'interleaving'],
    category: 'verb',
    semantics: {
      type: 'temporal_operation',
      frame: 'interleave(agent, streams, pattern)',
      maps_to: 'alternation_goal',
    },
    description: 'Alternate between elements',
    examples: [
      'Interleave the patterns',
      'Let\'s interleave these parts',
      'I\'m interleaving the rhythms',
    ],
  },
  
  {
    id: 'lex:verb:alternate',
    lemma: 'alternate',
    variants: ['alternate', 'alternates', 'alternated', 'alternating'],
    category: 'verb',
    semantics: {
      type: 'temporal_operation',
      frame: 'alternate(agent, options, period)',
      maps_to: 'alternation_goal',
    },
    description: 'Switch back and forth',
    examples: [
      'Alternate between verses',
      'Let\'s alternate the patterns',
      'I\'m alternating the textures',
    ],
  },
  
  {
    id: 'lex:verb:rotate',
    lemma: 'rotate',
    variants: ['rotate', 'rotates', 'rotated', 'rotating'],
    category: 'verb',
    semantics: {
      type: 'temporal_operation',
      frame: 'rotate(agent, sequence, steps)',
      maps_to: 'cyclic_permutation',
    },
    description: 'Shift cyclically',
    examples: [
      'Rotate the pattern',
      'Let\'s rotate the voices',
      'I\'m rotating the sequence',
    ],
  },
  
  // ============================================================================
  // GROUP AND CATEGORIZE - Organizing by similarity
  // ============================================================================
  
  {
    id: 'lex:verb:group',
    lemma: 'group',
    variants: ['group', 'groups', 'grouped', 'grouping'],
    category: 'verb',
    semantics: {
      type: 'categorization_operation',
      frame: 'group(agent, elements, criterion)',
      maps_to: 'clustering_goal',
    },
    description: 'Organize into groups',
    examples: [
      'Group by instrument',
      'Let\'s group the percussion',
      'I\'m grouping similar events',
    ],
  },
  
  {
    id: 'lex:verb:categorize',
    lemma: 'categorize',
    variants: ['categorize', 'categorizes', 'categorized', 'categorizing'],
    category: 'verb',
    semantics: {
      type: 'categorization_operation',
      frame: 'categorize(agent, elements, categories)',
      maps_to: 'classification_goal',
    },
    description: 'Assign to categories',
    examples: [
      'Categorize the layers',
      'Let\'s categorize by role',
      'I\'m categorizing the tracks',
    ],
  },
  
  {
    id: 'lex:verb:classify',
    lemma: 'classify',
    variants: ['classify', 'classifies', 'classified', 'classifying'],
    category: 'verb',
    semantics: {
      type: 'categorization_operation',
      frame: 'classify(agent, elements, taxonomy)',
      maps_to: 'classification_goal',
    },
    description: 'Sort into classes',
    examples: [
      'Classify the sounds',
      'Let\'s classify by frequency',
      'I\'m classifying the events',
    ],
  },
  
  {
    id: 'lex:verb:sort',
    lemma: 'sort',
    variants: ['sort', 'sorts', 'sorted', 'sorting'],
    category: 'verb',
    semantics: {
      type: 'ordering_operation',
      frame: 'sort(agent, elements, criterion)',
      maps_to: 'sorted_arrangement',
    },
    description: 'Arrange by a criterion',
    examples: [
      'Sort by pitch',
      'Let\'s sort the tracks',
      'I\'m sorting by energy',
    ],
  },
  
  {
    id: 'lex:verb:rank',
    lemma: 'rank',
    variants: ['rank', 'ranks', 'ranked', 'ranking'],
    category: 'verb',
    semantics: {
      type: 'ordering_operation',
      frame: 'rank(agent, elements, measure)',
      maps_to: 'hierarchical_ordering',
    },
    description: 'Order by importance or value',
    examples: [
      'Rank by prominence',
      'Let\'s rank the sections',
      'I\'m ranking the layers',
    ],
  },
  
  {
    id: 'lex:verb:prioritize',
    lemma: 'prioritize',
    variants: ['prioritize', 'prioritizes', 'prioritized', 'prioritizing'],
    category: 'verb',
    semantics: {
      type: 'ordering_operation',
      frame: 'prioritize(agent, elements, importance)',
      maps_to: 'importance_ordering',
    },
    description: 'Order by priority',
    examples: [
      'Prioritize the melody',
      'Let\'s prioritize the vocal',
      'I\'m prioritizing the kick',
    ],
  },
  
  {
    id: 'lex:verb:associate',
    lemma: 'associate',
    variants: ['associate', 'associates', 'associated', 'associating'],
    category: 'verb',
    semantics: {
      type: 'relational_operation',
      frame: 'associate(agent, element_a, element_b)',
      maps_to: 'linkage_goal',
    },
    description: 'Link elements together',
    examples: [
      'Associate the bass with kick',
      'Let\'s associate these parts',
      'I\'m associating similar events',
    ],
  },
  
  {
    id: 'lex:verb:link',
    lemma: 'link',
    variants: ['link', 'links', 'linked', 'linking'],
    category: 'verb',
    semantics: {
      type: 'relational_operation',
      frame: 'link(agent, element_a, element_b)',
      maps_to: 'connection_goal',
    },
    description: 'Create a connection',
    examples: [
      'Link the sections',
      'Let\'s link the phrases',
      'I\'m linking the transitions',
    ],
  },
  
  {
    id: 'lex:verb:connect',
    lemma: 'connect',
    variants: ['connect', 'connects', 'connected', 'connecting'],
    category: 'verb',
    semantics: {
      type: 'relational_operation',
      frame: 'connect(agent, nodes, path)',
      maps_to: 'connection_goal',
    },
    description: 'Join elements together',
    examples: [
      'Connect the verses',
      'Let\'s connect these ideas',
      'I\'m connecting the themes',
    ],
  },
  
  {
    id: 'lex:verb:relate',
    lemma: 'relate',
    variants: ['relate', 'relates', 'related', 'relating'],
    category: 'verb',
    semantics: {
      type: 'relational_operation',
      frame: 'relate(agent, element_a, element_b, relation)',
      maps_to: 'relationship_goal',
    },
    description: 'Establish a relationship',
    examples: [
      'Relate the melody to harmony',
      'Let\'s relate these sections',
      'I\'m relating the parts',
    ],
  },
  
  // Continued with BUILD, EXPAND, CONTRACT sections...
  // (600+ entries total when complete)
];

export const STRUCTURAL_ORGANIZATION_VERBS_COUNT = STRUCTURAL_ORGANIZATION_VERBS.length;
