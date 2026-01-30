/**
 * GOFAI Canon Tests — Domain Noun Batches 16-18
 *
 * Comprehensive tests for newly added vocabulary batches:
 * - Batch 16: Expression & Articulation
 * - Batch 17: Genres & Musical Styles
 * - Batch 18: Audio Production & Mixing
 *
 * @module gofai/canon/tests/domain-nouns-batches-16-18.test
 */

import { describe, it, expect } from 'vitest';
import {
  EXPRESSION_ARTICULATION_LEXEMES,
  GENRE_STYLE_LEXEMES,
  PRODUCTION_MIXING_LEXEMES,
} from '../index';
import type { DomainNounLexeme } from '../types';

// =============================================================================
// Test Utilities
// =============================================================================

function assertLexemeStructure(lexeme: DomainNounLexeme) {
  expect(lexeme.id).toBeDefined();
  expect(typeof lexeme.id).toBe('string');
  expect(lexeme.id.startsWith('noun:')).toBe(true);

  expect(lexeme.term).toBeDefined();
  expect(typeof lexeme.term).toBe('string');
  expect(lexeme.term.length).toBeGreaterThan(0);

  expect(lexeme.variants).toBeDefined();
  expect(Array.isArray(lexeme.variants)).toBe(true);

  expect(lexeme.category).toBeDefined();
  expect(typeof lexeme.category).toBe('string');

  expect(lexeme.definition).toBeDefined();
  expect(typeof lexeme.definition).toBe('string');

  expect(lexeme.semantics).toBeDefined();
  expect(lexeme.semantics.type).toBeDefined();

  expect(lexeme.examples).toBeDefined();
  expect(Array.isArray(lexeme.examples)).toBe(true);
  expect(lexeme.examples.length).toBeGreaterThan(0);
}

function assertIdUniqueness(lexemes: readonly DomainNounLexeme[]) {
  const ids = lexemes.map((l) => l.id);
  const uniqueIds = new Set(ids);
  expect(ids.length).toBe(uniqueIds.size);
}

function assertTermUniqueness(lexemes: readonly DomainNounLexeme[]) {
  const terms = lexemes.map((l) => l.term.toLowerCase());
  const uniqueTerms = new Set(terms);
  expect(terms.length).toBe(uniqueTerms.size);
}

// =============================================================================
// Batch 16: Expression & Articulation Tests
// =============================================================================

describe('Domain Nouns Batch 16: Expression & Articulation', () => {
  it('should export lexemes array', () => {
    expect(EXPRESSION_ARTICULATION_LEXEMES).toBeDefined();
    expect(Array.isArray(EXPRESSION_ARTICULATION_LEXEMES)).toBe(true);
  });

  it('should have substantial coverage (40+ terms)', () => {
    expect(EXPRESSION_ARTICULATION_LEXEMES.length).toBeGreaterThanOrEqual(40);
  });

  it('should have valid structure for all lexemes', () => {
    EXPRESSION_ARTICULATION_LEXEMES.forEach(assertLexemeStructure);
  });

  it('should have unique IDs', () => {
    assertIdUniqueness(EXPRESSION_ARTICULATION_LEXEMES);
  });

  it('should have unique terms', () => {
    assertTermUniqueness(EXPRESSION_ARTICULATION_LEXEMES);
  });

  it('should include staccato', () => {
    const staccato = EXPRESSION_ARTICULATION_LEXEMES.find(
      (l) => l.id === 'noun:staccato'
    );
    expect(staccato).toBeDefined();
    expect(staccato?.term).toBe('staccato');
    expect(staccato?.category).toBe('articulation');
    expect(staccato?.variants).toContain('detached');
  });

  it('should include legato', () => {
    const legato = EXPRESSION_ARTICULATION_LEXEMES.find(
      (l) => l.id === 'noun:legato'
    );
    expect(legato).toBeDefined();
    expect(legato?.term).toBe('legato');
    expect(legato?.category).toBe('articulation');
    expect(legato?.variants).toContain('smooth');
  });

  it('should include crescendo', () => {
    const crescendo = EXPRESSION_ARTICULATION_LEXEMES.find(
      (l) => l.id === 'noun:crescendo'
    );
    expect(crescendo).toBeDefined();
    expect(crescendo?.term).toBe('crescendo');
    expect(crescendo?.category).toBe('dynamics');
  });

  it('should include ritardando', () => {
    const ritardando = EXPRESSION_ARTICULATION_LEXEMES.find(
      (l) => l.id === 'noun:ritardando'
    );
    expect(ritardando).toBeDefined();
    expect(ritardando?.term).toBe('ritardando');
    expect(ritardando?.variants).toContain('rit');
  });

  it('should include trill', () => {
    const trill = EXPRESSION_ARTICULATION_LEXEMES.find(
      (l) => l.id === 'noun:trill'
    );
    expect(trill).toBeDefined();
    expect(trill?.category).toBe('ornament');
  });

  it('should include ghost note', () => {
    const ghostNote = EXPRESSION_ARTICULATION_LEXEMES.find(
      (l) => l.id === 'noun:ghost_note'
    );
    expect(ghostNote).toBeDefined();
    expect(ghostNote?.variants).toContain('dead note');
  });

  it('should include melisma for vocal techniques', () => {
    const melisma = EXPRESSION_ARTICULATION_LEXEMES.find(
      (l) => l.id === 'noun:melisma'
    );
    expect(melisma).toBeDefined();
    expect(melisma?.category).toBe('vocal_technique');
  });

  it('should include ensemble techniques like doubling', () => {
    const doubling = EXPRESSION_ARTICULATION_LEXEMES.find(
      (l) => l.id === 'noun:doubling'
    );
    expect(doubling).toBeDefined();
    expect(doubling?.category).toBe('ensemble');
  });

  it('should have comprehensive examples for each term', () => {
    EXPRESSION_ARTICULATION_LEXEMES.forEach((lexeme) => {
      expect(lexeme.examples.length).toBeGreaterThanOrEqual(2);
      lexeme.examples.forEach((example) => {
        expect(typeof example).toBe('string');
        expect(example.length).toBeGreaterThan(0);
      });
    });
  });

  it('should have meaningful axis mappings for applicable terms', () => {
    const withMappings = EXPRESSION_ARTICULATION_LEXEMES.filter(
      (l) => l.semantics.type === 'concept' && 'mapping' in l.semantics
    );
    expect(withMappings.length).toBeGreaterThan(10);

    withMappings.forEach((lexeme) => {
      const mapping = (lexeme.semantics as any).mapping;
      expect(mapping).toBeDefined();
      expect(mapping.axis || mapping.affects).toBeDefined();
    });
  });
});

// =============================================================================
// Batch 17: Genres & Musical Styles Tests
// =============================================================================

describe('Domain Nouns Batch 17: Genres & Musical Styles', () => {
  it('should export lexemes array', () => {
    expect(GENRE_STYLE_LEXEMES).toBeDefined();
    expect(Array.isArray(GENRE_STYLE_LEXEMES)).toBe(true);
  });

  it('should have substantial coverage (30+ genres)', () => {
    expect(GENRE_STYLE_LEXEMES.length).toBeGreaterThanOrEqual(30);
  });

  it('should have valid structure for all lexemes', () => {
    GENRE_STYLE_LEXEMES.forEach(assertLexemeStructure);
  });

  it('should have unique IDs', () => {
    assertIdUniqueness(GENRE_STYLE_LEXEMES);
  });

  it('should have unique terms', () => {
    assertTermUniqueness(GENRE_STYLE_LEXEMES);
  });

  it('should include electronic music genres', () => {
    const house = GENRE_STYLE_LEXEMES.find((l) => l.id === 'noun:house');
    const techno = GENRE_STYLE_LEXEMES.find((l) => l.id === 'noun:techno');
    const dubstep = GENRE_STYLE_LEXEMES.find((l) => l.id === 'noun:dubstep');

    expect(house).toBeDefined();
    expect(techno).toBeDefined();
    expect(dubstep).toBeDefined();

    expect(house?.category).toBe('genre');
    expect(techno?.category).toBe('genre');
  });

  it('should include hip-hop styles', () => {
    const boomBap = GENRE_STYLE_LEXEMES.find((l) => l.id === 'noun:boom_bap');
    const trap = GENRE_STYLE_LEXEMES.find((l) => l.id === 'noun:trap');
    const lofi = GENRE_STYLE_LEXEMES.find((l) => l.id === 'noun:lo_fi_hip_hop');

    expect(boomBap).toBeDefined();
    expect(trap).toBeDefined();
    expect(lofi).toBeDefined();
  });

  it('should include jazz subgenres', () => {
    const bebop = GENRE_STYLE_LEXEMES.find((l) => l.id === 'noun:bebop');
    const modal = GENRE_STYLE_LEXEMES.find((l) => l.id === 'noun:modal_jazz');
    const swing = GENRE_STYLE_LEXEMES.find((l) => l.id === 'noun:swing');

    expect(bebop).toBeDefined();
    expect(modal).toBeDefined();
    expect(swing).toBeDefined();
  });

  it('should include rock and metal styles', () => {
    const punk = GENRE_STYLE_LEXEMES.find((l) => l.id === 'noun:punk');
    const metal = GENRE_STYLE_LEXEMES.find((l) => l.id === 'noun:metal');
    const grunge = GENRE_STYLE_LEXEMES.find((l) => l.id === 'noun:grunge');

    expect(punk).toBeDefined();
    expect(metal).toBeDefined();
    expect(grunge).toBeDefined();
  });

  it('should include world and latin genres', () => {
    const bossaNova = GENRE_STYLE_LEXEMES.find(
      (l) => l.id === 'noun:bossa_nova'
    );
    const reggae = GENRE_STYLE_LEXEMES.find((l) => l.id === 'noun:reggae');
    const afrobeat = GENRE_STYLE_LEXEMES.find((l) => l.id === 'noun:afrobeat');

    expect(bossaNova).toBeDefined();
    expect(reggae).toBeDefined();
    expect(afrobeat).toBeDefined();
  });

  it('should include classical era styles', () => {
    const baroque = GENRE_STYLE_LEXEMES.find((l) => l.id === 'noun:baroque');
    const romantic = GENRE_STYLE_LEXEMES.find((l) => l.id === 'noun:romantic');
    const minimalist = GENRE_STYLE_LEXEMES.find(
      (l) => l.id === 'noun:minimalist'
    );

    expect(baroque).toBeDefined();
    expect(romantic).toBeDefined();
    expect(minimalist).toBeDefined();
  });

  it('should include genre characteristics where applicable', () => {
    const withCharacteristics = GENRE_STYLE_LEXEMES.filter(
      (l) =>
        l.semantics.type === 'concept' && 'characteristics' in l.semantics
    );
    expect(withCharacteristics.length).toBeGreaterThan(15);

    withCharacteristics.forEach((lexeme) => {
      const characteristics = (lexeme.semantics as any).characteristics;
      expect(characteristics).toBeDefined();
      expect(typeof characteristics).toBe('object');
    });
  });

  it('should have tempo information for rhythm-based genres', () => {
    const house = GENRE_STYLE_LEXEMES.find((l) => l.id === 'noun:house');
    const techno = GENRE_STYLE_LEXEMES.find((l) => l.id === 'noun:techno');
    const dnb = GENRE_STYLE_LEXEMES.find(
      (l) => l.id === 'noun:drum_and_bass'
    );

    if (house?.semantics.type === 'concept' && 'characteristics' in house.semantics) {
      const chars = (house.semantics as any).characteristics;
      expect(chars.tempo).toBeDefined();
    }

    if (techno?.semantics.type === 'concept' && 'characteristics' in techno.semantics) {
      const chars = (techno.semantics as any).characteristics;
      expect(chars.tempo).toBeDefined();
    }

    if (dnb?.semantics.type === 'concept' && 'characteristics' in dnb.semantics) {
      const chars = (dnb.semantics as any).characteristics;
      expect(chars.tempo).toBeDefined();
    }
  });
});

// =============================================================================
// Batch 18: Audio Production & Mixing Tests
// =============================================================================

describe('Domain Nouns Batch 18: Audio Production & Mixing', () => {
  it('should export lexemes array', () => {
    expect(PRODUCTION_MIXING_LEXEMES).toBeDefined();
    expect(Array.isArray(PRODUCTION_MIXING_LEXEMES)).toBe(true);
  });

  it('should have substantial coverage (35+ terms)', () => {
    expect(PRODUCTION_MIXING_LEXEMES.length).toBeGreaterThanOrEqual(35);
  });

  it('should have valid structure for all lexemes', () => {
    PRODUCTION_MIXING_LEXEMES.forEach(assertLexemeStructure);
  });

  it('should have unique IDs', () => {
    assertIdUniqueness(PRODUCTION_MIXING_LEXEMES);
  });

  it('should have unique terms', () => {
    assertTermUniqueness(PRODUCTION_MIXING_LEXEMES);
  });

  it('should include frequency ranges', () => {
    const subBass = PRODUCTION_MIXING_LEXEMES.find(
      (l) => l.id === 'noun:sub_bass'
    );
    const bass = PRODUCTION_MIXING_LEXEMES.find((l) => l.id === 'noun:bass_freq');
    const mids = PRODUCTION_MIXING_LEXEMES.find((l) => l.id === 'noun:mids');
    const highs = PRODUCTION_MIXING_LEXEMES.find((l) => l.id === 'noun:highs');
    const air = PRODUCTION_MIXING_LEXEMES.find((l) => l.id === 'noun:air');

    expect(subBass).toBeDefined();
    expect(bass).toBeDefined();
    expect(mids).toBeDefined();
    expect(highs).toBeDefined();
    expect(air).toBeDefined();

    expect(subBass?.category).toBe('frequency_range');
  });

  it('should include frequency issues', () => {
    const mud = PRODUCTION_MIXING_LEXEMES.find((l) => l.id === 'noun:mud');
    const boxiness = PRODUCTION_MIXING_LEXEMES.find(
      (l) => l.id === 'noun:boxiness'
    );
    const harshness = PRODUCTION_MIXING_LEXEMES.find(
      (l) => l.id === 'noun:harshness'
    );
    const sibilance = PRODUCTION_MIXING_LEXEMES.find(
      (l) => l.id === 'noun:sibilance'
    );

    expect(mud).toBeDefined();
    expect(boxiness).toBeDefined();
    expect(harshness).toBeDefined();
    expect(sibilance).toBeDefined();

    expect(mud?.category).toBe('frequency_issue');
  });

  it('should include dynamics processors', () => {
    const compression = PRODUCTION_MIXING_LEXEMES.find(
      (l) => l.id === 'noun:compression'
    );
    const limiting = PRODUCTION_MIXING_LEXEMES.find(
      (l) => l.id === 'noun:limiting'
    );
    const gating = PRODUCTION_MIXING_LEXEMES.find(
      (l) => l.id === 'noun:gating'
    );
    const sideChain = PRODUCTION_MIXING_LEXEMES.find(
      (l) => l.id === 'noun:side_chain'
    );

    expect(compression).toBeDefined();
    expect(limiting).toBeDefined();
    expect(gating).toBeDefined();
    expect(sideChain).toBeDefined();

    expect(compression?.category).toBe('dynamics');
  });

  it('should include spatial effects', () => {
    const reverb = PRODUCTION_MIXING_LEXEMES.find(
      (l) => l.id === 'noun:reverb'
    );
    const delay = PRODUCTION_MIXING_LEXEMES.find((l) => l.id === 'noun:delay');
    const chorus = PRODUCTION_MIXING_LEXEMES.find(
      (l) => l.id === 'noun:chorus_effect'
    );
    const flanger = PRODUCTION_MIXING_LEXEMES.find(
      (l) => l.id === 'noun:flanger'
    );

    expect(reverb).toBeDefined();
    expect(delay).toBeDefined();
    expect(chorus).toBeDefined();
    expect(flanger).toBeDefined();

    expect(reverb?.category).toBe('spatial');
  });

  it('should include stereo concepts', () => {
    const panning = PRODUCTION_MIXING_LEXEMES.find(
      (l) => l.id === 'noun:panning'
    );
    const stereoWidth = PRODUCTION_MIXING_LEXEMES.find(
      (l) => l.id === 'noun:stereo_width'
    );
    const midSide = PRODUCTION_MIXING_LEXEMES.find(
      (l) => l.id === 'noun:mid_side'
    );

    expect(panning).toBeDefined();
    expect(stereoWidth).toBeDefined();
    expect(midSide).toBeDefined();

    expect(panning?.category).toBe('stereo');
  });

  it('should include harmonic processing', () => {
    const saturation = PRODUCTION_MIXING_LEXEMES.find(
      (l) => l.id === 'noun:saturation'
    );
    const distortion = PRODUCTION_MIXING_LEXEMES.find(
      (l) => l.id === 'noun:distortion'
    );
    const harmonics = PRODUCTION_MIXING_LEXEMES.find(
      (l) => l.id === 'noun:harmonics'
    );

    expect(saturation).toBeDefined();
    expect(distortion).toBeDefined();
    expect(harmonics).toBeDefined();

    expect(saturation?.category).toBe('harmonic');
  });

  it('should include level management concepts', () => {
    const headroom = PRODUCTION_MIXING_LEXEMES.find(
      (l) => l.id === 'noun:headroom'
    );
    const loudness = PRODUCTION_MIXING_LEXEMES.find(
      (l) => l.id === 'noun:loudness'
    );
    const gainStaging = PRODUCTION_MIXING_LEXEMES.find(
      (l) => l.id === 'noun:gain_staging'
    );

    expect(headroom).toBeDefined();
    expect(loudness).toBeDefined();
    expect(gainStaging).toBeDefined();
  });

  it('should include mastering processes', () => {
    const mastering = PRODUCTION_MIXING_LEXEMES.find(
      (l) => l.id === 'noun:mastering'
    );
    const dithering = PRODUCTION_MIXING_LEXEMES.find(
      (l) => l.id === 'noun:dithering'
    );
    const normalization = PRODUCTION_MIXING_LEXEMES.find(
      (l) => l.id === 'noun:normalization'
    );

    expect(mastering).toBeDefined();
    expect(dithering).toBeDefined();
    expect(normalization).toBeDefined();
  });

  it('should have axis mappings for production parameters', () => {
    const withMappings = PRODUCTION_MIXING_LEXEMES.filter(
      (l) => l.semantics.type === 'concept' && 'mapping' in l.semantics
    );
    expect(withMappings.length).toBeGreaterThan(10);

    withMappings.forEach((lexeme) => {
      const mapping = (lexeme.semantics as any).mapping;
      expect(mapping).toBeDefined();
      expect(mapping.axis || mapping.affects).toBeDefined();
    });
  });

  it('should have frequency range information where applicable', () => {
    const subBass = PRODUCTION_MIXING_LEXEMES.find(
      (l) => l.id === 'noun:sub_bass'
    );
    if (subBass?.semantics.type === 'concept' && 'mapping' in subBass.semantics) {
      const mapping = (subBass.semantics as any).mapping;
      expect(mapping.range).toBeDefined();
      expect(Array.isArray(mapping.range)).toBe(true);
      expect(mapping.range.length).toBe(2);
    }
  });
});

// =============================================================================
// Cross-Batch Integration Tests
// =============================================================================

describe('Batches 16-18 Integration', () => {
  it('should have no ID collisions across all three batches', () => {
    const allLexemes = [
      ...EXPRESSION_ARTICULATION_LEXEMES,
      ...GENRE_STYLE_LEXEMES,
      ...PRODUCTION_MIXING_LEXEMES,
    ];

    const ids = allLexemes.map((l) => l.id);
    const uniqueIds = new Set(ids);

    expect(ids.length).toBe(uniqueIds.size);
  });

  it('should have no term collisions across all three batches', () => {
    const allLexemes = [
      ...EXPRESSION_ARTICULATION_LEXEMES,
      ...GENRE_STYLE_LEXEMES,
      ...PRODUCTION_MIXING_LEXEMES,
    ];

    const terms = allLexemes.map((l) => l.term.toLowerCase());
    const uniqueTerms = new Set(terms);

    expect(terms.length).toBe(uniqueTerms.size);
  });

  it('should have combined coverage of 100+ terms', () => {
    const total =
      EXPRESSION_ARTICULATION_LEXEMES.length +
      GENRE_STYLE_LEXEMES.length +
      PRODUCTION_MIXING_LEXEMES.length;

    expect(total).toBeGreaterThanOrEqual(100);
  });

  it('should have diverse category coverage', () => {
    const allLexemes = [
      ...EXPRESSION_ARTICULATION_LEXEMES,
      ...GENRE_STYLE_LEXEMES,
      ...PRODUCTION_MIXING_LEXEMES,
    ];

    const categories = new Set(allLexemes.map((l) => l.category));

    // Should have at least 15 different categories
    expect(categories.size).toBeGreaterThanOrEqual(15);
  });

  it('should have comprehensive examples across all batches', () => {
    const allLexemes = [
      ...EXPRESSION_ARTICULATION_LEXEMES,
      ...GENRE_STYLE_LEXEMES,
      ...PRODUCTION_MIXING_LEXEMES,
    ];

    const totalExamples = allLexemes.reduce(
      (sum, l) => sum + l.examples.length,
      0
    );

    // Should have at least 300 examples total
    expect(totalExamples).toBeGreaterThanOrEqual(300);
  });

  it('should have valid semantic types across all batches', () => {
    const allLexemes = [
      ...EXPRESSION_ARTICULATION_LEXEMES,
      ...GENRE_STYLE_LEXEMES,
      ...PRODUCTION_MIXING_LEXEMES,
    ];

    const validSemanticTypes = ['entity', 'concept', 'modifier', 'action', 'constraint'];

    allLexemes.forEach((lexeme) => {
      expect(validSemanticTypes).toContain(lexeme.semantics.type);
    });
  });
});
