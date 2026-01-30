# Getting Started with CardPlay

Welcome to CardPlay! This guide will help you understand the basics and start creating music right away.

## What is CardPlay?

CardPlay is a **board-centric music creation environment** that lets you work with **as much or as little AI as you want**. Unlike traditional DAWs with a single fixed interface, CardPlay provides multiple "boards"—each optimized for different workflows and control levels.

## The Control Spectrum

CardPlay boards exist along a spectrum from full manual control to AI-driven generation:

### 🎹 Manual (Full Control)
- **You do everything**: Pure manual composition
- **No AI interference**: Traditional workflow
- **Best for**: Notation composers, tracker users, traditional DAWs users
- **Example Boards**: Basic Tracker, Notation Board (Manual), Basic Sampler

### 🎵 Manual + Hints
- **You write, AI hints**: Visual guidance without automation
- **Shows chord tones**: Highlights harmonically relevant notes
- **Suggests next chords**: Non-intrusive recommendations
- **Best for**: Learning harmony, exploring theory
- **Example Boards**: Tracker + Harmony

### 🎼 Assisted
- **You place, AI fills**: Drag phrases, trigger generators
- **Everything editable**: Full control after generation
- **Speeds up workflow**: Quick sketching with full editing power
- **Best for**: Fast prototyping, beat making, loop-based production
- **Example Boards**: Tracker + Phrases, Session + Generators

### 🎨 Directed
- **You direct, AI executes**: Set constraints and goals
- **Preview before commit**: Accept/reject AI suggestions
- **High-level control**: Focus on structure, not details
- **Best for**: Arranging, sound design exploration, composition drafts
- **Example Boards**: AI Arranger, AI Composition

### 🌊 Generative
- **AI generates, you curate**: Continuous AI output
- **Accept what you like**: Freeze parts you want to keep
- **Evolving soundscapes**: Perfect for ambient, experimental
- **Best for**: Ambient music, sound design, happy accidents
- **Example Boards**: Generative Ambient

## First Steps

### 1. Choose Your Starting Board

When you first open CardPlay, you'll see the board selector. Here's how to choose:

- **Never used a tracker?** → Start with **Notation Board (Manual)** or **Basic Session**
- **Tracker user (Renoise/FastTracker)?** → Start with **Basic Tracker**
- **Want to explore AI?** → Start with **Tracker + Phrases** (assisted)
- **Just exploring?** → Try **Session + Generators** for quick results

**Pro tip**: Press `Cmd+B` (Mac) or `Ctrl+B` (Windows/Linux) anytime to switch boards!

### 2. Understand Your Board Layout

Every board has **decks**—modular panels that you can arrange, resize, and close:

- **Editor Decks**: Where you create music (tracker, notation, piano roll)
- **Browser Decks**: Find instruments, samples, phrases
- **Properties Deck**: Edit selected items
- **Mixer Deck**: Balance and process audio
- **Transport**: Play, stop, record controls

### 3. Add Some Notes

The exact method depends on your board:

#### Tracker Mode
- Click in a cell and press hex keys (`0-9`, `A-F`) for notes
- `C-4` = Middle C (MIDI note 60)
- Use arrow keys to navigate
- Press `Space` to play

#### Notation Mode
- Click on the staff to place notes
- Select note duration first (whole, half, quarter, eighth)
- Use mouse or keyboard shortcuts
- Press `Space` to play

#### Session Mode
- Double-click an empty slot to create a clip
- Double-click the clip to open its editor
- Add notes in piano roll or tracker view
- Click the clip to launch it

### 4. Play Your Music

- **Play**: Press `Space` or click the play button ▶️
- **Stop**: Press `Space` again or click stop ⏹️
- **Loop**: Enable loop mode to repeat a section
- **Tempo**: Adjust BPM in the transport controls

### 5. Try AI Features (Optional)

If your board has AI features enabled:

#### Phrase Library (Assisted Boards)
1. Open the phrase library deck
2. Search or browse phrases (bass lines, melodies, drum patterns)
3. Drag a phrase onto your editor
4. The phrase adapts to your current key/chord!
5. Edit freely—it's just notes now

#### Generators (Assisted/Directed Boards)
1. Open the generator deck
2. Select a generator (melody, bass, drums, arp)
3. Adjust parameters (density, swing, style)
4. Click "Generate" to create a pattern
5. Accept to keep it, or regenerate for variations

#### Freeze Parts (Generative Boards)
1. Let the AI generate continuously
2. When you hear something you like, click "Freeze"
3. Frozen parts won't regenerate
4. Edit frozen parts like any manual notes

## Essential Keyboard Shortcuts

Learn these shortcuts to work efficiently:

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Switch Boards | `Cmd+B` | `Ctrl+B` |
| Play/Stop | `Space` | `Space` |
| Undo | `Cmd+Z` | `Ctrl+Z` |
| Redo | `Cmd+Shift+Z` | `Ctrl+Shift+Z` |
| Help | `Cmd+?` | `Ctrl+?` |
| Command Palette | `Cmd+K` | `Ctrl+K` |
| Properties | `Cmd+I` | `Ctrl+I` |
| Mixer | `Cmd+M` | `Ctrl+M` |

Press `Cmd+?` (or `Ctrl+?`) anytime to see all shortcuts for your current board!

## Core Concepts

### Streams
- A **stream** is a sequence of musical events (notes, automation, chords)
- One stream = one part/voice/track
- All editors (tracker, notation, piano roll) edit the same underlying streams
- Changes in one view appear instantly in others

### Clips
- A **clip** is a container for a stream segment
- Clips have duration, loop points, and color
- Used in session view for launching and arranging
- Multiple clips can reference the same stream

### Routing
- **Audio routing**: Connect instruments → effects → mixer → output
- **MIDI routing**: Connect controllers → instruments
- **Modulation routing**: Connect LFOs/envelopes → parameters
- Toggle routing overlay with `Cmd+Shift+R` to visualize connections

### Undo System
- **Everything is undoable**: Edit fearlessly!
- AI actions are undoable too (freeze, generate, accept)
- Undo works across all views and boards
- View undo history in the undo history browser

## Tips for Success

### For Beginners
1. **Start with a template**: Use "First Project" tutorials
2. **Don't fear AI**: All AI actions are undoable
3. **Learn shortcuts**: They save SO much time
4. **Switch boards freely**: Find what works for you
5. **Use hints mode**: Tracker + Harmony teaches theory as you write

### For Tracker Users
1. **Hex entry works**: Same as FastTracker/Renoise
2. **Effect commands**: Use FX column for slides, vibrato, etc.
3. **Pattern cloning**: Right-click → Clone Pattern
4. **Try Tracker + Phrases**: Speeds up your workflow dramatically

### For Notation Composers
1. **Engraving tools**: Built-in quality checks
2. **Harmony board**: Get chord suggestions as you write
3. **Part extraction**: Export individual parts for performance
4. **PDF export**: Beautiful scores for printing

### For Producers
1. **Producer Board**: Timeline + mixer + effects all in one
2. **Session sketching**: Create clips in session, arrange in timeline
3. **Bus routing**: Create send/return chains for reverb/delay
4. **Freeze tracks**: Turn MIDI to audio for performance

## Next Steps

### Tutorials
1. **First Project** (5 min): Create a simple sketch
2. **Board Switching** (3 min): Understand the control spectrum
3. **Keyboard Shortcuts** (2 min): Learn essential shortcuts
4. **Tracker Workflow** (10 min): Deep dive into tracker mode
5. **AI Workflow** (12 min): Learn to work with AI effectively

Access tutorials from: **Help** → **Tutorials** or press `Cmd+?`

### Documentation
- **Board Reference**: Details on all 17 built-in boards
- **Deck Reference**: What each deck type does
- **Keyboard Shortcuts**: Complete shortcut reference per board
- **Music Theory**: Harmony, scales, chord progressions
- **Troubleshooting**: Common issues and solutions

### Community
- **Template Library**: 9+ starter templates across all genres
- **Sample Packs**: Bundled drums, synths, orchestral sounds
- **Deck Packs**: Pre-configured deck sets for quick setup
- **Extension Gallery**: Community-created cards and generators

## Philosophy

CardPlay is designed with these principles:

1. **You're in control**: AI assists, never forces
2. **Everything is undoable**: Experiment fearlessly
3. **Board-centric**: Different tools for different tasks
4. **Cross-view sync**: Edit in any view, see in all views
5. **Beautiful UI**: Professional tools deserve professional design

## Getting Help

- **In-app help**: Press `Cmd+?` anytime
- **What's This? mode**: Press `Shift+F1`, then click any element
- **Tooltips**: Hover over buttons for quick hints
- **Tutorials**: Step-by-step interactive guides
- **Documentation**: Comprehensive reference materials

## Welcome to CardPlay!

You're now ready to start creating. Remember:

- Start with a simple board (Tracker, Notation, or Session)
- Don't be afraid to experiment
- Try different boards to find your favorite workflow
- All AI features are optional—use what helps you
- Everything is undoable—explore freely!

Press `Cmd+B` to open the board switcher and begin your journey.

Happy music making! 🎵
