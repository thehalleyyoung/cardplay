# Extension Development Guide

This guide covers everything you need to build custom extensions for CardPlay.

## Overview

CardPlay's extension system allows you to add:
- **Custom Cards** - New instrument/effect/tool types
- **Custom Decks** - New panel/editor types
- **Custom Generators** - New music generation algorithms
- **Custom Effects** - New audio processing units
- **Custom Boards** - Complete board configurations
- **Prolog KB Extensions** - New music theory predicates

All extensions are **local**, **sandboxed**, and **secure** - no network access, no file system access beyond designated folders.

## Getting Started

### Extension Structure

```
my-extension/
├── manifest.json       # Extension metadata
├── index.ts           # Main entry point
├── card.ts            # Card definitions (optional)
├── deck.ts            # Deck definitions (optional)
├── generator.ts       # Generator logic (optional)
└── prolog/            # Prolog predicates (optional)
    └── scales.pl
```

### Manifest Format

```json
{
  "id": "my-custom-extension",
  "name": "My Custom Extension",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Adds custom drum machine card",
  "cardplayVersion": ">=1.0.0",
  "provides": ["card", "generator"],
  "permissions": [],
  "entry": "index.ts"
}
```

## Creating Custom Cards

### Basic Card Structure

```typescript
import { CardDefinition, CardKind } from '@cardplay/extensions';

export const myCard: CardDefinition = {
  kind: 'instrument' as CardKind,
  id: 'my-drum-machine',
  name: 'My Drum Machine',
  category: 'drums',
  
  // Render function (DOM-based)
  render(container: HTMLElement, state: any) {
    const ui = document.createElement('div');
    ui.className = 'my-drum-machine';
    ui.innerHTML = `
      <h3>Drum Machine</h3>
      <button data-action="play">Play</button>
    `;
    
    ui.querySelector('[data-action="play"]')?.addEventListener('click', () => {
      state.trigger('drum-hit');
    });
    
    container.appendChild(ui);
    
    return {
      update(newState: any) {
        // Update UI when state changes
      },
      destroy() {
        // Cleanup
        container.removeChild(ui);
      }
    };
  },
  
  // Audio processing
  audioNode(context: AudioContext) {
    // Return AudioNode for processing chain
    const gainNode = context.createGain();
    return gainNode;
  },
  
  // Parameter definitions
  parameters: {
    volume: { min: 0, max: 1, default: 0.7 },
    pitch: { min: -12, max: 12, default: 0 }
  }
};
```

### Card Types

**Instrument Cards:**
```typescript
{
  kind: 'instrument',
  // Generates audio from MIDI input
  audioNode(context: AudioContext) { /* ... */ }
}
```

**Effect Cards:**
```typescript
{
  kind: 'effect',
  // Processes audio signal
  audioNode(context: AudioContext) { /* ... */ }
}
```

**Tool Cards:**
```typescript
{
  kind: 'tool',
  // Utility/helper (no audio processing)
  render(container: HTMLElement, state: any) { /* ... */ }
}
```

## Creating Custom Decks

### Deck Definition

```typescript
import { DeckDefinition, DeckType } from '@cardplay/extensions';

export const myDeck: DeckDefinition = {
  type: 'my-scale-explorer' as DeckType,
  name: 'Scale Explorer',
  category: 'composition',
  
  // Render deck UI
  render(container: HTMLElement, context: DeckContext) {
    const ui = document.createElement('div');
    ui.className = 'scale-explorer';
    
    // Build UI
    const scaleSelect = document.createElement('select');
    ['major', 'minor', 'dorian', 'phrygian'].forEach(scale => {
      const option = document.createElement('option');
      option.value = scale;
      option.textContent = scale;
      scaleSelect.appendChild(option);
    });
    
    scaleSelect.addEventListener('change', (e) => {
      context.emit('scale-changed', { scale: e.target.value });
    });
    
    ui.appendChild(scaleSelect);
    container.appendChild(ui);
    
    return {
      update(newContext: DeckContext) {
        // Handle context updates
      },
      destroy() {
        container.removeChild(ui);
      }
    };
  },
  
  // Deck capabilities
  capabilities: {
    canContainCards: false,
    canBeResized: true,
    canBeMinimized: true
  }
};
```

## Creating Custom Generators

### Generator Definition

```typescript
import { GeneratorDefinition, MusicEvent } from '@cardplay/extensions';

export const euclideanGenerator: GeneratorDefinition = {
  id: 'euclidean-rhythm',
  name: 'Euclidean Rhythm Generator',
  category: 'rhythm',
  
  // Generator function
  generate(params: GeneratorParams): MusicEvent[] {
    const { steps, pulses, rotation, note, velocity } = params;
    
    // Implement Euclidean rhythm algorithm
    const pattern = generateEuclideanPattern(steps, pulses, rotation);
    
    // Convert to music events
    const events: MusicEvent[] = [];
    pattern.forEach((hit, i) => {
      if (hit) {
        events.push({
          kind: 'note',
          start: i * (4 / steps), // Ticks
          duration: 0.25,
          payload: { note, velocity }
        });
      }
    });
    
    return events;
  },
  
  // Parameter schema
  parameters: {
    steps: { type: 'integer', min: 1, max: 32, default: 16 },
    pulses: { type: 'integer', min: 1, max: 32, default: 4 },
    rotation: { type: 'integer', min: 0, max: 31, default: 0 },
    note: { type: 'integer', min: 0, max: 127, default: 60 },
    velocity: { type: 'integer', min: 0, max: 127, default: 100 }
  }
};

function generateEuclideanPattern(steps: number, pulses: number, rotation: number): boolean[] {
  // Bjorklund's algorithm
  const pattern: boolean[] = new Array(steps).fill(false);
  const slope = pulses / steps;
  
  for (let i = 0; i < steps; i++) {
    const index = Math.floor(i * slope);
    pattern[(i + rotation) % steps] = index < pulses;
  }
  
  return pattern;
}
```

## Creating Custom Audio Effects

### Effect Definition

```typescript
import { EffectDefinition } from '@cardplay/extensions';

export const myReverb: EffectDefinition = {
  id: 'my-reverb',
  name: 'My Reverb',
  category: 'spatial',
  
  // Create audio processing graph
  createNode(context: AudioContext): AudioNode {
    // Create convolver for reverb
    const convolver = context.createConvolver();
    
    // Create impulse response
    const length = context.sampleRate * 2; // 2 seconds
    const impulse = context.createBuffer(2, length, context.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (context.sampleRate * 0.5));
      }
    }
    
    convolver.buffer = impulse;
    return convolver;
  },
  
  parameters: {
    mix: { min: 0, max: 1, default: 0.3 },
    decay: { min: 0.1, max: 10, default: 2 }
  }
};
```

## Adding Prolog Predicates

### Prolog KB Extension

```prolog
% Define custom microtonal scales
microtonal_scale('bohlen-pierce', [
  0, 146, 293, 439, 585, 732, 878, 1024, 1170, 1317, 1463, 1609, 1755
]).

microtonal_scale('alpha', [0, 78, 156, 234, 312, 390, 468, 546, 624, 702, 780, 858, 936]).

microtonal_scale('beta', [0, 64, 128, 192, 256, 320, 384, 448, 512]).

microtonal_scale('gamma', [0, 36, 72, 108, 144, 180, 216, 252, 288, 324]).

% Query microtonal scales
:- query(microtonal_scale(ScaleName, Cents), [ScaleName, Cents]).
```

### TypeScript Integration

```typescript
import { PrologKBExtension } from '@cardplay/extensions';

export const microtonalScales: PrologKBExtension = {
  id: 'microtonal-scales',
  name: 'Microtonal Scale Library',
  
  // Prolog source
  source: `
    microtonal_scale('bohlen-pierce', [0, 146, 293, ...]).
    microtonal_scale('alpha', [0, 78, 156, ...]).
  `,
  
  // TypeScript helpers
  queries: {
    getScale(scaleName: string): Promise<number[]> {
      return this.query(`microtonal_scale('${scaleName}', Cents)`)
        .then(results => results[0]?.Cents || []);
    },
    
    listScales(): Promise<string[]> {
      return this.query('microtonal_scale(Name, _)')
        .then(results => results.map(r => r.Name));
    }
  }
};
```

## Extension Registration

### Main Entry Point

```typescript
// index.ts
import { ExtensionAPI } from '@cardplay/extensions';
import { myCard } from './card';
import { myDeck } from './deck';
import { euclideanGenerator } from './generator';
import { microtonalScales } from './prolog';

export default function initialize(api: ExtensionAPI) {
  // Register card
  api.registerCard(myCard);
  
  // Register deck
  api.registerDeck(myDeck);
  
  // Register generator
  api.registerGenerator(euclideanGenerator);
  
  // Register Prolog KB
  api.registerPrologKB(microtonalScales);
  
  console.log('Extension loaded successfully!');
}
```

## Testing Extensions

### Unit Testing

```typescript
import { describe, it, expect } from 'vitest';
import { euclideanGenerator } from './generator';

describe('Euclidean Generator', () => {
  it('generates correct number of events', () => {
    const events = euclideanGenerator.generate({
      steps: 16,
      pulses: 4,
      rotation: 0,
      note: 60,
      velocity: 100
    });
    
    expect(events).toHaveLength(4);
  });
  
  it('respects parameter bounds', () => {
    const events = euclideanGenerator.generate({
      steps: 8,
      pulses: 3,
      rotation: 0,
      note: 60,
      velocity: 100
    });
    
    events.forEach(event => {
      expect(event.payload.note).toBeGreaterThanOrEqual(0);
      expect(event.payload.note).toBeLessThanOrEqual(127);
    });
  });
});
```

### Integration Testing

```typescript
import { loadExtension } from '@cardplay/extensions';

async function testExtension() {
  // Load extension
  const extension = await loadExtension('my-extension');
  
  // Test card registration
  const card = extension.getCard('my-drum-machine');
  expect(card).toBeDefined();
  
  // Test generator
  const generator = extension.getGenerator('euclidean-rhythm');
  const events = generator.generate({ steps: 8, pulses: 3 });
  expect(events).toHaveLength(3);
  
  console.log('All tests passed!');
}
```

## Best Practices

### Performance

1. **Minimize DOM operations** - Batch updates, use document fragments
2. **Efficient audio nodes** - Reuse nodes, avoid creating/destroying frequently
3. **Lazy initialization** - Load heavy resources only when needed
4. **Memory management** - Clean up event listeners and resources

### User Experience

1. **Clear naming** - Use descriptive IDs and names
2. **Helpful defaults** - Set sensible default parameter values
3. **Error handling** - Gracefully handle invalid inputs
4. **Visual feedback** - Show loading/processing states

### Code Quality

1. **Type safety** - Use TypeScript throughout
2. **Documentation** - Comment complex algorithms
3. **Testing** - Write unit tests for core logic
4. **Validation** - Validate all user inputs

## Security & Sandboxing

### Allowed Operations

✅ DOM manipulation within container
✅ Audio API usage
✅ Event emission/listening
✅ Parameter reading/writing
✅ Generator execution

### Restricted Operations

❌ Network access
❌ File system access
❌ localStorage/cookies
❌ Native code execution
❌ Accessing other extensions

## Publishing Extensions

### Packaging

```bash
# Create extension package
npm run build
npm run package

# Creates: my-extension.cardplay-ext
```

### Distribution

Extensions can be shared as:
- `.cardplay-ext` files (recommended)
- Git repositories
- NPM packages (advanced)

### Versioning

Follow semantic versioning:
- **Major** - Breaking API changes
- **Minor** - New features, backward compatible
- **Patch** - Bug fixes

## Example Extensions

See `/examples/extensions/` for complete examples:

1. **Euclidean Rhythm Generator** - Algorithmic rhythm generation
2. **Microtonal Scale Explorer** - Non-12TET scale support
3. **Custom Visualizer Deck** - Waveform/spectrum analysis
4. **Modal Harmony KB** - Extended Prolog predicates

## API Reference

### Extension API

```typescript
interface ExtensionAPI {
  // Card registration
  registerCard(card: CardDefinition): void;
  
  // Deck registration
  registerDeck(deck: DeckDefinition): void;
  
  // Generator registration
  registerGenerator(generator: GeneratorDefinition): void;
  
  // Effect registration
  registerEffect(effect: EffectDefinition): void;
  
  // Board registration
  registerBoard(board: BoardDefinition): void;
  
  // Prolog KB registration
  registerPrologKB(kb: PrologKBExtension): void;
  
  // Utility
  getVersion(): string;
  getCapabilities(): string[];
}
```

### Context Objects

```typescript
interface DeckContext {
  activeStreamId: string | null;
  activeClipId: string | null;
  selection: string[];
  
  emit(event: string, data: any): void;
  subscribe(event: string, handler: Function): () => void;
}

interface GeneratorParams {
  [key: string]: number | string | boolean;
}
```

## Troubleshooting

### Extension Won't Load

**Check:**
- Manifest is valid JSON
- Entry point exists
- All dependencies are included
- Version compatibility

### Card Not Rendering

**Check:**
- render() function returns cleanup object
- DOM operations are valid
- Container element exists
- CSS classes don't conflict

### Generator Not Working

**Check:**
- Events have required fields (kind, start, duration)
- Parameters match schema
- Return type is MusicEvent[]

## Resources

- [API Documentation](/docs/api/)
- [Example Extensions](/examples/extensions/)
- [Type Definitions](/src/extensions/types.ts)
- [Extension Registry](/src/extensions/registry.ts)

## Support

Questions? Check:
- GitHub Issues
- Community Forum
- Example Code
- API Documentation
