# Canonical IDs

**Status:** Maintained (auto-generated)
**Last Updated:** 2026-01-30

This document enumerates all canonical ID spaces used in CardPlay.

---

## Board & Deck

### `DeckType`

**Source:** `src/canon/ids.ts`  
**Description:** Union type defining DeckType values

**TypeScript Definition:**
```typescript
type DeckType = 'pattern-deck' | 'notation-deck' | 'piano-roll-deck' | 'session-deck' | 'arrangement-deck' | 'instruments-deck' | 'dsp-chain' | 'effects-deck' | 'samples-deck' | 'sample-manager-deck' | 'phrases-deck' | 'harmony-deck' | 'generators-deck' | 'mixer-deck' | 'mix-bus-deck' | 'routing-deck' | 'automation-deck' | 'properties-deck' | 'transport-deck' | 'arranger-deck' | 'ai-advisor-deck' | 'modulation-matrix-deck' | 'track-groups-deck' | 'reference-track-deck' | 'spectrum-analyzer-deck' | 'waveform-editor-deck' | 'registry-devtool-deck';
```

**Values:**
- `ai-advisor-deck`
- `arrangement-deck`
- `arranger-deck`
- `automation-deck`
- `dsp-chain`
- `effects-deck`
- `generators-deck`
- `harmony-deck`
- `instruments-deck`
- `mix-bus-deck`
- `mixer-deck`
- `modulation-matrix-deck`
- `notation-deck`
- `pattern-deck`
- `phrases-deck`
- `piano-roll-deck`
- `properties-deck`
- `reference-track-deck`
- `registry-devtool-deck`
- `routing-deck`
- `sample-manager-deck`
- `samples-deck`
- `session-deck`
- `spectrum-analyzer-deck`
- `track-groups-deck`
- `transport-deck`
- `waveform-editor-deck`

### `BoardDifficulty`

**Source:** `src/boards/types.ts`  
**Description:** Union type defining BoardDifficulty values

**TypeScript Definition:**
```typescript
type BoardDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';
```

**Values:**
- `advanced`
- `beginner`
- `expert`
- `intermediate`

### `PanelRole`

**Source:** `src/boards/types.ts`  
**Description:** Union type defining PanelRole values

**TypeScript Definition:**
```typescript
type PanelRole = 'browser' | 'composition' | 'properties' | 'mixer' | 'timeline' | 'toolbar' | 'transport';
```

**Values:**
- `browser`
- `composition`
- `mixer`
- `properties`
- `timeline`
- `toolbar`
- `transport`

### `PanelPosition`

**Source:** `src/boards/types.ts`  
**Description:** Union type defining PanelPosition values

**TypeScript Definition:**
```typescript
type PanelPosition = 'left' | 'right' | 'top' | 'bottom' | 'center';
```

**Values:**
- `bottom`
- `center`
- `left`
- `right`
- `top`

### `DeckType`

**Source:** `src/boards/types.ts`  
**Description:** Union type defining DeckType values

**TypeScript Definition:**
```typescript
type DeckType = 'pattern-deck' | 'notation-deck' | 'piano-roll-deck' | 'session-deck' | 'arrangement-deck' | 'instruments-deck' | 'dsp-chain' | 'effects-deck' | 'samples-deck' | 'phrases-deck' | 'harmony-deck' | 'generators-deck' | 'mixer-deck' | 'routing-deck' | 'automation-deck' | 'properties-deck' | 'transport-deck' | 'arranger-deck' | 'ai-advisor-deck' | 'sample-manager-deck' | 'modulation-matrix-deck' | 'track-groups-deck' | 'mix-bus-deck' | 'reference-track-deck' | 'spectrum-analyzer-deck' | 'waveform-editor-deck' | 'registry-devtool-deck';
```

**Values:**
- `ai-advisor-deck`
- `arrangement-deck`
- `arranger-deck`
- `automation-deck`
- `dsp-chain`
- `effects-deck`
- `generators-deck`
- `harmony-deck`
- `instruments-deck`
- `mix-bus-deck`
- `mixer-deck`
- `modulation-matrix-deck`
- `notation-deck`
- `pattern-deck`
- `phrases-deck`
- `piano-roll-deck`
- `properties-deck`
- `reference-track-deck`
- `registry-devtool-deck`
- `routing-deck`
- `sample-manager-deck`
- `samples-deck`
- `session-deck`
- `spectrum-analyzer-deck`
- `track-groups-deck`
- `transport-deck`
- `waveform-editor-deck`

### `DeckCardLayout`

**Source:** `src/boards/types.ts`  
**Description:** Union type defining DeckCardLayout values

**TypeScript Definition:**
```typescript
type DeckCardLayout = 'stack' | 'tabs' | 'split' | 'floating' | 'grid';
```

**Values:**
- `floating`
- `grid`
- `split`
- `stack`
- `tabs`

## Cards & Ports

### `PortType`

**Source:** `src/canon/ids.ts`  
**Description:** Union type defining PortType values

**TypeScript Definition:**
```typescript
type PortType = 'audio' | 'midi' | 'notes' | 'control' | 'trigger' | 'gate' | 'clock' | 'transport';
```

**Values:**
- `audio`
- `clock`
- `control`
- `gate`
- `midi`
- `notes`
- `transport`
- `trigger`

### `DeckCardLayout`

**Source:** `src/boards/types.ts`  
**Description:** Union type defining DeckCardLayout values

**TypeScript Definition:**
```typescript
type DeckCardLayout = 'floating' | 'grid' | 'split' | 'stack' | 'tabs';
```

**Values:**
- `floating`
- `grid`
- `split`
- `stack`
- `tabs`

### `CardKind`

**Source:** `src/boards/types.ts`  
**Description:** Union type defining CardKind values

**TypeScript Definition:**
```typescript
type CardKind = 'manual' | 'hint' | 'assisted' | 'collaborative' | 'generative';
```

**Values:**
- `assisted`
- `collaborative`
- `generative`
- `hint`
- `manual`

### `CardCategory`

**Source:** `src/cards/card.ts`  
**Description:** Union type defining CardCategory values

**TypeScript Definition:**
```typescript
type CardCategory = 'generators' | 'effects' | 'transforms' | 'filters' | 'routing' | 'analysis' | 'utilities' | 'custom';
```

**Values:**
- `analysis`
- `custom`
- `effects`
- `filters`
- `generators`
- `routing`
- `transforms`
- `utilities`

## Events & Time

### `PPQ`

**Source:** `src/types/primitives.ts`  
**Description:** Pulses Per Quarter note (timebase resolution)

**TypeScript Definition:**
```typescript
export const PPQ = 960;
```

## Music Theory

### `TonalityModel`

**Source:** `src/canon/ids.ts`  
**Description:** Union type defining TonalityModel values

**TypeScript Definition:**
```typescript
type TonalityModel = 'ks_profile' | 'dft_phase' | 'spiral_array';
```

**Values:**
- `dft_phase`
- `ks_profile`
- `spiral_array`

### `ModeName`

**Source:** `src/canon/ids.ts`  
**Description:** Union type defining ModeName values

**TypeScript Definition:**
```typescript
type ModeName = 'ionian' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'aeolian' | 'locrian' | 'harmonic_minor' | 'melodic_minor' | 'pentatonic_major' | 'pentatonic_minor' | 'blues' | 'whole_tone' | 'diminished';
```

**Values:**
- `aeolian`
- `blues`
- `diminished`
- `dorian`
- `harmonic_minor`
- `ionian`
- `locrian`
- `lydian`
- `melodic_minor`
- `mixolydian`
- `pentatonic_major`
- `pentatonic_minor`
- `phrygian`
- `whole_tone`

### `CadenceType`

**Source:** `src/canon/ids.ts`  
**Description:** Union type defining CadenceType values

**TypeScript Definition:**
```typescript
type CadenceType = 'perfect_authentic' | 'imperfect_authentic' | 'half' | 'plagal' | 'deceptive' | 'phrygian_half' | 'evaded';
```

**Values:**
- `deceptive`
- `evaded`
- `half`
- `imperfect_authentic`
- `perfect_authentic`
- `phrygian_half`
- `plagal`

### `BuiltinConstraintType`

**Source:** `src/canon/ids.ts`  
**Description:** Union type defining BuiltinConstraintType values

**TypeScript Definition:**
```typescript
type BuiltinConstraintType = 'key' | 'tonality_model' | 'meter' | 'tempo' | 'cadence' | 'chord_progression' | 'harmonic_rhythm' | 'avoid_parallel' | 'range' | 'contour' | 'density' | 'culture' | 'style' | 'schema' | 'raga' | 'tala' | 'gamaka_density' | 'eduppu' | 'tune_type' | 'tune_form' | 'chinese_mode' | 'heterophony' | 'film_device';
```

**Values:**
- `avoid_parallel`
- `cadence`
- `chinese_mode`
- `chord_progression`
- `contour`
- `culture`
- `density`
- `eduppu`
- `film_device`
- `gamaka_density`
- `harmonic_rhythm`
- `heterophony`
- `key`
- `meter`
- `raga`
- `range`
- `schema`
- `style`
- `tala`
- `tempo`
- `tonality_model`
- `tune_form`
- `tune_type`

### `QuantizeMode`

**Source:** `src/types/primitives.ts`  
**Description:** Union type defining QuantizeMode values

**TypeScript Definition:**
```typescript
type QuantizeMode = 'floor' | 'ceil' | 'nearest';
```

**Values:**
- `ceil`
- `floor`
- `nearest`

### `ModeName`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining ModeName values

**TypeScript Definition:**
```typescript
type ModeName = 'major' | 'ionian' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'aeolian' | 'locrian' | 'natural_minor' | 'harmonic_minor' | 'melodic_minor' | 'pentatonic_major' | 'pentatonic_minor' | 'blues' | 'whole_tone' | 'chromatic' | 'octatonic';
```

**Values:**
- `aeolian`
- `blues`
- `chromatic`
- `dorian`
- `harmonic_minor`
- `ionian`
- `locrian`
- `lydian`
- `major`
- `melodic_minor`
- `mixolydian`
- `natural_minor`
- `octatonic`
- `pentatonic_major`
- `pentatonic_minor`
- `phrygian`
- `whole_tone`

### `TonalityModel`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining TonalityModel values

**TypeScript Definition:**
```typescript
type TonalityModel = 'ks_profile' | 'dft_phase' | 'spiral_array';
```

**Values:**
- `dft_phase`
- `ks_profile`
- `spiral_array`

### `AccentModel`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining AccentModel values

**TypeScript Definition:**
```typescript
type AccentModel = 'standard' | 'compound' | 'swing' | 'celtic_dance' | 'carnatic_tala';
```

**Values:**
- `carnatic_tala`
- `celtic_dance`
- `compound`
- `standard`
- `swing`

### `ChineseModeName`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining ChineseModeName values

**TypeScript Definition:**
```typescript
type ChineseModeName = 'gong' | 'shang' | 'jiao' | 'zhi' | 'yu';
```

**Values:**
- `gong`
- `jiao`
- `shang`
- `yu`
- `zhi`

### `CadenceType`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining CadenceType values

**TypeScript Definition:**
```typescript
type CadenceType = 'authentic' | 'perfect_authentic' | 'imperfect_authentic' | 'half' | 'plagal' | 'deceptive';
```

**Values:**
- `authentic`
- `deceptive`
- `half`
- `imperfect_authentic`
- `perfect_authentic`
- `plagal`

### `ExtendedCadenceType`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining ExtendedCadenceType values

**TypeScript Definition:**
```typescript
type ExtendedCadenceType = 'CadenceType' | 'phrygian_half' | 'picardy' | 'backdoor' | 'galant_meyer' | 'galant_quiescenza' | 'modal_bvii_i' | 'modal_iv_i' | 'cinematic_bvi_bvii_i' | 'carnatic_arudi';
```

**Values:**
- `CadenceType`
- `backdoor`
- `carnatic_arudi`
- `cinematic_bvi_bvii_i`
- `galant_meyer`
- `galant_quiescenza`
- `modal_bvii_i`
- `modal_iv_i`
- `phrygian_half`
- `picardy`

### `MusicConstraint`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining MusicConstraint values

**TypeScript Definition:**
```typescript
type MusicConstraint = 'ConstraintKey' | 'ConstraintTempo' | 'ConstraintMeter' | 'ConstraintTonalityModel' | 'ConstraintStyle' | 'ConstraintCulture' | 'ConstraintSchema' | 'ConstraintRaga' | 'ConstraintTala' | 'ConstraintCelticTune' | 'ConstraintChineseMode' | 'ConstraintFilmMood' | 'ConstraintFilmDevice' | 'ConstraintPhraseDensity' | 'ConstraintContour' | 'ConstraintGrouping' | 'ConstraintAccent' | 'ConstraintGamakaDensity' | 'ConstraintOrnamentBudget' | 'ConstraintHarmonicRhythm' | 'ConstraintCadence' | 'ConstraintTrailerBuild' | 'ConstraintLeitmotif' | 'ConstraintDrone' | 'ConstraintPatternRole' | 'ConstraintSwing' | 'ConstraintHeterophony' | 'ConstraintMaxInterval' | 'ConstraintArrangerStyle' | 'ConstraintSceneArc' | 'ConstraintLCCGravity' | 'ConstraintLCCParentScale' | 'ConstraintOrchestrationAlgorithm' | 'ConstraintTimbreMatching' | 'ConstraintEastAsianTradition' | 'ConstraintChineseRegional' | 'ConstraintJazzVocabularyLevel' | 'ConstraintJazzStyleEra' | 'ConstraintJapaneseGenre' | 'ConstraintLatinStyle' | 'ConstraintCustom';
```

**Values:**
- `ConstraintAccent`
- `ConstraintArrangerStyle`
- `ConstraintCadence`
- `ConstraintCelticTune`
- `ConstraintChineseMode`
- `ConstraintChineseRegional`
- `ConstraintContour`
- `ConstraintCulture`
- `ConstraintCustom`
- `ConstraintDrone`
- `ConstraintEastAsianTradition`
- `ConstraintFilmDevice`
- `ConstraintFilmMood`
- `ConstraintGamakaDensity`
- `ConstraintGrouping`
- `ConstraintHarmonicRhythm`
- `ConstraintHeterophony`
- `ConstraintJapaneseGenre`
- `ConstraintJazzStyleEra`
- `ConstraintJazzVocabularyLevel`
- `ConstraintKey`
- `ConstraintLCCGravity`
- `ConstraintLCCParentScale`
- `ConstraintLatinStyle`
- `ConstraintLeitmotif`
- `ConstraintMaxInterval`
- `ConstraintMeter`
- `ConstraintOrchestrationAlgorithm`
- `ConstraintOrnamentBudget`
- `ConstraintPatternRole`
- `ConstraintPhraseDensity`
- `ConstraintRaga`
- `ConstraintSceneArc`
- `ConstraintSchema`
- `ConstraintStyle`
- `ConstraintSwing`
- `ConstraintTala`
- `ConstraintTempo`
- `ConstraintTimbreMatching`
- `ConstraintTonalityModel`
- `ConstraintTrailerBuild`

## Control & Policy

### `ControlLevel`

**Source:** `src/boards/types.ts`  
**Description:** Union type defining ControlLevel values

**TypeScript Definition:**
```typescript
type ControlLevel = 'full-manual' | 'manual-with-hints' | 'assisted' | 'collaborative' | 'directed' | 'generative';
```

**Values:**
- `assisted`
- `collaborative`
- `directed`
- `full-manual`
- `generative`
- `manual-with-hints`

### `ToolKind`

**Source:** `src/boards/types.ts`  
**Description:** Union type defining ToolKind values

**TypeScript Definition:**
```typescript
type ToolKind = 'phraseDatabase' | 'harmonyExplorer' | 'phraseGenerators' | 'arrangerCard' | 'aiComposer';
```

**Values:**
- `aiComposer`
- `arrangerCard`
- `harmonyExplorer`
- `phraseDatabase`
- `phraseGenerators`

### `DensityLevel`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining DensityLevel values

**TypeScript Definition:**
```typescript
type DensityLevel = 'sparse' | 'medium' | 'dense' | 'very_dense';
```

**Values:**
- `dense`
- `medium`
- `sparse`
- `very_dense`

### `HarmonicRhythmLevel`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining HarmonicRhythmLevel values

**TypeScript Definition:**
```typescript
type HarmonicRhythmLevel = 'very_slow' | 'slow' | 'moderate' | 'fast' | 'very_fast';
```

**Values:**
- `fast`
- `moderate`
- `slow`
- `very_fast`
- `very_slow`

### `JazzVocabularyLevel`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining JazzVocabularyLevel values

**TypeScript Definition:**
```typescript
type JazzVocabularyLevel = 'beginner' | 'intermediate' | 'advanced';
```

**Values:**
- `advanced`
- `beginner`
- `intermediate`

## Other

### `CultureTag`

**Source:** `src/canon/ids.ts`  
**Description:** Union type defining CultureTag values

**TypeScript Definition:**
```typescript
type CultureTag = 'western' | 'carnatic' | 'celtic' | 'chinese' | 'hybrid';
```

**Values:**
- `carnatic`
- `celtic`
- `chinese`
- `hybrid`
- `western`

### `StyleTag`

**Source:** `src/canon/ids.ts`  
**Description:** Union type defining StyleTag values

**TypeScript Definition:**
```typescript
type StyleTag = 'galant' | 'baroque' | 'classical' | 'romantic' | 'cinematic' | 'trailer' | 'underscore' | 'edm' | 'pop' | 'jazz' | 'lofi' | 'custom';
```

**Values:**
- `baroque`
- `cinematic`
- `classical`
- `custom`
- `edm`
- `galant`
- `jazz`
- `lofi`
- `pop`
- `romantic`
- `trailer`
- `underscore`

### `RoutingConnectionType`

**Source:** `src/canon/ids.ts`  
**Description:** Union type defining RoutingConnectionType values

**TypeScript Definition:**
```typescript
type RoutingConnectionType = 'audio' | 'midi' | 'modulation' | 'sidechain';
```

**Values:**
- `audio`
- `midi`
- `modulation`
- `sidechain`

### `ViewType`

**Source:** `src/boards/types.ts`  
**Description:** Union type defining ViewType values

**TypeScript Definition:**
```typescript
type ViewType = 'tracker' | 'notation' | 'session' | 'arranger' | 'composer' | 'sampler';
```

**Values:**
- `arranger`
- `composer`
- `notation`
- `sampler`
- `session`
- `tracker`

### `ConnectionType`

**Source:** `src/boards/types.ts`  
**Description:** Union type defining ConnectionType values

**TypeScript Definition:**
```typescript
type ConnectionType = 'audio' | 'midi' | 'modulation' | 'trigger';
```

**Values:**
- `audio`
- `midi`
- `modulation`
- `trigger`

### `BuiltinOntologyId`

**Source:** `src/boards/types.ts`  
**Description:** Union type defining BuiltinOntologyId values

**TypeScript Definition:**
```typescript
type BuiltinOntologyId = 'western-12tet' | 'western-just' | 'microtonal';
```

**Values:**
- `microtonal`
- `western-12tet`
- `western-just`

### `OntologyId`

**Source:** `src/boards/types.ts`  
**Description:** Union type defining OntologyId values

**TypeScript Definition:**
```typescript
type OntologyId = 'BuiltinOntologyId' | '(string & {})';
```

**Values:**
- `(string & {})`
- `BuiltinOntologyId`

### `OntologySelection`

**Source:** `src/boards/types.ts`  
**Description:** Union type defining OntologySelection values

**TypeScript Definition:**
```typescript
type OntologySelection = 'OntologyId' | 'readonly OntologyId[]';
```

**Values:**
- `OntologyId`
- `readonly OntologyId[]`

### `UserType`

**Source:** `src/boards/types.ts`  
**Description:** Union type defining UserType values

**TypeScript Definition:**
```typescript
type UserType = 'notation-composer' | 'tracker-user' | 'producer' | 'live-performer' | 'sound-designer' | 'ai-explorer' | 'beginner';
```

**Values:**
- `ai-explorer`
- `beginner`
- `live-performer`
- `notation-composer`
- `producer`
- `sound-designer`
- `tracker-user`

### `ParamType`

**Source:** `src/cards/card.ts`  
**Description:** Union type defining ParamType values

**TypeScript Definition:**
```typescript
type ParamType = 'number' | 'integer' | 'boolean' | 'enum' | 'color' | 'file' | 'note' | 'scale' | 'chord';
```

**Values:**
- `boolean`
- `chord`
- `color`
- `enum`
- `file`
- `integer`
- `note`
- `number`
- `scale`

### `RootName`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining RootName values

**TypeScript Definition:**
```typescript
type RootName = 'c' | 'csharp' | 'd' | 'dsharp' | 'e' | 'f' | 'fsharp' | 'g' | 'gsharp' | 'a' | 'asharp' | 'b' | 'dflat' | 'eflat' | 'gflat' | 'aflat' | 'bflat';
```

**Values:**
- `a`
- `aflat`
- `asharp`
- `b`
- `bflat`
- `c`
- `csharp`
- `d`
- `dflat`
- `dsharp`
- `e`
- `eflat`
- `f`
- `fsharp`
- `g`
- `gflat`
- `gsharp`

### `ChordQuality`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining ChordQuality values

**TypeScript Definition:**
```typescript
type ChordQuality = 'major' | 'minor' | 'diminished' | 'augmented' | 'sus2' | 'sus4' | 'major7' | 'minor7' | 'dominant7' | 'diminished7' | 'half_diminished7' | 'major9' | 'minor9' | 'dominant9' | 'add9' | 'major11' | 'minor11' | 'dominant11' | 'major13' | 'minor13' | 'dominant13';
```

**Values:**
- `add9`
- `augmented`
- `diminished`
- `diminished7`
- `dominant11`
- `dominant13`
- `dominant7`
- `dominant9`
- `half_diminished7`
- `major`
- `major11`
- `major13`
- `major7`
- `major9`
- `minor`
- `minor11`
- `minor13`
- `minor7`
- `minor9`
- `sus2`
- `sus4`

### `CultureTag`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining CultureTag values

**TypeScript Definition:**
```typescript
type CultureTag = 'western' | 'carnatic' | 'celtic' | 'chinese' | 'hybrid';
```

**Values:**
- `carnatic`
- `celtic`
- `chinese`
- `hybrid`
- `western`

### `StyleTag`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining StyleTag values

**TypeScript Definition:**
```typescript
type StyleTag = 'galant' | 'baroque' | 'classical' | 'romantic' | 'cinematic' | 'trailer' | 'underscore' | 'edm' | 'pop' | 'jazz' | 'lofi' | 'custom';
```

**Values:**
- `baroque`
- `cinematic`
- `classical`
- `custom`
- `edm`
- `galant`
- `jazz`
- `lofi`
- `pop`
- `romantic`
- `trailer`
- `underscore`

### `GalantSchemaName`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining GalantSchemaName values

**TypeScript Definition:**
```typescript
type GalantSchemaName = 'prinner' | 'fonte' | 'monte' | 'romanesca' | 'meyer' | 'quiescenza' | 'do_re_mi' | 'cadential_64' | 'lament_bass' | 'ponte' | 'passo_indietro' | 'circolo' | 'indugio';
```

**Values:**
- `cadential_64`
- `circolo`
- `do_re_mi`
- `fonte`
- `indugio`
- `lament_bass`
- `meyer`
- `monte`
- `passo_indietro`
- `ponte`
- `prinner`
- `quiescenza`
- `romanesca`

### `OrnamentType`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining OrnamentType values

**TypeScript Definition:**
```typescript
type OrnamentType = 'grace' | 'mordent' | 'trill' | 'turn' | 'appoggiatura' | 'cut' | 'tap' | 'roll' | 'slide' | 'cran' | 'birl' | 'kampita' | 'nokku' | 'jaaru' | 'sphurita' | 'pratyahatam' | 'hua' | 'yao' | 'hua_yin' | 'tremolo';
```

**Values:**
- `appoggiatura`
- `birl`
- `cran`
- `cut`
- `grace`
- `hua`
- `hua_yin`
- `jaaru`
- `kampita`
- `mordent`
- `nokku`
- `pratyahatam`
- `roll`
- `slide`
- `sphurita`
- `tap`
- `tremolo`
- `trill`
- `turn`
- `yao`

### `TalaName`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining TalaName values

**TypeScript Definition:**
```typescript
type TalaName = 'adi' | 'rupaka' | 'misra_chapu' | 'khanda_chapu' | 'jhampa' | 'triputa' | 'ata' | 'eka';
```

**Values:**
- `adi`
- `ata`
- `eka`
- `jhampa`
- `khanda_chapu`
- `misra_chapu`
- `rupaka`
- `triputa`

### `JatiType`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining JatiType values

**TypeScript Definition:**
```typescript
type JatiType = 'tisra' | 'chatusra' | 'khanda' | 'misra' | 'sankeerna';
```

**Values:**
- `chatusra`
- `khanda`
- `misra`
- `sankeerna`
- `tisra`

### `CelticTuneType`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining CelticTuneType values

**TypeScript Definition:**
```typescript
type CelticTuneType = 'reel' | 'jig' | 'slip_jig' | 'hornpipe' | 'strathspey' | 'polka' | 'march' | 'air';
```

**Values:**
- `air`
- `hornpipe`
- `jig`
- `march`
- `polka`
- `reel`
- `slip_jig`
- `strathspey`

### `RagaName`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining RagaName values

**TypeScript Definition:**
```typescript
type RagaName = 'mohanam' | 'hamsadhwani' | 'kalyani' | 'keeravani' | 'shankarabharanam' | 'hindolam' | 'abhogi' | 'todi' | 'bhairavi' | 'kambhoji';
```

**Values:**
- `abhogi`
- `bhairavi`
- `hamsadhwani`
- `hindolam`
- `kalyani`
- `kambhoji`
- `keeravani`
- `mohanam`
- `shankarabharanam`
- `todi`

### `FilmMood`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining FilmMood values

**TypeScript Definition:**
```typescript
type FilmMood = 'heroic' | 'ominous' | 'tender' | 'wonder' | 'mystery' | 'sorrow' | 'comedy' | 'action';
```

**Values:**
- `action`
- `comedy`
- `heroic`
- `mystery`
- `ominous`
- `sorrow`
- `tender`
- `wonder`

### `FilmDevice`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining FilmDevice values

**TypeScript Definition:**
```typescript
type FilmDevice = 'pedal_point' | 'drone' | 'ostinato' | 'planing' | 'chromatic_mediant' | 'modal_mixture' | 'lydian_tonic' | 'dorian_minor' | 'phrygian_color' | 'whole_tone_wash' | 'octatonic_action' | 'cluster_tension' | 'quartal_openness' | 'suspension_chain' | 'cadence_deferral' | 'trailer_rise';
```

**Values:**
- `cadence_deferral`
- `chromatic_mediant`
- `cluster_tension`
- `dorian_minor`
- `drone`
- `lydian_tonic`
- `modal_mixture`
- `octatonic_action`
- `ostinato`
- `pedal_point`
- `phrygian_color`
- `planing`
- `quartal_openness`
- `suspension_chain`
- `trailer_rise`
- `whole_tone_wash`

### `VoiceRole`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining VoiceRole values

**TypeScript Definition:**
```typescript
type VoiceRole = 'melody' | 'countermelody' | 'bass' | 'pad' | 'ostinato' | 'drone' | 'percussion' | 'fill';
```

**Values:**
- `bass`
- `countermelody`
- `drone`
- `fill`
- `melody`
- `ostinato`
- `pad`
- `percussion`

### `TensionDevice`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining TensionDevice values

**TypeScript Definition:**
```typescript
type TensionDevice = 'diatonic' | 'chromatic_mediant' | 'modal_mixture' | 'tritone_sub' | 'augmented_sixth' | 'neapolitan';
```

**Values:**
- `augmented_sixth`
- `chromatic_mediant`
- `diatonic`
- `modal_mixture`
- `neapolitan`
- `tritone_sub`

### `MelodicContour`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining MelodicContour values

**TypeScript Definition:**
```typescript
type MelodicContour = 'ascending' | 'descending' | 'arch' | 'inverted_arch' | 'level' | 'zigzag' | 'sawtooth' | 'wave';
```

**Values:**
- `arch`
- `ascending`
- `descending`
- `inverted_arch`
- `level`
- `sawtooth`
- `wave`
- `zigzag`

### `Articulation`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining Articulation values

**TypeScript Definition:**
```typescript
type Articulation = 'staccato' | 'legato' | 'tenuto' | 'marcato' | 'accent' | 'portato' | 'spiccato' | 'pizzicato' | 'tremolo' | 'glissando' | 'sforzando';
```

**Values:**
- `accent`
- `glissando`
- `legato`
- `marcato`
- `pizzicato`
- `portato`
- `sforzando`
- `spiccato`
- `staccato`
- `tenuto`
- `tremolo`

### `InstrumentFamily`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining InstrumentFamily values

**TypeScript Definition:**
```typescript
type InstrumentFamily = 'strings' | 'brass' | 'woodwinds' | 'choir' | 'synths' | 'percussion' | 'piano' | 'guitar' | 'harp' | 'organ' | 'erhu' | 'dizi' | 'guzheng' | 'pipa' | 'guqin' | 'sheng' | 'suona' | 'fiddle' | 'flute' | 'whistle' | 'pipes' | 'bouzouki' | 'bodhran' | 'mridangam' | 'tabla';
```

**Values:**
- `bodhran`
- `bouzouki`
- `brass`
- `choir`
- `dizi`
- `erhu`
- `fiddle`
- `flute`
- `guitar`
- `guqin`
- `guzheng`
- `harp`
- `mridangam`
- `organ`
- `percussion`
- `piano`
- `pipa`
- `pipes`
- `sheng`
- `strings`
- `suona`
- `synths`
- `tabla`
- `whistle`
- `woodwinds`

### `ArrangerStyle`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining ArrangerStyle values

**TypeScript Definition:**
```typescript
type ArrangerStyle = 'cinematic' | 'trailer' | 'underscore' | 'orchestral' | 'ambient' | 'edm' | 'pop_band' | 'jazz_combo' | 'chamber';
```

**Values:**
- `ambient`
- `chamber`
- `cinematic`
- `edm`
- `jazz_combo`
- `orchestral`
- `pop_band`
- `trailer`
- `underscore`

### `PhraseType`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining PhraseType values

**TypeScript Definition:**
```typescript
type PhraseType = 'pickup' | 'cadence' | 'fill' | 'turnaround' | 'response' | 'sequence' | 'development' | 'head' | 'bridge' | 'coda' | 'intro' | 'outro';
```

**Values:**
- `bridge`
- `cadence`
- `coda`
- `development`
- `fill`
- `head`
- `intro`
- `outro`
- `pickup`
- `response`
- `sequence`
- `turnaround`

### `PatternRole`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining PatternRole values

**TypeScript Definition:**
```typescript
type PatternRole = 'groove' | 'fill' | 'break' | 'build' | 'transition' | 'intro_pattern' | 'outro_pattern' | 'drop' | 'breakdown';
```

**Values:**
- `break`
- `breakdown`
- `build`
- `drop`
- `fill`
- `groove`
- `intro_pattern`
- `outro_pattern`
- `transition`

### `EastAsianTradition`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining EastAsianTradition values

**TypeScript Definition:**
```typescript
type EastAsianTradition = 'chinese' | 'japanese' | 'korean';
```

**Values:**
- `chinese`
- `japanese`
- `korean`

### `ChineseRegionalStyle`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining ChineseRegionalStyle values

**TypeScript Definition:**
```typescript
type ChineseRegionalStyle = 'cantonese' | 'beijing' | 'jiangnan' | 'sichuan';
```

**Values:**
- `beijing`
- `cantonese`
- `jiangnan`
- `sichuan`

### `JazzStyleEra`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining JazzStyleEra values

**TypeScript Definition:**
```typescript
type JazzStyleEra = 'swing' | 'bebop' | 'cool' | 'modal' | 'fusion' | 'contemporary';
```

**Values:**
- `bebop`
- `contemporary`
- `cool`
- `fusion`
- `modal`
- `swing`

### `JapaneseGenre`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining JapaneseGenre values

**TypeScript Definition:**
```typescript
type JapaneseGenre = 'gagaku' | 'hogaku' | 'minyo';
```

**Values:**
- `gagaku`
- `hogaku`
- `minyo`

### `LatinStyle`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining LatinStyle values

**TypeScript Definition:**
```typescript
type LatinStyle = 'salsa' | 'son' | 'mambo' | 'cha_cha' | 'bossa' | 'samba' | 'tango';
```

**Values:**
- `bossa`
- `cha_cha`
- `mambo`
- `salsa`
- `samba`
- `son`
- `tango`

### `SpecChangeType`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining SpecChangeType values

**TypeScript Definition:**
```typescript
type SpecChangeType = 'key_change' | 'mode_change' | 'tempo_change' | 'meter_change' | 'style_change' | 'culture_change' | 'tonality_model_change' | 'constraint_added' | 'constraint_removed' | 'constraint_modified';
```

**Values:**
- `constraint_added`
- `constraint_modified`
- `constraint_removed`
- `culture_change`
- `key_change`
- `meter_change`
- `mode_change`
- `style_change`
- `tempo_change`
- `tonality_model_change`

---

## ID Naming Conventions

1. **Builtin IDs**: No namespace prefix (e.g., `audio`, `midi`)
2. **Extension IDs**: Must use `namespace:name` format (e.g., `acme:custom-synth`)
3. **Branded Types**: IDs use branded types for type safety (e.g., `DeckId`, `CardId`)

To regenerate this document: `npm run docs:sync-ids`
