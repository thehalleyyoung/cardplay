# Canonical IDs

**Status:** Maintained (auto-generated)
**Last Updated:** 2026-01-30

This document enumerates all canonical ID spaces used in CardPlay.

---

## Board & Deck

### `DeckType`

**Source:** `src/canon/ids.ts`  
**Description:** Union type defining DeckType values

**Values:**
- `// Pattern/Tracker`
- `ai-advisor-deck
  // Modulation`
- `arrangement-deck
  // Instruments`
- `arranger-deck
  // AI`
- `automation-deck
  // Properties`
- `dsp-chain`
- `effects-deck
  // Samples`
- `generators-deck
  // Mixing`
- `harmony-deck
  // Generators`
- `instruments-deck
  // DSP/Effects`
- `mix-bus-deck
  // Routing`
- `mixer-deck`
- `modulation-matrix-deck
  // Groups`
- `notation-deck
  // Piano Roll`
- `pattern-deck
  // Notation`
- `phrases-deck
  // Harmony/Theory`
- `piano-roll-deck
  // Session/Clips`
- `properties-deck
  // Transport`
- `reference-track-deck
  // Analysis`
- `routing-deck
  // Automation`
- `sample-manager-deck
  // Phrases`
- `samples-deck`
- `session-deck
  // Arrangement`
- `spectrum-analyzer-deck
  // Waveform`
- `track-groups-deck
  // Reference`
- `transport-deck
  // Arranger`
- `waveform-editor-deck`

### `BoardDifficulty`

**Source:** `src/boards/types.ts`  
**Description:** Union type defining BoardDifficulty values

**Values:**
- `advanced`
- `beginner`
- `expert`
- `intermediate`

### `PanelRole`

**Source:** `src/boards/types.ts`  
**Description:** Union type defining PanelRole values

**Values:**
- `browser       // File/clip/phrase browser`
- `composition   // Main composition area`
- `mixer         // Audio mixer`
- `properties    // Properties inspector`
- `timeline      // Arrangement timeline`
- `toolbar       // Toolbar actions`
- `transport`

### `PanelPosition`

**Source:** `src/boards/types.ts`  
**Description:** Union type defining PanelPosition values

**Values:**
- `bottom`
- `center`
- `left`
- `right`
- `top`

### `DeckType`

**Source:** `src/boards/types.ts`  
**Description:** Union type defining DeckType values

**Values:**
- `ai-advisor-deck       // AI Advisor panel (L299)`
- `arrangement-deck      // Timeline arrangement`
- `arranger-deck         // Arranger sections (E057)`
- `automation-deck       // Automation lanes`
- `dsp-chain             // DSP effect chain (E042)`
- `effects-deck          // Effect rack`
- `generators-deck       // Generator cards`
- `harmony-deck          // Harmony explorer`
- `instruments-deck      // Instrument rack`
- `mix-bus-deck          // Mix bus for group processing (M259)`
- `mixer-deck            // Mixer channels`
- `modulation-matrix-deck // Modulation matrix (M178)`
- `notation-deck         // Notation editor`
- `pattern-deck          // Tracker pattern editor`
- `phrases-deck          // Phrase library`
- `piano-roll-deck       // Piano roll editor`
- `properties-deck       // Properties inspector`
- `reference-track-deck  // Reference track A/B comparison (M260)`
- `registry-devtool-deck`
- `routing-deck          // Routing graph`
- `sample-manager-deck   // Sample manager / organizer (M100)`
- `samples-deck          // Sample browser`
- `session-deck          // Session view clips`
- `spectrum-analyzer-deck // Spectrum analyzer (M179)`
- `track-groups-deck     // Track groups for organizing stems (M258)`
- `transport-deck        // Transport controls (E060)`
- `waveform-editor-deck  // Waveform editor (M180)`

### `DeckCardLayout`

**Source:** `src/boards/types.ts`  
**Description:** Union type defining DeckCardLayout values

**Values:**
- `floating   // Floating cards`
- `grid`
- `split      // Split view (multiple visible)`
- `stack      // Stacked cards (one visible at a time)`
- `tabs       // Tabbed interface`

## Cards & Ports

### `PortType`

**Source:** `src/canon/ids.ts`  
**Description:** Union type defining PortType values

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

**Values:**
- `floating   // Floating cards`
- `grid`
- `split      // Split view (multiple visible)`
- `stack      // Stacked cards (one visible at a time)`
- `tabs       // Tabbed interface`

### `CardKind`

**Source:** `src/boards/types.ts`  
**Description:** Union type defining CardKind values

**Values:**
- `assisted        // On-demand generation/assistance`
- `collaborative   // Inline suggestions (accept/reject)`
- `generative`
- `hint            // Display hints/suggestions (no auto-apply)`
- `manual          // Manual editing only`

### `CardCategory`

**Source:** `src/cards/card.ts`  
**Description:** Union type defining CardCategory values

**Values:**
- `analysis`
- `custom`
- `effects`
- `filters`
- `generators`
- `routing`
- `transforms`
- `utilities`

## Music Theory

### `TonalityModel`

**Source:** `src/canon/ids.ts`  
**Description:** Union type defining TonalityModel values

**Values:**
- `dft_phase     // DFT phase-based tonality`
- `ks_profile    // Krumhansl-Schmuckler key profiles`
- `spiral_array`

### `ModeName`

**Source:** `src/canon/ids.ts`  
**Description:** Union type defining ModeName values

**Values:**
- `aeolian`
- `blues`
- `diminished`
- `dorian`
- `harmonic_minor`
- `ionian`
- `locrian
  // Extended modes`
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

**Values:**
- `deceptive            // DC: V → vi (or other)`
- `evaded`
- `half                 // HC: ends on V`
- `imperfect_authentic  // IAC: V → I, soprano not on tonic`
- `perfect_authentic    // PAC: V → I, soprano on tonic`
- `phrygian_half        // PHC: iv6 → V in minor`
- `plagal               // PC: IV → I`

### `BuiltinConstraintType`

**Source:** `src/canon/ids.ts`  
**Description:** Union type defining BuiltinConstraintType values

**Values:**
- `// Key/Tonality`
- `avoid_parallel
  // Melody`
- `cadence`
- `chinese_mode`
- `chord_progression`
- `contour`
- `culture`
- `density
  // Style/Culture`
- `eduppu
  // Celtic`
- `film_device`
- `gamaka_density`
- `harmonic_rhythm`
- `heterophony
  // Film/Media`
- `key`
- `meter`
- `raga`
- `range`
- `schema
  // Carnatic`
- `style`
- `tala`
- `tempo
  // Harmony`
- `tonality_model
  // Meter/Rhythm`
- `tune_form
  // Chinese`
- `tune_type`

### `QuantizeMode`

**Source:** `src/types/primitives.ts`  
**Description:** Union type defining QuantizeMode values

**Values:**
- `ceil`
- `floor`
- `nearest`

### `ModeName`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining ModeName values

**Values:**
- `// Western church modes`
- `aeolian`
- `blues
  // Symmetric`
- `chromatic`
- `dorian`
- `harmonic_minor`
- `ionian`
- `locrian
  // Minor variants`
- `lydian`
- `major`
- `melodic_minor
  // Pentatonic/blues`
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

**Values:**
- `dft_phase      // DFT phase estimation (k=1 component)`
- `ks_profile     // Krumhansl-Schmuckler key profiles`
- `spiral_array`

### `AccentModel`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining AccentModel values

**Values:**
- `carnatic_tala`
- `celtic_dance   // Dance lift accents`
- `compound       // 6/8, 9/8, 12/8 groupings`
- `standard       // Strong/weak based on position`
- `swing          // Jazz swing feel`

### `ChineseModeName`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining ChineseModeName values

**Values:**
- `gong`
- `jiao`
- `shang`
- `yu`
- `zhi`

### `CadenceType`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining CadenceType values

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

**Values:**
- `CadenceType`
- `backdoor  // Western extended`
- `carnatic_arudi`
- `cinematic_bvi_bvii_i                       // Film`
- `galant_meyer`
- `galant_quiescenza        // Galant`
- `modal_bvii_i`
- `modal_iv_i              // Modal`
- `phrygian_half`
- `picardy`

### `MusicConstraint`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining MusicConstraint values

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

**Values:**
- `assisted              // Your ideas + tool execution`
- `collaborative         // 50/50 with AI`
- `directed              // You direct, AI creates`
- `full-manual           // You control everything`
- `generative`
- `manual-with-hints     // Manual + suggestions`

### `ToolKind`

**Source:** `src/boards/types.ts`  
**Description:** Union type defining ToolKind values

**Values:**
- `aiComposer`
- `arrangerCard`
- `harmonyExplorer`
- `phraseDatabase`
- `phraseGenerators`

### `DensityLevel`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining DensityLevel values

**Values:**
- `dense`
- `medium`
- `sparse`
- `very_dense`

### `HarmonicRhythmLevel`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining HarmonicRhythmLevel values

**Values:**
- `fast`
- `moderate`
- `slow`
- `very_fast`
- `very_slow`

### `JazzVocabularyLevel`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining JazzVocabularyLevel values

**Values:**
- `advanced`
- `beginner`
- `intermediate`

## Other

### `CultureTag`

**Source:** `src/canon/ids.ts`  
**Description:** Union type defining CultureTag values

**Values:**
- `carnatic  // South Indian classical`
- `celtic    // Irish/Scottish/Breton traditional`
- `chinese   // Chinese traditional`
- `hybrid`
- `western   // Western tonal music`

### `StyleTag`

**Source:** `src/canon/ids.ts`  
**Description:** Union type defining StyleTag values

**Values:**
- `baroque     // Baroque period`
- `cinematic   // Film score style`
- `classical   // Classical period`
- `custom`
- `edm         // Electronic dance music`
- `galant      // 18th century galant style`
- `jazz        // Jazz`
- `lofi        // Lo-fi hip hop / chill`
- `pop         // Pop music`
- `romantic    // Romantic period`
- `trailer     // Trailer music`
- `underscore  // Background/ambient scoring`

### `RoutingConnectionType`

**Source:** `src/canon/ids.ts`  
**Description:** Union type defining RoutingConnectionType values

**Values:**
- `audio       // Audio signal`
- `midi        // MIDI messages`
- `modulation  // Control rate modulation`
- `sidechain`

### `ViewType`

**Source:** `src/boards/types.ts`  
**Description:** Union type defining ViewType values

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

**Values:**
- `audio       // Audio signal`
- `midi        // MIDI data`
- `modulation  // Control/modulation signals`
- `trigger`

### `BuiltinOntologyId`

**Source:** `src/boards/types.ts`  
**Description:** Union type defining BuiltinOntologyId values

**Values:**
- `microtonal`
- `western-12tet      // Standard 12-tone equal temperament`
- `western-just       // Just intonation`

### `OntologyId`

**Source:** `src/boards/types.ts`  
**Description:** Union type defining OntologyId values

**Values:**
- `(string & {})`
- `BuiltinOntologyId`

### `OntologySelection`

**Source:** `src/boards/types.ts`  
**Description:** Union type defining OntologySelection values

**Values:**
- `OntologyId`
- `readonly OntologyId[]`

### `UserType`

**Source:** `src/boards/types.ts`  
**Description:** Union type defining UserType values

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

**Values:**
- `// Triads`
- `add9`
- `augmented`
- `diminished`
- `diminished7`
- `dominant11`
- `dominant13`
- `dominant7`
- `dominant9`
- `half_diminished7
  // Extended`
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
- `sus4
  // Sevenths`

### `CultureTag`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining CultureTag values

**Values:**
- `carnatic`
- `celtic`
- `chinese`
- `hybrid`
- `western`

### `StyleTag`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining StyleTag values

**Values:**
- `// Historical Western`
- `baroque`
- `cinematic`
- `classical`
- `custom`
- `edm`
- `galant`
- `jazz`
- `lofi
  // World substyles handled via CultureTag`
- `pop`
- `romantic
  // Modern Western`
- `trailer`
- `underscore`

### `GalantSchemaName`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining GalantSchemaName values

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

**Values:**
- `// Western`
- `appoggiatura
  // Celtic`
- `birl
  // Carnatic`
- `cran`
- `cut`
- `grace`
- `hua`
- `hua_yin`
- `jaaru`
- `kampita`
- `mordent`
- `nokku`
- `pratyahatam
  // Chinese`
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

**Values:**
- `chatusra`
- `khanda`
- `misra`
- `sankeerna`
- `tisra`

### `CelticTuneType`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining CelticTuneType values

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

**Values:**
- `chinese`
- `japanese`
- `korean`

### `ChineseRegionalStyle`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining ChineseRegionalStyle values

**Values:**
- `beijing`
- `cantonese`
- `jiangnan`
- `sichuan`

### `JazzStyleEra`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining JazzStyleEra values

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

**Values:**
- `gagaku`
- `hogaku`
- `minyo`

### `LatinStyle`

**Source:** `src/ai/theory/music-spec.ts`  
**Description:** Union type defining LatinStyle values

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
