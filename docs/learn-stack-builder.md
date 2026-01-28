# Learn: Stack Builder
Assumes canonical model and terminology in `cardplay2.md` (repo root).

This guide covers the Stack Builder panel, where you create, configure, and connect card stacks to build signal processing chains for your music production.

## Prerequisites

- Completed [Learn: Getting Started](./learn-getting-started.md)
- Completed [Learn: Card Library](./learn-card-library.md)
- Understanding of signal flow and audio routing

## Workflow 1: Creating and Managing Stacks (3 minutes)

### Goal
Create new stacks and understand stack structure.

### Steps

1. **Open the Stack Builder panel**
   - Click the **Stack Builder** tab
   - You see stack management controls and a card list

2. **Create a new stack**
   - In the **"New stack id"** input, enter a name (e.g., "melody-chain")
   - Click **"Create stack"** button
   - ✅ A new empty stack is created

3. **Select a stack**
   - Use the **"Stack"** dropdown
   - Choose the stack you want to work with
   - The card list updates to show cards in that stack
   - ✅ You're now editing this stack

4. **Understand stack modes**
   - **Behavior**: Serial (chain) or Parallel (simultaneous)
     - **Serial**: A → B → C (output of A feeds B, output of B feeds C)
     - **Parallel**: A, B, C run independently
   - **Composition**: How cards are composed (auto/manual)
   - ✅ Serial is most common for instruments and effects

### Troubleshooting
- **Stack dropdown empty?** Create your first stack
- **Can't create stack?** Check that the ID doesn't already exist
- **Behavior confusing?** Start with Serial for most cases

### What You Learned
✓ How to create stacks  
✓ How to select and switch between stacks  
✓ Serial vs. Parallel behavior  

---

## Workflow 2: Adding and Configuring Cards (4 minutes)

### Goal
Add cards to a stack and configure their parameters.

### Steps

1. **Add cards from Card Library**
   - Go to Card Library panel
   - Select your stack in the dropdown
   - Search and add cards (see [Learn: Card Library](./learn-card-library.md))
   - Return to Stack Builder
   - ✅ Cards now appear in the list

2. **View card details**
   - Click a card in the list
   - The inspector shows:
     - **Ports**: Inputs and outputs
     - **Parameters**: Configurable settings
     - **Bindings**: Port connections
   - ✅ Understand the card's role

3. **Reorder cards**
   - Use **↑** (Move Up) and **↓** (Move Down) buttons
   - In serial stacks, order matters (signal flows in sequence)
   - ✅ Adjust signal flow as needed

4. **Delete a card**
   - Select a card
   - Click **"Delete card"** button
   - The card instance is removed from the stack
   - ✅ Clean up unwanted cards

### Troubleshooting
- **Cards don't appear?** Check that the correct stack is selected
- **Can't reorder?** Ensure the card is selected first
- **Delete doesn't work?** Check selection and try again

### What You Learned
✓ How to view cards in a stack  
✓ How to reorder cards  
✓ How to delete cards  

---

## Workflow 3: Connecting Ports and AutoFix (5 minutes)

### Goal
Connect card ports using bindings and use AutoFix to resolve type mismatches.

### Steps

1. **Understand port bindings**
   - Each card has input and output ports
   - Bindings connect outputs to inputs
   - Example: SessionSource.output → PolySynth.input
   - ✅ Data flows through bindings

2. **Derive bindings for serial stacks**
   - Click **"Derive bindings"** button
   - The system auto-connects compatible ports in sequence
   - Works best for linear chains (A → B → C)
   - ✅ Fast way to connect simple stacks

3. **Inspect the stack report**
   - Click **"Show report"** button
   - Detailed analysis appears:
     - Port compatibility
     - Missing connections
     - Type mismatches
     - Suggestions
   - ✅ Diagnose routing problems

4. **Use AutoFix for type mismatches**
   - If ports don't match types (e.g., `EventStream` vs. `AudioBuffer`)
   - Click **"AutoFix"** button
   - The system inserts adapter cards automatically
   - ✅ Resolves type errors without manual work

5. **Verify the stack**
   - After AutoFix, click **"Show report"** again
   - Check that all ports are connected
   - Look for green checkmarks (✓ = good)
   - ✅ Stack is ready to use

### Troubleshooting
- **Derive bindings fails?** Check that ports are compatible types
- **AutoFix doesn't work?** Some type mismatches may not have adapters yet
- **Report too long?** Focus on errors (red) and warnings (yellow)

### What You Learned
✓ Port bindings connect cards  
✓ Derive bindings for serial chains  
✓ Stack report for diagnostics  
✓ AutoFix resolves type mismatches  

---

## Key Concepts

### Stack
- A collection of card instances (ordered or parallel)
- Defines a signal processing pipeline
- Can be used in the project graph

### Serial Stack
- Cards process in sequence (A → B → C)
- Output of one card feeds input of next
- Most common for instruments and effects chains

### Parallel Stack
- Cards run independently (A, B, C)
- No data flow between cards
- Useful for layering or routing

### Port
- Input or output of a card
- Has a type (e.g., `EventStream<NoteEvent>`, `AudioBuffer`)
- Must match when connecting
- Note: `NoteEvent` is an alias for `Event<Voice<MIDIPitch>>` (see cardplay2.md §2.0.9)

### Binding
- Connection between an output port and an input port
- Defines data flow in the stack
- Can be auto-derived or manually specified

### Adapter Card
- Special card that converts one port type to another
- Example: EventStream → Audio (instrument)
- Inserted automatically by AutoFix

### Stack Report
- Detailed analysis of stack structure
- Shows port compatibility, connections, and issues
- Essential for debugging complex stacks

---

## Tips and Tricks

1. **Start with derive bindings**: Let the system connect simple chains
2. **Use AutoFix liberally**: Saves manual adapter insertion
3. **Check report after changes**: Catch errors early
4. **Serial for most cases**: Instruments, effects, processors
5. **Parallel for layering**: Multiple instruments playing together
6. **Reorder for tone shaping**: Example: Filter before Reverb vs. Reverb before Filter
7. **Delete and re-add**: If stuck, remove problematic card and try again

---

## Common Workflows

### Building an Instrument Stack
1. Create stack: "my-instrument"
2. Go to Card Library
3. Add SessionSource (generates note events)
4. Add PolySynth or Sampler (converts events to audio)
5. Add AudioOut (sends to speakers)
6. Return to Stack Builder
7. Click "Derive bindings"
8. Click "AutoFix" if needed
9. Check "Show report" for green checkmarks
10. ✅ Stack is ready

### Building an Effect Chain
1. Create stack: "vocal-fx"
2. Add AudioIn (or use existing instrument)
3. Add Filter (EQ)
4. Add Delay (echo)
5. Add Reverb (space)
6. Add AudioOut
7. Derive bindings
8. AutoFix
9. Adjust card order if needed (experiment!)
10. ✅ Effect chain ready

### Debugging a Broken Stack
1. Select the stack
2. Click "Show report"
3. Look for red errors (type mismatches, missing connections)
4. Try "AutoFix" first
5. If AutoFix doesn't work, manually remove/reorder cards
6. Add adapter cards manually if needed
7. Re-run "Show report" to verify
8. ✅ Stack fixed

---

## Next Steps

- [Learn: Card Library](./learn-card-library.md) - Browse and add cards
- [Learn: Graph Report](./learn-graph-report.md) - Inspect project-wide routing
- [Docs: Stack Inference](./stack-inference.md) - Advanced binding rules

---

## Reference

### Stack Builder Controls

| Control | Description |
|---------|-------------|
| Stack | Select which stack to edit |
| New stack id | Name for a new stack |
| Create stack | Create a new empty stack |
| Delete stack | Remove the stack and its cards |
| Behavior | Serial (chain) or Parallel |
| Composition | Auto or Manual |
| Derive bindings | Auto-connect ports for serial stacks |
| AutoFix | Insert adapters to fix type mismatches |
| Show report | Display detailed stack analysis |

### Stack Modes

| Mode | Description |
|------|-------------|
| Serial | Cards flow in sequence (A → B → C) |
| Parallel | Cards run independently (A, B, C) |

### Port Types (Common)

These use convenience aliases from cardplay2.md §2.0.9:

- `EventStream<NoteEvent>`: MIDI-like note events (`Event<Voice<MIDIPitch>>`)
- `EventStream<AutomationEvent>`: Automation/modulation events (`Event<AutomationPayload>`)
- `AudioBuffer`: Audio buffers (channel count is an attribute; UIs may display “mono/stereo”)
- `ClipSchedule`: Session clip timing info

---

## Troubleshooting

**Q: Derive bindings doesn't connect cards**  
A: Check port types—only compatible ports are auto-connected. Use AutoFix for mismatches.

**Q: AutoFix doesn't work**  
A: Some type mismatches may not have adapters yet. Check the report for details.

**Q: Stack report is all red**  
A: Start simple—ensure at least one output connects to one input. Build incrementally.

**Q: Which cards should go in which order?**  
A: Typical: Source → Processor → Instrument → Effect → Out. Experiment for tone shaping!

**Q: Can I have multiple stacks?**  
A: Yes! Create as many as you need. They can be routed together in the project graph.

**Q: What's the difference between stack and graph?**  
A: Stack = local card chain. Graph = project-wide routing of all stacks and containers.

**Q: How do I use my stack in Session?**  
A: Stacks connect to the project graph via bindings. Use SessionSource to pull from Session clips.
