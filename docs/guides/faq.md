# CardPlay Frequently Asked Questions (FAQ)

Quick answers to common questions about CardPlay.

## General Questions

### What is CardPlay?

CardPlay is a **board-centric music creation environment** that provides multiple workflow boards optimized for different levels of AI assistance. You can work with traditional manual tools, AI-assisted features, or fully generative systems—all in one application.

### Is CardPlay free?

Yes! CardPlay is open-source and free to use. No subscriptions, no in-app purchases, no cloud dependencies.

### Does CardPlay work offline?

Yes! CardPlay runs entirely in your browser and requires no network connection. All AI features use local Prolog-based reasoning (no cloud AI required).

### What browsers does CardPlay support?

CardPlay works best on:
- **Chrome/Chromium** (recommended)
- **Edge** (Chromium-based)
- **Firefox**
- **Safari**

All modern browsers with Web Audio API support will work.

### Is CardPlay a DAW replacement?

CardPlay complements traditional DAWs by offering flexible, board-based workflows. It's excellent for composition, sketching, and AI-assisted creation. For final mixing/mastering with VST plugins, traditional DAWs may still be preferred.

---

## Getting Started

### Which board should I start with?

Choose based on your background:
- **Tracker users** (Renoise/FastTracker): **Basic Tracker Board**
- **Notation composers**: **Notation Board (Manual)**
- **Session users** (Ableton Live): **Basic Session Board**
- **Want to try AI**: **Tracker + Phrases** or **Session + Generators**
- **Complete beginner**: **Notation Board** or **Session + Generators**

### How do I switch boards?

Press `Cmd+B` (Mac) or `Ctrl+B` (Windows/Linux) to open the board switcher. Select any board and it switches instantly.

### Can I use multiple boards in one project?

Yes! Switch boards anytime—your project data (streams, clips, routing) persists across all boards. Each board is just a different "view" of the same project.

### Where are my projects saved?

Projects are saved in your browser's local storage (IndexedDB). They persist between sessions. You can also export projects as `.cardplay` files for backup or sharing.

---

## Workflow Questions

### What's the difference between streams and clips?

- **Stream**: A sequence of musical events (notes, chords, automation)
- **Clip**: A container that references a stream (or part of a stream)

One stream can be used by multiple clips. Think: stream = the music, clip = a reference to it.

### Can I edit in multiple views simultaneously?

Yes! The tracker, piano roll, notation, and timeline views all edit the same underlying streams. Changes in one view appear instantly in all others.

### Is everything undoable?

Yes! Every action in CardPlay is undoable (`Cmd+Z`), including AI-generated content. Edit fearlessly—you can always undo!

### How many undo levels do I get?

The undo stack is unlimited (within browser memory limits). Typically hundreds of actions.

---

## AI Questions

### What kind of AI does CardPlay use?

CardPlay uses **Prolog-based declarative reasoning**, not neural networks. The AI follows music theory rules and compositional patterns defined in a knowledge base. No cloud, no training data, completely deterministic.

### Does CardPlay send my music to the cloud?

**No.** Everything runs locally in your browser. No data is sent anywhere. Your music stays on your device.

### Can I turn off AI features?

Yes! Just use Manual boards (Notation Board, Basic Tracker, Basic Sampler, Basic Session). These boards have zero AI assistance.

### Can I mix manual and AI tracks?

Yes! Hybrid boards (Composer, Producer, Live Performance) let you choose control level per track. Some tracks manual, others AI-assisted—totally up to you.

### How do I make AI generate better results?

1. **Set constraints**: Key, chord progression, density, style
2. **Use appropriate board**: Assisted vs Directed vs Generative
3. **Iterate**: Regenerate until you get something close
4. **Edit results**: Use AI as starting point, then tweak manually

### Can I save AI-generated phrases?

Yes! Select generated notes → Right-click → "Save as Phrase". Your phrase is added to the library and can be reused.

---

## Audio Questions

### What audio formats does CardPlay support?

- **Import**: WAV, MP3, OGG, FLAC (browser-dependent)
- **Export**: WAV, MP3, OGG
- **MIDI**: MIDI import/export supported

### Can I use VST plugins?

Not directly (browser limitation). CardPlay has built-in effects (EQ, compression, reverb, delay, etc.) and supports extension development for custom effects.

### What's the audio latency?

Typical latency is 10-50ms depending on buffer size and browser. Web Audio API has inherent latency—for ultra-low-latency recording, native DAWs are better.

### Can I record audio?

Yes! Arm a track and play notes via MIDI keyboard or computer keyboard. Audio recording from microphone is supported in compatible browsers.

### How do I export audio?

1. File → Export Audio (or `Cmd+E`)
2. Choose format (WAV/MP3/OGG)
3. Choose sample rate (44.1/48/96 kHz)
4. Choose bit depth (16/24/32)
5. Click Export

---

## MIDI Questions

### Can I use a MIDI keyboard?

Yes! CardPlay supports Web MIDI API. Connect your keyboard, grant permission when prompted, and start playing.

### Which MIDI keyboards work?

Any class-compliant USB MIDI keyboard should work. Most modern keyboards are class-compliant.

### Can I use MIDI controllers (knobs/faders)?

Yes! MIDI CC messages are supported. Map MIDI controllers to parameters via the MIDI learn system.

### Does CardPlay support MPE?

Not yet, but it's on the roadmap (Phase N advanced features).

---

## Collaboration Questions

### Can I share projects with others?

Yes! Export projects as `.cardplay` files (File → Export Project). Others can import them (File → Import Project).

### Can multiple people work on the same project?

CardPlay doesn't have real-time collaboration yet. You can:
1. Export project → share file → import on other device
2. Use project diff system to compare versions
3. Use comments/annotations for feedback

### Can I export notation as PDF?

Yes! Notation boards have PDF export (File → Export PDF). Great for printing parts for musicians.

### Can I import MIDI files?

Yes! File → Import → MIDI. The MIDI file creates streams and clips in your project.

---

## Customization Questions

### Can I customize keyboard shortcuts?

Not yet (coming in a future update), but all shortcuts are documented (press `Cmd+?`).

### Can I create custom boards?

Yes! With extension system (Phase O), you can define custom board layouts, deck configurations, and tool settings.

### Can I create custom instruments/effects?

Yes! The extension API allows custom cards, effects, generators, and even Prolog predicates for AI reasoning.

### Can I change the theme?

Yes! Settings → Appearance → Theme. Choose from light, dark, high-contrast, and per-board themes.

---

## Technical Questions

### What technologies does CardPlay use?

- **UI**: TypeScript, Web Components
- **Audio**: Web Audio API
- **MIDI**: Web MIDI API
- **AI**: Prolog engine (pure JavaScript)
- **Storage**: IndexedDB (browser local storage)
- **Build**: Vite, TypeScript

### Is CardPlay open source?

Yes! Check the repository for source code, contribution guidelines, and license information.

### Can I run CardPlay on mobile/tablet?

CardPlay is optimized for desktop with keyboard/mouse. Mobile support is experimental—some features may not work well on small screens.

### Does CardPlay support multi-monitor setups?

Yes! You can drag the window across monitors. Decks can be arranged to take advantage of extra screen space.

### What are the system requirements?

**Minimum**:
- Modern browser (Chrome/Firefox/Safari/Edge)
- 4GB RAM
- Any modern CPU

**Recommended**:
- 8GB+ RAM for large projects
- Chrome/Edge for best performance
- SSD for faster project loading

---

## Troubleshooting

### Audio is crackling/glitching

1. Increase buffer size (Settings → Audio → Buffer Size)
2. Close unused decks
3. Reduce number of active tracks
4. Check browser CPU usage

### UI is slow/laggy

1. Close unused decks
2. Disable routing overlay when not needed
3. Reduce visual density (Settings → UI)
4. Close other browser tabs

### Project won't save

1. Check browser storage (Settings → Storage)
2. Clear old projects if storage full
3. Export project as file (File → Export)

### MIDI keyboard not working

1. Grant MIDI permission when browser asks
2. Settings → MIDI → Select input device
3. Ensure keyboard plugged in before opening CardPlay

### More issues?

See the [Troubleshooting Guide](./troubleshooting.md) for comprehensive solutions.

---

## Best Practices

### Project Organization

- **Use templates**: Start with genre-appropriate templates
- **Name everything**: Tracks, clips, streams—clear names help
- **Use colors**: Color-code clips by type (drums/bass/melody)
- **Save frequently**: `Cmd+S` saves to browser storage
- **Export backups**: File → Export Project for safety

### Performance Optimization

- **Close unused decks**: Each deck has overhead
- **Freeze AI tracks**: Turns generated content into static edits
- **Use compact mode**: Settings → UI → Visual Density → Compact
- **Restart browser**: Occasionally for memory cleanup

### Learning Tips

- **Start simple**: Don't use all features at once
- **Learn shortcuts**: Huge productivity boost (press `Cmd+?`)
- **Try tutorials**: Help → Tutorials (interactive guides)
- **Experiment with boards**: Find what works for your workflow
- **Use What's This? mode**: `Shift+F1` → click elements for help

---

## Feature Comparisons

### CardPlay vs Traditional DAWs

**Advantages**:
- Multiple workflow boards (not one-size-fits-all)
- Optional AI assistance (as much or as little as you want)
- Cross-view editing (tracker/piano roll/notation all in sync)
- No installation, runs in browser
- Free and open source

**Limitations**:
- No VST plugin support (browser limitation)
- Higher audio latency than native (Web Audio API)
- Large projects may hit browser memory limits

### CardPlay vs AI Music Tools

**Advantages**:
- Full manual control available (not AI-only)
- Local, deterministic AI (no cloud, no randomness)
- AI is rule-based (music theory), not neural net
- Everything is editable (AI is starting point)
- No subscription, no usage limits

**Limitations**:
- Not "creative AI" (doesn't invent new styles)
- Requires music theory understanding for best results

---

## Community & Support

### How do I get help?

1. **In-app help**: Press `Cmd+?` anytime
2. **What's This? mode**: `Shift+F1` → click elements
3. **Documentation**: Help → Documentation
4. **Tutorials**: Help → Tutorials
5. **Troubleshooting**: Help → Troubleshooting Guide
6. **FAQ**: This document!

### How can I contribute?

- **Report bugs**: GitHub issues
- **Suggest features**: GitHub discussions
- **Contribute code**: Submit pull requests
- **Create templates**: Share via extension system
- **Write documentation**: Help improve docs

### Where can I share my music?

Share `.cardplay` project files so others can explore your workflow! Export audio to share finished tracks on streaming platforms.

---

## Roadmap

### What's coming next?

- **Phase N**: Advanced AI features (learning, adaptation)
- **Phase O**: Community ecosystem (templates, extensions, collaboration)
- **Phase P**: Polish & launch (performance, accessibility, docs)

### Can I request features?

Yes! Open a GitHub issue or discussion with your feature request. We review all suggestions.

---

## Philosophy

### Why "board-centric"?

Different tasks need different tools. Notation composition is different from tracker sequencing is different from live performance. Rather than one interface for everything, boards provide specialized tools for each workflow.

### Why optional AI?

Some users want full control (manual boards). Some want quick results (generative boards). Most want something in between (assisted/directed). You choose your level of AI—it never forces itself on you.

### Why Prolog-based AI?

Prolog enables **explainable, deterministic AI** based on music theory rules. You understand why the AI made a choice. No black-box neural networks, no cloud dependencies, no mysterious results.

---

*Last updated: 2026-01-29*

**Still have questions?** Press `Cmd+?` in the app for context-sensitive help!
