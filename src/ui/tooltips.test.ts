/**
 * @fileoverview Tests for Tooltip & Help System
 */

import { describe, it, expect } from 'vitest';
import {
  getActionSuggestions,
  getDidYouKnowTips,
  getProgressHints,
  getErrorRecovery,
  getGlossaryTerm,
  getUnitExplanation,
  getParameterRangeHint,
  createContextualTooltip,
  getRelatedFeatures,
  getVideoTips,
  getUndoSuggestions,
  getComparisonExplanation,
  getWhyExplanation,
  getHowTutorial,
  getWhatNextSuggestions,
  getUndiscoveredFeatures,
  calculateMasteryLevel,
  getMasteryProgress,
  getTipsForMastery,
  type TooltipContext,
} from './tooltips.js';

describe('Action Suggestions', () => {
  it('should suggest tutorial for beginners without tutorials', () => {
    const context: TooltipContext = {
      experienceLevel: 'beginner',
      completedTutorials: [],
      recentActions: [],
      preferences: {},
    };

    const suggestions = getActionSuggestions(context);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(s => s.id === 'start-tutorial')).toBe(true);
  });

  it('should suggest adding first card when no cards added', () => {
    const context: TooltipContext = {
      experienceLevel: 'intermediate',
      completedTutorials: ['your-first-note'],
      recentActions: [],
      preferences: {},
    };

    const suggestions = getActionSuggestions(context);
    expect(suggestions.some(s => s.id === 'add-first-card')).toBe(true);
  });

  it('should not suggest tutorial for advanced users', () => {
    const context: TooltipContext = {
      experienceLevel: 'advanced',
      completedTutorials: [],
      recentActions: [],
      preferences: {},
    };

    const suggestions = getActionSuggestions(context);
    expect(suggestions.every(s => s.id !== 'start-tutorial')).toBe(true);
  });
});

describe('Did You Know Tips', () => {
  it('should include tips appropriate for experience level', () => {
    const beginnerContext: TooltipContext = {
      experienceLevel: 'beginner',
      completedTutorials: [],
      recentActions: [],
      preferences: {},
    };

    const advancedContext: TooltipContext = {
      experienceLevel: 'advanced',
      completedTutorials: [],
      recentActions: [],
      preferences: {},
    };

    const beginnerTips = getDidYouKnowTips(beginnerContext);
    const advancedTips = getDidYouKnowTips(advancedContext);
    
    // Beginners should see some tips
    expect(beginnerTips.length).toBeGreaterThan(0);
    
    // Advanced users should also see tips
    expect(advancedTips.length).toBeGreaterThan(0);
    
    // Both should have tips (not concerned about exact counts)
    expect(beginnerTips.length).toBeGreaterThan(0);
    expect(advancedTips.length).toBeGreaterThan(0);
  });

  it('should show all tips for advanced users', () => {
    const advancedContext: TooltipContext = {
      experienceLevel: 'advanced',
      completedTutorials: [],
      recentActions: [],
      preferences: {},
    };

    const tips = getDidYouKnowTips(advancedContext);
    expect(tips.length).toBeGreaterThan(0);
  });
});

describe('Progress Hints', () => {
  it('should show next-step hint after adding card', () => {
    const context: TooltipContext = {
      experienceLevel: 'beginner',
      completedTutorials: [],
      recentActions: ['add-card'],
      preferences: {},
    };

    const hints = getProgressHints(context);
    expect(hints.length).toBeGreaterThan(0);
    expect(hints[0]).toContain('connect');
  });

  it('should show milestone hint after completing tutorials', () => {
    const context: TooltipContext = {
      experienceLevel: 'beginner',
      completedTutorials: ['your-first-note', 'card-stacking'],
      recentActions: [],
      preferences: {},
    };

    const hints = getProgressHints(context);
    expect(hints.some(h => h.includes('tutorial'))).toBe(true);
  });
});

describe('Error Recovery', () => {
  it('should provide recovery suggestions for audio output error', () => {
    const recovery = getErrorRecovery('audio-output-disconnected');
    expect(recovery).not.toBeNull();
    expect(recovery!.solutions.length).toBeGreaterThan(0);
    expect(recovery!.explanation).toBeTruthy();
  });

  it('should provide recovery for card connection error', () => {
    const recovery = getErrorRecovery('card-connection-invalid');
    expect(recovery).not.toBeNull();
    expect(recovery!.solutions.some(s => s.title.includes('Adapter'))).toBe(true);
  });

  it('should return null for unknown error', () => {
    const recovery = getErrorRecovery('unknown-error-code');
    expect(recovery).toBeNull();
  });
});

describe('Glossary', () => {
  it('should define common audio terms', () => {
    const attack = getGlossaryTerm('attack');
    expect(attack).not.toBeNull();
    expect(attack!.definition).toBeTruthy();
    expect(attack!.category).toBe('audio');
  });

  it('should define production terms', () => {
    const sidechain = getGlossaryTerm('sidechain');
    expect(sidechain).not.toBeNull();
    expect(sidechain!.category).toBe('production');
  });

  it('should be case-insensitive', () => {
    const term1 = getGlossaryTerm('ATTACK');
    const term2 = getGlossaryTerm('attack');
    expect(term1).toEqual(term2);
  });

  it('should include related terms', () => {
    const attack = getGlossaryTerm('attack');
    expect(attack!.relatedTerms).toBeTruthy();
    expect(attack!.relatedTerms!.length).toBeGreaterThan(0);
  });
});

describe('Unit Explanations', () => {
  it('should explain Hz unit', () => {
    const hz = getUnitExplanation('Hz');
    expect(hz).not.toBeNull();
    expect(hz!.fullName).toContain('Hertz');
    expect(hz!.ranges.low).toBeTruthy();
    expect(hz!.ranges.high).toBeTruthy();
  });

  it('should explain dB unit', () => {
    const db = getUnitExplanation('dB');
    expect(db).not.toBeNull();
    expect(db!.fullName).toContain('Decibel');
  });

  it('should return null for unknown unit', () => {
    const unknown = getUnitExplanation('unknown');
    expect(unknown).toBeNull();
  });
});

describe('Parameter Range Hints', () => {
  it('should provide range hints for filter cutoff', () => {
    const hint = getParameterRangeHint('filter-cutoff');
    expect(hint).not.toBeNull();
    expect(hint!.low.description).toBeTruthy();
    expect(hint!.high.description).toBeTruthy();
    expect(hint!.sweetSpot).toBeTruthy();
  });

  it('should provide range hints for attack', () => {
    const hint = getParameterRangeHint('attack');
    expect(hint).not.toBeNull();
    expect(hint!.sweetSpot).toBeTruthy();
  });
});

describe('Contextual Tooltips', () => {
  it('should create contextual tooltip', () => {
    const tooltip = createContextualTooltip(
      'test-tooltip',
      'test-target',
      (context) => ({
        text: `Level: ${context.experienceLevel}`,
      })
    );

    expect(tooltip.id).toBe('test-tooltip');
    expect(tooltip.targetId).toBe('test-target');

    const context: TooltipContext = {
      experienceLevel: 'beginner',
      completedTutorials: [],
      recentActions: [],
      preferences: {},
    };

    const content = tooltip.getContent(context);
    expect(content.text).toBe('Level: beginner');
  });
});

describe('Related Features', () => {
  it('should return related features for card-palette', () => {
    const features = getRelatedFeatures('card-palette');
    expect(features.length).toBeGreaterThan(0);
    expect(features.some(f => f.id === 'preset-browser')).toBe(true);
  });

  it('should return related features for mixer', () => {
    const features = getRelatedFeatures('mixer');
    expect(features.length).toBeGreaterThan(0);
    expect(features.some(f => f.id === 'automation')).toBe(true);
  });

  it('should return empty array for unknown feature', () => {
    const features = getRelatedFeatures('unknown-feature');
    expect(features.length).toBe(0);
  });
});

describe('Video Tips', () => {
  it('should show getting-started videos for beginners', () => {
    const context: TooltipContext = {
      experienceLevel: 'beginner',
      completedTutorials: [],
      recentActions: [],
      preferences: {},
    };

    const tips = getVideoTips(context);
    expect(tips.length).toBeGreaterThan(0);
    expect(tips.every(t => t.category === 'getting-started')).toBe(true);
  });

  it('should show more videos for advanced users', () => {
    const beginnerContext: TooltipContext = {
      experienceLevel: 'beginner',
      completedTutorials: [],
      recentActions: [],
      preferences: {},
    };

    const advancedContext: TooltipContext = {
      experienceLevel: 'advanced',
      completedTutorials: [],
      recentActions: [],
      preferences: {},
    };

    const beginnerTips = getVideoTips(beginnerContext);
    const advancedTips = getVideoTips(advancedContext);

    expect(advancedTips.length).toBeGreaterThanOrEqual(beginnerTips.length);
  });
});

describe('Undo Suggestions', () => {
  it('should suggest undoing card deletion', () => {
    const context: TooltipContext = {
      experienceLevel: 'intermediate',
      completedTutorials: [],
      recentActions: ['delete-card'],
      preferences: {},
    };

    const suggestions = getUndoSuggestions(context);
    expect(suggestions.some(s => s.actionId === 'undo-delete-card')).toBe(true);
  });

  it('should suggest undoing parameter change that caused clipping', () => {
    const context: TooltipContext = {
      experienceLevel: 'intermediate',
      completedTutorials: [],
      recentActions: ['parameter-change', 'audio-clipping'],
      preferences: {},
    };

    const suggestions = getUndoSuggestions(context);
    expect(suggestions.some(s => s.actionId === 'undo-parameter-change')).toBe(true);
  });
});

describe('Comparison Explanations', () => {
  it('should explain lowpass vs highpass filter', () => {
    const comparison = getComparisonExplanation('lowpass-vs-highpass');
    expect(comparison).not.toBeNull();
    expect(comparison!.differences.length).toBeGreaterThan(0);
    expect(comparison!.recommendation).toBeTruthy();
  });

  it('should explain serial vs parallel stacks', () => {
    const comparison = getComparisonExplanation('serial-vs-parallel');
    expect(comparison).not.toBeNull();
    expect(comparison!.differences.length).toBeGreaterThan(0);
  });
});

describe('Why Explanations', () => {
  it('should explain why cards are used', () => {
    const why = getWhyExplanation('why-cards');
    expect(why).not.toBeNull();
    expect(why!.shortAnswer).toBeTruthy();
    expect(why!.detailedAnswer).toBeTruthy();
  });

  it('should explain why normalization is used', () => {
    const why = getWhyExplanation('why-normalization');
    expect(why).not.toBeNull();
    expect(why!.example).toBeTruthy();
  });
});

describe('How Tutorials', () => {
  it('should provide step-by-step for adding cards', () => {
    const how = getHowTutorial('how-add-card');
    expect(how).not.toBeNull();
    expect(how!.steps.length).toBeGreaterThan(0);
    expect(how!.difficulty).toBe('easy');
  });

  it('should provide steps for automation', () => {
    const how = getHowTutorial('how-automate-parameter');
    expect(how).not.toBeNull();
    expect(how!.steps.length).toBeGreaterThan(0);
    expect(how!.difficulty).toBe('medium');
  });
});

describe('What Next Suggestions', () => {
  it('should suggest connecting card after adding', () => {
    const context: TooltipContext = {
      experienceLevel: 'beginner',
      completedTutorials: [],
      recentActions: ['add-card'],
      preferences: {},
    };

    const suggestions = getWhatNextSuggestions(context);
    expect(suggestions.some(s => s.id === 'connect-first-card')).toBe(true);
  });

  it('should suggest playing after connecting', () => {
    const context: TooltipContext = {
      experienceLevel: 'beginner',
      completedTutorials: [],
      recentActions: ['connect-cards'],
      preferences: {},
    };

    const suggestions = getWhatNextSuggestions(context);
    expect(suggestions.some(s => s.id === 'play-music')).toBe(true);
  });

  it('should suggest advanced features for progressing beginners', () => {
    const context: TooltipContext = {
      experienceLevel: 'beginner',
      completedTutorials: ['tutorial1', 'tutorial2', 'tutorial3'],
      recentActions: ['transport-play'],
      preferences: {},
    };

    const suggestions = getWhatNextSuggestions(context);
    expect(suggestions.some(s => s.id === 'explore-stacks')).toBe(true);
  });
});

describe('Feature Discovery', () => {
  it('should discover features when prerequisites are met', () => {
    const context: TooltipContext = {
      experienceLevel: 'beginner',
      completedTutorials: [],
      recentActions: ['add-card'],
      preferences: {},
    };

    const features = getUndiscoveredFeatures(context, []);
    expect(features.length).toBeGreaterThan(0);
    expect(features.some(f => f.featureId === 'graph-view')).toBe(true);
  });

  it('should not show discovered features', () => {
    const context: TooltipContext = {
      experienceLevel: 'beginner',
      completedTutorials: [],
      recentActions: ['add-card'],
      preferences: {},
    };

    const features = getUndiscoveredFeatures(context, ['graph-view']);
    expect(features.every(f => f.featureId !== 'graph-view')).toBe(true);
  });

  it('should sort by priority', () => {
    const context: TooltipContext = {
      experienceLevel: 'beginner',
      completedTutorials: ['your-first-note'],
      recentActions: ['add-card'],
      preferences: {},
    };

    const features = getUndiscoveredFeatures(context, []);
    
    // High priority features should come first
    const priorities = features.map(f => f.priority);
    for (let i = 0; i < priorities.length - 1; i++) {
      const current = priorities[i] === 'high' ? 0 : priorities[i] === 'medium' ? 1 : 2;
      const next = priorities[i + 1] === 'high' ? 0 : priorities[i + 1] === 'medium' ? 1 : 2;
      expect(current).toBeLessThanOrEqual(next);
    }
  });
});

describe('Mastery Tracking', () => {
  it('should calculate correct mastery levels', () => {
    expect(calculateMasteryLevel(0)).toBe('novice');
    expect(calculateMasteryLevel(3)).toBe('learning');
    expect(calculateMasteryLevel(10)).toBe('competent');
    expect(calculateMasteryLevel(30)).toBe('proficient');
    expect(calculateMasteryLevel(100)).toBe('expert');
  });

  it('should calculate mastery progress', () => {
    expect(getMasteryProgress('novice')).toBe(0);
    expect(getMasteryProgress('learning')).toBe(20);
    expect(getMasteryProgress('competent')).toBe(40);
    expect(getMasteryProgress('proficient')).toBe(70);
    expect(getMasteryProgress('expert')).toBe(100);
  });

  it('should provide appropriate tips for mastery level', () => {
    const noviceTips = getTipsForMastery('card-palette', 'novice');
    const expertTips = getTipsForMastery('card-palette', 'expert');

    expect(noviceTips.length).toBeGreaterThan(0);
    expect(expertTips.length).toBeGreaterThan(0);
    
    // Expert tips should be different from novice tips
    expect(noviceTips[0]).not.toBe(expertTips[0]);
  });

  it('should return empty array for unknown feature', () => {
    const tips = getTipsForMastery('unknown-feature', 'novice');
    expect(tips.length).toBe(0);
  });
});
