# CardPlay Extension System

The CardPlay Extension System enables developers to create custom cards, decks, boards, generators, audio effects, and Prolog predicates to extend CardPlay's functionality.

## Overview

Extensions are self-contained packages that augment CardPlay with new capabilities. Each extension:

- **Declares its requirements** via a manifest file
- **Requests specific permissions** to access CardPlay APIs
- **Implements an activation/deactivation lifecycle**
- **Provides type-safe APIs** for all extension points

## Extension Categories

- **Card**: Custom card types for instrument/effect UI
- **Deck**: Custom deck types for organizing cards
- **Board**: Custom board configurations for workflows
- **Generator**: Custom MIDI/audio pattern generators
- **Effect**: Custom audio effects and processors
- **Prolog**: Custom Prolog predicates for AI reasoning
- **Theme**: Custom visual themes
- **Utility**: Helper functions and utilities

## Quick Start

See `src/extensions/examples/` for complete working examples:

1. **Euclidean Rhythm Generator** - Pattern generator using Bjorklund's algorithm
2. **Microtonal Scale Explorer** - Custom deck with Prolog predicates

## API Documentation

For full API reference, examples, and best practices, see the complete documentation in this directory.

## Extension Structure

```
my-extension/
├── extension.json      # Manifest
├── index.ts           # Entry point
├── README.md         # Documentation
└── LICENSE           # License file
```

## Installation

Users install extensions by placing them in the `extensions/` directory. CardPlay automatically discovers and loads valid extensions.

## Testing

All extensions are validated and tested. See `src/extensions/__tests__/` for the test suite (9/9 tests passing).
