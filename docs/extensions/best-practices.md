# Extension Development Best Practices

Guidelines for creating high-quality, performant, and maintainable CardPlay extensions.

## Code Quality

### Type Safety
```typescript
// ✅ Good: Full type safety
export const myCard: CardDefinition = {
  kind: 'instrument',
  id: 'my-synth',
  parameters: {
    volume: { min: 0, max: 1, default: 0.7, type: 'number' }
  }
};

// ❌ Bad: Loose typing
export const myCard = {
  kind: 'instrument',
  parameters: { volume: {} }
};
```

### Error Handling
```typescript
// ✅ Good: Graceful error handling
try {
  const events = generator.generate(params);
  return events;
} catch (error) {
  console.error('Generation failed:', error);
  return []; // Return empty array, don't crash
}

// ❌ Bad: Unhandled errors
const events = generator.generate(params); // Might throw
return events;
```

### Resource Cleanup
```typescript
// ✅ Good: Proper cleanup
render(container: HTMLElement) {
  const listeners: Array<() => void> = [];
  
  const button = document.createElement('button');
  const handler = () => console.log('clicked');
  button.addEventListener('click', handler);
  listeners.push(() => button.removeEventListener('click', handler));
  
  return {
    destroy() {
      listeners.forEach(cleanup => cleanup());
    }
  };
}

// ❌ Bad: Memory leaks
render(container: HTMLElement) {
  const button = document.createElement('button');
  button.addEventListener('click', () => console.log('clicked'));
  // No cleanup!
}
```

## Performance

### DOM Operations
```typescript
// ✅ Good: Batch DOM updates
const fragment = document.createDocumentFragment();
items.forEach(item => {
  const el = document.createElement('div');
  el.textContent = item;
  fragment.appendChild(el);
});
container.appendChild(fragment);

// ❌ Bad: Individual DOM updates
items.forEach(item => {
  const el = document.createElement('div');
  el.textContent = item;
  container.appendChild(el); // Triggers reflow each time
});
```

### Audio Node Reuse
```typescript
// ✅ Good: Reuse audio nodes
class MyEffect {
  private gainNode: GainNode;
  
  constructor(context: AudioContext) {
    this.gainNode = context.createGain();
  }
  
  setVolume(value: number) {
    this.gainNode.gain.value = value; // Reuse existing node
  }
}

// ❌ Bad: Recreate nodes
function setVolume(context: AudioContext, value: number) {
  const gain = context.createGain(); // Creates new node every time!
  gain.gain.value = value;
  return gain;
}
```

### Lazy Loading
```typescript
// ✅ Good: Load heavy resources on demand
async function loadSamples() {
  if (!this.samplesLoaded) {
    this.samples = await fetch('/samples.json').then(r => r.json());
    this.samplesLoaded = true;
  }
  return this.samples;
}

// ❌ Bad: Load everything upfront
const samples = await fetch('/samples.json').then(r => r.json());
```

## User Experience

### Sensible Defaults
```typescript
// ✅ Good: Helpful defaults
parameters: {
  volume: { min: 0, max: 1, default: 0.7 }, // 70% volume
  attack: { min: 0, max: 1, default: 0.01 }, // 10ms attack
  release: { min: 0, max: 2, default: 0.1 } // 100ms release
}

// ❌ Bad: Unintuitive defaults
parameters: {
  volume: { min: 0, max: 1, default: 0 }, // Silent!
  attack: { min: 0, max: 1, default: 1 }, // Very slow
}
```

### Clear Feedback
```typescript
// ✅ Good: Show loading states
render(container) {
  container.innerHTML = '<div class="loading">Generating...</div>';
  
  generator.generate(params).then(events => {
    container.innerHTML = `<div>Generated ${events.length} notes</div>`;
  });
}

// ❌ Bad: No feedback
render(container) {
  generator.generate(params).then(events => {
    // User doesn't know anything is happening
    container.innerHTML = `<div>${events.length} notes</div>`;
  });
}
```

### Input Validation
```typescript
// ✅ Good: Validate and clamp
function setParameter(name: string, value: number) {
  const param = this.parameters[name];
  if (!param) throw new Error(`Unknown parameter: ${name}`);
  
  // Clamp to valid range
  const clamped = Math.max(param.min, Math.min(param.max, value));
  this.values[name] = clamped;
}

// ❌ Bad: No validation
function setParameter(name: string, value: number) {
  this.values[name] = value; // Might be out of range!
}
```

## Security

### No Network Access
```typescript
// ✅ Good: Local operations only
function generatePattern() {
  return localAlgorithm(params); // Pure function
}

// ❌ Bad: Network dependency
async function generatePattern() {
  return await fetch('https://api.example.com/generate'); // Not allowed!
}
```

### Sandbox Compliance
```typescript
// ✅ Good: Only access provided APIs
render(container: HTMLElement, context: DeckContext) {
  context.emit('event', data); // Use provided context
}

// ❌ Bad: Access global state
render(container: HTMLElement) {
  window.globalState = {}; // Not allowed!
  localStorage.setItem('key', 'value'); // Not allowed!
}
```

## Testing

### Unit Tests
```typescript
import { describe, it, expect } from 'vitest';

describe('Euclidean Generator', () => {
  it('generates correct pattern', () => {
    const events = euclideanGenerator.generate({
      steps: 8,
      pulses: 3
    });
    
    expect(events).toHaveLength(3);
    expect(events[0].kind).toBe('note');
  });
  
  it('handles edge cases', () => {
    const events = euclideanGenerator.generate({
      steps: 0,
      pulses: 0
    });
    
    expect(events).toHaveLength(0);
  });
});
```

### Integration Tests
```typescript
describe('Card Integration', () => {
  it('renders without errors', () => {
    const container = document.createElement('div');
    const instance = myCard.render(container, {});
    
    expect(container.children.length).toBeGreaterThan(0);
    
    instance.destroy();
  });
});
```

## Documentation

### Clear API Docs
```typescript
/**
 * Generates a Euclidean rhythm pattern.
 * 
 * @param steps - Total number of steps in the pattern (1-32)
 * @param pulses - Number of note hits to distribute (1-32)
 * @param rotation - Rotation offset (0-31)
 * @returns Array of music events representing the pattern
 * 
 * @example
 * ```ts
 * const events = generate({ steps: 16, pulses: 4, rotation: 0 });
 * // Returns 4 evenly-spaced notes across 16 steps
 * ```
 */
export function generate(params: EuclideanParams): MusicEvent[] {
  // Implementation...
}
```

### Usage Examples
```typescript
// Include examples in README
/**
 * # My Extension
 * 
 * ## Usage
 * 
 * ```typescript
 * import { MyCard } from 'my-extension';
 * 
 * // Create instance
 * const card = MyCard.create({
 *   volume: 0.8
 * });
 * 
 * // Generate pattern
 * const events = card.generate();
 * ```
 */
```

## Versioning

### Semantic Versioning
```
1.0.0 - Initial release
1.1.0 - Added new parameter (backward compatible)
1.1.1 - Fixed bug (backward compatible)
2.0.0 - Changed API (breaking change)
```

### Migration Guides
```markdown
# Migrating from 1.x to 2.0

## Breaking Changes

- `generate()` now returns `Promise<MusicEvent[]>` instead of `MusicEvent[]`
- Parameter `length` renamed to `duration`

## Migration Steps

1. Update all `generate()` calls to use `await`:
   ```typescript
   // Before:
   const events = generator.generate(params);
   
   // After:
   const events = await generator.generate(params);
   ```

2. Rename `length` parameter to `duration`:
   ```typescript
   // Before:
   { length: 4 }
   
   // After:
   { duration: 4 }
   ```
```

## Common Pitfalls

### Memory Leaks
```typescript
// ❌ Problem: Event listeners not cleaned up
render(container) {
  button.addEventListener('click', handler);
  // No cleanup!
}

// ✅ Solution: Track and cleanup listeners
render(container) {
  button.addEventListener('click', handler);
  return {
    destroy() {
      button.removeEventListener('click', handler);
    }
  };
}
```

### Performance Issues
```typescript
// ❌ Problem: Heavy operation on every frame
update() {
  const processed = heavyOperation(this.data); // Slow!
  render(processed);
}

// ✅ Solution: Cache and update only when needed
update() {
  if (this.dataDirty) {
    this.processedData = heavyOperation(this.data);
    this.dataDirty = false;
  }
  render(this.processedData);
}
```

### Type Errors
```typescript
// ❌ Problem: Loose typing
function process(data: any) {
  return data.value; // Might not exist!
}

// ✅ Solution: Strict typing
interface DataType {
  value: number;
}

function process(data: DataType): number {
  return data.value; // Type-safe
}
```

## Checklist

Before publishing your extension:

- [ ] All code is TypeScript with strict mode
- [ ] All public APIs have JSDoc documentation
- [ ] Unit tests cover core functionality
- [ ] Integration tests verify rendering
- [ ] No console errors in browser
- [ ] No memory leaks after repeated use
- [ ] Works in different browsers
- [ ] Clear README with examples
- [ ] Semantic version number
- [ ] manifest.json is valid
- [ ] No network dependencies
- [ ] No file system access
- [ ] Graceful error handling
- [ ] Sensible default parameters
- [ ] Visual feedback for long operations

## Resources

- [Extension API Reference](/docs/extensions/api-reference.md)
- [Development Guide](/docs/extensions/development-guide.md)
- [Example Extensions](/examples/extensions/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
