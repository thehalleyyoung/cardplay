# CardPlay Documentation Index

**Complete guide to all CardPlay documentation**

---

## Getting Started

### For New Users

- **[Getting Started Guide](guides/getting-started.md)** - Comprehensive onboarding for all user types (9,114 chars)
- **[FAQ](guides/faq.md)** - 45+ frequently asked questions (12,491 chars)
- **[Troubleshooting](guides/troubleshooting.md)** - Solutions for common issues (12,375 chars)
- **[Keyboard Shortcuts](guides/keyboard-shortcuts.md)** - Complete shortcut reference (9,379 chars)
- **[System Requirements](guides/system-requirements.md)** - Performance characteristics and requirements (11,137 chars)

### Interactive Learning

- **Tutorial Mode** - 10 interactive in-app tutorials:
  1. Creating Your First Project
  2. Board Switching Basics
  3. Using Keyboard Shortcuts
  4. Tracker Workflow
  5. Notation Composition
  6. Session Performance
  7. AI-Assisted Workflows
  8. Routing Basics
  9. Mixing Fundamentals
  10. Advanced Features
  
- **What's This? Mode** - Shift+F1 to explore UI elements interactively
- **Contextual Tooltips** - Hover over any element for inline help

---

## Workflows & Recipes

### Cookbook

- **[Cookbook](guides/cookbook.md)** - 20+ recipes and patterns (12,368 chars)
  - Quick Start Recipes (lofi beat, harmony, arrangement)
  - Composition Patterns (modal, rhythmic, counterpoint, substitution)
  - Production Techniques (sidechain, parallel compression, stereo widening, automation)
  - Sound Design Workflows (pads, modulation, sampling, layering)
  - Performance Setups (looping, DJ-style, generative)
  - Advanced Patterns (polymetric, microtonal, algorithmic, voice leading)

---

## Reference Documentation

### API Reference

- **[API Overview](reference/api-overview.md)** - Complete API documentation
  - Core Systems
  - Board System API
  - Event Store API
  - Clip Registry API
  - Routing Graph API
  - Extension API
  - Types Reference

### Board System

- **[Board System Overview](boards/README.md)** - Board-centric architecture
- **[Board List](boards/)** - All 17 builtin boards documented
- **[Deck Types](boards/decks.md)** - All 24 deck types explained
- **[Board Authoring Guide](boards/board-authoring.md)** - Create custom boards
- **[Deck Authoring Guide](boards/deck-authoring.md)** - Create custom decks

### AI & Music Theory

- **[AI System](ai/)** - Prolog-based AI reasoning
- **[Music Theory KB](ai/music-theory-kb.md)** - Music theory knowledge base
- **[Theory Cards](ai/theory-cards-catalog.md)** - All theory cards documented
- **[Constraint System](ai/constraint-system.md)** - Music constraint resolution

### Community Resources

- **[Template Creation Guide](guides/template-creation.md)** - Create project templates
- **[Deck Pack Creation](guides/deck-pack-creation.md)** - Bundle deck configurations
- **[Sample Pack Creation](guides/sample-pack-creation.md)** - Package sample collections
- **[Extension Development](guides/extension-development.md)** - Build extensions

---

## Persona-Specific Documentation

### Notation Composer

- **Workflow**: Notation Board (Manual), Notation + Harmony Board
- **Key Features**: Score editing, engraving checks, voice leading, part extraction
- **Reference**: Four-part harmony, counterpoint rules, notation shortcuts
- **Tutorials**: Tutorial #5 (Notation Composition)

### Tracker User

- **Workflow**: Basic Tracker Board, Tracker + Harmony, Tracker + Phrases
- **Key Features**: Pattern editor, hex/decimal entry, effect columns, pattern operations
- **Reference**: Tracker shortcuts, effect commands, pattern tricks
- **Tutorials**: Tutorial #4 (Tracker Workflow)

### Sound Designer

- **Workflow**: Sound Design Lab Board, Modular Board
- **Key Features**: Modulation matrix, spectrum analysis, preset management, layering
- **Reference**: Synthesis techniques, modulation routing, sound design recipes
- **Tutorials**: Tutorial #10 (Advanced Features)

### Producer/Beatmaker

- **Workflow**: Producer Board, Session + Generators
- **Key Features**: Timeline arrangement, mixer, automation, bouncing
- **Reference**: Production techniques, mixing tips, arrangement patterns
- **Tutorials**: Tutorial #6 (Session Performance), Tutorial #9 (Mixing Fundamentals)

### Live Performer

- **Workflow**: Live Performance Board, Session Board
- **Key Features**: Clip launching, scene management, macros, tempo control
- **Reference**: Performance setups, MIDI mapping, live looping
- **Tutorials**: Tutorial #6 (Session Performance)

---

## Technical Documentation

### Architecture

- **[Architecture Overview](architecture.md)** - System design
- **[Board-Centric Architecture](boardcentric/)** - Detailed board system docs
- **[Store System](../src/state/)** - Centralized state management
- **[Type System](reference/api-overview.md#types-reference)** - Branded types and safety

### Performance

- **[Performance Guide](guides/system-requirements.md)** - Optimization tips
- **[Memory Management](boards/performance.md)** - Memory leak prevention
- **[Virtualization](../src/ui/)** - Efficient rendering

### Testing

- **[Test Coverage](../__tests__/)** - 8,052+ passing tests
- **[Integration Tests](../src/integration/)** - Cross-system validation
- **[Benchmark Suite](performance/)** - Performance benchmarks

---

## Quick Links

### Most Common Tasks

- [Create a new project](guides/getting-started.md#creating-your-first-project)
- [Switch boards](guides/getting-started.md#switching-boards)
- [Import MIDI](guides/getting-started.md#importing-midi)
- [Export audio](guides/cookbook.md#technique-automation-curve-drawing)
- [Install extensions](reference/api-overview.md#extension-api)
- [Report a bug](guides/troubleshooting.md#getting-help)

### Keyboard Shortcuts

- `Cmd+N` - New project
- `Cmd+O` - Open project
- `Cmd+S` - Save project
- `Cmd+B` - Open board switcher
- `Cmd+K` - Command palette (AI boards)
- `Cmd+Z` / `Cmd+Shift+Z` - Undo/Redo
- `Space` - Play/Pause
- `Shift+F1` - What's This? mode

### Help Resources

- **In-App**: Help Browser deck (Cmd+Shift+H)
- **Tooltips**: Hover over any UI element
- **Tutorials**: Settings → Tutorial Mode
- **Community**: [GitHub Discussions](#) (when available)
- **Extensions**: [Extension Marketplace](#) (coming soon)

---

## Contributing

### Documentation

- Found an error? Submit a correction
- Want to add a recipe? Follow the cookbook format
- Improve clarity? Submit a PR with improvements

### Code

- See [CONTRIBUTING.md](#) for development setup
- Follow [Code Style Guide](#) for consistency
- Write tests for new features

---

## Version Information

- **Current Version**: v1.0.0
- **Documentation Version**: v1.0.0
- **Last Updated**: 2026-01-29
- **Build**: Production

---

## Need Help?

1. **Check the FAQ**: Most common questions answered
2. **Search docs**: Use browser's find (Cmd+F)
3. **Try tutorials**: Interactive learning in-app
4. **Read troubleshooting**: Solutions for common issues
5. **Ask community**: GitHub Discussions (when available)

---

*CardPlay documentation is continuously improved. Check back for updates, or contribute your own improvements via pull request!*
