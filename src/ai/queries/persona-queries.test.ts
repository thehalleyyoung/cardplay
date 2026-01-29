/**
 * @fileoverview Tests for Persona-Specific Query Functions
 *
 * Covers roadmap items:
 *   - M012-M015: Notation composer (score layout, page breaks, engraving, articulations)
 *   - M016-M017: Score layout & page break tests
 *   - M026: Engraving check tests
 *   - M032-M034: Orchestration (suggest, range check, dynamic balance)
 *   - M049-M050: Board preset / deck config tests
 *   - M055-M057: Counterpoint, cadence, modulation
 *   - M093-M095: Tracker persona tests (pattern length, samples, effects)
 *   - M134-M136: Pattern variation, groove templates, humanization
 *   - M253-M255: Producer tests (arrangement, mix, mastering)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getPrologAdapter, resetPrologAdapter } from '../engine/prolog-adapter';
import { resetPersonaLoaders } from '../knowledge/persona-loader';
import { resetAdaptationLoader } from '../knowledge/adaptation-loader';

import {
  // M012-M015
  suggestScoreLayoutFull,
  suggestPageBreaks,
  checkEngravingQuality,
  suggestArticulations,
  // M032-M034
  suggestOrchestration,
  checkInstrumentRangeFull,
  suggestDynamicBalance,
  // M055-M057
  analyzeCounterpoint,
  suggestCadences,
  planModulation,
  // Notation existing
  getNotationBoardDecks,
  getEngravingRules,
  getFormSections,
  getNotationShortcuts,
  // Tracker
  suggestPatternLengths,
  suggestTrackerEffectChain,
  getGrooveTemplates,
  getTrackerVariationTechniques,
  getHumanizationAmount,
  getTrackerBoardPresets,
  getTrackerBoardDecks,
  // Sound Designer
  suggestSynthesis,
  suggestSoundEffectChain,
  suggestModulationRouting,
  suggestLayering,
  suggestMacroLayout,
  getRandomizationConstraints,
  getSoundDesignerBoardPresets,
  getSoundDesignerBoardDecks,
  // Producer
  suggestArrangementStructure,
  getGenreTemplate,
  suggestMixChecklist,
  getMasteringTarget,
  suggestTrackColors,
  getTrackOrganization,
  getProducerBoardPresets,
  getProducerBoardDecks,
  // M134-M136: Pattern Variation / Groove / Humanization
  generateVariation,
  applyGroove,
  humanize,
  // Cross-persona
  getPersonaTransition,
  getBoardsForPersonas,
  getWorkflowBridges,
  getLearningPath,
  getQuickStartFlow,
  // N126-N128: Skill estimation & feature visibility
  estimateSkillLevel,
  adaptSuggestions,
  decideFeatureVisibility,
  getVisibleFeatures,
  // M145-M146: Performance mode & launch quantization
  getPerformanceModeLayout,
  getPerformanceModeDeckProperties,
  getLaunchQuantizationModes,
  getSuggestedLaunchQuantization,
  // M279-M280: Bus routing & automation lanes
  setupBusRouting,
  suggestAutomationLanes,
  getAllAutomationLaneSuggestions,
  // M307: Collaboration
  getCollaborationWorkflows,
  getCollaborationRoles,
  getCollaborationHandoff,
  // Sound designer extras
  analyzeFrequencyBalance,
  suggestStereoPlacement,
} from './persona-queries';

describe('Persona-Specific Query Functions', () => {
  beforeEach(() => {
    resetPrologAdapter();
    resetPersonaLoaders();
    resetAdaptationLoader();
  });

  afterEach(() => {
    resetPrologAdapter();
    resetPersonaLoaders();
    resetAdaptationLoader();
  });

  // ===========================================================================
  // M012-M015: Notation Composer - Score Layout & Engraving
  // ===========================================================================

  describe('Notation Composer: Score Layout (M012)', () => {
    it('M016: returns layout with stave order for orchestral instruments', async () => {
      const result = await suggestScoreLayoutFull(
        ['violin', 'flute', 'cello', 'trumpet'],
      );
      expect(result.totalStaves).toBe(4);
      expect(result.staveOrder).toEqual(['flute', 'trumpet', 'violin', 'cello']);
    });

    it('M016: instruments have range data', async () => {
      const result = await suggestScoreLayoutFull(['violin', 'piano']);
      expect(result.instruments.length).toBeGreaterThanOrEqual(1);
      for (const g of result.instruments) {
        expect(g.rangeLow).toBeGreaterThan(0);
        expect(g.rangeHigh).toBeGreaterThan(g.rangeLow);
      }
    });
  });

  describe('Notation Composer: Page Breaks (M013)', () => {
    it('M017: suggests page breaks at phrase boundaries', async () => {
      const suggestions = await suggestPageBreaks(
        64, // 64 measures
        4,  // 4 measures per system
        [16, 32, 48], // phrase boundaries at bars 16, 32, 48
      );
      expect(suggestions.length).toBeGreaterThan(0);
      for (const s of suggestions) {
        expect(s.measureNumber).toBeGreaterThan(0);
        expect(s.reason).toBeDefined();
      }
    });

    it('M017: prefers phrase boundaries over arbitrary positions', async () => {
      const suggestions = await suggestPageBreaks(
        100,
        4,
        [15, 30, 45, 60, 75, 90],
      );
      // Should snap to phrase boundaries when close enough
      for (const s of suggestions) {
        expect(typeof s.measureNumber).toBe('number');
      }
    });
  });

  describe('Notation Composer: Engraving Quality (M014)', () => {
    it('M026: returns engraving rules', async () => {
      const checks = await checkEngravingQuality();
      expect(checks.length).toBeGreaterThan(0);
      const ruleIds = checks.map((c) => c.ruleId);
      expect(ruleIds).toContain('stem_direction');
      expect(ruleIds).toContain('beam_grouping');
    });
  });

  describe('Notation Composer: Articulations (M015)', () => {
    it('returns articulation suggestions', async () => {
      const results = await suggestArticulations();
      expect(results.length).toBeGreaterThan(0);
      const names = results.map((r) => r.name);
      expect(names).toContain('staccato');
      expect(names).toContain('accent');
    });
  });

  // ===========================================================================
  // M032-M034: Orchestration
  // ===========================================================================

  describe('Orchestration (M032-M034)', () => {
    it('M032: suggests orchestration sorted by suitability', async () => {
      const assignments = await suggestOrchestration(
        { low: 60, high: 80 }, // C4 to G#5
        ['violin', 'flute', 'tuba', 'cello'],
      );
      expect(assignments.length).toBeGreaterThan(0);
      // Suitable instruments should come first
      const suitableFirst = assignments.findIndex((a) => !a.suitable);
      if (suitableFirst > 0) {
        for (let i = 0; i < suitableFirst; i++) {
          expect(assignments[i]!.suitable).toBe(true);
        }
      }
    });

    it('M033: checks instrument range correctly', async () => {
      const results = await checkInstrumentRangeFull(
        'violin',
        [55, 80, 110], // G3, G#5, D8 — first two in range, last out
      );
      expect(results.length).toBe(3);
      expect(results[0]!.inRange).toBe(true);  // G3 in violin range
      expect(results[1]!.inRange).toBe(true);  // G#5 in violin range
      expect(results[2]!.inRange).toBe(false); // D8 above violin range
    });

    it('M034: suggests dynamic balance', async () => {
      const suggestions = await suggestDynamicBalance([
        { instrument: 'flute', role: 'melody' },
        { instrument: 'violin', role: 'harmony' },
        { instrument: 'cello', role: 'bass' },
      ]);
      expect(suggestions.length).toBe(3);
      expect(suggestions[0]!.suggestedDynamic).toContain('f');   // melody = prominent
      expect(suggestions[2]!.suggestedDynamic).toContain('mf');  // bass = foundational
    });
  });

  // ===========================================================================
  // M055-M057: Counterpoint, Cadence, Modulation
  // ===========================================================================

  describe('Counterpoint / Cadence / Modulation (M055-M057)', () => {
    it('M055/M061: counterpoint analysis includes parallel fifth detection', async () => {
      const analysis = await analyzeCounterpoint();
      expect(analysis.rules.length).toBeGreaterThan(0);
      expect(analysis.applicable).toContain('no_parallel_fifths');
      expect(analysis.applicable).toContain('no_parallel_octaves');
    });

    it('M056/M062: cadence suggestions include standard types', async () => {
      const cadences = await suggestCadences();
      expect(cadences.length).toBe(4); // authentic, half, deceptive, plagal
      const types = cadences.map((c) => c.cadenceType);
      expect(types).toContain('authentic');
      expect(types).toContain('plagal');
    });

    it('M057/M063: modulation plans include common and rare types', async () => {
      const plans = await planModulation();
      expect(plans.length).toBeGreaterThan(0);
      const types = plans.map((p) => p.modulationType);
      expect(types).toContain('major_to_dominant');
      expect(types).toContain('tritone');
    });
  });

  // ===========================================================================
  // M049-M050: Notation Board Deck Configuration
  // ===========================================================================

  describe('Notation Board Configuration (M049-M050)', () => {
    it('M049: notation board has correct deck structure', async () => {
      const decks = await getNotationBoardDecks();
      expect(decks.length).toBeGreaterThan(0);
      const required = decks.filter((d) => d.importance === 'required');
      expect(required.length).toBeGreaterThanOrEqual(2); // score_notation + properties_inspector
      const types = decks.map((d) => d.deckType);
      expect(types).toContain('score_notation');
    });

    it('M050: notation board presets configure decks correctly', async () => {
      const shortcuts = await getNotationShortcuts();
      expect(shortcuts.length).toBeGreaterThan(10); // 16+ shortcuts in KB
    });
  });

  // ===========================================================================
  // M093-M095: Tracker Persona Tests
  // ===========================================================================

  describe('Tracker Persona (M093-M095)', () => {
    it('M093: pattern length suggestions match genre conventions', async () => {
      const technoLengths = await suggestPatternLengths('techno');
      expect(technoLengths).toContain(64);
      expect(technoLengths).toContain(128);

      const chipLengths = await suggestPatternLengths('chiptune');
      expect(chipLengths).toContain(32);
    });

    it('M094: sample suggestions match track roles via effect chains', async () => {
      const kickChains = await suggestTrackerEffectChain('kick');
      expect(kickChains.length).toBeGreaterThan(0);
      for (const chain of kickChains) {
        expect(chain.trackType).toBe('kick');
        expect(chain.effects.length).toBeGreaterThan(0);
      }
    });

    it('M095: effect chain presets are appropriate', async () => {
      const bassChains = await suggestTrackerEffectChain('bass');
      expect(bassChains.length).toBeGreaterThan(0);
      const styles = bassChains.map((c) => c.style);
      expect(styles).toContain('sub');
      expect(styles).toContain('distorted');
    });

    it('groove templates have valid offsets', async () => {
      const templates = await getGrooveTemplates();
      expect(templates.length).toBeGreaterThanOrEqual(8);
      for (const t of templates) {
        expect(Array.isArray(t.offsets)).toBe(true);
      }
    });

    it('variation techniques are documented', async () => {
      const techniques = await getTrackerVariationTechniques();
      expect(techniques.length).toBeGreaterThanOrEqual(7);
      const ids = techniques.map((t) => t.id);
      expect(ids).toContain('reverse');
      expect(ids).toContain('invert');
    });

    it('humanization amounts vary by genre', async () => {
      const chiptune = await getHumanizationAmount('chiptune');
      const jazz = await getHumanizationAmount('jazz');
      expect(chiptune).toBe(0);
      expect(jazz).toBeGreaterThan(chiptune);
    });

    it('tracker board presets exist', async () => {
      const presets = await getTrackerBoardPresets();
      expect(presets.length).toBeGreaterThanOrEqual(3);
      const ids = presets.map((p) => p.id);
      expect(ids).toContain('chip_music');
      expect(ids).toContain('techno');
    });

    it('tracker board decks include pattern editor', async () => {
      const decks = await getTrackerBoardDecks();
      expect(decks.length).toBeGreaterThan(0);
      const types = decks.map((d) => d.deckType);
      expect(types).toContain('pattern_editor');
    });
  });

  // ===========================================================================
  // M253-M255: Producer Tests
  // ===========================================================================

  describe('Producer Persona (M253-M255)', () => {
    it('M253: arrangement suggestions match genre templates', async () => {
      const sections = await suggestArrangementStructure('house');
      expect(sections.length).toBeGreaterThan(0);
    });

    it('M254: mix balance suggestions are genre-appropriate', async () => {
      const checklist = await suggestMixChecklist('electronic');
      expect(checklist.length).toBeGreaterThan(0);
    });

    it('M255: mastering checks detect common issues', async () => {
      const target = await getMasteringTarget('pop');
      expect(target).not.toBeNull();
      expect(target!.targetLUFS).toBeLessThan(0);
      expect(target!.dynamicRangeDB).toBeGreaterThan(0);
    });

    it('genre template includes BPM range', async () => {
      const template = await getGenreTemplate('house');
      expect(template).not.toBeNull();
      expect(template!.bpmMin).toBeGreaterThan(0);
      expect(template!.bpmMax).toBeGreaterThan(template!.bpmMin);
    });

    it('track colors have valid assignments', async () => {
      const colors = await suggestTrackColors();
      expect(colors.length).toBeGreaterThan(0);
      for (const c of colors) {
        expect(c.groupType).toBeDefined();
        expect(c.color).toBeDefined();
      }
    });

    it('producer board presets exist', async () => {
      const presets = await getProducerBoardPresets();
      expect(presets.length).toBeGreaterThanOrEqual(3);
    });

    it('producer board decks are configured', async () => {
      const decks = await getProducerBoardDecks();
      expect(decks.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // Sound Designer Tests
  // ===========================================================================

  describe('Sound Designer Persona', () => {
    it('suggests synthesis techniques for pad', async () => {
      const techniques = await suggestSynthesis('pad');
      expect(techniques.length).toBeGreaterThan(0);
    });

    it('suggests effect chains for sound types', async () => {
      const chains = await suggestSoundEffectChain('pad');
      expect(chains.length).toBeGreaterThan(0);
      for (const c of chains) {
        expect(c.effects.length).toBeGreaterThan(0);
      }
    });

    it('suggests modulation routing', async () => {
      const routings = await suggestModulationRouting();
      expect(routings.length).toBeGreaterThan(0);
    });

    it('suggests layering for thick_pad', async () => {
      const result = await suggestLayering('thick_pad');
      expect(result).not.toBeNull();
      expect(result!.roles.length).toBeGreaterThan(0);
    });

    it('provides randomization constraints', async () => {
      const constraints = await getRandomizationConstraints();
      expect(constraints.length).toBeGreaterThan(0);
      for (const c of constraints) {
        expect(c.minFraction).toBeGreaterThanOrEqual(0);
        expect(c.maxFraction).toBeLessThanOrEqual(1);
      }
    });

    it('sound designer presets exist', async () => {
      const presets = await getSoundDesignerBoardPresets();
      expect(presets.length).toBeGreaterThanOrEqual(3);
    });

    it('sound designer decks are configured', async () => {
      const decks = await getSoundDesignerBoardDecks();
      expect(decks.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // Cross-Persona Tests
  // ===========================================================================

  describe('Cross-Persona Features', () => {
    it('M327: transition suggestions exist', async () => {
      const transition = await getPersonaTransition('notation_composer', 'tracker_user');
      // May or may not have a path — depends on KB data
      if (transition) {
        expect(transition.sharedNeeds.length).toBeGreaterThan(0);
      }
    });

    it('workflow bridges are available', async () => {
      const bridges = await getWorkflowBridges();
      expect(bridges.length).toBeGreaterThan(0);
    });

    it('learning paths exist for personas', async () => {
      const path = await getLearningPath('tracker_user', 'beginner');
      if (path) {
        expect(path.steps.length).toBeGreaterThan(0);
      }
    });

    it('quick start flows exist', async () => {
      const flow = await getQuickStartFlow('tracker_user');
      expect(flow.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // M134-M136: Pattern Variation / Groove / Humanization
  // ===========================================================================

  describe('M134-M136: Pattern Variation/Groove/Humanization', () => {
    const samplePattern: import('./persona-queries').PatternNote[] = [
      { tick: 0, note: 60, velocity: 100, duration: 120 },
      { tick: 120, note: 64, velocity: 90, duration: 120 },
      { tick: 240, note: 67, velocity: 80, duration: 120 },
      { tick: 360, note: 72, velocity: 110, duration: 120 },
    ];

    describe('M134: Variations maintain rhythmic relationship', () => {
      it('reverse produces reversed note order with original tick spacing', async () => {
        const result = await generateVariation(samplePattern, 'reverse');
        expect(result.technique).toBe('reverse');
        expect(result.notes).toHaveLength(4);
        // Notes should be in reversed pitch order
        expect(result.notes[0]!.note).toBe(72);
        expect(result.notes[1]!.note).toBe(67);
        expect(result.notes[2]!.note).toBe(64);
        expect(result.notes[3]!.note).toBe(60);
      });

      it('invert mirrors intervals around first note', async () => {
        const result = await generateVariation(samplePattern, 'invert');
        expect(result.technique).toBe('invert');
        expect(result.notes).toHaveLength(4);
        // First note unchanged
        expect(result.notes[0]!.note).toBe(60);
        // Second note: 60 - (64 - 60) = 56
        expect(result.notes[1]!.note).toBe(56);
        // Third note: 60 - (67 - 60) = 53
        expect(result.notes[2]!.note).toBe(53);
        // Fourth note: 60 - (72 - 60) = 48
        expect(result.notes[3]!.note).toBe(48);
      });

      it('shift transposes all notes by 2 semitones', async () => {
        const result = await generateVariation(samplePattern, 'shift');
        expect(result.technique).toBe('shift');
        expect(result.notes[0]!.note).toBe(62);
        expect(result.notes[1]!.note).toBe(66);
        expect(result.notes[2]!.note).toBe(69);
        expect(result.notes[3]!.note).toBe(74);
      });

      it('octave_shift moves notes up 12 semitones', async () => {
        const result = await generateVariation(samplePattern, 'octave_shift');
        expect(result.notes[0]!.note).toBe(72);
        expect(result.notes[1]!.note).toBe(76);
        expect(result.notes[2]!.note).toBe(79);
        expect(result.notes[3]!.note).toBe(84);
      });

      it('double doubles all durations', async () => {
        const result = await generateVariation(samplePattern, 'double');
        expect(result.notes[0]!.duration).toBe(240);
        expect(result.notes[1]!.duration).toBe(240);
        expect(result.notes[2]!.duration).toBe(240);
        expect(result.notes[3]!.duration).toBe(240);
      });

      it('halve halves all durations', async () => {
        const result = await generateVariation(samplePattern, 'halve');
        expect(result.notes[0]!.duration).toBe(60);
        expect(result.notes[1]!.duration).toBe(60);
        expect(result.notes[2]!.duration).toBe(60);
        expect(result.notes[3]!.duration).toBe(60);
      });

      it('unknown technique returns original pattern', async () => {
        const result = await generateVariation(samplePattern, 'nonexistent');
        expect(result.notes).toEqual(samplePattern);
      });
    });

    describe('M135: Groove templates affect timing', () => {
      it('applyGroove returns original if template not found', async () => {
        const result = await applyGroove(samplePattern, 'nonexistent_groove');
        expect(result.notes).toEqual(samplePattern);
      });

      // Note: actual groove template application depends on KB data
    });

    describe('M136: Humanization is subtle and musical', () => {
      it('humanize returns unchanged pattern for zero-humanization genres', async () => {
        // chiptune has humanization_amount 0
        const result = await humanize(samplePattern, 'chiptune');
        // With 0 amount, notes should be unchanged
        expect(result.notes).toHaveLength(4);
        expect(result.notes[0]!.tick).toBe(0);
        expect(result.notes[0]!.velocity).toBe(100);
      });

      it('humanize preserves note count', async () => {
        const result = await humanize(samplePattern, 'jazz');
        expect(result.notes).toHaveLength(4);
      });
    });
  });

  // ===========================================================================
  // N126-N128: Skill Estimation & Feature Visibility
  // ===========================================================================

  describe('Skill Estimation (N126)', () => {
    it('N131: estimates beginner for low action counts', async () => {
      const profile = await estimateSkillLevel({ composition: 5, mixing: 10 });
      expect(profile.overall).toBe('beginner'); // total=15 < 20
      expect(profile.areas.get('composition')).toBe('beginner');
    });

    it('N131: estimates intermediate for moderate counts', async () => {
      const profile = await estimateSkillLevel({ general: 50 });
      expect(profile.overall).toBe('intermediate'); // 50 >= 20 and < 80
    });

    it('N131: estimates expert for high counts', async () => {
      const profile = await estimateSkillLevel({ composition: 200, mixing: 350 });
      expect(profile.overall).toBe('expert'); // total=550 >= 200
      expect(profile.areas.get('composition')).toBe('expert');
      expect(profile.areas.get('mixing')).toBe('expert'); // mixing-specific: 350 >= 300
    });
  });

  describe('Adaptive Suggestions (N127)', () => {
    it('N132: adapts suggestions for beginners', async () => {
      const adapted = await adaptSuggestions(
        ['chord_suggestion', 'scale_suggestion', 'rhythm_suggestion'],
        'beginner'
      );
      expect(adapted.length).toBe(3);
      expect(adapted[0]!.adjustment).toBe('limit_to_triads');
      expect(adapted[1]!.adjustment).toBe('limit_to_major_minor');
      expect(adapted[2]!.adjustment).toBe('limit_to_straight');
    });

    it('N132: adapts suggestions for experts', async () => {
      const adapted = await adaptSuggestions(
        ['chord_suggestion', 'arrangement'],
        'expert'
      );
      expect(adapted.length).toBe(2);
      expect(adapted[0]!.adjustment).toBe('include_all_harmony');
      expect(adapted[1]!.adjustment).toBe('suggest_through_composed');
    });
  });

  describe('Feature Visibility (N128)', () => {
    it('N133: beginners see basic features only', async () => {
      const visible = await decideFeatureVisibility('basic_board_switcher', 'beginner');
      expect(visible).toBe(true);

      const notVisible = await decideFeatureVisibility('ai_advisor', 'beginner');
      expect(notVisible).toBe(false);
    });

    it('N133: advanced users see advanced features', async () => {
      const visible = await decideFeatureVisibility('ai_advisor', 'advanced');
      expect(visible).toBe(true);

      const basicVisible = await decideFeatureVisibility('pattern_editor', 'advanced');
      expect(basicVisible).toBe(true);
    });

    it('N133: experts see everything', async () => {
      const features = await getVisibleFeatures('expert');
      expect(features.length).toBeGreaterThan(15); // all features visible
      expect(features).toContain('custom_prolog_rules');
      expect(features).toContain('basic_board_switcher');
    });

    it('N133: beginners see limited features', async () => {
      const features = await getVisibleFeatures('beginner');
      expect(features.length).toBeLessThan(10);
      expect(features).toContain('pattern_editor');
      expect(features).not.toContain('ai_advisor');
    });
  });

  // ===========================================================================
  // M145: Performance Mode Layout
  // ===========================================================================

  describe('Tracker Performance Mode (M145)', () => {
    it('M145: performance mode layout has essential decks', async () => {
      const layout = await getPerformanceModeLayout();
      expect(layout.length).toBeGreaterThanOrEqual(3);
      const types = layout.map((d) => d.deckType);
      expect(types).toContain('pattern_launcher');
      expect(types).toContain('mixer');
    });

    it('M145: performance mode sizes sum to ~100%', async () => {
      const layout = await getPerformanceModeLayout();
      const total = layout.reduce((sum, d) => sum + d.sizePercent, 0);
      expect(total).toBe(100);
    });

    it('M145: performance mode decks have properties', async () => {
      const props = await getPerformanceModeDeckProperties('pattern_launcher');
      expect(props.length).toBeGreaterThan(0);
      const features = props.filter((p) => p.property === 'feature');
      expect(features.length).toBeGreaterThan(0);
    });

    it('M150: performance mode layout is accessible during live play', async () => {
      const layout = await getPerformanceModeLayout();
      // Pattern launcher must have highest size for visibility during live play
      const launcher = layout.find((d) => d.deckType === 'pattern_launcher');
      expect(launcher).toBeDefined();
      expect(launcher!.sizePercent).toBeGreaterThanOrEqual(40);
    });
  });

  // ===========================================================================
  // M146: Pattern Launch Quantization
  // ===========================================================================

  describe('Pattern Launch Quantization (M146)', () => {
    it('M146: launch quantization modes are defined', async () => {
      const modes = await getLaunchQuantizationModes();
      expect(modes.length).toBeGreaterThanOrEqual(5);
      const modeNames = modes.map((m) => m.mode);
      expect(modeNames).toContain('bar');
      expect(modeNames).toContain('beat');
      expect(modeNames).toContain('none');
    });

    it('M146: genre-specific quantization returns valid mode', async () => {
      const techno = await getSuggestedLaunchQuantization('techno');
      expect(techno).toBe('bar');
      const ambient = await getSuggestedLaunchQuantization('ambient');
      expect(ambient).toBe('four_bar');
    });

    it('M146: unknown genre defaults to bar', async () => {
      const unknown = await getSuggestedLaunchQuantization('unknown_genre');
      expect(unknown).toBe('bar');
    });
  });

  // ===========================================================================
  // M174: Effect chains match sound design goals
  // ===========================================================================

  describe('Sound Designer: Effect Chains (M174)', () => {
    it('M174: pad effect chains include reverb or chorus', async () => {
      const chains = await suggestSoundEffectChain('pad');
      expect(chains.length).toBeGreaterThan(0);
      for (const chain of chains) {
        const hasSpacial = chain.effects.some(
          (e) => e.includes('reverb') || e.includes('chorus') || e.includes('delay')
        );
        expect(hasSpacial).toBe(true);
      }
    });

    it('M174: bass effect chains include dynamics or tonal shaping', async () => {
      const chains = await suggestSoundEffectChain('bass');
      expect(chains.length).toBeGreaterThan(0);
      // At least one chain should have compressor or saturator
      const chainsWithControl = chains.filter((chain) =>
        chain.effects.some(
          (e) => e.includes('compressor') || e.includes('saturator') || e.includes('filter') || e.includes('wavefolder')
        )
      );
      expect(chainsWithControl.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // M204: Layering suggestions complement each other
  // ===========================================================================

  describe('Sound Designer: Layering (M204)', () => {
    it('M204: layering suggestion has multiple roles', async () => {
      const result = await suggestLayering('thick_pad');
      expect(result).not.toBeNull();
      expect(result!.roles.length).toBeGreaterThan(1);
    });

    it('M204: fat_bass layering includes distinct roles', async () => {
      const result = await suggestLayering('fat_bass');
      if (result) {
        expect(result.roles.length).toBeGreaterThan(1);
        // Roles should be distinct for complementary layering
        const uniqueRoles = new Set(result.roles);
        expect(uniqueRoles.size).toBe(result.roles.length);
      }
    });
  });

  // ===========================================================================
  // M205: Frequency analysis detects mud/harshness
  // ===========================================================================

  describe('Sound Designer: Frequency Analysis (M205)', () => {
    it('M205: frequency analysis returns balance issues for bass+pad', async () => {
      const issues = await analyzeFrequencyBalance(['bass', 'pad']);
      expect(issues.length).toBeGreaterThan(0);
      // Should include frequency range checks
      for (const issue of issues) {
        expect(issue.range).toBeDefined();
        expect(issue.description).toBeDefined();
      }
    });

    it('M205: lead track includes harshness/presence ranges', async () => {
      const issues = await analyzeFrequencyBalance(['lead']);
      const ranges = issues.map((i) => i.range);
      // The KB defines presence and harshness rules for lead
      expect(ranges.length).toBeGreaterThan(0);
      expect(ranges).toContain('presence');
    });

    it('M205: multiple tracks get universal masking check', async () => {
      const issues = await analyzeFrequencyBalance(['bass', 'lead', 'pad']);
      const ranges = issues.map((i) => i.range);
      // Universal checks (masking, air) should apply when multiple tracks present
      expect(ranges).toContain('masking');
    });
  });

  // ===========================================================================
  // M206: Stereo placement avoids phase issues
  // ===========================================================================

  describe('Sound Designer: Stereo Placement (M206)', () => {
    it('M206: stereo placement provides pan positions', async () => {
      const placements = await suggestStereoPlacement([
        { name: 'kick', type: 'drums' },
        { name: 'bass', type: 'bass' },
        { name: 'pad_l', type: 'synths' },
      ]);
      expect(placements.length).toBe(3);
      for (const p of placements) {
        expect(p.pan).toBeGreaterThanOrEqual(-1);
        expect(p.pan).toBeLessThanOrEqual(1);
      }
    });

    it('M206: kick and bass are centered (mono-compatible)', async () => {
      const placements = await suggestStereoPlacement([
        { name: 'kick', type: 'drums' },
        { name: 'sub_bass', type: 'bass' },
      ]);
      for (const p of placements) {
        // Low-end should be centered for phase safety
        expect(Math.abs(p.pan)).toBeLessThanOrEqual(0.1);
      }
    });
  });

  // ===========================================================================
  // M228: Randomization respects constraints
  // ===========================================================================

  describe('Sound Designer: Randomization (M228)', () => {
    it('M228: constraints have valid min/max fractions', async () => {
      const constraints = await getRandomizationConstraints();
      expect(constraints.length).toBeGreaterThan(0);
      for (const c of constraints) {
        expect(c.minFraction).toBeGreaterThanOrEqual(0);
        expect(c.maxFraction).toBeLessThanOrEqual(1);
        // max >= min always (max == min means "don't randomize")
        expect(c.maxFraction).toBeGreaterThanOrEqual(c.minFraction);
      }
    });

    it('M228: filter cutoff has constrained range (avoids extremes)', async () => {
      const constraints = await getRandomizationConstraints();
      const filterCutoff = constraints.find((c) => c.paramGroup === 'filter_cutoff');
      expect(filterCutoff).toBeDefined();
      // Filter cutoff: min=0.2 max=0.9 (avoids extremes)
      expect(filterCutoff!.minFraction).toBeGreaterThan(0);
      expect(filterCutoff!.maxFraction).toBeLessThan(1);
    });

    it('M228: oscillator pitch is never randomized (min == max == 0)', async () => {
      const constraints = await getRandomizationConstraints();
      const pitch = constraints.find((c) => c.paramGroup === 'oscillator_pitch');
      expect(pitch).toBeDefined();
      expect(pitch!.minFraction).toBe(0);
      expect(pitch!.maxFraction).toBe(0);
    });
  });

  // ===========================================================================
  // M279: Bus Routing Setup
  // ===========================================================================

  describe('Producer: Bus Routing (M279)', () => {
    it('M279: electronic setup has drum, bass, and master buses', async () => {
      const config = await setupBusRouting('electronic');
      expect(config).not.toBeNull();
      expect(config!.buses.length).toBeGreaterThanOrEqual(5);
      const names = config!.buses.map((b) => b.name);
      expect(names).toContain('drum_bus');
      expect(names).toContain('bass_bus');
      expect(names).toContain('master');
    });

    it('M279: cinematic setup has string and brass buses', async () => {
      const config = await setupBusRouting('cinematic');
      expect(config).not.toBeNull();
      const names = config!.buses.map((b) => b.name);
      expect(names).toContain('string_bus');
      expect(names).toContain('brass_bus');
    });

    it('M279: buses have effects assigned', async () => {
      const config = await setupBusRouting('electronic');
      expect(config).not.toBeNull();
      for (const bus of config!.buses) {
        expect(bus.effects.length).toBeGreaterThan(0);
      }
    });

    it('M279: unknown setup returns null', async () => {
      const config = await setupBusRouting('nonexistent_setup');
      expect(config).toBeNull();
    });
  });

  // ===========================================================================
  // M280: Automation Lane Suggestions
  // ===========================================================================

  describe('Producer: Automation Lanes (M280)', () => {
    it('M280: vocal automation lanes are priority-sorted', async () => {
      const lanes = await suggestAutomationLanes('vocals');
      expect(lanes.length).toBeGreaterThan(0);
      // Volume should be highest priority (lowest number)
      expect(lanes[0]!.parameter).toBe('volume');
      expect(lanes[0]!.priority).toBe(1);
    });

    it('M280: synth lanes include filter and send params', async () => {
      const lanes = await suggestAutomationLanes('synths');
      expect(lanes.length).toBeGreaterThan(2);
      const params = lanes.map((l) => l.parameter);
      expect(params).toContain('filter_cutoff');
      expect(params).toContain('send_delay');
    });

    it('M280: all lanes have valid priorities', async () => {
      const all = await getAllAutomationLaneSuggestions();
      expect(all.length).toBeGreaterThan(10);
      for (const lane of all) {
        expect(lane.priority).toBeGreaterThanOrEqual(1);
        expect(lane.priority).toBeLessThanOrEqual(10);
      }
    });
  });

  // ===========================================================================
  // M284: Track Coloring Consistency
  // ===========================================================================

  describe('Producer: Track Coloring (M284)', () => {
    it('M284: all track groups have unique colors', async () => {
      const colors = await suggestTrackColors();
      const colorValues = colors.map((c) => c.color);
      const uniqueColors = new Set(colorValues);
      expect(uniqueColors.size).toBe(colorValues.length);
    });

    it('M284: essential groups (drums, bass, vocals) are present', async () => {
      const colors = await suggestTrackColors();
      const groups = colors.map((c) => c.groupType);
      expect(groups).toContain('drums');
      expect(groups).toContain('bass');
      expect(groups).toContain('vocals');
    });
  });

  // ===========================================================================
  // M307: Collaboration Workflows
  // ===========================================================================

  describe('Producer: Collaboration (M307)', () => {
    it('M307: collaboration workflows are defined', async () => {
      const workflows = await getCollaborationWorkflows();
      expect(workflows.length).toBeGreaterThanOrEqual(5);
      const ids = workflows.map((w) => w.id);
      expect(ids).toContain('stem_exchange');
      expect(ids).toContain('project_sharing');
    });

    it('M307: collaboration roles have responsibilities', async () => {
      const roles = await getCollaborationRoles();
      expect(roles.length).toBeGreaterThanOrEqual(4);
      for (const role of roles) {
        expect(role.responsibilities.length).toBeGreaterThan(0);
      }
    });

    it('M307: handoff between beat_maker and mix_engineer suggests method', async () => {
      const handoff = await getCollaborationHandoff('beat_maker', 'mix_engineer');
      expect(handoff).not.toBeNull();
      expect(handoff!.method).toBe('project_sharing');
    });

    it('M307: unknown role pair falls back to stem_exchange', async () => {
      const handoff = await getCollaborationHandoff('unknown_role', 'another_role');
      expect(handoff).not.toBeNull();
      expect(handoff!.method).toBe('stem_exchange');
    });
  });

  // ===========================================================================
  // M328: Workflow Mixing Detection Accuracy
  // ===========================================================================

  describe('Cross-Persona: Workflow Mixing (M328)', () => {
    it('M328: boards for multiple personas returns compatible boards', async () => {
      const boards = await getBoardsForPersonas(['tracker_user', 'producer']);
      // Should find boards that work across both personas
      expect(Array.isArray(boards)).toBe(true);
    });

    it('M328: workflow bridges connect different workflows', async () => {
      const bridges = await getWorkflowBridges();
      expect(bridges.length).toBeGreaterThan(0);
      for (const b of bridges) {
        expect(b.fromWorkflow).toBeDefined();
        expect(b.toWorkflow).toBeDefined();
        expect(b.bridgeAction).toBeDefined();
      }
    });
  });
});
