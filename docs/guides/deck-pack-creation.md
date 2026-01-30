# Deck Pack Creation Guide

Deck packs provide pre-configured deck collections for quick board customization.

## Overview

A deck pack is a collection of deck definitions that can be added to any board. Examples: "Essential Production" (mixer + transport), "Notation Essentials" (score + properties).

## Structure

```typescript
interface DeckPack {
  id: string;
  name: string;
  description: string;
  category: string;  // production, composition, performance
  difficulty: BoardDifficulty;
  tags: string[];
  decks: Array<{
    id: string;
    type: DeckType;
    title: string;
    config?: Record<string, unknown>;
  }>;
}
```

## Examples

See `src/boards/deck-packs/builtins.ts` for three complete examples:
- Essential Production
- Notation Essentials
- Sound Design Lab

## Best Practices

- Keep packs focused (3-5 decks)
- Avoid duplicate deck types
- Test installation on different boards
- Use descriptive pack names

## Testing

The deck pack system includes conflict resolution (rename/skip strategies). Test with existing decks to ensure smooth installation.

For complete API reference, see `src/boards/deck-packs/types.ts`.
