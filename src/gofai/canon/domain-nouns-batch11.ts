/**
 * GOFAI Domain Nouns — Musical Styles, Genres, and Idioms (Batch 11)
 *
 * Comprehensive vocabulary for musical styles, genres, subgenres, and performance idioms.
 * Enables natural language commands referencing specific musical traditions and aesthetics.
 *
 * @module gofai/canon/domain-nouns-batch11
 */

import {
  type Lexeme,
  createLexemeId,
} from './types';

// =============================================================================
// Extended Lexeme Type for Style/Genre Nouns
// =============================================================================

/**
 * Extended lexeme for musical style and genre domain nouns.
 */
export interface StyleGenreLexeme extends Lexeme {
  readonly styleCategory:
    | 'classical-period'
    | 'jazz-style'
    | 'popular-genre'
    | 'electronic-genre'
    | 'world-music'
    | 'performance-idiom'
    | 'aesthetic'
    | 'compositional-approach';
  readonly originContext?: string;
  readonly typicalCharacteristics?: readonly string[];
  readonly relatedStyles?: readonly string[];
}

// =============================================================================
// Classical Periods and Styles
// =============================================================================

const BAROQUE: StyleGenreLexeme = {
  id: createLexemeId('noun', 'baroque'),
  lemma: 'baroque',
  variants: ['baroque style', 'baroque period'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'baroque' },
  description: 'Western classical music period circa 1600-1750.',
  examples: ['Baroque style ornamentation', 'Bach-like baroque counterpoint', 'Baroque harpsichord'],
  styleCategory: 'classical-period',
  originContext: 'European art music, 1600-1750',
  typicalCharacteristics: ['ornate ornamentation', 'terraced dynamics', 'basso continuo', 'fugal counterpoint', 'dance forms'],
  relatedStyles: ['renaissance', 'classical'],
};

const CLASSICAL: StyleGenreLexeme = {
  id: createLexemeId('noun', 'classical'),
  lemma: 'classical',
  variants: ['classical period', 'classical style'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'classical' },
  description: 'Western art music period circa 1750-1820, emphasizing clarity and balance.',
  examples: ['Classical period phrasing', 'Mozart-style classical', 'Classical sonata form'],
  styleCategory: 'classical-period',
  originContext: 'European art music, 1750-1820',
  typicalCharacteristics: ['clear form', 'balanced phrases', 'dynamic contrast', 'alberti bass', 'sonata form'],
  relatedStyles: ['baroque', 'romantic'],
};

const ROMANTIC: StyleGenreLexeme = {
  id: createLexemeId('noun', 'romantic'),
  lemma: 'romantic',
  variants: ['romantic period', 'romantic style', 'romanticism'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'romantic' },
  description: 'Western art music period circa 1820-1900, emphasizing emotion and expression.',
  examples: ['Romantic lush harmony', 'Chopin-style romantic', 'Romantic expression'],
  styleCategory: 'classical-period',
  originContext: 'European art music, 1820-1900',
  typicalCharacteristics: ['emotional expression', 'chromaticism', 'rubato', 'expanded forms', 'programmatic content'],
  relatedStyles: ['classical', 'impressionist'],
};

const IMPRESSIONIST: StyleGenreLexeme = {
  id: createLexemeId('noun', 'impressionist'),
  lemma: 'impressionist',
  variants: ['impressionism', 'impressionistic'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'impressionist' },
  description: 'Late 19th/early 20th century style emphasizing color and atmosphere.',
  examples: ['Impressionist harmony', 'Debussy-style impressionism', 'Dreamy impressionist textures'],
  styleCategory: 'classical-period',
  originContext: 'French art music, late 1800s-early 1900s',
  typicalCharacteristics: ['whole-tone scales', 'parallel chords', 'ambiguous tonality', 'atmospheric', 'coloristic'],
  relatedStyles: ['romantic', 'modernist'],
};

const MODERNIST: StyleGenreLexeme = {
  id: createLexemeId('noun', 'modernist'),
  lemma: 'modernist',
  variants: ['modern', 'modernism', 'contemporary classical'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'modernist' },
  description: '20th/21st century art music exploring new techniques and sounds.',
  examples: ['Modernist atonality', 'Contemporary classical textures', 'Avant-garde modern'],
  styleCategory: 'classical-period',
  originContext: '20th-21st century art music',
  typicalCharacteristics: ['atonality', 'serialism', 'extended techniques', 'chance procedures', 'experimental'],
  relatedStyles: ['impressionist', 'minimalist'],
};

const MINIMALIST: StyleGenreLexeme = {
  id: createLexemeId('noun', 'minimalist'),
  lemma: 'minimalist',
  variants: ['minimalism', 'minimal music'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'minimalist' },
  description: 'Style characterized by repetition, gradual change, and simple materials.',
  examples: ['Minimalist patterns', 'Reich-style minimalism', 'Phasing minimalist'],
  styleCategory: 'classical-period',
  originContext: 'American art music, 1960s onward',
  typicalCharacteristics: ['repetition', 'gradual process', 'consonant harmony', 'steady pulse', 'phasing'],
  relatedStyles: ['modernist', 'ambient'],
};

// =============================================================================
// Jazz Styles
// =============================================================================

const JAZZ: StyleGenreLexeme = {
  id: createLexemeId('noun', 'jazz'),
  lemma: 'jazz',
  variants: ['jazz style', 'jazzy'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'jazz' },
  description: 'American music genre emphasizing improvisation, swing, and complex harmony.',
  examples: ['Jazz harmony', 'Jazzy chords', 'Jazz improvisation'],
  styleCategory: 'jazz-style',
  originContext: 'African-American music, early 20th century',
  typicalCharacteristics: ['swing rhythm', 'improvisation', 'extended chords', 'blue notes', 'call-and-response'],
  relatedStyles: ['blues', 'bebop', 'swing'],
};

const BLUES: StyleGenreLexeme = {
  id: createLexemeId('noun', 'blues'),
  lemma: 'blues',
  variants: ['blues style', 'bluesy'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'blues' },
  description: 'African-American genre with characteristic 12-bar form and blue notes.',
  examples: ['Blues progression', 'Bluesy feel', 'Traditional blues'],
  styleCategory: 'jazz-style',
  originContext: 'African-American music, late 19th century',
  typicalCharacteristics: ['12-bar form', 'blue notes', 'call-and-response', 'shuffle rhythm', 'pentatonic melodies'],
  relatedStyles: ['jazz', 'rock', 'soul'],
};

const BEBOP: StyleGenreLexeme = {
  id: createLexemeId('noun', 'bebop'),
  lemma: 'bebop',
  variants: ['bop', 'bebop style'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'bebop' },
  description: 'Fast, complex jazz style with intricate melodies and chord changes.',
  examples: ['Bebop lines', 'Fast bebop tempo', 'Charlie Parker-style bebop'],
  styleCategory: 'jazz-style',
  originContext: 'American jazz, 1940s',
  typicalCharacteristics: ['fast tempos', 'complex changes', 'eighth-note lines', 'altered chords', 'virtuosic'],
  relatedStyles: ['jazz', 'hard-bop', 'cool-jazz'],
};

const SWING: StyleGenreLexeme = {
  id: createLexemeId('noun', 'swing'),
  lemma: 'swing',
  variants: ['swing style', 'big band', 'swing era'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'swing' },
  description: 'Jazz style emphasizing strong rhythmic drive and danceable groove.',
  examples: ['Swing feel', 'Big band swing', 'Swing rhythm section'],
  styleCategory: 'jazz-style',
  originContext: 'American jazz, 1930s-1940s',
  typicalCharacteristics: ['swing eighths', 'big band', 'riff-based', 'danceable', 'section playing'],
  relatedStyles: ['jazz', 'bebop'],
};

const COOL_JAZZ: StyleGenreLexeme = {
  id: createLexemeId('noun', 'cool-jazz'),
  lemma: 'cool jazz',
  variants: ['cool', 'west coast jazz', 'cool style'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'cool-jazz' },
  description: 'Relaxed, understated jazz style with softer tones and complex harmonies.',
  examples: ['Cool jazz voicings', 'Laid-back cool style', 'Miles Davis cool'],
  styleCategory: 'jazz-style',
  originContext: 'American jazz, 1940s-1950s',
  typicalCharacteristics: ['relaxed tempo', 'soft dynamics', 'contrapuntal', 'modal', 'restrained emotion'],
  relatedStyles: ['bebop', 'modal-jazz'],
};

const MODAL_JAZZ: StyleGenreLexeme = {
  id: createLexemeId('noun', 'modal-jazz'),
  lemma: 'modal jazz',
  variants: ['modal', 'modal style'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'modal-jazz' },
  description: 'Jazz style using modes rather than chord changes as basis for improvisation.',
  examples: ['Modal harmony', 'Dorian modal jazz', 'Kind of Blue style modal'],
  styleCategory: 'jazz-style',
  originContext: 'American jazz, late 1950s',
  typicalCharacteristics: ['modal scales', 'static harmony', 'open voicings', 'meditative', 'spacious'],
  relatedStyles: ['cool-jazz', 'free-jazz'],
};

const FUSION: StyleGenreLexeme = {
  id: createLexemeId('noun', 'fusion'),
  lemma: 'fusion',
  variants: ['jazz-fusion', 'jazz-rock', 'fusion style'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'fusion' },
  description: 'Jazz style blending elements of funk, rock, and electric instruments.',
  examples: ['Fusion groove', 'Jazz-rock fusion', 'Electric fusion'],
  styleCategory: 'jazz-style',
  originContext: 'American jazz, late 1960s',
  typicalCharacteristics: ['electric instruments', 'rock rhythms', 'funk grooves', 'complex meters', 'synthesizers'],
  relatedStyles: ['jazz', 'funk', 'progressive-rock'],
};

const FREE_JAZZ: StyleGenreLexeme = {
  id: createLexemeId('noun', 'free-jazz'),
  lemma: 'free jazz',
  variants: ['free', 'avant-garde jazz', 'free improvisation'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'free-jazz' },
  description: 'Jazz style abandoning traditional structures in favor of free improvisation.',
  examples: ['Free jazz improvisation', 'Ornette Coleman-style free', 'Atonal free jazz'],
  styleCategory: 'jazz-style',
  originContext: 'American jazz, late 1950s',
  typicalCharacteristics: ['no set changes', 'collective improvisation', 'atonality', 'extended techniques', 'free rhythm'],
  relatedStyles: ['modal-jazz', 'avant-garde'],
};

// =============================================================================
// Popular Genres
// =============================================================================

const ROCK: StyleGenreLexeme = {
  id: createLexemeId('noun', 'rock'),
  lemma: 'rock',
  variants: ['rock and roll', 'rock music', 'rock style'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'rock' },
  description: 'Popular genre emphasizing electric guitars, strong backbeat, and blues influence.',
  examples: ['Rock guitar', 'Classic rock feel', 'Rock and roll energy'],
  styleCategory: 'popular-genre',
  originContext: 'American popular music, 1950s',
  typicalCharacteristics: ['electric guitars', 'backbeat', 'verse-chorus form', 'power chords', 'amplified'],
  relatedStyles: ['blues', 'punk', 'metal'],
};

const POP: StyleGenreLexeme = {
  id: createLexemeId('noun', 'pop'),
  lemma: 'pop',
  variants: ['pop music', 'pop style', 'popular'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'pop' },
  description: 'Accessible, catchy music aimed at mainstream audience.',
  examples: ['Pop production', 'Catchy pop hook', 'Modern pop style'],
  styleCategory: 'popular-genre',
  originContext: 'Mainstream popular music, 1950s onward',
  typicalCharacteristics: ['catchy melodies', 'verse-chorus form', 'polished production', 'accessible', 'radio-friendly'],
  relatedStyles: ['rock', 'r&b', 'dance'],
};

const FUNK: StyleGenreLexeme = {
  id: createLexemeId('noun', 'funk'),
  lemma: 'funk',
  variants: ['funky', 'funk style'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'funk' },
  description: 'Groove-based genre emphasizing strong rhythmic feel and syncopation.',
  examples: ['Funky groove', 'Funk rhythm section', 'James Brown-style funk'],
  styleCategory: 'popular-genre',
  originContext: 'African-American music, 1960s',
  typicalCharacteristics: ['syncopated bass', 'tight grooves', 'rhythmic guitar', 'horn sections', 'strong backbeat'],
  relatedStyles: ['soul', 'jazz', 'disco'],
};

const SOUL: StyleGenreLexeme = {
  id: createLexemeId('noun', 'soul'),
  lemma: 'soul',
  variants: ['soul music', 'soulful'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'soul' },
  description: 'Emotionally expressive African-American genre blending gospel and R&B.',
  examples: ['Soulful vocals', 'Soul harmony', 'Classic soul feel'],
  styleCategory: 'popular-genre',
  originContext: 'African-American music, 1950s-1960s',
  typicalCharacteristics: ['gospel influence', 'emotional vocals', 'horn sections', 'rhythmic drive', 'call-and-response'],
  relatedStyles: ['r&b', 'funk', 'gospel'],
};

const R_AND_B: StyleGenreLexeme = {
  id: createLexemeId('noun', 'r-and-b'),
  lemma: 'R&B',
  variants: ['rhythm and blues', 'r&b', 'R and B'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'r-and-b' },
  description: 'Genre combining blues, jazz, and gospel with strong rhythmic component.',
  examples: ['R&B groove', 'Smooth R&B vocals', 'Contemporary R&B'],
  styleCategory: 'popular-genre',
  originContext: 'African-American music, 1940s onward',
  typicalCharacteristics: ['smooth vocals', 'syncopated rhythms', 'blues influence', 'romantic themes', 'rich harmony'],
  relatedStyles: ['soul', 'funk', 'hip-hop'],
};

const REGGAE: StyleGenreLexeme = {
  id: createLexemeId('noun', 'reggae'),
  lemma: 'reggae',
  variants: ['reggae style', 'roots reggae'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'reggae' },
  description: 'Jamaican genre with characteristic offbeat rhythm and bass-driven sound.',
  examples: ['Reggae rhythm', 'Offbeat reggae guitar', 'Bob Marley-style reggae'],
  styleCategory: 'world-music',
  originContext: 'Jamaican popular music, 1960s',
  typicalCharacteristics: ['offbeat guitar', 'prominent bass', 'one-drop rhythm', 'dub influence', 'political themes'],
  relatedStyles: ['ska', 'dub', 'dancehall'],
};

const COUNTRY: StyleGenreLexeme = {
  id: createLexemeId('noun', 'country'),
  lemma: 'country',
  variants: ['country music', 'country style'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'country' },
  description: 'American genre rooted in folk and blues with narrative lyrics.',
  examples: ['Country guitar', 'Twangy country', 'Modern country production'],
  styleCategory: 'popular-genre',
  originContext: 'American folk music, early 20th century',
  typicalCharacteristics: ['acoustic guitars', 'steel guitar', 'storytelling lyrics', 'twangy vocals', 'simple harmony'],
  relatedStyles: ['folk', 'rock', 'bluegrass'],
};

const FOLK: StyleGenreLexeme = {
  id: createLexemeId('noun', 'folk'),
  lemma: 'folk',
  variants: ['folk music', 'folk style', 'traditional'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'folk' },
  description: 'Traditional or contemporary music rooted in cultural traditions.',
  examples: ['Folk melody', 'Traditional folk', 'Contemporary folk'],
  styleCategory: 'world-music',
  originContext: 'Traditional music worldwide',
  typicalCharacteristics: ['acoustic instruments', 'simple forms', 'narrative lyrics', 'cultural traditions', 'communal'],
  relatedStyles: ['country', 'bluegrass', 'singer-songwriter'],
};

const METAL: StyleGenreLexeme = {
  id: createLexemeId('noun', 'metal'),
  lemma: 'metal',
  variants: ['heavy metal', 'metal style'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'metal' },
  description: 'Heavy, aggressive rock style with distorted guitars and powerful sound.',
  examples: ['Metal riff', 'Heavy metal guitar', 'Aggressive metal drums'],
  styleCategory: 'popular-genre',
  originContext: 'Hard rock, late 1960s',
  typicalCharacteristics: ['distorted guitars', 'power chords', 'aggressive vocals', 'fast tempos', 'loud dynamics'],
  relatedStyles: ['rock', 'punk', 'progressive-rock'],
};

const PUNK: StyleGenreLexeme = {
  id: createLexemeId('noun', 'punk'),
  lemma: 'punk',
  variants: ['punk rock', 'punk style'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'punk' },
  description: 'Fast, aggressive rock style emphasizing raw energy and DIY ethos.',
  examples: ['Punk energy', 'Raw punk sound', 'Three-chord punk'],
  styleCategory: 'popular-genre',
  originContext: 'Underground rock, mid-1970s',
  typicalCharacteristics: ['fast tempo', 'simple chords', 'shouted vocals', 'short songs', 'DIY aesthetic'],
  relatedStyles: ['rock', 'metal', 'garage'],
};

const DISCO: StyleGenreLexeme = {
  id: createLexemeId('noun', 'disco'),
  lemma: 'disco',
  variants: ['disco style', 'disco beat'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'disco' },
  description: 'Danceable genre with four-on-the-floor beat and lush production.',
  examples: ['Disco beat', 'Four-on-the-floor disco', 'Classic disco strings'],
  styleCategory: 'popular-genre',
  originContext: 'Dance music, 1970s',
  typicalCharacteristics: ['four-on-the-floor', 'string sections', 'syncopated bass', 'orchestral', 'danceable'],
  relatedStyles: ['funk', 'dance', 'house'],
};

// =============================================================================
// Electronic Genres
// =============================================================================

const HOUSE: StyleGenreLexeme = {
  id: createLexemeId('noun', 'house'),
  lemma: 'house',
  variants: ['house music', 'house style'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'house' },
  description: 'Electronic dance music with repetitive 4/4 beat, typically 120-130 BPM.',
  examples: ['House beat', 'Classic house', 'Four-on-the-floor house'],
  styleCategory: 'electronic-genre',
  originContext: 'Chicago electronic music, 1980s',
  typicalCharacteristics: ['four-on-the-floor', 'repetitive', '120-130 BPM', 'synthesizers', 'drum machines'],
  relatedStyles: ['disco', 'techno', 'garage'],
};

const TECHNO: StyleGenreLexeme = {
  id: createLexemeId('noun', 'techno'),
  lemma: 'techno',
  variants: ['techno style', 'Detroit techno'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'techno' },
  description: 'Electronic music emphasizing repetitive instrumental textures and futuristic sounds.',
  examples: ['Techno beat', 'Industrial techno', 'Minimal techno'],
  styleCategory: 'electronic-genre',
  originContext: 'Detroit electronic music, 1980s',
  typicalCharacteristics: ['repetitive rhythms', 'synthesizers', 'futuristic', 'minimal', 'machine-like'],
  relatedStyles: ['house', 'industrial', 'trance'],
};

const TRANCE: StyleGenreLexeme = {
  id: createLexemeId('noun', 'trance'),
  lemma: 'trance',
  variants: ['trance music', 'trance style'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'trance' },
  description: 'Electronic music with hypnotic rhythms and build-ups, typically 125-150 BPM.',
  examples: ['Trance build-up', 'Progressive trance', 'Euphoric trance'],
  styleCategory: 'electronic-genre',
  originContext: 'European electronic music, 1990s',
  typicalCharacteristics: ['builds and breakdowns', 'euphoric', 'melodic', '125-150 BPM', 'hypnotic'],
  relatedStyles: ['house', 'techno', 'progressive'],
};

const DRUM_AND_BASS: StyleGenreLexeme = {
  id: createLexemeId('noun', 'drum-and-bass'),
  lemma: 'drum and bass',
  variants: ['d&b', 'dnb', 'jungle'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'drum-and-bass' },
  description: 'Fast electronic music with breakbeats and heavy bass, typically 160-180 BPM.',
  examples: ['Drum and bass rhythm', 'Liquid dnb', 'Neurofunk bass'],
  styleCategory: 'electronic-genre',
  originContext: 'UK electronic music, 1990s',
  typicalCharacteristics: ['fast breakbeats', 'heavy bass', '160-180 BPM', 'complex rhythms', 'syncopated'],
  relatedStyles: ['jungle', 'dubstep', 'breakbeat'],
};

const DUBSTEP: StyleGenreLexeme = {
  id: createLexemeId('noun', 'dubstep'),
  lemma: 'dubstep',
  variants: ['dubstep style', 'brostep'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'dubstep' },
  description: 'Electronic genre with wobbly basslines and half-time feel, around 140 BPM.',
  examples: ['Dubstep wobble', 'Half-time dubstep', 'Dubstep drop'],
  styleCategory: 'electronic-genre',
  originContext: 'UK electronic music, early 2000s',
  typicalCharacteristics: ['wobble bass', 'half-time', '140 BPM', 'heavy sub-bass', 'sparse'],
  relatedStyles: ['drum-and-bass', 'dub', 'grime'],
};

const AMBIENT: StyleGenreLexeme = {
  id: createLexemeId('noun', 'ambient'),
  lemma: 'ambient',
  variants: ['ambient music', 'ambient style'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'ambient' },
  description: 'Atmospheric electronic music emphasizing texture and mood over rhythm.',
  examples: ['Ambient texture', 'Atmospheric ambient', 'Brian Eno-style ambient'],
  styleCategory: 'electronic-genre',
  originContext: 'Electronic music, 1970s',
  typicalCharacteristics: ['atmospheric', 'no beat or slow', 'textural', 'spacious', 'meditative'],
  relatedStyles: ['minimalist', 'drone', 'new-age'],
};

const TRAP: StyleGenreLexeme = {
  id: createLexemeId('noun', 'trap'),
  lemma: 'trap',
  variants: ['trap music', 'trap style', 'trap beat'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'trap' },
  description: 'Hip-hop subgenre with rolling hi-hats, 808 bass, and dark atmosphere.',
  examples: ['Trap beat', 'Trap hi-hats', 'Modern trap production'],
  styleCategory: 'electronic-genre',
  originContext: 'Southern hip-hop, early 2000s',
  typicalCharacteristics: ['rolling hi-hats', '808 bass', 'snare rolls', 'dark mood', 'layered'],
  relatedStyles: ['hip-hop', 'dubstep', 'drill'],
};

const HIP_HOP: StyleGenreLexeme = {
  id: createLexemeId('noun', 'hip-hop'),
  lemma: 'hip-hop',
  variants: ['hip hop', 'rap', 'hip-hop style'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'hip-hop' },
  description: 'Urban genre emphasizing rapped vocals over sampled or programmed beats.',
  examples: ['Hip-hop beat', 'Boom-bap hip-hop', 'Modern hip-hop production'],
  styleCategory: 'popular-genre',
  originContext: 'African-American urban music, 1970s',
  typicalCharacteristics: ['rapped vocals', 'sampling', 'breakbeats', 'turntablism', 'rhythmic'],
  relatedStyles: ['r&b', 'trap', 'funk'],
};

const LO_FI: StyleGenreLexeme = {
  id: createLexemeId('noun', 'lo-fi'),
  lemma: 'lo-fi',
  variants: ['lofi', 'lo-fi hip-hop', 'chillhop'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'lo-fi' },
  description: 'Relaxed hip-hop style with intentionally low-fidelity aesthetic and jazz samples.',
  examples: ['Lo-fi beat', 'Chill lo-fi', 'Study beats lo-fi'],
  styleCategory: 'electronic-genre',
  originContext: 'Internet hip-hop, 2010s',
  typicalCharacteristics: ['low-fidelity', 'jazz samples', 'relaxed tempo', 'vinyl crackle', 'nostalgic'],
  relatedStyles: ['hip-hop', 'jazz', 'ambient'],
};

const VAPORWAVE: StyleGenreLexeme = {
  id: createLexemeId('noun', 'vaporwave'),
  lemma: 'vaporwave',
  variants: ['vaporwave style', 'mallsoft'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-style', style: 'vaporwave' },
  description: 'Internet genre sampling 80s/90s music with surreal, nostalgic aesthetic.',
  examples: ['Vaporwave aesthetic', 'Slowed vaporwave', 'Retro vaporwave'],
  styleCategory: 'electronic-genre',
  originContext: 'Internet music, early 2010s',
  typicalCharacteristics: ['chopped samples', 'pitch-shifted', 'nostalgic', '80s/90s references', 'surreal'],
  relatedStyles: ['lo-fi', 'ambient', 'experimental'],
};

// Export all lexemes
export const STYLE_GENRE_LEXEMES: readonly StyleGenreLexeme[] = [
  // Classical periods (6)
  BAROQUE, CLASSICAL, ROMANTIC, IMPRESSIONIST, MODERNIST, MINIMALIST,
  
  // Jazz styles (8)
  JAZZ, BLUES, BEBOP, SWING, COOL_JAZZ, MODAL_JAZZ, FUSION, FREE_JAZZ,
  
  // Popular genres (11)
  ROCK, POP, FUNK, SOUL, R_AND_B, REGGAE, COUNTRY, FOLK, METAL, PUNK, DISCO,
  
  // Electronic genres (10)
  HOUSE, TECHNO, TRANCE, DRUM_AND_BASS, DUBSTEP, AMBIENT, TRAP, HIP_HOP, LO_FI, VAPORWAVE,
] as const;

// Helper functions
export function getStyleByName(name: string): StyleGenreLexeme | undefined {
  return STYLE_GENRE_LEXEMES.find(
    lex => lex.lemma.toLowerCase() === name.toLowerCase() ||
           lex.variants.some(v => v.toLowerCase() === name.toLowerCase())
  );
}

export function getStylesByCategory(category: StyleGenreLexeme['styleCategory']): readonly StyleGenreLexeme[] {
  return STYLE_GENRE_LEXEMES.filter(lex => lex.styleCategory === category);
}

export function getClassicalStyles(): readonly StyleGenreLexeme[] {
  return STYLE_GENRE_LEXEMES.filter(lex => lex.styleCategory === 'classical-period');
}

export function getJazzStyles(): readonly StyleGenreLexeme[] {
  return STYLE_GENRE_LEXEMES.filter(lex => lex.styleCategory === 'jazz-style');
}

export function getElectronicGenres(): readonly StyleGenreLexeme[] {
  return STYLE_GENRE_LEXEMES.filter(lex => lex.styleCategory === 'electronic-genre');
}

export function getPopularGenres(): readonly StyleGenreLexeme[] {
  return STYLE_GENRE_LEXEMES.filter(lex => lex.styleCategory === 'popular-genre');
}

export function getRelatedStyles(styleName: string): readonly string[] {
  const style = getStyleByName(styleName);
  return style?.relatedStyles ?? [];
}

/**
 * Vocabulary summary statistics.
 */
export const STYLE_GENRE_STATS = {
  totalLexemes: STYLE_GENRE_LEXEMES.length,
  classicalPeriods: 6,
  jazzStyles: 8,
  popularGenres: 11,
  electronicGenres: 10,
} as const;
