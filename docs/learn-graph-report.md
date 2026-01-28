# Learn: Graph Report
Assumes canonical model and terminology in `cardplay2.md` (repo root).

This guide covers the Graph Report panel, a diagnostic and debugging tool that visualizes your card graph structure, validates connections, and simulates auto-fixes before applying them.

## Prerequisites

- Completed [Learn: Getting Started](./learn-getting-started.md)
- Basic familiarity with cards and stacks
- See [Graph Invariants](./graph-invariants.md) for technical details

## Workflow 1: View Your First Graph Report (3 minutes)

### Goal
Generate and read a graph report to understand your project's card connections.

### Steps

1. **Create a simple stack**
   - Add a few cards to a stack (e.g., a pattern generator → note transformer → audio output)
   - Or use an existing project with cards
   - ✅ You have something to inspect

2. **Open the Graph Report panel**
   - Click the **Graph Report** tab
   - You see a stack selector dropdown and report view
   - ✅ Panel is ready

3. **Select a stack to inspect**
   - Choose a stack from the dropdown
   - The report shows:
     - Node list (all cards in the stack)
     - Edge list (connections between cards)
     - Type compatibility (are ports compatible?)
   - ✅ Report generated

4. **Read the node section**
   - Each node shows: `nodeId`, `cardType`, `ports`
   - Input ports are listed separately from output ports
   - ✅ You can see all cards and their ports

5. **Read the edge section**
   - Each edge shows: `from` → `to` connection
   - Port types are validated (match or compatible)
   - ❌ Type mismatches are highlighted in red
   - ✅ You understand your graph structure

### Troubleshooting
- **No stacks appear?** Create at least one stack with cards first
- **Empty report?** Ensure your stack has cards and connections
- **Type errors shown?** See Workflow 2 to diagnose and fix

### What You Learned
✓ How to open and use Graph Report panel
✓ How to select and inspect a stack
✓ How to read node and edge listings
✓ How to spot type compatibility issues

---

## Workflow 2: Diagnose and Fix Graph Errors (5 minutes)

### Goal
Use Graph Report to identify and resolve type mismatches and connection problems.

### Steps

1. **Open a stack with errors**
   - Look for stacks with red error badges
   - Or intentionally create a mismatch (e.g., connect incompatible port types)
   - Select it in Graph Report panel
   - ✅ Error report is visible

2. **Read the error diagnostics**
   - Scroll to the "Issues" section (if present)
   - Each issue shows:
     - The problematic edge or node
     - The type mismatch (expected vs. actual)
     - Suggested fix (adapter card, port change)
   - ✅ You understand the problem

3. **Simulate auto-fix**
   - Click **"Simulate Fix"** button
   - The panel shows a preview of changes:
     - Inserted adapter cards
     - Inserted merge nodes (for fan-in)
     - Updated connections
   - Review the proposed changes
   - ✅ You see the fix strategy

4. **Apply the fix**
   - Click **"Apply Fix"** button
   - The graph is updated with the changes
   - The report refreshes to show the fixed graph
   - ✅ Errors resolved

5. **Verify the fix worked**
   - Check the Issues section is now empty (or reduced)
   - Test your stack in the session or audio engine
   - ✅ Graph is valid and functional

### Troubleshooting
- **Fix doesn't work?** Some complex graphs may require manual intervention
- **Unwanted adapter cards?** Remove them and manually adjust port types
- **Fix button disabled?** No fixable issues were detected

### What You Learned
✓ How to diagnose type mismatches and connection issues
✓ How to simulate and preview auto-fixes
✓ How to apply graph fixes and verify results
✓ When to use auto-fix vs. manual correction

---

## Workflow 3: Export and Share Graph Reports (4 minutes)

### Goal
Export a graph report as JSON or text for debugging, collaboration, or documentation.

### Steps

1. **Generate a report for your stack**
   - Open Graph Report panel
   - Select the stack you want to export
   - ✅ Report is displayed

2. **Choose export format**
   - Click **"Export as JSON"** for machine-readable format
   - Or click **"Export as Text"** for human-readable format
   - A download is triggered
   - ✅ File is saved to your downloads folder

3. **Review the exported file**
   - Open the JSON file in a text editor or IDE
   - You see:
     - `nodes`: array of all cards with their ports
     - `edges`: array of all connections
     - `issues`: array of validation errors (if any)
   - ✅ You have a complete graph snapshot

4. **Share with collaborators or AI**
   - Send the JSON file to teammates for debugging
   - Paste into AI chat for automated analysis
   - Use as documentation of your project structure
   - ✅ Report is portable

5. **Import a shared report (optional)**
   - If someone shares a report with you, paste the JSON into the import field
   - Click **"Load Report"**
   - The panel displays their graph structure
   - ✅ You can inspect others' graphs

### Troubleshooting
- **Export button not visible?** Ensure a stack is selected and report is generated
- **JSON is too large?** Large projects may produce multi-MB files; consider partial export
- **Import fails?** Validate JSON syntax and ensure it matches the report schema

### What You Learned
✓ How to export graph reports in JSON and text formats
✓ How to share reports with teammates or AI tools
✓ How to import and inspect others' graph reports
✓ When to use JSON vs. text export

---

## Key Concepts

### Node
A node represents a card instance in the graph. Each node has:
- A unique `nodeId`
- A `cardType` (references a card definition)
- Input and output `ports` (typed connection points)

### Edge
An edge represents a connection between two nodes. Each edge has:
- A `from` port (output of source node)
- A `to` port (input of destination node)
- Type validation (ports must be compatible)

### Type Compatibility
Ports must have compatible types to connect. These examples use convenience aliases from cardplay2.md §2.0.9:
- **Exact match**: `EventStream<NoteEvent>` → `EventStream<NoteEvent>` (where `NoteEvent = Event<Voice<MIDIPitch>>`)
- **Subtype (structural payload)**: `EventStream<Event<{ pitch: number; velocity: number; articulation: string }>>` → `EventStream<Event<{ pitch: number; velocity: number }>>`
- **Adapter**: Insert an adapter card to convert between types

### Merge Node
When multiple outputs connect to one input (fan-in), a merge node is automatically inserted to combine streams safely.

### Graph Invariants
The system enforces rules to keep graphs valid:
- All edges reference existing nodes and ports
- All port connections are type-compatible (or have adapters)
- Fan-in is explicit (merge nodes materialized)
- See [Graph Invariants](./graph-invariants.md) for full list

---

## Related Documentation

- [Graph Invariants](./graph-invariants.md) - Rules enforced by the validator
- [Learn: Stack Builder](./learn-stack-builder.md) - How to create and connect cards
- [Adapter Cost Model](./adapter-cost-model.md) - How type conversions work
- [State Model](./state-model.md) - How graph state is represented

---

## Tips and Tricks

- **Use Graph Report early and often** - Catch type errors before they compound
- **Simulate fixes before applying** - Preview changes to avoid unexpected results
- **Export reports for complex debugging** - Share with AI or teammates for analysis
- **Study the example reports** - Learn patterns from working stacks
- **Check Issues section first** - The most important info is at the top
- **Use text export for quick reading** - JSON is for machines, text is for humans

---

## Next Steps

- Explore [Learn: Command Palette](./learn-command-palette.md) to automate graph operations
- Read [Runtime Execution](./runtime-execution.md) to understand how graphs are compiled
- Study [Graph Invariants](./graph-invariants.md) for advanced validation rules
