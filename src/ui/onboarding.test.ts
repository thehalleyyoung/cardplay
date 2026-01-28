/**
 * @fileoverview Tests for personalized onboarding flow.
 */

import { describe, it, expect } from 'vitest';
import {
  createOnboardingState,
  getNextOnboardingStep,
  getPreviousOnboardingStep,
  canProceedToNextStep,
  completeOnboarding,
  generatePersonalizedDashboard,
  GENRE_OPTIONS,
  SKILL_LEVEL_OPTIONS,
  DAW_BACKGROUND_OPTIONS,
  INSTRUMENT_OPTIONS,
  GOAL_OPTIONS,
  AVATAR_PRESETS,
  type OnboardingState,
} from './onboarding';

describe('onboarding', () => {
  describe('createOnboardingState', () => {
    it('creates initial state with welcome step', () => {
      const state = createOnboardingState();
      expect(state.currentStep).toBe('welcome');
      expect(state.completedSteps).toEqual([]);
      expect(state.genres).toEqual([]);
      expect(state.skillLevel).toBeNull();
      expect(state.completedAt).toBeNull();
    });

    it('sets start timestamp', () => {
      const before = Date.now();
      const state = createOnboardingState();
      const after = Date.now();
      expect(state.startedAt).toBeGreaterThanOrEqual(before);
      expect(state.startedAt).toBeLessThanOrEqual(after);
    });
  });

  describe('onboarding flow navigation', () => {
    it('advances through all steps in order', () => {
      let step = getNextOnboardingStep('welcome');
      expect(step).toBe('genre-preference');
      
      step = getNextOnboardingStep(step);
      expect(step).toBe('skill-level');
      
      step = getNextOnboardingStep(step);
      expect(step).toBe('daw-background');
      
      step = getNextOnboardingStep(step);
      expect(step).toBe('instrument-preference');
      
      step = getNextOnboardingStep(step);
      expect(step).toBe('goal-selection');
      
      step = getNextOnboardingStep(step);
      expect(step).toBe('name-avatar');
      
      step = getNextOnboardingStep(step);
      expect(step).toBe('account-creation');
      
      step = getNextOnboardingStep(step);
      expect(step).toBe('audio-setup');
      
      step = getNextOnboardingStep(step);
      expect(step).toBe('midi-setup');
      
      step = getNextOnboardingStep(step);
      expect(step).toBe('complete');
      
      step = getNextOnboardingStep(step);
      expect(step).toBe('complete'); // Stays at complete
    });

    it('goes back through steps', () => {
      let step = getPreviousOnboardingStep('complete');
      expect(step).toBe('midi-setup');
      
      step = getPreviousOnboardingStep(step!);
      expect(step).toBe('audio-setup');
      
      step = getPreviousOnboardingStep('welcome');
      expect(step).toBeNull(); // Can't go before welcome
    });
  });

  describe('canProceedToNextStep', () => {
    it('allows proceeding from welcome', () => {
      const state = createOnboardingState();
      expect(canProceedToNextStep(state)).toBe(true);
    });

    it('requires genre selection', () => {
      const state: OnboardingState = {
        ...createOnboardingState(),
        currentStep: 'genre-preference',
      };
      expect(canProceedToNextStep(state)).toBe(false);
      
      const withGenre: OnboardingState = {
        ...state,
        genres: ['electronic'],
      };
      expect(canProceedToNextStep(withGenre)).toBe(true);
    });

    it('requires skill level selection', () => {
      const state: OnboardingState = {
        ...createOnboardingState(),
        currentStep: 'skill-level',
      };
      expect(canProceedToNextStep(state)).toBe(false);
      
      const withSkill: OnboardingState = {
        ...state,
        skillLevel: 'beginner',
      };
      expect(canProceedToNextStep(withSkill)).toBe(true);
    });

    it('requires DAW background selection', () => {
      const state: OnboardingState = {
        ...createOnboardingState(),
        currentStep: 'daw-background',
      };
      expect(canProceedToNextStep(state)).toBe(false);
      
      const withBackground: OnboardingState = {
        ...state,
        dawBackground: 'ableton',
      };
      expect(canProceedToNextStep(withBackground)).toBe(true);
    });

    it('requires instrument selection', () => {
      const state: OnboardingState = {
        ...createOnboardingState(),
        currentStep: 'instrument-preference',
      };
      expect(canProceedToNextStep(state)).toBe(false);
      
      const withInstrument: OnboardingState = {
        ...state,
        instruments: ['synth'],
      };
      expect(canProceedToNextStep(withInstrument)).toBe(true);
    });

    it('requires goal selection', () => {
      const state: OnboardingState = {
        ...createOnboardingState(),
        currentStep: 'goal-selection',
      };
      expect(canProceedToNextStep(state)).toBe(false);
      
      const withGoal: OnboardingState = {
        ...state,
        goals: ['produce'],
      };
      expect(canProceedToNextStep(withGoal)).toBe(true);
    });

    it('requires name for name-avatar step', () => {
      const state: OnboardingState = {
        ...createOnboardingState(),
        currentStep: 'name-avatar',
      };
      expect(canProceedToNextStep(state)).toBe(false);
      
      const withName: OnboardingState = {
        ...state,
        userName: 'Alex',
      };
      expect(canProceedToNextStep(withName)).toBe(true);
    });

    it('allows skipping optional steps', () => {
      const accountStep: OnboardingState = {
        ...createOnboardingState(),
        currentStep: 'account-creation',
      };
      expect(canProceedToNextStep(accountStep)).toBe(true);
      
      const audioStep: OnboardingState = {
        ...createOnboardingState(),
        currentStep: 'audio-setup',
      };
      expect(canProceedToNextStep(audioStep)).toBe(true);
      
      const midiStep: OnboardingState = {
        ...createOnboardingState(),
        currentStep: 'midi-setup',
      };
      expect(canProceedToNextStep(midiStep)).toBe(true);
    });
  });

  describe('completeOnboarding', () => {
    it('generates user persona from state', () => {
      const state: OnboardingState = {
        ...createOnboardingState(),
        skillLevel: 'intermediate',
        dawBackground: 'ableton',
        genres: ['electronic', 'hip-hop'],
        instruments: ['synth', 'drums'],
        goals: ['produce', 'jam'],
        userName: 'TestUser',
        completedAt: Date.now(),
      };

      const persona = completeOnboarding(state);
      
      expect(persona.name).toBe('TestUser');
      expect(persona.experienceLevel).toBe('intermediate');
      expect(persona.background).toBe('ableton');
      expect(persona.primaryInterests).toContain('electronic');
      expect(persona.preferredLayout).toBe('ableton');
    });

    it('uses defaults for missing fields', () => {
      const state = createOnboardingState();
      const persona = completeOnboarding(state);
      
      expect(persona.experienceLevel).toBe('beginner');
      expect(persona.background).toBe('none');
      expect(persona.preferredLayout).toBe('simplified');
    });

    it('maps goals to interests', () => {
      const state: OnboardingState = {
        ...createOnboardingState(),
        goals: ['learn', 'sound-design'],
        genres: [],
      };

      const persona = completeOnboarding(state);
      
      expect(persona.primaryInterests).toContain('education');
      expect(persona.primaryInterests).toContain('sound-design');
    });

    it('sets enabled features based on skill level', () => {
      const beginnerState: OnboardingState = {
        ...createOnboardingState(),
        skillLevel: 'beginner',
      };
      const beginnerPersona = completeOnboarding(beginnerState);
      expect(beginnerPersona.enabledFeatures).toContain('guided-tutorials');
      
      const expertState: OnboardingState = {
        ...createOnboardingState(),
        skillLevel: 'expert',
      };
      const expertPersona = completeOnboarding(expertState);
      expect(expertPersona.enabledFeatures).toContain('api');
    });

    it('sets tutorial sequence from goals', () => {
      const state: OnboardingState = {
        ...createOnboardingState(),
        goals: ['produce', 'learn'],
      };

      const persona = completeOnboarding(state);
      
      expect(persona.tutorialSequence.length).toBeGreaterThan(0);
      expect(persona.tutorialSequence).toContain('first-track');
      expect(persona.tutorialSequence).toContain('theory-basics');
    });
  });

  describe('generatePersonalizedDashboard', () => {
    it('generates welcome message with user name', () => {
      const state: OnboardingState = {
        ...createOnboardingState(),
        userName: 'Alice',
        genres: ['jazz'],
      };

      const dashboard = generatePersonalizedDashboard(state);
      
      expect(dashboard.welcomeMessage).toContain('Alice');
      expect(dashboard.welcomeMessage).toContain('jazz');
    });

    it('generates welcome message without user name', () => {
      const state = createOnboardingState();
      const dashboard = generatePersonalizedDashboard(state);
      
      expect(dashboard.welcomeMessage).toContain('Welcome');
      expect(dashboard.welcomeMessage).not.toContain('null');
    });

    it('recommends templates based on preferences', () => {
      const state: OnboardingState = {
        ...createOnboardingState(),
        genres: ['hip-hop'],
        goals: ['jam'],
        instruments: ['drums'],
      };

      const dashboard = generatePersonalizedDashboard(state);
      
      expect(dashboard.recommendedTemplates).toContain('hip-hop-starter');
      expect(dashboard.recommendedTemplates).toContain('jam-hip-hop');
      expect(dashboard.recommendedTemplates).toContain('drums-demo');
    });

    it('includes first beat tutorial for beginners', () => {
      const state: OnboardingState = {
        ...createOnboardingState(),
        skillLevel: 'beginner',
      };

      const dashboard = generatePersonalizedDashboard(state);
      
      const firstBeatAction = dashboard.firstActions.find(a => a.id === 'make-first-beat');
      expect(firstBeatAction).toBeDefined();
      expect(firstBeatAction?.actionType).toBe('tutorial');
    });

    it('suggests instrument exploration', () => {
      const state: OnboardingState = {
        ...createOnboardingState(),
        instruments: ['guitar'],
      };

      const dashboard = generatePersonalizedDashboard(state);
      
      const instrumentAction = dashboard.firstActions.find(a => a.id === 'try-guitar');
      expect(instrumentAction).toBeDefined();
      expect(instrumentAction?.title).toContain('Guitar');
    });

    it('selects quick-win tutorial based on goal', () => {
      const learnState: OnboardingState = {
        ...createOnboardingState(),
        goals: ['learn'],
      };
      const learnDashboard = generatePersonalizedDashboard(learnState);
      expect(learnDashboard.quickWinTutorial).toBe('theory-basics');
      
      const jamState: OnboardingState = {
        ...createOnboardingState(),
        goals: ['jam'],
      };
      const jamDashboard = generatePersonalizedDashboard(jamState);
      expect(jamDashboard.quickWinTutorial).toBe('live-loop');
    });

    it('features relevant cards', () => {
      const state: OnboardingState = {
        ...createOnboardingState(),
        instruments: ['synth', 'drums'],
        goals: ['produce'],
      };

      const dashboard = generatePersonalizedDashboard(state);
      
      expect(dashboard.featuredCards.length).toBeGreaterThan(0);
      expect(dashboard.featuredCards.length).toBeLessThanOrEqual(8);
    });

    it('sets layout preset based on DAW background', () => {
      const abletonState: OnboardingState = {
        ...createOnboardingState(),
        dawBackground: 'ableton',
      };
      const abletonDashboard = generatePersonalizedDashboard(abletonState);
      expect(abletonDashboard.layoutPreset).toBe('ableton');
      
      const renoiseState: OnboardingState = {
        ...createOnboardingState(),
        dawBackground: 'renoise',
      };
      const renoiseDashboard = generatePersonalizedDashboard(renoiseState);
      expect(renoiseDashboard.layoutPreset).toBe('renoise');
    });
  });

  describe('genre options', () => {
    it('has all genre options defined', () => {
      expect(GENRE_OPTIONS.electronic).toBeDefined();
      expect(GENRE_OPTIONS['hip-hop']).toBeDefined();
      expect(GENRE_OPTIONS.jazz).toBeDefined();
    });

    it('each genre has required properties', () => {
      Object.values(GENRE_OPTIONS).forEach(genre => {
        expect(genre.id).toBeDefined();
        expect(genre.name).toBeDefined();
        expect(genre.description).toBeDefined();
        expect(genre.emoji).toBeDefined();
        expect(genre.popularInstruments).toBeDefined();
        expect(genre.typicalTempo).toBeDefined();
        expect(genre.keywords).toBeDefined();
      });
    });

    it('has valid tempo ranges', () => {
      Object.values(GENRE_OPTIONS).forEach(genre => {
        expect(genre.typicalTempo.min).toBeGreaterThan(0);
        expect(genre.typicalTempo.max).toBeGreaterThan(genre.typicalTempo.min);
        expect(genre.typicalTempo.max).toBeLessThan(300);
      });
    });
  });

  describe('skill level options', () => {
    it('has all skill levels defined', () => {
      expect(SKILL_LEVEL_OPTIONS.beginner).toBeDefined();
      expect(SKILL_LEVEL_OPTIONS.intermediate).toBeDefined();
      expect(SKILL_LEVEL_OPTIONS.advanced).toBeDefined();
      expect(SKILL_LEVEL_OPTIONS.expert).toBeDefined();
    });

    it('each skill level has required properties', () => {
      Object.values(SKILL_LEVEL_OPTIONS).forEach(level => {
        expect(level.level).toBeDefined();
        expect(level.name).toBeDefined();
        expect(level.description).toBeDefined();
        expect(level.emoji).toBeDefined();
        expect(level.features).toBeDefined();
        expect(level.tutorialLength).toBeDefined();
      });
    });

    it('beginner has longest tutorials', () => {
      expect(SKILL_LEVEL_OPTIONS.beginner.tutorialLength).toBe('long');
    });

    it('expert has shortest tutorials', () => {
      expect(SKILL_LEVEL_OPTIONS.expert.tutorialLength).toBe('short');
    });
  });

  describe('DAW background options', () => {
    it('has all backgrounds defined', () => {
      expect(DAW_BACKGROUND_OPTIONS.none).toBeDefined();
      expect(DAW_BACKGROUND_OPTIONS.ableton).toBeDefined();
      expect(DAW_BACKGROUND_OPTIONS.renoise).toBeDefined();
    });

    it('each background has layout preset', () => {
      Object.values(DAW_BACKGROUND_OPTIONS).forEach(bg => {
        expect(bg.layoutPreset).toBeDefined();
        expect(typeof bg.layoutPreset).toBe('string');
      });
    });

    it('none background has simplified layout', () => {
      expect(DAW_BACKGROUND_OPTIONS.none.layoutPreset).toBe('simplified');
    });

    it('backgrounds have similar concepts', () => {
      expect(DAW_BACKGROUND_OPTIONS.ableton.similarConcepts).toContain('clips');
      expect(DAW_BACKGROUND_OPTIONS.renoise.similarConcepts).toContain('patterns');
    });
  });

  describe('instrument options', () => {
    it('has all instruments defined', () => {
      expect(INSTRUMENT_OPTIONS.synth).toBeDefined();
      expect(INSTRUMENT_OPTIONS.drums).toBeDefined();
      expect(INSTRUMENT_OPTIONS.guitar).toBeDefined();
    });

    it('each instrument has default cards', () => {
      Object.values(INSTRUMENT_OPTIONS).forEach(inst => {
        expect(Array.isArray(inst.defaultCards)).toBe(true);
      });
    });

    it('categorizes instruments correctly', () => {
      expect(INSTRUMENT_OPTIONS.drums.category).toBe('rhythmic');
      expect(INSTRUMENT_OPTIONS.keys.category).toBe('harmonic');
      expect(INSTRUMENT_OPTIONS.vocals.category).toBe('melodic');
    });
  });

  describe('goal options', () => {
    it('has all goals defined', () => {
      expect(GOAL_OPTIONS.produce).toBeDefined();
      expect(GOAL_OPTIONS.learn).toBeDefined();
      expect(GOAL_OPTIONS.jam).toBeDefined();
    });

    it('each goal has tutorials and cards', () => {
      Object.values(GOAL_OPTIONS).forEach(goal => {
        expect(Array.isArray(goal.recommendedTutorials)).toBe(true);
        expect(Array.isArray(goal.recommendedCards)).toBe(true);
      });
    });

    it('learn goal has theory tutorials', () => {
      expect(GOAL_OPTIONS.learn.recommendedTutorials).toContain('theory-basics');
    });

    it('produce goal has mixing cards', () => {
      expect(GOAL_OPTIONS.produce.recommendedCards).toContain('mixer');
    });
  });

  describe('avatar presets', () => {
    it('has multiple avatar options', () => {
      expect(AVATAR_PRESETS.length).toBeGreaterThan(10);
    });

    it('each avatar has required properties', () => {
      AVATAR_PRESETS.forEach(avatar => {
        expect(avatar.id).toBeDefined();
        expect(avatar.emoji).toBeDefined();
        expect(avatar.name).toBeDefined();
        expect(avatar.category).toBeDefined();
      });
    });

    it('has music category avatars', () => {
      const musicAvatars = AVATAR_PRESETS.filter(a => a.category === 'music');
      expect(musicAvatars.length).toBeGreaterThan(0);
    });

    it('has animal category avatars', () => {
      const animalAvatars = AVATAR_PRESETS.filter(a => a.category === 'animal');
      expect(animalAvatars.length).toBeGreaterThan(0);
    });

    it('has space category avatars', () => {
      const spaceAvatars = AVATAR_PRESETS.filter(a => a.category === 'space');
      expect(spaceAvatars.length).toBeGreaterThan(0);
    });

    it('has abstract category avatars', () => {
      const abstractAvatars = AVATAR_PRESETS.filter(a => a.category === 'abstract');
      expect(abstractAvatars.length).toBeGreaterThan(0);
    });
  });
});
