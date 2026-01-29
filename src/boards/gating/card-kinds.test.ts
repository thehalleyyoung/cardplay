/**
 * @fileoverview Card Kinds Classification Tests
 */

import { describe, it, expect } from 'vitest';
import {
  classifyCard,
  getAllowedKindsForControlLevel,
  isKindAllowed,
  isCardKindAllowed,
  type BoardCardKind,
} from './card-kinds';
import { createCardMeta } from '../../cards/card';
import type { ControlLevel } from '../types';

describe('classifyCard', () => {
  it('classifies core editor cards as manual', () => {
    const tracker = createCardMeta('tracker', 'Tracker', 'custom', {
      tags: ['editor', 'view'],
    });
    expect(classifyCard(tracker)).toEqual(['manual']);
  });

  it('classifies effect cards as manual', () => {
    const reverb = createCardMeta('reverb', 'Reverb', 'effects');
    expect(classifyCard(reverb)).toEqual(['manual']);
  });

  it('classifies generator cards as generative', () => {
    const melody = createCardMeta('melody-gen', 'Melody Generator', 'generators');
    expect(classifyCard(melody)).toEqual(['generative']);
  });

  it('classifies phrase-tagged generator as assisted', () => {
    const phraseGen = createCardMeta('phrase-gen', 'Phrase Library', 'generators', {
      tags: ['phrase', 'template'],
    });
    expect(classifyCard(phraseGen)).toEqual(['assisted']);
  });

  it('classifies harmony analysis as hint', () => {
    const harmony = createCardMeta('harmony-display', 'Harmony Display', 'analysis', {
      tags: ['harmony', 'chord'],
    });
    expect(classifyCard(harmony)).toEqual(['hint']);
  });

  it('classifies custom cards with AI tags as generative', () => {
    const aiCard = createCardMeta('ai-composer', 'AI Composer', 'custom', {
      tags: ['ai', 'generator'],
    });
    expect(classifyCard(aiCard)).toEqual(['generative']);
  });

  it('defaults to manual for unclassified cards', () => {
    const unknown = createCardMeta('unknown', 'Unknown', 'utilities');
    expect(classifyCard(unknown)).toEqual(['manual']);
  });
});

describe('getAllowedKindsForControlLevel', () => {
  it('full-manual allows only manual cards', () => {
    expect(getAllowedKindsForControlLevel('full-manual')).toEqual(['manual']);
  });

  it('manual-with-hints allows manual and hint cards', () => {
    expect(getAllowedKindsForControlLevel('manual-with-hints')).toEqual([
      'manual',
      'hint',
    ]);
  });

  it('assisted allows manual, hint, and assisted cards', () => {
    expect(getAllowedKindsForControlLevel('assisted')).toEqual([
      'manual',
      'hint',
      'assisted',
    ]);
  });

  it('collaborative allows manual through collaborative', () => {
    expect(getAllowedKindsForControlLevel('collaborative')).toEqual([
      'manual',
      'hint',
      'assisted',
      'collaborative',
    ]);
  });

  it('directed and generative allow all card kinds', () => {
    const allKinds: BoardCardKind[] = [
      'manual',
      'hint',
      'assisted',
      'collaborative',
      'generative',
    ];
    expect(getAllowedKindsForControlLevel('directed')).toEqual(allKinds);
    expect(getAllowedKindsForControlLevel('generative')).toEqual(allKinds);
  });
});

describe('isKindAllowed', () => {
  const testCases: Array<{
    kind: BoardCardKind;
    level: ControlLevel;
    allowed: boolean;
  }> = [
    { kind: 'manual', level: 'full-manual', allowed: true },
    { kind: 'hint', level: 'full-manual', allowed: false },
    { kind: 'assisted', level: 'full-manual', allowed: false },
    { kind: 'hint', level: 'manual-with-hints', allowed: true },
    { kind: 'assisted', level: 'manual-with-hints', allowed: false },
    { kind: 'assisted', level: 'assisted', allowed: true },
    { kind: 'generative', level: 'assisted', allowed: false },
    { kind: 'generative', level: 'directed', allowed: true },
  ];

  testCases.forEach(({ kind, level, allowed }) => {
    it(`${kind} is ${allowed ? 'allowed' : 'disallowed'} at ${level}`, () => {
      expect(isKindAllowed(kind, level)).toBe(allowed);
    });
  });
});

describe('isCardKindAllowed', () => {
  it('allows manual cards at all control levels', () => {
    const effect = createCardMeta('delay', 'Delay', 'effects');
    const levels: ControlLevel[] = [
      'full-manual',
      'manual-with-hints',
      'assisted',
      'collaborative',
      'directed',
      'generative',
    ];
    levels.forEach(level => {
      expect(isCardKindAllowed(effect, level)).toBe(true);
    });
  });

  it('blocks generative cards at manual control levels', () => {
    const generator = createCardMeta('bass-gen', 'Bass Generator', 'generators');
    expect(isCardKindAllowed(generator, 'full-manual')).toBe(false);
    expect(isCardKindAllowed(generator, 'manual-with-hints')).toBe(false);
    expect(isCardKindAllowed(generator, 'assisted')).toBe(false);
  });

  it('allows generative cards at directed/generative levels', () => {
    const generator = createCardMeta('bass-gen', 'Bass Generator', 'generators');
    expect(isCardKindAllowed(generator, 'directed')).toBe(true);
    expect(isCardKindAllowed(generator, 'generative')).toBe(true);
  });

  it('allows hint cards at manual-with-hints and above', () => {
    const harmony = createCardMeta('harmony', 'Harmony Display', 'analysis', {
      tags: ['harmony'],
    });
    expect(isCardKindAllowed(harmony, 'full-manual')).toBe(false);
    expect(isCardKindAllowed(harmony, 'manual-with-hints')).toBe(true);
    expect(isCardKindAllowed(harmony, 'assisted')).toBe(true);
  });
});
