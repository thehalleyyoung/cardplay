/**
 * @fileoverview Tests for Core Card to UI Card Adapter (Change 295)
 */

import { describe, it, expect, vi } from 'vitest';
import {
  mapPortTypeToUI,
  mapCardPortToUI,
  coreCardToUI,
  createUICardFromCore,
} from './core-card-adapter';
import type { Card as CoreCard, CardPort } from '../cards/card';
import type { PortType } from '../canon/port-types';

// ============================================================================
// MOCK CORE CARD
// ============================================================================

function createMockCoreCard(overrides?: Partial<CoreCard>): CoreCard {
  return {
    meta: {
      id: 'test-card',
      name: 'Test Card',
      description: 'A test card',
      category: 'generator',
      version: '1.0.0',
      ...overrides?.meta,
    },
    inputs: overrides?.inputs || [],
    outputs: overrides?.outputs || [],
    apply: () => ({} as never),
    ...overrides,
  } as CoreCard;
}

function createMockPort(type: PortType, id: string = 'port-1'): CardPort {
  return {
    id,
    name: id.replace(/-/g, ' '),
    type: type as string,
  };
}

// ============================================================================
// PORT MAPPING TESTS
// ============================================================================

describe('mapPortTypeToUI', () => {
  it('maps canonical audio/midi/control/trigger types directly', () => {
    expect(mapPortTypeToUI('audio')).toBe('audio');
    expect(mapPortTypeToUI('midi')).toBe('midi');
    expect(mapPortTypeToUI('control')).toBe('control');
    expect(mapPortTypeToUI('trigger')).toBe('trigger');
  });

  it('maps notes to midi', () => {
    expect(mapPortTypeToUI('notes')).toBe('midi');
  });

  it('maps gate/clock/transport to trigger', () => {
    expect(mapPortTypeToUI('gate')).toBe('trigger');
    expect(mapPortTypeToUI('clock')).toBe('trigger');
    expect(mapPortTypeToUI('transport')).toBe('trigger');
  });

  it('maps namespaced extensions to data', () => {
    expect(mapPortTypeToUI('mypack:custom-type' as PortType)).toBe('data');
    expect(mapPortTypeToUI('user:special' as PortType)).toBe('data');
  });

  it('defaults unknown types to data with warning', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(mapPortTypeToUI('unknown' as PortType)).toBe('data');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Unknown port type 'unknown'")
    );
    consoleSpy.mockRestore();
  });
});

describe('mapCardPortToUI', () => {
  it('maps port with all properties', () => {
    const port = createMockPort('audio', 'audio-in');
    const result = mapCardPortToUI(port, 'input');
    
    expect(result).toEqual({
      id: 'audio-in',
      name: 'audio in',
      type: 'audio',
      direction: 'input',
    });
  });

  it('maps output ports', () => {
    const port = createMockPort('midi', 'midi-out');
    const result = mapCardPortToUI(port, 'output');
    
    expect(result.direction).toBe('output');
  });

  it('handles ports without explicit name', () => {
    const port: CardPort = { id: 'test-port', type: 'control' };
    const result = mapCardPortToUI(port, 'input');
    
    expect(result.name).toBe('test-port');
  });
});

// ============================================================================
// CARD ADAPTER TESTS
// ============================================================================

describe('coreCardToUI', () => {
  it('converts basic core card to UI config', () => {
    const card = createMockCoreCard();
    const config = coreCardToUI(card);
    
    expect(config.id).toBe('test-card');
    expect(config.type).toBe('generator');
    expect(config.title).toBe('Test Card');
    expect(config.description).toBe('A test card');
  });

  it('maps card ports to UI ports', () => {
    const card = createMockCoreCard({
      inputs: [createMockPort('audio', 'in-1'), createMockPort('midi', 'in-2')],
      outputs: [createMockPort('audio', 'out-1')],
    });
    
    const config = coreCardToUI(card);
    
    expect(config.inputs).toHaveLength(2);
    expect(config.inputs[0]).toMatchObject({
      id: 'in-1',
      type: 'audio',
      direction: 'input',
    });
    expect(config.inputs[1]).toMatchObject({
      id: 'in-2',
      type: 'midi',
      direction: 'input',
    });
    
    expect(config.outputs).toHaveLength(1);
    expect(config.outputs[0]).toMatchObject({
      id: 'out-1',
      type: 'audio',
      direction: 'output',
    });
  });

  it('applies size option', () => {
    const card = createMockCoreCard();
    const config = coreCardToUI(card, { size: 'large' });
    
    expect(config.size).toBe('large');
  });

  it('applies style option', () => {
    const card = createMockCoreCard();
    const config = coreCardToUI(card, { style: 'minimal' });
    
    expect(config.style).toBe('minimal');
  });

  it('uses default visual properties', () => {
    const card = createMockCoreCard();
    const config = coreCardToUI(card);
    
    expect(config.size).toBe('medium');
    expect(config.style).toBe('default');
    expect(config.draggable).toBe(true);
    expect(config.resizable).toBe(true);
    expect(config.minimizable).toBe(true);
    expect(config.closable).toBe(true);
  });

  it('uses card color if provided', () => {
    const card = createMockCoreCard({
      meta: {
        id: 'test',
        name: 'Test',
        description: 'Test',
        category: 'effect',
        version: '1.0.0',
        color: '#ff0000',
      },
    });
    
    const config = coreCardToUI(card);
    expect(config.color).toBe('#ff0000');
  });

  it('uses default color if none provided', () => {
    const card = createMockCoreCard();
    const config = coreCardToUI(card);
    
    expect(config.color).toBe('#4a90e2');
  });
});

describe('createUICardFromCore', () => {
  it('creates UI card with position', () => {
    const card = createMockCoreCard();
    const result = createUICardFromCore(card, { x: 100, y: 200 });
    
    expect(result.x).toBe(100);
    expect(result.y).toBe(200);
    expect(result.id).toBe('test-card');
  });

  it('uses default position if not provided', () => {
    const card = createMockCoreCard();
    const result = createUICardFromCore(card);
    
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it('passes through all config properties', () => {
    const card = createMockCoreCard();
    const result = createUICardFromCore(card, { size: 'small', style: 'rounded' });
    
    expect(result.size).toBe('small');
    expect(result.style).toBe('rounded');
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Core-to-UI adapter integration', () => {
  it('handles cards with no ports', () => {
    const card = createMockCoreCard({
      inputs: [],
      outputs: [],
    });
    
    const config = coreCardToUI(card);
    
    expect(config.inputs).toEqual([]);
    expect(config.outputs).toEqual([]);
  });

  it('handles cards with mixed port types', () => {
    const card = createMockCoreCard({
      inputs: [
        createMockPort('audio', 'audio-in'),
        createMockPort('midi', 'midi-in'),
        createMockPort('control', 'ctrl-in'),
        createMockPort('trigger', 'trig-in'),
      ],
      outputs: [
        createMockPort('audio', 'audio-out'),
        createMockPort('notes', 'notes-out'),
        createMockPort('gate', 'gate-out'),
      ],
    });
    
    const config = coreCardToUI(card);
    
    expect(config.inputs).toHaveLength(4);
    expect(config.outputs).toHaveLength(3);
    
    // Verify types are mapped correctly
    expect(config.inputs.map(p => p.type)).toEqual(['audio', 'midi', 'control', 'trigger']);
    expect(config.outputs.map(p => p.type)).toEqual(['audio', 'midi', 'trigger']);
  });

  it('preserves card identity through conversion', () => {
    const cardId = 'unique-card-123';
    const card = createMockCoreCard({
      meta: {
        id: cardId,
        name: 'Unique Card',
        description: 'Test',
        category: 'utility',
        version: '1.0.0',
      },
    });
    
    const config = coreCardToUI(card);
    
    expect(config.id).toBe(cardId);
    expect(config.title).toBe('Unique Card');
    expect(config.type).toBe('utility');
  });
});
