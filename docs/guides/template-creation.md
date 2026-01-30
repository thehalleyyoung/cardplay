# Template Creation Guide

This guide explains how to create custom project templates for CardPlay.

## Overview

Templates provide starting points for different musical workflows. See `src/boards/templates/builtins.ts` for examples.

## Quick Reference

```typescript
interface ProjectTemplate {
  metadata: {
    id: string;              // kebab-case ID
    name: string;            // Display name
    description: string;     // Short description
    genre: string;           // Music genre
    difficulty: BoardDifficulty;
    estimatedTime: string;   // e.g., "30min"
    tags: string[];
    author: string;
    version: string;         // Semver
    createdAt: string;       // ISO date
  };
  streams: StreamData[];
  clips: ClipData[];
  board: { boardId: string };
  readme?: string;
}
```

## Best Practices

✅ **DO:**
- Use kebab-case IDs
- Test thoroughly
- Include README
- Use semantic versioning

❌ **DON'T:**
- Hard-code dependencies
- Create templates over 1MB
- Use placeholder IDs

For complete examples, see the 9 builtin templates in `src/boards/templates/builtins.ts`.
