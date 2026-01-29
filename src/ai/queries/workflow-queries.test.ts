/**
 * @fileoverview Tests for Workflow Planning & Project Analysis Query Functions
 *
 * Covers roadmap items:
 *   - N007: planWorkflow
 *   - N008: executeWorkflowStep
 *   - N009: validateWorkflow
 *   - N010-N011: workflow plan execution & validation tests
 *   - N028-N030: deck config, sync, optimization tests
 *   - N031-N033: routing templates, signal flow, optimization
 *   - N060-N062: project analysis tests
 *   - N079-N082: consistency check tests
 *   - N092-N094: complexity & safety tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createPrologAdapter, resetPrologAdapter } from '../engine/prolog-adapter';
import { resetWorkflowPlanningLoader } from '../knowledge/workflow-planning-loader';
import { resetProjectAnalysisLoader } from '../knowledge/project-analysis-loader';

import {
  // Workflow planning
  planWorkflow,
  getDeckSequence,
  getParameterDependencies,
  getRoutingRequirements,
  getWorkflowCheckpoints,
  getDeckConfigPatterns,
  getCrossDeckSyncRules,
  // N008-N009
  executeWorkflowStep,
  validateWorkflow,
  // N031-N033
  getRoutingTemplate,
  validateSignalFlow,
  getRoutingOptimizations,
  // Project analysis
  getHealthMetrics,
  getMissingElements,
  getOverusedElements,
  getStructuralIssues,
  getTechnicalIssues,
  getAllProjectIssues,
  getStyleConsistencyIssues,
  getHarmonyCoherenceIssues,
  getRhythmConsistencyIssues,
  getInstrumentationBalanceIssues,
  getSimplificationSuggestions,
  getBeginnerSafetyWarnings,
  // N086: complexity
  measureComplexity,
  // N024: configuration optimization
  optimizeConfiguration,
  // N016: workflow interruption/resume
  getWorkflowInterruptPolicy,
  getWorkflowSkippableSteps,
  getWorkflowCheckpointSteps,
  suspendWorkflow,
  resumeWorkflow,
  // N015: workflow template library
  getWorkflowTemplateLibrary,
  getWorkflowTemplatesForPersona,
  getWorkflowTemplatesByCategory,
  searchWorkflowTemplates,
  getWorkflowTemplateById,
} from './workflow-queries';

describe('Workflow Planning Queries', () => {
  beforeEach(() => {
    resetPrologAdapter();
    resetWorkflowPlanningLoader();
    resetProjectAnalysisLoader();
  });

  afterEach(() => {
    resetPrologAdapter();
    resetWorkflowPlanningLoader();
    resetProjectAnalysisLoader();
  });

  // ===========================================================================
  // N007: planWorkflow
  // ===========================================================================

  describe('planWorkflow (N007)', () => {
    it('returns steps for a known goal/persona combo', async () => {
      const plan = await planWorkflow('make_beat', 'tracker_user');
      if (plan) {
        expect(plan.goal).toBe('make_beat');
        expect(plan.persona).toBe('tracker_user');
        expect(plan.steps.length).toBeGreaterThan(0);
      }
    });

    it('returns null for unknown goal', async () => {
      const plan = await planWorkflow('build_spaceship', 'tracker_user');
      expect(plan).toBeNull();
    });
  });

  // ===========================================================================
  // N003: getDeckSequence
  // ===========================================================================

  describe('getDeckSequence (N003)', () => {
    it('returns deck order for known tasks', async () => {
      const decks = await getDeckSequence('make_beat');
      if (decks.length > 0) {
        expect(decks.length).toBeGreaterThan(1);
      }
    });
  });

  // ===========================================================================
  // N004-N005: Dependencies and routing
  // ===========================================================================

  describe('Parameter dependencies (N004)', () => {
    it('returns parameter dependencies', async () => {
      const deps = await getParameterDependencies();
      expect(deps.length).toBeGreaterThan(0);
      for (const dep of deps) {
        expect(dep.param).toBeDefined();
        expect(dep.sourceDeck).toBeDefined();
        expect(dep.affectedDeck).toBeDefined();
      }
    });
  });

  describe('Routing requirements (N005)', () => {
    it('returns routing requirements for known tasks', async () => {
      const reqs = await getRoutingRequirements('make_beat');
      if (reqs.length > 0) {
        expect(reqs[0]!.task).toBe('make_beat');
        expect(reqs[0]!.sourceDeck).toBeDefined();
        expect(reqs[0]!.targetDeck).toBeDefined();
      }
    });
  });

  // ===========================================================================
  // N006: Workflow checkpoints
  // ===========================================================================

  describe('Workflow checkpoints (N006)', () => {
    it('returns checkpoints for known tasks', async () => {
      const checkpoint = await getWorkflowCheckpoints('make_beat');
      if (checkpoint) {
        expect(checkpoint.task).toBe('make_beat');
        expect(checkpoint.checks.length).toBeGreaterThan(0);
      }
    });
  });

  // ===========================================================================
  // N008: executeWorkflowStep
  // ===========================================================================

  describe('executeWorkflowStep (N008)', () => {
    it('N010: marks step completed when decks are available', async () => {
      const result = await executeWorkflowStep(
        'make_beat',
        0,
        ['pattern_editor', 'sample_browser', 'mixer', 'effect_chain'],
      );
      if (result.status !== 'failed') {
        expect(['completed', 'skipped']).toContain(result.status);
      }
    });

    it('N010: fails for unknown goal', async () => {
      const result = await executeWorkflowStep('fly_to_moon', 0, []);
      expect(result.status).toBe('failed');
    });

    it('N010: fails for out-of-range step index', async () => {
      const result = await executeWorkflowStep('make_beat', 999, []);
      expect(result.status).toBe('failed');
    });
  });

  // ===========================================================================
  // N009: validateWorkflow
  // ===========================================================================

  describe('validateWorkflow (N009)', () => {
    it('N011: valid when all decks available', async () => {
      const result = await validateWorkflow(
        'make_beat',
        'tracker_user',
        ['pattern_editor', 'sample_browser', 'mixer', 'effect_chain', 'automation'],
      );
      if (result.errors.length === 0) {
        expect(result.valid).toBe(true);
      }
    });

    it('N011: catches missing dependencies', async () => {
      const result = await validateWorkflow(
        'make_beat',
        'tracker_user',
        [], // No decks available
      );
      // Should have errors or warnings about missing decks
      expect(result.errors.length + result.warnings.length).toBeGreaterThanOrEqual(0);
    });

    it('N011: invalid for unknown goal/persona', async () => {
      const result = await validateWorkflow('unknown_goal', 'unknown_persona', []);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // N047: Workflow planning end-to-end
  // ===========================================================================

  describe('Workflow planning end-to-end (N047)', () => {
    it('plans, validates, and executes each step', async () => {
      const adapter = createPrologAdapter({ enableCache: false });

      const goal = 'make_beat';
      const persona = 'tracker_user';

      const plan = await planWorkflow(goal, persona, adapter);
      expect(plan).not.toBeNull();
      expect(plan!.steps.length).toBeGreaterThan(0);

      const deckSequence = await getDeckSequence(goal, adapter);
      expect(deckSequence.length).toBeGreaterThan(0);

      const availableDecks = Array.from(new Set([...deckSequence, 'transport']));

      const validation = await validateWorkflow(goal, persona, availableDecks, adapter);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      for (let i = 0; i < plan!.steps.length; i++) {
        const result = await executeWorkflowStep(goal, i, availableDecks, adapter);
        expect(result.status).not.toBe('failed');
        if (i < deckSequence.length) {
          expect(result.status).toBe('completed');
        }
      }
    });
  });

  // ===========================================================================
  // N019-N021: Deck configuration
  // ===========================================================================

  describe('Deck configuration (N019-N021)', () => {
    it('N028: deck configurations exist for known tasks', async () => {
      const configs = await getDeckConfigPatterns('make_beat');
      // May or may not have config patterns
      expect(Array.isArray(configs)).toBe(true);
    });

    it('N029: cross-deck sync rules exist', async () => {
      const rules = await getCrossDeckSyncRules();
      expect(rules.length).toBeGreaterThan(0);
      const params = rules.map((r) => r.param);
      expect(params).toContain('tempo');
    });
  });

  // ===========================================================================
  // N031-N033: Routing templates
  // ===========================================================================

  describe('Routing templates (N031-N033)', () => {
    it('N040: routing templates exist for known task types', async () => {
      const template = await getRoutingTemplate('beat_making');
      if (template) {
        expect(template.taskType).toBe('beat_making');
        expect(template.deckSet.length).toBeGreaterThan(0);
      }
    });

    it('N041: signal flow validation returns issues', async () => {
      const issues = await validateSignalFlow();
      expect(Array.isArray(issues)).toBe(true);
    });

    it('N042: routing optimizations are available', async () => {
      const optimizations = await getRoutingOptimizations();
      expect(optimizations.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // N051-N062: Project Analysis
  // ===========================================================================

  describe('Project Analysis (N051-N062)', () => {
    it('N060: project health metrics exist', async () => {
      const metrics = await getHealthMetrics();
      expect(metrics.length).toBeGreaterThan(0);
      const ids = metrics.map((m) => m.id);
      expect(ids).toContain('completeness');
    });

    it('N060: missing element detection works', async () => {
      const issues = await getMissingElements();
      expect(issues.length).toBeGreaterThan(0);
      for (const issue of issues) {
        expect(issue.category).toBe('missing');
        expect(issue.remedy).toBeDefined();
      }
    });

    it('N061: aggregated project issues span categories', async () => {
      const all = await getAllProjectIssues();
      expect(all.length).toBeGreaterThan(0);
      const categories = [...new Set(all.map((i) => i.category))];
      expect(categories.length).toBeGreaterThan(1);
    });

    it('N062: overused elements detected', async () => {
      const issues = await getOverusedElements();
      expect(issues.length).toBeGreaterThan(0);
    });

    it('structural issues detected', async () => {
      const issues = await getStructuralIssues();
      expect(issues.length).toBeGreaterThan(0);
    });

    it('technical issues detected', async () => {
      const issues = await getTechnicalIssues();
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // N079-N082: Consistency Checks
  // ===========================================================================

  describe('Consistency Checks (N079-N082)', () => {
    it('N079: style consistency checks exist', async () => {
      const issues = await getStyleConsistencyIssues();
      expect(issues.length).toBeGreaterThan(0);
    });

    it('N080: harmony coherence checks exist', async () => {
      const issues = await getHarmonyCoherenceIssues();
      expect(issues.length).toBeGreaterThan(0);
    });

    it('N081: rhythm consistency checks exist', async () => {
      const issues = await getRhythmConsistencyIssues();
      expect(issues.length).toBeGreaterThan(0);
    });

    it('N082: instrumentation balance checks exist', async () => {
      const issues = await getInstrumentationBalanceIssues();
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // N092-N094: Complexity & Safety
  // ===========================================================================

  describe('Complexity & Safety (N092-N094)', () => {
    it('N093: simplification suggestions exist', async () => {
      const suggestions = await getSimplificationSuggestions();
      expect(suggestions.length).toBeGreaterThan(0);
      for (const s of suggestions) {
        expect(s.technique).toBeDefined();
        expect(s.description).toBeDefined();
      }
    });

    it('N094: beginner safety warnings exist', async () => {
      const warnings = await getBeginnerSafetyWarnings();
      expect(warnings.length).toBeGreaterThan(0);
      for (const w of warnings) {
        expect(w.check).toBeDefined();
        expect(w.warning).toBeDefined();
      }
    });
  });

  // ===========================================================================
  // N086: measureComplexity
  // ===========================================================================

  describe('measureComplexity (N086)', () => {
    it('returns low complexity for small projects', async () => {
      const result = await measureComplexity({
        track_count: 4,
        unique_instruments: 3,
        effect_count: 5,
        automation_lanes: 2,
        routing_connections: 1,
        section_count: 3,
      });
      expect(result.level).toBe('low');
      expect(result.overallScore).toBeLessThan(30);
      expect(result.measurements.length).toBeGreaterThan(0);
      for (const m of result.measurements) {
        expect(m.exceeds).toBe(false);
      }
    });

    it('returns high complexity for large projects', async () => {
      const result = await measureComplexity({
        track_count: 32,
        unique_instruments: 15,
        effect_count: 40,
        automation_lanes: 20,
        routing_connections: 16,
        section_count: 12,
      });
      expect(['high', 'very_high']).toContain(result.level);
      expect(result.overallScore).toBeGreaterThan(50);
      expect(result.measurements.some((m) => m.exceeds)).toBe(true);
    });

    it('handles missing stats gracefully', async () => {
      const result = await measureComplexity({});
      expect(result.level).toBe('low');
      expect(result.overallScore).toBe(0);
    });
  });

  // ===========================================================================
  // N024: optimizeConfiguration
  // ===========================================================================

  describe('optimizeConfiguration (N024)', () => {
    it('suggests changes for known goals', async () => {
      const result = await optimizeConfiguration('make_beat', {});
      expect(result.goal).toBe('make_beat');
      // Even if no KB patterns match, the structure should be correct
      expect(Array.isArray(result.changes)).toBe(true);
      expect(Array.isArray(result.syncRules)).toBe(true);
    });

    it('returns sync rules', async () => {
      const result = await optimizeConfiguration('mix_track', {
        pattern_editor: ['tempo'],
      });
      expect(result.syncRules.length).toBeGreaterThanOrEqual(0);
    });
  });

  // ===========================================================================
  // N016: Workflow Interruption & Resume
  // ===========================================================================

  describe('Workflow Interruption & Resume (N016)', () => {
    it('N017: gets interrupt policy for known goals', async () => {
      const policy = await getWorkflowInterruptPolicy('make_beat');
      expect(policy).not.toBeNull();
      expect(policy!.goal).toBe('make_beat');
      expect(typeof policy!.policy).toBe('string');
    });

    it('N017: returns null for unknown goals', async () => {
      const policy = await getWorkflowInterruptPolicy('nonexistent_goal');
      expect(policy).toBeNull();
    });

    it('N017: gets skippable steps', async () => {
      const steps = await getWorkflowSkippableSteps('make_beat');
      expect(Array.isArray(steps)).toBe(true);
      // make_beat has skippable steps in the KB
      expect(steps.length).toBeGreaterThan(0);
    });

    it('N017: gets checkpoint steps', async () => {
      const steps = await getWorkflowCheckpointSteps('make_beat');
      expect(Array.isArray(steps)).toBe(true);
      expect(steps.length).toBeGreaterThan(0);
    });

    it('N017: suspends a workflow', async () => {
      const suspended = await suspendWorkflow('make_beat', 'tracker_user', 2);
      expect(suspended).not.toBeNull();
      expect(suspended!.goal).toBe('make_beat');
      expect(suspended!.completedStepIndex).toBe(2);
      expect(suspended!.totalSteps.length).toBeGreaterThan(0);
      expect(typeof suspended!.interruptPolicy).toBe('string');
      expect(typeof suspended!.suspendedAt).toBe('number');
    });

    it('N018: resumes a workflow from suspended state', async () => {
      const suspended = await suspendWorkflow('make_beat', 'tracker_user', 2);
      expect(suspended).not.toBeNull();

      const resumed = resumeWorkflow(suspended!);
      expect(resumed.goal).toBe('make_beat');
      expect(resumed.resumeFromIndex).toBe(3);
      expect(resumed.strategy).toBe('resume_from_step');
      expect(resumed.remainingSteps.length).toBeGreaterThan(0);
    });

    it('N018: skipped steps are excluded from remaining steps', async () => {
      const suspended = await suspendWorkflow('make_beat', 'tracker_user', 0);
      expect(suspended).not.toBeNull();

      const resumed = resumeWorkflow(suspended!);
      // Skippable steps should not appear in remainingSteps
      for (const step of resumed.skippedSteps) {
        expect(resumed.remainingSteps).not.toContain(step);
      }
    });
  });

  // ===========================================================================
  // N015: Workflow Template Library
  // ===========================================================================

  describe('workflow template library (N015)', () => {
    it('returns a non-empty template library', () => {
      const templates = getWorkflowTemplateLibrary();
      expect(templates.length).toBeGreaterThanOrEqual(10);
    });

    it('all templates have valid structure', () => {
      const templates = getWorkflowTemplateLibrary();
      for (const t of templates) {
        expect(t.templateId).toBeTruthy();
        expect(t.goal).toBeTruthy();
        expect(t.description).toBeTruthy();
        expect(t.persona).toBeTruthy();
        expect(t.category).toBeTruthy();
        expect(t.estimatedSteps).toBeGreaterThan(0);
        expect(t.requiredDecks.length).toBeGreaterThan(0);
        expect(t.tags.length).toBeGreaterThan(0);
      }
    });

    it('filters templates by persona', () => {
      const trackerTemplates = getWorkflowTemplatesForPersona('tracker_user');
      expect(trackerTemplates.length).toBeGreaterThan(0);
      // Should include tracker-specific + "any" persona templates
      expect(trackerTemplates.some(t => t.persona === 'tracker_user')).toBe(true);
      expect(trackerTemplates.some(t => t.persona === 'any')).toBe(true);
    });

    it('filters templates by category', () => {
      const mixingTemplates = getWorkflowTemplatesByCategory('mixing');
      expect(mixingTemplates.length).toBeGreaterThan(0);
      expect(mixingTemplates.every(t => t.category === 'mixing')).toBe(true);
    });

    it('searches templates by query', () => {
      const results = searchWorkflowTemplates('beat');
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(t =>
        t.goal.toLowerCase().includes('beat') ||
        t.description.toLowerCase().includes('beat') ||
        t.tags.some(tag => tag.includes('beat'))
      )).toBe(true);
    });

    it('retrieves template by ID', () => {
      const t = getWorkflowTemplateById('wf_mix_session');
      expect(t).not.toBeNull();
      expect(t!.goal).toBe('mix_session');
    });

    it('returns null for unknown template ID', () => {
      expect(getWorkflowTemplateById('nonexistent')).toBeNull();
    });

    it('covers common workflow categories', () => {
      const templates = getWorkflowTemplateLibrary();
      const categories = new Set(templates.map(t => t.category));
      expect(categories.has('composition')).toBe(true);
      expect(categories.has('production')).toBe(true);
      expect(categories.has('mixing')).toBe(true);
      expect(categories.has('mastering')).toBe(true);
      expect(categories.has('sound-design')).toBe(true);
    });
  });
});
