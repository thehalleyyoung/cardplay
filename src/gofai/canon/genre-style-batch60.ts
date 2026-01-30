/**
 * GOFAI Canon — Genre and Style Marker Vocabulary (Batch 60)
 *
 * Comprehensive vocabulary for genre identification, style markers, and aesthetic
 * descriptors across musical traditions:
 * - Genre labels (jazz, rock, classical, electronic, etc.)
 * - Sub-genre classification
 * - Era and period markers
 * - Regional and cultural styles
 * - Aesthetic descriptors
 * - Production style markers
 *
 * This batch provides natural language coverage for genre-aware composition,
 * arrangement, and production decisions.
 *
 * @module gofai/canon/genre-style-batch60
 */

import {
  type Lexeme,
  type LexemeId,
  type AxisId,
  createLexemeId,
  createAxisId,
} from './types';

// =============================================================================
// Major Genre Categories
// =============================================================================

/**
 * Major genre category descriptors.
 *
 * Covers:
 * - Jazz and related styles
 * - Rock and related styles
 * - Classical and art music
 * - Electronic and dance music
 * - Hip-hop and R&B
 * - Pop and commercial styles
 * - Folk and traditional
 * - World music
 */
const MAJOR_GENRE_DESCRIPTORS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'jazz'),
    lemma: 'jazz',
    variants: ['jazzy', 'jazz style', 'jazz feel'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'genre',
      aspect: 'style',
      genre: 'jazz',
    },
    description: 'Jazz genre characteristics (swing, improvisation, complex harmony)',
    examples: [
      'make it jazz',
      'add jazz feel',
      'use jazz harmony',
    ],
  },
  {
    id: createLexemeId('noun', 'rock'),
    lemma: 'rock',
    variants: ['rock style', 'rock feel', 'rocky'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'genre',
      aspect: 'style',
      genre: 'rock',
    },
    description: 'Rock genre characteristics (driving rhythm, guitar-based, energy)',
    examples: [
      'make it rock',
      'add rock feel',
      'create rock energy',
    ],
  },
  {
    id: createLexemeId('noun', 'classical'),
    lemma: 'classical',
    variants: ['classical style', 'orchestral', 'art music'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'genre',
      aspect: 'style',
      genre: 'classical',
    },
    description: 'Classical genre characteristics (formal structure, orchestration)',
    examples: [
      'make it classical',
      'use classical forms',
      'add orchestral elements',
    ],
  },
  {
    id: createLexemeId('noun', 'electronic'),
    lemma: 'electronic',
    variants: ['electronic music', 'EDM', 'electronic style'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'genre',
      aspect: 'style',
      genre: 'electronic',
    },
    description: 'Electronic genre characteristics (synthesized sounds, production focus)',
    examples: [
      'make it electronic',
      'add EDM elements',
      'use electronic production',
    ],
  },
  {
    id: createLexemeId('noun', 'hip_hop'),
    lemma: 'hip-hop',
    variants: ['hip hop', 'rap', 'hip-hop style'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'genre',
      aspect: 'style',
      genre: 'hip_hop',
    },
    description: 'Hip-hop genre characteristics (beats, sampling, vocal style)',
    examples: [
      'make it hip-hop',
      'add hip-hop beat',
      'use rap style',
    ],
  },
  {
    id: createLexemeId('noun', 'pop'),
    lemma: 'pop',
    variants: ['pop music', 'pop style', 'poppy'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'genre',
      aspect: 'style',
      genre: 'pop',
    },
    description: 'Pop genre characteristics (catchy melodies, commercial appeal)',
    examples: [
      'make it pop',
      'add pop hooks',
      'create pop production',
    ],
  },
  {
    id: createLexemeId('noun', 'folk'),
    lemma: 'folk',
    variants: ['folk music', 'folk style', 'traditional'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'genre',
      aspect: 'style',
      genre: 'folk',
    },
    description: 'Folk genre characteristics (acoustic, traditional forms, storytelling)',
    examples: [
      'make it folk',
      'add folk instrumentation',
      'use folk style',
    ],
  },
  {
    id: createLexemeId('noun', 'blues'),
    lemma: 'blues',
    variants: ['blues style', 'bluesy', 'blues feel'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'genre',
      aspect: 'style',
      genre: 'blues',
    },
    description: 'Blues genre characteristics (12-bar form, blue notes, expressive)',
    examples: [
      'make it blues',
      'add blues feel',
      'use blues scale',
    ],
  },
] as const;

// =============================================================================
// Sub-Genre Classifications
// =============================================================================

/**
 * Sub-genre and hybrid style descriptors.
 *
 * Covers:
 * - Jazz sub-genres (bebop, modal, fusion)
 * - Rock sub-genres (indie, alternative, metal)
 * - Electronic sub-genres (house, techno, ambient)
 * - Hybrid and crossover styles
 */
const SUB_GENRE_DESCRIPTORS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'bebop'),
    lemma: 'bebop',
    variants: ['bop', 'bebop style', 'bebop jazz'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'genre',
      aspect: 'subgenre',
      parentGenre: 'jazz',
      subgenre: 'bebop',
    },
    description: 'Bebop jazz characteristics (fast tempo, complex changes)',
    examples: [
      'make it bebop',
      'add bebop lines',
      'use bebop changes',
    ],
  },
  {
    id: createLexemeId('noun', 'modal_jazz'),
    lemma: 'modal',
    variants: ['modal jazz', 'modal style', 'modal approach'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'genre',
      aspect: 'subgenre',
      parentGenre: 'jazz',
      subgenre: 'modal',
    },
    description: 'Modal jazz characteristics (static harmony, modal scales)',
    examples: [
      'make it modal',
      'use modal approach',
      'add modal harmony',
    ],
  },
  {
    id: createLexemeId('noun', 'fusion'),
    lemma: 'fusion',
    variants: ['jazz fusion', 'fusion style', 'jazz-rock fusion'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'genre',
      aspect: 'subgenre',
      parentGenre: 'jazz',
      subgenre: 'fusion',
    },
    description: 'Fusion characteristics (jazz harmony + rock energy)',
    examples: [
      'make it fusion',
      'add fusion elements',
      'create fusion style',
    ],
  },
  {
    id: createLexemeId('noun', 'indie'),
    lemma: 'indie',
    variants: ['indie rock', 'indie style', 'independent'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'genre',
      aspect: 'subgenre',
      parentGenre: 'rock',
      subgenre: 'indie',
    },
    description: 'Indie rock characteristics (alternative, DIY aesthetic)',
    examples: [
      'make it indie',
      'add indie elements',
      'use indie production',
    ],
  },
  {
    id: createLexemeId('noun', 'metal'),
    lemma: 'metal',
    variants: ['heavy metal', 'metal style', 'metallic'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'genre',
      aspect: 'subgenre',
      parentGenre: 'rock',
      subgenre: 'metal',
    },
    description: 'Metal characteristics (heavy distortion, aggressive, powerful)',
    examples: [
      'make it metal',
      'add metal guitar',
      'create metal energy',
    ],
  },
  {
    id: createLexemeId('noun', 'house'),
    lemma: 'house',
    variants: ['house music', 'house style', '4-on-the-floor'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'genre',
      aspect: 'subgenre',
      parentGenre: 'electronic',
      subgenre: 'house',
    },
    description: 'House music characteristics (4/4 beat, repetitive, danceable)',
    examples: [
      'make it house',
      'add house beat',
      'use house groove',
    ],
  },
  {
    id: createLexemeId('noun', 'techno'),
    lemma: 'techno',
    variants: ['techno style', 'techno music', 'Detroit techno'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'genre',
      aspect: 'subgenre',
      parentGenre: 'electronic',
      subgenre: 'techno',
    },
    description: 'Techno characteristics (mechanical, repetitive, industrial)',
    examples: [
      'make it techno',
      'add techno elements',
      'create techno vibe',
    ],
  },
  {
    id: createLexemeId('noun', 'ambient'),
    lemma: 'ambient',
    variants: ['ambient music', 'ambient style', 'atmospheric'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'genre',
      aspect: 'subgenre',
      parentGenre: 'electronic',
      subgenre: 'ambient',
    },
    description: 'Ambient characteristics (textural, atmospheric, minimal rhythm)',
    examples: [
      'make it ambient',
      'add ambient textures',
      'create ambient atmosphere',
    ],
  },
] as const;

// =============================================================================
// Era and Period Markers
// =============================================================================

/**
 * Historical era and period style markers.
 *
 * Covers:
 * - Classical periods (Baroque, Classical, Romantic)
 * - Popular music eras (50s, 60s, 80s, 90s)
 * - Contemporary and vintage markers
 */
const ERA_PERIOD_DESCRIPTORS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'baroque'),
    lemma: 'Baroque',
    variants: ['baroque style', 'baroque period'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'style',
      aspect: 'era',
      period: 'baroque',
      years: '1600-1750',
    },
    description: 'Baroque period characteristics (counterpoint, ornamentation)',
    examples: [
      'make it Baroque',
      'add Baroque ornamentation',
      'use Baroque style',
    ],
  },
  {
    id: createLexemeId('adj', 'romantic'),
    lemma: 'Romantic',
    variants: ['romantic style', 'romantic period'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'style',
      aspect: 'era',
      period: 'romantic',
      years: '1800-1900',
    },
    description: 'Romantic period characteristics (expressive, emotional, chromatic)',
    examples: [
      'make it Romantic',
      'add romantic expression',
      'use romantic harmony',
    ],
  },
  {
    id: createLexemeId('adj', 'modern'),
    lemma: 'modern',
    variants: ['modernist', 'contemporary classical', '20th century'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'style',
      aspect: 'era',
      period: 'modern',
      years: '1900-present',
    },
    description: 'Modern period characteristics (experimental, dissonant, abstract)',
    examples: [
      'make it modern',
      'add modern techniques',
      'use contemporary style',
    ],
  },
  {
    id: createLexemeId('adj', 'retro'),
    lemma: 'retro',
    variants: ['vintage', 'old-school', 'throwback'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('production_era'),
      direction: 'decrease',
    },
    description: 'Vintage production aesthetics and style',
    examples: [
      'make it retro',
      'add vintage feel',
      'use old-school production',
    ],
  },
  {
    id: createLexemeId('adj', 'contemporary'),
    lemma: 'contemporary',
    variants: ['current', 'modern', 'up-to-date'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('production_era'),
      direction: 'increase',
    },
    description: 'Contemporary production aesthetics and style',
    examples: [
      'make it contemporary',
      'update the sound',
      'modernize the production',
    ],
  },
  {
    id: createLexemeId('adj', 'seventies'),
    lemma: '70s',
    variants: ['seventies', '1970s', '70s style'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'style',
      aspect: 'era',
      decade: '1970s',
    },
    description: '1970s production and style characteristics',
    examples: [
      'make it 70s',
      'add 70s vibe',
      'use seventies production',
    ],
  },
  {
    id: createLexemeId('adj', 'eighties'),
    lemma: '80s',
    variants: ['eighties', '1980s', '80s style'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'style',
      aspect: 'era',
      decade: '1980s',
    },
    description: '1980s production characteristics (synths, gated reverb)',
    examples: [
      'make it 80s',
      'add 80s synths',
      'use eighties production',
    ],
  },
  {
    id: createLexemeId('adj', 'nineties'),
    lemma: '90s',
    variants: ['nineties', '1990s', '90s style'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'style',
      aspect: 'era',
      decade: '1990s',
    },
    description: '1990s production and style characteristics',
    examples: [
      'make it 90s',
      'add 90s feel',
      'use nineties style',
    ],
  },
] as const;

// =============================================================================
// Regional and Cultural Styles
// =============================================================================

/**
 * Regional, cultural, and world music style markers.
 *
 * Covers:
 * - Latin American styles
 * - African rhythms
 * - Asian traditions
 * - European folk styles
 */
const REGIONAL_CULTURAL_DESCRIPTORS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'latin'),
    lemma: 'Latin',
    variants: ['Latin American', 'latino', 'Latin style'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'style',
      aspect: 'regional',
      region: 'latin_america',
    },
    description: 'Latin American musical characteristics',
    examples: [
      'make it Latin',
      'add Latin rhythm',
      'use Latin percussion',
    ],
  },
  {
    id: createLexemeId('adj', 'afrobeat'),
    lemma: 'Afrobeat',
    variants: ['African', 'Afrobeat style', 'West African'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'style',
      aspect: 'regional',
      region: 'africa',
      subgenre: 'afrobeat',
    },
    description: 'Afrobeat characteristics (polyrhythms, groove-based)',
    examples: [
      'make it Afrobeat',
      'add African rhythms',
      'use Afrobeat groove',
    ],
  },
  {
    id: createLexemeId('adj', 'brazilian'),
    lemma: 'Brazilian',
    variants: ['Brazil', 'bossa nova', 'samba'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'style',
      aspect: 'regional',
      region: 'brazil',
    },
    description: 'Brazilian musical characteristics (samba, bossa nova rhythms)',
    examples: [
      'make it Brazilian',
      'add bossa nova feel',
      'use samba rhythm',
    ],
  },
  {
    id: createLexemeId('adj', 'caribbean'),
    lemma: 'Caribbean',
    variants: ['reggae', 'ska', 'calypso'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'style',
      aspect: 'regional',
      region: 'caribbean',
    },
    description: 'Caribbean musical characteristics (reggae, ska rhythms)',
    examples: [
      'make it Caribbean',
      'add reggae feel',
      'use ska rhythm',
    ],
  },
  {
    id: createLexemeId('adj', 'middle_eastern'),
    lemma: 'Middle Eastern',
    variants: ['Arabic', 'Persian', 'Oriental'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'style',
      aspect: 'regional',
      region: 'middle_east',
    },
    description: 'Middle Eastern musical characteristics (maqam scales, ornamentation)',
    examples: [
      'make it Middle Eastern',
      'add Arabic scale',
      'use Oriental ornamentation',
    ],
  },
  {
    id: createLexemeId('adj', 'indian'),
    lemma: 'Indian',
    variants: ['raga', 'Hindustani', 'Carnatic'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'style',
      aspect: 'regional',
      region: 'india',
    },
    description: 'Indian musical characteristics (raga, tala, ornamentation)',
    examples: [
      'make it Indian',
      'use raga scale',
      'add Indian ornamentation',
    ],
  },
  {
    id: createLexemeId('adj', 'celtic'),
    lemma: 'Celtic',
    variants: ['Irish', 'Scottish', 'Celtic style'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'style',
      aspect: 'regional',
      region: 'celtic',
    },
    description: 'Celtic musical characteristics (jigs, reels, modal)',
    examples: [
      'make it Celtic',
      'add Irish feel',
      'use Scottish style',
    ],
  },
  {
    id: createLexemeId('adj', 'flamenco'),
    lemma: 'flamenco',
    variants: ['Spanish', 'flamenco style', 'Andalusian'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'style',
      aspect: 'regional',
      region: 'spain',
      subgenre: 'flamenco',
    },
    description: 'Flamenco characteristics (Phrygian mode, strumming patterns)',
    examples: [
      'make it flamenco',
      'add Spanish guitar',
      'use flamenco rhythm',
    ],
  },
] as const;

// =============================================================================
// Aesthetic Descriptors
// =============================================================================

/**
 * Aesthetic and mood-based style descriptors.
 *
 * Covers:
 * - Minimalist vs. maximalist
 * - Experimental vs. traditional
 * - Commercial vs. artistic
 * - Lo-fi vs. hi-fi
 */
const AESTHETIC_DESCRIPTORS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'minimalist'),
    lemma: 'minimalist',
    variants: ['minimal', 'sparse', 'reductive'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('aesthetic_complexity'),
      direction: 'decrease',
    },
    description: 'Minimalist aesthetic (sparse, essential elements only)',
    examples: [
      'make it minimalist',
      'reduce to essentials',
      'use minimal elements',
    ],
  },
  {
    id: createLexemeId('adj', 'maximalist'),
    lemma: 'maximalist',
    variants: ['maximal', 'dense', 'layered'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('aesthetic_complexity'),
      direction: 'increase',
    },
    description: 'Maximalist aesthetic (dense, many layers)',
    examples: [
      'make it maximalist',
      'add more layers',
      'increase density',
    ],
  },
  {
    id: createLexemeId('adj', 'experimental'),
    lemma: 'experimental',
    variants: ['avant-garde', 'innovative', 'unconventional'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('aesthetic_conventionality'),
      direction: 'decrease',
    },
    description: 'Experimental aesthetic (unconventional, innovative)',
    examples: [
      'make it experimental',
      'add avant-garde elements',
      'push boundaries',
    ],
  },
  {
    id: createLexemeId('adj', 'traditional'),
    lemma: 'traditional',
    variants: ['conventional', 'classic', 'standard'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('aesthetic_conventionality'),
      direction: 'increase',
    },
    description: 'Traditional aesthetic (conventional, established forms)',
    examples: [
      'make it traditional',
      'use conventional forms',
      'follow standards',
    ],
  },
  {
    id: createLexemeId('adj', 'commercial'),
    lemma: 'commercial',
    variants: ['radio-friendly', 'mainstream', 'accessible'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('commercial_accessibility'),
      direction: 'increase',
    },
    description: 'Commercial aesthetic (accessible, radio-friendly)',
    examples: [
      'make it commercial',
      'add radio appeal',
      'increase accessibility',
    ],
  },
  {
    id: createLexemeId('adj', 'artistic'),
    lemma: 'artistic',
    variants: ['art music', 'non-commercial', 'experimental'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('commercial_accessibility'),
      direction: 'decrease',
    },
    description: 'Artistic aesthetic (non-commercial, experimental)',
    examples: [
      'make it artistic',
      'prioritize art',
      'reduce commercial appeal',
    ],
  },
  {
    id: createLexemeId('adj', 'lo_fi'),
    lemma: 'lo-fi',
    variants: ['low-fi', 'lo-fi aesthetic', 'degraded'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('production_fidelity'),
      direction: 'decrease',
    },
    description: 'Lo-fi aesthetic (degraded, warm, nostalgic)',
    examples: [
      'make it lo-fi',
      'add tape saturation',
      'degrade the sound',
    ],
  },
  {
    id: createLexemeId('adj', 'hi_fi'),
    lemma: 'hi-fi',
    variants: ['high-fi', 'pristine', 'clean production'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('production_fidelity'),
      direction: 'increase',
    },
    description: 'Hi-fi aesthetic (clean, pristine, high quality)',
    examples: [
      'make it hi-fi',
      'clean up the sound',
      'increase fidelity',
    ],
  },
] as const;

// =============================================================================
// Production Style Markers
// =============================================================================

/**
 * Production technique and aesthetic markers.
 *
 * Covers:
 * - Acoustic vs. electronic production
 * - Live vs. programmed feel
 * - Natural vs. processed
 * - Polished vs. raw
 */
const PRODUCTION_STYLE_DESCRIPTORS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'acoustic'),
    lemma: 'acoustic',
    variants: ['natural', 'unplugged', 'organic'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('production_acoustic'),
      direction: 'increase',
    },
    description: 'Acoustic production (natural instruments, minimal processing)',
    examples: [
      'make it acoustic',
      'use acoustic instruments',
      'go unplugged',
    ],
  },
  {
    id: createLexemeId('adj', 'electric'),
    lemma: 'electric',
    variants: ['electrified', 'amplified', 'plugged in'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('production_acoustic'),
      direction: 'decrease',
    },
    description: 'Electric production (amplified, electronic elements)',
    examples: [
      'make it electric',
      'amplify the sound',
      'add electric elements',
    ],
  },
  {
    id: createLexemeId('adj', 'live_feel'),
    lemma: 'live',
    variants: ['live recording', 'performed', 'concert feel'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('production_liveness'),
      direction: 'increase',
    },
    description: 'Live performance aesthetic (human feel, imperfections)',
    examples: [
      'make it sound live',
      'add performance feel',
      'humanize it',
    ],
  },
  {
    id: createLexemeId('adj', 'programmed'),
    lemma: 'programmed',
    variants: ['sequenced', 'electronic', 'computer-based'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('production_liveness'),
      direction: 'decrease',
    },
    description: 'Programmed aesthetic (precise, electronic)',
    examples: [
      'make it programmed',
      'quantize perfectly',
      'use electronic precision',
    ],
  },
  {
    id: createLexemeId('adj', 'natural_production'),
    lemma: 'natural',
    variants: ['unprocessed', 'raw', 'untreated'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('production_processing'),
      direction: 'decrease',
    },
    description: 'Natural production (minimal processing)',
    examples: [
      'keep it natural',
      'reduce processing',
      'make it raw',
    ],
  },
  {
    id: createLexemeId('adj', 'processed'),
    lemma: 'processed',
    variants: ['treated', 'effected', 'manipulated'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('production_processing'),
      direction: 'increase',
    },
    description: 'Processed production (heavy effects, manipulation)',
    examples: [
      'process the sound',
      'add effects',
      'manipulate the timbre',
    ],
  },
  {
    id: createLexemeId('adj', 'polished'),
    lemma: 'polished',
    variants: ['refined', 'perfected', 'professional'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('production_polish'),
      direction: 'increase',
    },
    description: 'Polished production (refined, professional)',
    examples: [
      'polish the mix',
      'refine the sound',
      'make it professional',
    ],
  },
  {
    id: createLexemeId('adj', 'raw_production'),
    lemma: 'raw',
    variants: ['rough', 'unpolished', 'gritty'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('production_polish'),
      direction: 'decrease',
    },
    description: 'Raw production (unpolished, gritty)',
    examples: [
      'keep it raw',
      'add grit',
      'make it rough',
    ],
  },
] as const;

// =============================================================================
// Combined Exports
// =============================================================================

/**
 * All genre and style marker vocabulary entries from Batch 60.
 */
export const GENRE_STYLE_BATCH_60: readonly Lexeme[] = [
  ...MAJOR_GENRE_DESCRIPTORS,
  ...SUB_GENRE_DESCRIPTORS,
  ...ERA_PERIOD_DESCRIPTORS,
  ...REGIONAL_CULTURAL_DESCRIPTORS,
  ...AESTHETIC_DESCRIPTORS,
  ...PRODUCTION_STYLE_DESCRIPTORS,
] as const;

/**
 * Count of entries in Batch 60.
 */
export const BATCH_60_COUNT = GENRE_STYLE_BATCH_60.length;

/**
 * Categories covered in Batch 60.
 */
export const BATCH_60_CATEGORIES = [
  'Major Genre Categories (8 entries)',
  'Sub-Genre Classifications (8 entries)',
  'Era and Period Markers (8 entries)',
  'Regional and Cultural Styles (8 entries)',
  'Aesthetic Descriptors (8 entries)',
  'Production Style Markers (8 entries)',
] as const;

/**
 * Summary of Batch 60.
 */
export const BATCH_60_SUMMARY = {
  batchNumber: 60,
  name: 'Genre and Style Markers',
  entryCount: BATCH_60_COUNT,
  categories: BATCH_60_CATEGORIES,
  description:
    'Comprehensive vocabulary for genre identification, style markers, era descriptors, ' +
    'regional characteristics, aesthetic approaches, and production styles.',
} as const;
