# Learn: Card Library
Assumes canonical model and terminology in `cardplay2.md` (repo root).

This guide covers the Card Library panel, where you browse, search, and add cards to stacks. Cards are typed processors/generators that form the building blocks of Cardplay's extensible architecture.

## Prerequisites

- Completed [Learn: Getting Started](./learn-getting-started.md)
- Basic understanding of signal flow and audio routing

## Workflow 1: Browsing the Card Library (3 minutes)

### Goal
Explore available cards and understand their types and purposes.

### Steps

1. **Open the Card Library panel**
   - Click the **Card Library** tab
   - You see a searchable list of card definitions
   - Each card has a type, name, and description

2. **Understand card categories**
   - **Sources**: Generate events or audio (SessionSource, Synth, Sampler)
   - **Processors**: Transform events/audio (Transpose, Scale, Filter)
   - **Instruments**: Convert events to audio (Sampler, PolySynth)
   - **Effects**: Process audio (Reverb, Delay, Distortion)
   - **Utilities**: Helper cards (Merge, Split, Adapter)

3. **Browse the list**
   - Scroll through available cards
   - Each entry shows:
     - **Name**: Human-readable label
     - **Type**: Unique card type identifier
     - **Description**: What the card does
   - ✅ Hundreds of cards are available

4. **Click a card for details**
   - Click any card in the list
   - The right panel shows:
     - **Ports**: Inputs and outputs (with types)
     - **Parameters**: Configurable settings
     - **Description**: Detailed explanation
   - ✅ Understand before adding

### Troubleshooting
- **Too many cards?** Use search to filter
- **Details don't show?** Click the card in the list first
- **Card type confusing?** Read the description carefully

### What You Learned
✓ How to browse the card library  
✓ Card categories (sources, processors, instruments, effects)  
✓ How to view card details  

---

## Workflow 2: Searching and Filtering Cards (3 minutes)

### Goal
Find specific cards quickly using search and filters.

### Steps

1. **Use the search box**
   - Type in the search input (e.g., "synth", "delay", "filter")
   - The list filters to matching cards
   - Search matches name, type, and description
   - ✅ Fast way to find cards

2. **Search by type**
   - Type partial card types (e.g., "Poly", "Sampler", "Session")
   - Only matching cards appear
   - ✅ Narrow down to specific categories

3. **View favorites**
   - Click **"Favorites"** button
   - Shows only cards you've favorited
   - Add to favorites by clicking star icon (if available)
   - ✅ Quick access to frequently used cards

4. **View recents**
   - Click **"Recents"** button
   - Shows recently used cards
   - Automatically tracked
   - ✅ Resume where you left off

5. **Sort options**
   - Click **"Sort: name"** to toggle
   - Options: Sort by name or sort by type
   - ✅ Organize list to your preference

### What You Learned
✓ How to search for cards  
✓ Favorites and recents for quick access  
✓ Sorting options  

---

## Workflow 3: Adding Cards to Stacks (4 minutes)

### Goal
Create card instances and add them to stacks for use in your project.

### Steps

1. **Select a target stack**
   - In the **Stack** dropdown, choose a stack
   - If no stacks exist, create one first (see [Learn: Stack Builder](./learn-stack-builder.md))
   - ✅ Cards will be added to this stack

2. **Find a card to add**
   - Search or browse for a card
   - Example: Search for "PolySynth" (instrument card)
   - Click the card to view details
   - ✅ Confirm it has the ports/params you need

3. **Add the card to the stack**
   - Click **"Add to stack"** button
   - A new card instance is created
   - The instance is added to the selected stack
   - ✅ The card is now in `project.cards`

4. **View the card in Stack Builder**
   - Switch to Stack Builder panel
   - Your newly added card appears in the stack's card list
   - ✅ Ready for configuration and routing

5. **Add multiple cards**
   - Repeat the process for other cards
   - Example: Add "SessionSource", "PolySynth", "AudioOut"
   - Build a complete signal chain
   - ✅ Stack grows with each addition

### Troubleshooting
- **"Add to stack" doesn't work?** Ensure a stack is selected
- **Card not in Stack Builder?** Check that the correct stack is selected
- **Too many instances?** Delete unwanted cards in Stack Builder

### What You Learned
✓ How to select a target stack  
✓ How to add cards to stacks  
✓ How to build signal chains  

---

## Key Concepts

### Card Definition
- A template or blueprint for a card type
- Defines ports, parameters, and behavior
- Registered globally (available to all projects)

### Card Instance
- A specific use of a card definition in your project
- Has a unique ID and configuration
- Stored in `project.cards`

### Stack
- An ordered collection of card instances
- Serial: cards flow in sequence (A → B → C)
- Parallel: cards run in parallel (A, B, C independently)

### Ports
- Inputs and outputs of a card
- Typed (e.g., `EventStream<NoteEvent>`, `AudioBuffer`)
- Must match when connecting cards
- `NoteEvent` is an alias for `Event<Voice<MIDIPitch>>` (see cardplay2.md §2.0.9)

### Parameters
- Configurable settings on a card
- Example: Synth waveform, Delay time, Filter frequency
- Adjustable in Stack Builder

---

## Tips and Tricks

1. **Start with search**: Type "session" to find SessionSource
2. **Instrument chain**: SessionSource → Instrument → AudioOut
3. **Effect chain**: SessionSource → Instrument → Effect → AudioOut
4. **Favorites for workflow**: Star your most-used cards
5. **Recents for iteration**: Quickly add the same cards repeatedly
6. **Read descriptions**: Many cards have advanced features explained in details
7. **Check port types**: Ensure compatibility before adding (or use adapters)

---

## Common Workflows

### Building a Basic Instrument Stack
1. Search for "SessionSource"
2. Add to stack
3. Search for "PolySynth" or "Sampler"
4. Add to stack
5. Search for "AudioOut"
6. Add to stack
7. Go to Stack Builder to connect and configure

### Building an Effect Stack
1. Add "AudioIn" (or existing instrument output)
2. Search for "Reverb"
3. Add to stack
4. Search for "Delay"
5. Add to stack
6. Add "AudioOut"
7. Connect in Stack Builder

### Exploring New Cards
1. Click **"Show All"** to reset filters
2. Scroll through list
3. Click cards to read descriptions
4. Experiment by adding to a test stack
5. Remove if not needed

---

## Next Steps

- [Learn: Stack Builder](./learn-stack-builder.md) - Connect and configure cards
- [Learn: Graph Report](./learn-graph-report.md) - Inspect routing and data flow

---

## Reference

### Card Library Controls

| Control | Description |
|---------|-------------|
| Search | Filter by name/type/description |
| Stack | Target stack for adding cards |
| Favorites | Show favorited cards only |
| Recents | Show recently used cards |
| Sort | Toggle sort by name/type |

### Card Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| Sources | Generate events/audio | SessionSource, StepSequencer |
| Processors | Transform events | Transpose, Arpeggiator, Quantize |
| Instruments | Events → audio | PolySynth, Sampler, DrumMachine |
| Effects | Process audio | Reverb, Delay, Filter, Distortion |
| Utilities | Helpers | Merge, Split, Adapter |

---

## Troubleshooting

**Q: Card list is empty**  
A: Check that the registry is loaded (should be automatic). Refresh if needed.

**Q: Can't add cards**  
A: Ensure a stack is selected in the Stack dropdown. Create a stack in Stack Builder if needed.

**Q: Too many cards to browse**  
A: Use search to narrow down. Type broad terms like "synth" or "effect".

**Q: What's the difference between card definition and instance?**  
A: Definition = blueprint (global). Instance = specific use in your project (has its own settings).

**Q: How do I delete a card?**  
A: Go to Stack Builder, select the card instance, and delete it there.

**Q: Can I create custom cards?**  
A: Yes—cards are extensible. Write a card definition following the API (see docs/card-definition-format.md).
