/**
 * @fileoverview Tests for Prolog-generated HostAction validation (Change 372)
 * 
 * Ensures that HostActions produced by Prolog queries (like spec_autofix/3)
 * are valid and can be applied cleanly to the system.
 * 
 * @module @cardplay/ai/theory/prolog-host-actions.test
 */

import { describe, it, expect } from 'vitest';
import type { HostAction } from './host-actions';
import { applyHostAction } from './apply-host-action';
import { createMusicSpec, type MusicSpec } from './music-spec';

// Mock Prolog query results
const mockPrologSuggestions: Array<{ action: string; confidence: number; reasons: string[] }> = [
  {
    action: 'set_key(C, major)',
    confidence: 0.9,
    reasons: ['Strong tonal profile matches C major', 'Pitch class distribution favors C major'],
  },
  {
    action: 'set_meter(4, 4)',
    confidence: 0.85,
    reasons: ['Regular periodicity detected'],
  },
  {
    action: 'add_constraint(key, C, major)',
    confidence: 0.8,
    reasons: ['User prefers explicit key constraint'],
  },
  {
    action: 'set_tempo(120)',
    confidence: 0.7,
    reasons: ['Tempo analysis suggests 120 BPM'],
  },
];

/**
 * Parse a simple Prolog action term into a HostAction.
 * This is a simplified parser for testing purposes.
 */
function parsePrologAction(actionStr: string, confidence: number, reasons: string[]): HostAction | null {
  const setKeyMatch = actionStr.match(/set_key\(([A-G][b#]?),\s*(\w+)\)/);
  if (setKeyMatch) {
    return {
      action: 'set_key',
      root: setKeyMatch[1] as any,
      mode: setKeyMatch[2] as any,
      confidence,
      reasons,
    };
  }

  const setMeterMatch = actionStr.match(/set_meter\((\d+),\s*(\d+)\)/);
  if (setMeterMatch) {
    return {
      action: 'set_meter',
      numerator: parseInt(setMeterMatch[1], 10),
      denominator: parseInt(setMeterMatch[2], 10),
      confidence,
      reasons,
    };
  }

  const addConstraintMatch = actionStr.match(/add_constraint\((\w+),\s*([^)]+)\)/);
  if (addConstraintMatch) {
    const type = addConstraintMatch[1];
    const params = addConstraintMatch[2].split(',').map(s => s.trim());
    
    if (type === 'key' && params.length >= 2) {
      return {
        action: 'add_constraint',
        constraint: {
          type: 'key',
          hard: true,
          weight: 1.0,
          root: params[0] as any,
          mode: params[1] as any,
        },
        confidence,
        reasons,
      };
    }
  }

  const setTempoMatch = actionStr.match(/set_tempo\((\d+)\)/);
  if (setTempoMatch) {
    return {
      action: 'set_tempo',
      bpm: parseInt(setTempoMatch[1], 10),
      confidence,
      reasons,
    };
  }

  return null;
}

describe('Prolog HostAction Generation', () => {
  it('parses set_key action from Prolog', () => {
    const action = parsePrologAction('set_key(C, major)', 0.9, ['test reason']);
    
    expect(action).toBeDefined();
    expect(action?.action).toBe('set_key');
    if (action?.action === 'set_key') {
      expect(action.root).toBe('C');
      expect(action.mode).toBe('major');
      expect(action.confidence).toBe(0.9);
    }
  });

  it('parses set_meter action from Prolog', () => {
    const action = parsePrologAction('set_meter(4, 4)', 0.85, ['test reason']);
    
    expect(action).toBeDefined();
    expect(action?.action).toBe('set_meter');
    if (action?.action === 'set_meter') {
      expect(action.numerator).toBe(4);
      expect(action.denominator).toBe(4);
      expect(action.confidence).toBe(0.85);
    }
  });

  it('parses add_constraint action from Prolog', () => {
    const action = parsePrologAction('add_constraint(key, C, major)', 0.8, ['test reason']);
    
    expect(action).toBeDefined();
    expect(action?.action).toBe('add_constraint');
    if (action?.action === 'add_constraint') {
      expect(action.constraint.type).toBe('key');
      expect(action.confidence).toBe(0.8);
    }
  });

  it('applies parsed Prolog actions to a spec', () => {
    const initialSpec = createMusicSpec({
      keyRoot: 'D',
      mode: 'dorian',
      meterNumerator: 4,
      meterDenominator: 4,
      tempo: 100,
      tonalityModel: 'ks_profile',
      style: 'jazz',
      culture: 'western',
      constraints: [],
    });

    // Parse a Prolog-generated action
    const action = parsePrologAction('set_key(C, major)', 0.9, ['Detected C major tonality']);
    expect(action).toBeDefined();

    // Apply it (this tests that the action is structurally valid)
    if (action) {
      const result = applyHostAction(action, {
        controlLevel: 'expert',
        toolMode: 'live',
        currentSpec: initialSpec,
        onSpecUpdate: () => {}, // Provide empty callback
      });
      
      expect(result.success).toBe(true);
      expect(result.updatedSpec).toBeDefined();
      if (result.updatedSpec && action.action === 'set_key') {
        expect(result.updatedSpec.keyRoot).toBe('C');
        expect(result.updatedSpec.mode).toBe('major');
      }
    }
  });

  it('validates confidence is in range 0..1', () => {
    const action = parsePrologAction('set_key(C, major)', 0.9, ['test']);
    expect(action?.confidence).toBeGreaterThanOrEqual(0);
    expect(action?.confidence).toBeLessThanOrEqual(1);
  });

  it('includes reasons array', () => {
    const reasons = ['Strong tonal profile', 'User preference'];
    const action = parsePrologAction('set_key(C, major)', 0.9, reasons);
    expect(action?.reasons).toEqual(reasons);
  });

  it('handles all mock Prolog suggestions', () => {
    const actions = mockPrologSuggestions.map(s => 
      parsePrologAction(s.action, s.confidence, s.reasons)
    );

    // All should parse successfully
    expect(actions.every(a => a !== null)).toBe(true);

    // All should have valid confidence
    expect(actions.every(a => a && a.confidence >= 0 && a.confidence <= 1)).toBe(true);

    // All should have reasons
    expect(actions.every(a => a && Array.isArray(a.reasons) && a.reasons.length > 0)).toBe(true);
  });

  it('applies multiple Prolog actions in sequence', () => {
    let spec = createMusicSpec({
      keyRoot: 'C',
      mode: 'major',
      meterNumerator: 4,
      meterDenominator: 4,
      tempo: 120,
      tonalityModel: 'ks_profile',
      style: 'pop',
      culture: 'western',
      constraints: [],
    });

    // Apply key change
    const keyAction = parsePrologAction('set_key(D, minor)', 0.9, ['Detected D minor']);
    if (keyAction) {
      const result = applyHostAction(keyAction, {
        controlLevel: 'expert',
        toolMode: 'live',
        currentSpec: spec,
        onSpecUpdate: (updated) => { spec = updated; },
      });
      expect(result.success).toBe(true);
      expect(result.updatedSpec).toBeDefined();
      if (result.updatedSpec) {
        spec = result.updatedSpec;
      }
    }

    expect(spec.keyRoot).toBe('D');
    expect(spec.mode).toBe('minor');

    // Apply tempo change  
    const tempoAction = parsePrologAction('set_tempo(140)', 0.8, ['Detected faster tempo']);
    if (tempoAction) {
      const result = applyHostAction(tempoAction, {
        controlLevel: 'expert',
        toolMode: 'live',
        currentSpec: spec,
        onSpecUpdate: (updated) => { spec = updated; },
      });
      expect(result.success).toBe(true);
      expect(result.updatedSpec).toBeDefined();
      if (result.updatedSpec) {
        spec = result.updatedSpec;
      }
    }

    expect(spec.tempo).toBe(140);
  });

  it('validates that unknown action types are handled gracefully', () => {
    const unknownAction = parsePrologAction('unknown_action(foo)', 0.5, ['test']);
    expect(unknownAction).toBeNull();
  });
});
