/**
 * @fileoverview SMuFL (Standard Music Font Layout) glyph definitions.
 * 
 * Uses MuseScore's Leland font which is SMuFL-compliant.
 * Unicode codepoints from SMuFL specification: https://w3c.github.io/smufl/
 */

// ============================================================================
// SMuFL CODEPOINTS
// ============================================================================

/**
 * SMuFL Unicode codepoints for musical symbols.
 * These map to glyphs in SMuFL-compliant fonts like Leland (MuseScore) or Bravura.
 */
export const SMUFL = {
  // Clefs (U+E050–U+E07F)
  gClef: '\uE050',                    // G clef (treble)
  gClef8vb: '\uE052',                 // G clef ottava bassa
  gClef8va: '\uE053',                 // G clef ottava alta
  gClef15mb: '\uE051',                // G clef quindicesima bassa
  gClef15ma: '\uE054',                // G clef quindicesima alta
  cClef: '\uE05C',                    // C clef (alto/tenor)
  fClef: '\uE062',                    // F clef (bass)
  fClef8vb: '\uE064',                 // F clef ottava bassa
  fClef8va: '\uE065',                 // F clef ottava alta
  unpitchedPercussionClef1: '\uE069', // Percussion clef
  unpitchedPercussionClef2: '\uE06A', // Percussion clef alt
  gClefChange: '\uE07A',              // G clef change (small)
  cClefChange: '\uE07B',              // C clef change (small)
  fClefChange: '\uE07C',              // F clef change (small)
  
  // Time signatures (U+E080–U+E09F)
  timeSig0: '\uE080',
  timeSig1: '\uE081',
  timeSig2: '\uE082',
  timeSig3: '\uE083',
  timeSig4: '\uE084',
  timeSig5: '\uE085',
  timeSig6: '\uE086',
  timeSig7: '\uE087',
  timeSig8: '\uE088',
  timeSig9: '\uE089',
  timeSigCommon: '\uE08A',            // Common time (C)
  timeSigCutCommon: '\uE08B',         // Cut time (₵)
  timeSigPlus: '\uE08C',
  timeSigPlusSmall: '\uE08D',
  timeSigFractionalSlash: '\uE08E',
  timeSigEquals: '\uE08F',
  timeSigMinus: '\uE090',
  timeSigMultiply: '\uE091',
  timeSigParensLeft: '\uE094',
  timeSigParensRight: '\uE095',
  timeSigCombNumerator: '\uE09E',
  timeSigCombDenominator: '\uE09F',
  
  // Noteheads (U+E0A0–U+E0FF)
  noteheadDoubleWhole: '\uE0A0',      // Breve
  noteheadDoubleWholeSquare: '\uE0A1',
  noteheadWhole: '\uE0A2',            // Whole note (semibreve)
  noteheadHalf: '\uE0A3',             // Half note (minim)
  noteheadBlack: '\uE0A4',            // Quarter/eighth/etc. (crotchet+)
  noteheadNull: '\uE0A5',             // Invisible notehead for spacing
  noteheadXBlack: '\uE0A9',           // X notehead
  noteheadDiamondBlack: '\uE0DB',     // Diamond notehead
  noteheadDiamondHalf: '\uE0D9',
  noteheadDiamondWhole: '\uE0D8',
  noteheadParenthesisLeft: '\uE0F5',  // Opening parenthesis for notehead
  noteheadParenthesisRight: '\uE0F6', // Closing parenthesis for notehead
  
  // Individual notes (with stems/flags) - for reference
  // Normally stems and flags are drawn separately
  
  // Flags (U+E240–U+E25F)
  flag8thUp: '\uE240',
  flag8thDown: '\uE241',
  flag16thUp: '\uE242',
  flag16thDown: '\uE243',
  flag32ndUp: '\uE244',
  flag32ndDown: '\uE245',
  flag64thUp: '\uE246',
  flag64thDown: '\uE247',
  flag128thUp: '\uE248',
  flag128thDown: '\uE249',
  flag256thUp: '\uE24A',
  flag256thDown: '\uE24B',
  flag512thUp: '\uE24C',
  flag512thDown: '\uE24D',
  flag1024thUp: '\uE24E',
  flag1024thDown: '\uE24F',
  flagInternalUp: '\uE250',
  flagInternalDown: '\uE251',
  
  // Accidentals (U+E260–U+E26F for standard)
  accidentalFlat: '\uE260',
  accidentalNatural: '\uE261',
  accidentalSharp: '\uE262',
  accidentalDoubleSharp: '\uE263',
  accidentalDoubleFlat: '\uE264',
  accidentalTripleSharp: '\uE265',
  accidentalTripleFlat: '\uE266',
  accidentalNaturalFlat: '\uE267',
  accidentalNaturalSharp: '\uE268',
  accidentalSharpSharp: '\uE269',
  accidentalParensLeft: '\uE26A',
  accidentalParensRight: '\uE26B',
  accidentalBracketLeft: '\uE26C',
  accidentalBracketRight: '\uE26D',
  
  // Quarter-tone accidentals
  accidentalQuarterToneFlatStein: '\uE280',
  accidentalQuarterToneSharpStein: '\uE282',
  accidentalThreeQuarterTonesFlatZimmermann: '\uE281',
  accidentalThreeQuarterTonesSharpStein: '\uE283',
  
  // Articulations (U+E4A0–U+E4BF)
  articAccentAbove: '\uE4A0',
  articAccentBelow: '\uE4A1',
  articStaccatoAbove: '\uE4A2',
  articStaccatoBelow: '\uE4A3',
  articTenutoAbove: '\uE4A4',
  articTenutoBelow: '\uE4A5',
  articStaccatissimoAbove: '\uE4A6',
  articStaccatissimoBelow: '\uE4A7',
  articStaccatissimoWedgeAbove: '\uE4A8',
  articStaccatissimoWedgeBelow: '\uE4A9',
  articStaccatissimoStrokeAbove: '\uE4AA',
  articStaccatissimoStrokeBelow: '\uE4AB',
  articMarcatoAbove: '\uE4AC',
  articMarcatoBelow: '\uE4AD',
  articMarcatoStaccatoAbove: '\uE4AE',
  articMarcatoStaccatoBelow: '\uE4AF',
  articAccentStaccatoAbove: '\uE4B0',
  articAccentStaccatoBelow: '\uE4B1',
  articTenutoStaccatoAbove: '\uE4B2',
  articTenutoStaccatoBelow: '\uE4B3',
  articTenutoAccentAbove: '\uE4B4',
  articTenutoAccentBelow: '\uE4B5',
  articStressAbove: '\uE4B6',
  articStressBelow: '\uE4B7',
  articUnstressAbove: '\uE4B8',
  articUnstressBelow: '\uE4B9',
  articSoftAccentAbove: '\uE4BA',
  articSoftAccentBelow: '\uE4BB',
  
  // Holds and pauses
  fermataAbove: '\uE4C0',
  fermataBelow: '\uE4C1',
  fermataVeryShortAbove: '\uE4C2',
  fermataVeryShortBelow: '\uE4C3',
  fermataShortAbove: '\uE4C4',
  fermataShortBelow: '\uE4C5',
  fermataLongAbove: '\uE4C6',
  fermataLongBelow: '\uE4C7',
  fermataVeryLongAbove: '\uE4C8',
  fermataVeryLongBelow: '\uE4C9',
  breathMarkComma: '\uE4CE',
  breathMarkTick: '\uE4CF',
  breathMarkUpbow: '\uE4D0',
  caesura: '\uE4D1',
  caesuraThick: '\uE4D2',
  caesuraShort: '\uE4D3',
  caesuraCurved: '\uE4D4',
  
  // Rests (U+E4E0–U+E4FF)
  restMaxima: '\uE4E0',
  restLonga: '\uE4E1',
  restDoubleWhole: '\uE4E2',
  restWhole: '\uE4E3',
  restHalf: '\uE4E4',
  restQuarter: '\uE4E5',
  rest8th: '\uE4E6',
  rest16th: '\uE4E7',
  rest32nd: '\uE4E8',
  rest64th: '\uE4E9',
  rest128th: '\uE4EA',
  rest256th: '\uE4EB',
  rest512th: '\uE4EC',
  rest1024th: '\uE4ED',
  restHBar: '\uE4EE',                 // Multi-measure rest H-bar
  restHBarLeft: '\uE4EF',
  restHBarMiddle: '\uE4F0',
  restHBarRight: '\uE4F1',
  restQuarterOld: '\uE4F2',           // Old-style quarter rest
  
  // Repeats (U+E040–U+E04F)
  repeatDot: '\uE044',
  repeatDots: '\uE043',
  dalSegno: '\uE045',
  daCapo: '\uE046',
  segno: '\uE047',
  coda: '\uE048',
  codaSquare: '\uE049',
  
  // Barlines
  barlineSingle: '\uE030',
  barlineDouble: '\uE031',
  barlineFinal: '\uE032',
  barlineReverseFinal: '\uE033',
  barlineHeavy: '\uE034',
  barlineHeavyHeavy: '\uE035',
  barlineDashed: '\uE036',
  barlineDotted: '\uE037',
  barlineShort: '\uE038',
  barlineTick: '\uE039',
  repeatLeft: '\uE040',
  repeatRight: '\uE041',
  repeatRightLeft: '\uE042',
  
  // Brackets and braces
  brace: '\uE000',
  reversedBrace: '\uE001',
  bracket: '\uE002',
  bracketTop: '\uE003',
  bracketBottom: '\uE004',
  reversedBracketTop: '\uE005',
  reversedBracketBottom: '\uE006',
  systemDivider: '\uE007',
  systemDividerLong: '\uE008',
  systemDividerExtraLong: '\uE009',
  
  // Augmentation dots
  augmentationDot: '\uE1E7',
  
  // Dynamics (U+E520–U+E54F)
  dynamicPiano: '\uE520',
  dynamicMezzo: '\uE521',
  dynamicForte: '\uE522',
  dynamicRinforzando: '\uE523',
  dynamicSforzando: '\uE524',
  dynamicZ: '\uE525',
  dynamicNiente: '\uE526',
  dynamicPPPPPP: '\uE527',
  dynamicPPPPP: '\uE528',
  dynamicPPPP: '\uE529',
  dynamicPPP: '\uE52A',
  dynamicPP: '\uE52B',
  dynamicMP: '\uE52C',
  dynamicMF: '\uE52D',
  dynamicPF: '\uE52E',
  dynamicFF: '\uE52F',
  dynamicFFF: '\uE530',
  dynamicFFFF: '\uE531',
  dynamicFFFFF: '\uE532',
  dynamicFFFFFF: '\uE533',
  dynamicFortePiano: '\uE534',
  dynamicForzando: '\uE535',
  dynamicSforzando1: '\uE536',
  dynamicSforzandoPiano: '\uE537',
  dynamicSforzandoPianissimo: '\uE538',
  dynamicSforzato: '\uE539',
  dynamicSforzatoPiano: '\uE53A',
  dynamicSforzatoFF: '\uE53B',
  dynamicRinforzando1: '\uE53C',
  dynamicRinforzando2: '\uE53D',
  
  // Ornaments (U+E560–U+E59F)
  ornamentTrill: '\uE566',
  ornamentTurn: '\uE567',
  ornamentTurnInverted: '\uE568',
  ornamentTurnSlash: '\uE569',
  ornamentTurnUp: '\uE56A',
  ornamentMordent: '\uE56C',
  ornamentMordentInverted: '\uE56D',
  ornamentTremblement: '\uE56E',
  ornamentPrallTriller: '\uE56F',
  
  // Tuplets
  tuplet0: '\uE880',
  tuplet1: '\uE881',
  tuplet2: '\uE882',
  tuplet3: '\uE883',
  tuplet4: '\uE884',
  tuplet5: '\uE885',
  tuplet6: '\uE886',
  tuplet7: '\uE887',
  tuplet8: '\uE888',
  tuplet9: '\uE889',
  tupletColon: '\uE88A',
  
  // Ottava
  ottava: '\uE510',
  ottavaAlta: '\uE511',
  ottavaBassa: '\uE512',
  ottavaBassaBa: '\uE513',
  quindicesima: '\uE514',
  quindicesimaAlta: '\uE515',
  quindicesimaBassa: '\uE516',
  
  // Pedal marks
  keyboardPedalPed: '\uE650',
  keyboardPedalUp: '\uE655',
  keyboardPedalHalf: '\uE656',
  
  // Tremolos
  tremolo1: '\uE220',
  tremolo2: '\uE221',
  tremolo3: '\uE222',
  tremolo4: '\uE223',
  tremolo5: '\uE224',
  buzzRoll: '\uE225',
  pendereckiTremolo: '\uE226',
  
  // Fingering
  fingering0: '\uED10',
  fingering1: '\uED11',
  fingering2: '\uED12',
  fingering3: '\uED13',
  fingering4: '\uED14',
  fingering5: '\uED15',
  fingeringTThumb: '\uED16',
  fingeringPLower: '\uED17',
  fingeringILower: '\uED18',
  fingeringMLower: '\uED19',
  fingeringALower: '\uED1A',
  fingeringCLower: '\uED1B',
  
} as const;

// ============================================================================
// ENGRAVING DEFAULTS (from Leland metadata)
// ============================================================================

/**
 * Engraving defaults from Leland font metadata.
 * Values are in staff spaces (1 staff space = distance between two staff lines).
 */
export const ENGRAVING_DEFAULTS = {
  // Line thicknesses
  staffLineThickness: 0.11,
  stemThickness: 0.1,
  beamThickness: 0.5,
  beamSpacing: 0.25,
  legerLineThickness: 0.16,
  legerLineExtension: 0.33,
  thinBarlineThickness: 0.18,
  thickBarlineThickness: 0.55,
  barlineSeparation: 0.37,
  thinThickBarlineSeparation: 0.37,
  repeatBarlineDotSeparation: 0.37,
  
  // Bracket/brace
  bracketThickness: 0.45,
  subBracketThickness: 0.11,
  
  // Hairpins/wedges
  hairpinThickness: 0.12,
  
  // Slurs/ties
  slurEndpointThickness: 0.05,
  slurMidpointThickness: 0.21,
  tieEndpointThickness: 0.05,
  tieMidpointThickness: 0.21,
  
  // Other
  tupletBracketThickness: 0.1,
  lyricLineThickness: 0.1,
  octaveLineThickness: 0.11,
  pedalLineThickness: 0.11,
  repeatEndingLineThickness: 0.11,
  textEnclosureThickness: 0.11,
  
  // Text font
  textFontFamily: ['Edwin', 'serif'],
} as const;

// ============================================================================
// GLYPH BOUNDING BOXES (selected important ones)
// ============================================================================

/**
 * Bounding boxes for selected glyphs (in staff spaces).
 * bBoxNE = northeast corner (right, top)
 * bBoxSW = southwest corner (left, bottom)
 */
export const GLYPH_BBOXES = {
  gClef: { bBoxNE: [1.32, 4.392], bBoxSW: [0.0, -2.632] },
  fClef: { bBoxNE: [2.736, 1.048], bBoxSW: [0.0, -1.02] },
  cClef: { bBoxNE: [2.568, 2.024], bBoxSW: [0.0, -2.024] },
  
  noteheadBlack: { bBoxNE: [1.18, 0.5], bBoxSW: [0.0, -0.5] },
  noteheadHalf: { bBoxNE: [1.18, 0.5], bBoxSW: [0.0, -0.5] },
  noteheadWhole: { bBoxNE: [1.516, 0.536], bBoxSW: [0.0, -0.532] },
  noteheadDoubleWhole: { bBoxNE: [2.14, 0.66], bBoxSW: [0.0, -0.656] },
  
  accidentalSharp: { bBoxNE: [0.996, 1.388], bBoxSW: [0.0, -1.38] },
  accidentalFlat: { bBoxNE: [0.812, 1.812], bBoxSW: [0.0, -0.704] },
  accidentalNatural: { bBoxNE: [0.672, 1.388], bBoxSW: [0.0, -1.38] },
  accidentalDoubleSharp: { bBoxNE: [1.1, 0.552], bBoxSW: [0.0, -0.548] },
  accidentalDoubleFlat: { bBoxNE: [1.484, 1.812], bBoxSW: [0.0, -0.704] },
  
  flag8thUp: { bBoxNE: [1.056, 0.088], bBoxSW: [0.0, -3.5] },
  flag8thDown: { bBoxNE: [1.056, 3.5], bBoxSW: [0.0, -0.1] },
  flag16thUp: { bBoxNE: [1.056, 0.088], bBoxSW: [0.0, -4.156] },
  flag16thDown: { bBoxNE: [1.056, 4.156], bBoxSW: [0.0, -0.1] },
  flag32ndUp: { bBoxNE: [1.056, 0.088], bBoxSW: [0.0, -4.812] },
  flag32ndDown: { bBoxNE: [1.056, 4.812], bBoxSW: [0.0, -0.1] },
  
  restWhole: { bBoxNE: [1.536, 0.472], bBoxSW: [0.0, -0.484] },
  restHalf: { bBoxNE: [1.536, 0.472], bBoxSW: [0.0, 0.0] },
  restQuarter: { bBoxNE: [1.14, 1.54], bBoxSW: [0.0, -1.504] },
  rest8th: { bBoxNE: [1.024, 1.124], bBoxSW: [0.0, -0.568] },
  rest16th: { bBoxNE: [1.304, 1.124], bBoxSW: [0.0, -1.572] },
  rest32nd: { bBoxNE: [1.4, 2.124], bBoxSW: [0.0, -1.572] },
  
  timeSig0: { bBoxNE: [1.496, 1.02], bBoxSW: [0.0, -1.016] },
  timeSig1: { bBoxNE: [0.876, 1.0], bBoxSW: [0.0, -0.996] },
  timeSig2: { bBoxNE: [1.396, 1.004], bBoxSW: [0.0, -1.0] },
  timeSig3: { bBoxNE: [1.328, 1.02], bBoxSW: [0.0, -1.016] },
  timeSig4: { bBoxNE: [1.452, 1.0], bBoxSW: [0.0, -1.0] },
  timeSig5: { bBoxNE: [1.296, 0.992], bBoxSW: [0.0, -1.02] },
  timeSig6: { bBoxNE: [1.372, 1.02], bBoxSW: [0.0, -1.016] },
  timeSig7: { bBoxNE: [1.268, 0.988], bBoxSW: [0.0, -1.0] },
  timeSig8: { bBoxNE: [1.376, 1.02], bBoxSW: [0.0, -1.016] },
  timeSig9: { bBoxNE: [1.372, 1.02], bBoxSW: [0.0, -1.016] },
  
  brace: { bBoxNE: [0.568, 4.0], bBoxSW: [0.0, -4.0] },
  
  augmentationDot: { bBoxNE: [0.4, 0.2], bBoxSW: [0.0, -0.2] },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the notehead glyph for a given duration.
 */
export function getNoteheadGlyph(duration: string): string {
  switch (duration) {
    case 'maxima':
    case 'longa':
    case 'breve':
      return SMUFL.noteheadDoubleWhole;
    case 'whole':
      return SMUFL.noteheadWhole;
    case 'half':
      return SMUFL.noteheadHalf;
    default:
      return SMUFL.noteheadBlack;
  }
}

/**
 * Get the rest glyph for a given duration.
 */
export function getRestGlyph(duration: string): string {
  switch (duration) {
    case 'maxima':
      return SMUFL.restMaxima;
    case 'longa':
      return SMUFL.restLonga;
    case 'breve':
      return SMUFL.restDoubleWhole;
    case 'whole':
      return SMUFL.restWhole;
    case 'half':
      return SMUFL.restHalf;
    case 'quarter':
      return SMUFL.restQuarter;
    case 'eighth':
      return SMUFL.rest8th;
    case '16th':
      return SMUFL.rest16th;
    case '32nd':
      return SMUFL.rest32nd;
    case '64th':
      return SMUFL.rest64th;
    case '128th':
      return SMUFL.rest128th;
    default:
      return SMUFL.restQuarter;
  }
}

/**
 * Get the flag glyph for a given duration and stem direction.
 */
export function getFlagGlyph(duration: string, stemUp: boolean): string | null {
  const flags: Record<string, [string, string]> = {
    'eighth': [SMUFL.flag8thUp, SMUFL.flag8thDown],
    '16th': [SMUFL.flag16thUp, SMUFL.flag16thDown],
    '32nd': [SMUFL.flag32ndUp, SMUFL.flag32ndDown],
    '64th': [SMUFL.flag64thUp, SMUFL.flag64thDown],
    '128th': [SMUFL.flag128thUp, SMUFL.flag128thDown],
    '256th': [SMUFL.flag256thUp, SMUFL.flag256thDown],
  };
  
  const pair = flags[duration];
  if (!pair) return null;
  return stemUp ? pair[0] : pair[1];
}

/**
 * Get the accidental glyph for a given accidental type.
 */
export function getAccidentalGlyph(accidental: string): string {
  switch (accidental) {
    case 'sharp':
      return SMUFL.accidentalSharp;
    case 'flat':
      return SMUFL.accidentalFlat;
    case 'natural':
      return SMUFL.accidentalNatural;
    case 'double-sharp':
    case 'doubleSharp':
      return SMUFL.accidentalDoubleSharp;
    case 'double-flat':
    case 'doubleFlat':
      return SMUFL.accidentalDoubleFlat;
    default:
      return SMUFL.accidentalNatural;
  }
}

/**
 * Get the clef glyph for a given clef type.
 */
export function getClefGlyph(clef: string): string {
  switch (clef) {
    case 'treble':
    case 'G':
      return SMUFL.gClef;
    case 'bass':
    case 'F':
      return SMUFL.fClef;
    case 'alto':
    case 'tenor':
    case 'C':
      return SMUFL.cClef;
    case 'percussion':
      return SMUFL.unpitchedPercussionClef1;
    default:
      return SMUFL.gClef;
  }
}

/**
 * Get the time signature glyphs for numerator and denominator.
 */
export function getTimeSigGlyphs(numerator: number, denominator: number): { num: string; denom: string } {
  const digits = [
    SMUFL.timeSig0, SMUFL.timeSig1, SMUFL.timeSig2, SMUFL.timeSig3, SMUFL.timeSig4,
    SMUFL.timeSig5, SMUFL.timeSig6, SMUFL.timeSig7, SMUFL.timeSig8, SMUFL.timeSig9,
  ];
  
  const numToGlyphs = (n: number): string => {
    if (n < 10) return digits[n] ?? '';
    return String(n).split('').map(d => digits[parseInt(d)] ?? '').join('');
  };
  
  return {
    num: numToGlyphs(numerator),
    denom: numToGlyphs(denominator),
  };
}

/**
 * Get a dynamic marking glyph.
 */
export function getDynamicGlyph(dynamic: string): string {
  const dynamics: Record<string, string> = {
    'pppppp': SMUFL.dynamicPPPPPP,
    'ppppp': SMUFL.dynamicPPPPP,
    'pppp': SMUFL.dynamicPPPP,
    'ppp': SMUFL.dynamicPPP,
    'pp': SMUFL.dynamicPP,
    'p': SMUFL.dynamicPiano,
    'mp': SMUFL.dynamicMP,
    'mf': SMUFL.dynamicMF,
    'f': SMUFL.dynamicForte,
    'ff': SMUFL.dynamicFF,
    'fff': SMUFL.dynamicFFF,
    'ffff': SMUFL.dynamicFFFF,
    'fffff': SMUFL.dynamicFFFFF,
    'ffffff': SMUFL.dynamicFFFFFF,
    'fp': SMUFL.dynamicFortePiano,
    'sf': SMUFL.dynamicSforzando,
    'sfz': SMUFL.dynamicSforzato,
    'sfp': SMUFL.dynamicSforzandoPiano,
    'sfpp': SMUFL.dynamicSforzandoPianissimo,
    'fz': SMUFL.dynamicForzando,
    'rf': SMUFL.dynamicRinforzando,
    'rfz': SMUFL.dynamicRinforzando1,
  };
  
  return dynamics[dynamic.toLowerCase()] || SMUFL.dynamicMF;
}

/**
 * Get articulation glyph.
 */
export function getArticulationGlyph(articulation: string, above: boolean): string {
  const artics: Record<string, [string, string]> = {
    'accent': [SMUFL.articAccentAbove, SMUFL.articAccentBelow],
    'staccato': [SMUFL.articStaccatoAbove, SMUFL.articStaccatoBelow],
    'tenuto': [SMUFL.articTenutoAbove, SMUFL.articTenutoBelow],
    'staccatissimo': [SMUFL.articStaccatissimoAbove, SMUFL.articStaccatissimoBelow],
    'marcato': [SMUFL.articMarcatoAbove, SMUFL.articMarcatoBelow],
    'fermata': [SMUFL.fermataAbove, SMUFL.fermataBelow],
  };
  
  const pair = artics[articulation];
  if (!pair) return SMUFL.articStaccatoAbove;
  return above ? pair[0] : pair[1];
}
