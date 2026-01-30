# Sample Pack Creation Guide

Sample packs bundle audio samples for easy installation into the sample library.

## Overview

Sample packs organize related audio samples (drums, synth one-shots, orchestral) with metadata for browsing and filtering.

## Structure

```typescript
interface SamplePack {
  id: string;
  name: string;
  description: string;
  category: 'drums' | 'synth' | 'orchestral' | 'fx' | 'vocals' | 'other';
  difficulty: BoardDifficulty;
  tags: string[];
  version: string;
  samples: Array<{
    id: string;
    name: string;
    filename: string;
    category: string;
    tags: string[];
    metadata?: {
      bpm?: number;
      key?: string;
      duration?: number;
    };
  }>;
  totalSize: number;  // bytes
}
```

## Examples

See `src/community/sample-packs/builtins.ts` for three example packs:
- Lofi Drums (8 warm, dusty drum samples)
- Synth One-Shots (essential synth samples)
- Orchestral Samples (strings, brass, woodwinds)

## Best Practices

- Group related samples
- Use descriptive filenames
- Tag samples consistently
- Include tempo/key metadata where relevant
- Keep total pack size reasonable (<50MB)

## Installation

Sample packs integrate with the sample browser and provide:
- Progress tracking during installation
- Conflict detection
- Installation history

For the complete API, see `src/community/sample-packs/types.ts`.
