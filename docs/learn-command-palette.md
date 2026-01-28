# Learn: Command Palette
Assumes canonical model and terminology in `cardplay2.md` (repo root).

This guide covers the Command Palette panel, a power-user tool for running text commands, chaining actions, and accessing advanced features without clicking through menus.

## Prerequisites

- Completed [Learn: Getting Started](./learn-getting-started.md)
- Basic familiarity with Cardplay's core concepts

## Workflow 1: Basic Command Execution (3 minutes)

### Goal
Run simple commands using the Command Palette.

### Steps

1. **Open the Command Palette panel**
   - Click the **Command Palette** tab
   - You see a text input area and preview

2. **Focus the input**
   - Click in the text area
   - Or press **Ctrl/Cmd+K** (keyboard shortcut)
   - ✅ Ready to type commands

3. **Type your first command**
   - Type: `help`
   - Press **Enter** (or click **"Run"** button)
   - 🎵 The preview shows all available commands
   - ✅ You've executed your first command

4. **Try a simple command**
   - Type: `new-pattern "Beat"`
   - Press **Enter**
   - A new pattern container (`Container<"pattern">` — see cardplay2.md §2.0.1) is created with the name "Beat"
   - ✅ Command executed successfully

5. **View the result**
   - The preview shows the command result
   - Success: Green text or confirmation message
   - Error: Red text with explanation
   - ✅ Immediate feedback

### Troubleshooting
- **Command not found?** Type `help` to see all available commands
- **Syntax error?** Check quotes for strings, commas for multiple args
- **Nothing happens?** Ensure you pressed Enter or clicked Run

### What You Learned
✓ How to open and focus Command Palette  
✓ How to run commands  
✓ How to view command results  
✓ The `help` command lists all commands  

---

## Workflow 2: Chaining Multiple Commands (3 minutes)

### Goal
Run multiple commands in sequence using semicolons or newlines.

### Steps

1. **Chain with semicolons**
   - Type: `new-pattern "Drums"; add-note ctr-1 0 24 36 100`
   - This creates a pattern AND adds a note
   - Press **Enter**
   - ✅ Both commands execute in order

2. **Chain with newlines**
   - Type:
     ```
     new-pattern "Bass"
     add-note ctr-2 0 96 40 110
     add-note ctr-2 96 96 40 100
     ```
   - Press **Enter**
   - ✅ All three lines execute sequentially

3. **Use Shift+Enter for multi-line editing**
   - While typing, press **Shift+Enter** to add a new line
   - This allows formatting complex command sequences
   - Press **Enter** when ready to run
   - ✅ Clean, readable command scripts

4. **Undo grouping with Ctrl/Cmd+Enter**
   - Type multiple commands
   - Press **Ctrl/Cmd+Enter** instead of Enter
   - All commands execute as **one undo group**
   - Pressing Undo reverses all changes at once
   - ✅ Batch operations with atomic undo

### Troubleshooting
- **Commands run in wrong order?** Check that semicolons or newlines separate them
- **Undo doesn't work?** Use Ctrl/Cmd+Enter for grouped undo
- **Syntax error in middle command?** The whole chain may fail—fix and retry

### What You Learned
✓ Semicolons and newlines chain commands  
✓ Shift+Enter for multi-line editing  
✓ Ctrl/Cmd+Enter for grouped undo  

---

## Workflow 3: Advanced Commands and API Calls (4 minutes)

### Goal
Use advanced commands and call internal APIs directly.

### Steps

1. **Explore available commands**
   - Type: `help`
   - Press **Enter**
   - The preview lists all commands with syntax
   - Examples:
     - `new-pattern <name>`
     - `add-note <containerId> <start> <duration> <pitch> <velocity>`
     - `delete-event <eventId>`
     - `select-container <containerId>`

2. **Use API calls**
   - Commands starting with `api-get` or `api-post` call internal HTTP-like endpoints
   - Example: `api-get /api/stack-graph/stack1`
   - This fetches the graph structure for `stack1`
   - ✅ Direct access to internal state

3. **Inspect state**
   - Type: `api-get /api/state/project`
   - View the entire project state (containers, cards, stacks)
   - ✅ Debugging tool

4. **Beginner commands**
   - Some commands are designed for beginners:
     - `make-noise`: Quick sound test
     - `panic-stop`: Emergency stop all audio
     - `reset-defaults`: Restore default settings
     - `export-wav`: Export audio to file
   - ✅ Quick actions without navigating UI

### Troubleshooting
- **API call fails?** Check endpoint path and parameters
- **Command list too long?** Scroll or search for specific keywords
- **Beginner commands not working?** Check that audio engine is running

### What You Learned
✓ How to list all commands with `help`  
✓ API calls for internal state access  
✓ Beginner commands for quick actions  

---

## Key Concepts

### Command
- A text string that triggers an action or API call
- Syntax: `command-name arg1 arg2 ...`
- Example: `new-pattern "Melody"`

### Chaining
- Running multiple commands in sequence
- Use semicolons (`;`) or newlines
- Example: `cmd1; cmd2; cmd3`

### Undo Grouping
- Ctrl/Cmd+Enter runs commands as one atomic operation
- Single Undo reverses all changes
- Useful for multi-step workflows

### API Calls
- Commands starting with `api-get` or `api-post`
- Access internal endpoints (state, graph, etc.)
- Example: `api-get /api/containers`

### Preview
- The area below the input showing command results
- Green = success, Red = error
- Shows command parsing and execution feedback

### Activity-Safe Mode
- When in guided activities, only certain commands are allowed
- Prevents breaking activity state
- Safe commands: `help`, view-only operations

---

## Tips and Tricks

1. **Ctrl/Cmd+K**: Focus Command Palette from anywhere
2. **Start with `help`**: Learn all available commands
3. **Use quotes for strings**: `new-pattern "My Pattern"` (with spaces)
4. **Chain for workflows**: `new-pattern "X"; add-note ...; select-container ...`
5. **Ctrl/Cmd+Enter for undo**: Group related commands
6. **API for debugging**: `api-get /api/state/...` to inspect state
7. **Beginner commands**: `make-noise`, `panic-stop`, `reset-defaults`
8. **Copy/paste command scripts**: Build libraries of common operations

---

## Common Workflows

### Creating a Pattern with Notes
```
new-pattern "Kick Pattern"
add-note ctr-1 0 24 36 110
add-note ctr-1 96 24 36 100
add-note ctr-1 192 24 36 105
add-note ctr-1 288 24 36 95
```
Press Ctrl/Cmd+Enter to run as one undo group.

### Inspecting Project State
```
api-get /api/state/project
```
View containers, cards, stacks, metadata.

### Quick Audio Test
```
make-noise
```
Plays a test tone to verify audio is working.

### Emergency Stop
```
panic-stop
```
Stops all audio immediately.

---

## Next Steps

- [Docs: Command Reference](./command-reference.md) - Full list of commands (if available)
- [Docs: API Endpoints](./api-endpoints.md) - Internal API documentation (if available)

---

## Reference

### Command Palette Controls

| Control | Description |
|---------|-------------|
| Input Area | Type commands here |
| Run Button | Execute commands (or press Enter) |
| Preview | Shows command results |
| Ctrl/Cmd+K | Focus input from anywhere |
| Shift+Enter | Add newline (don't execute) |
| Ctrl/Cmd+Enter | Execute as one undo group |

### Common Commands

| Command | Syntax | Description |
|---------|--------|-------------|
| help | `help` | List all commands |
| new-pattern | `new-pattern <name>` | Create a new pattern container |
| add-note | `add-note <ctrId> <start> <dur> <pitch> <vel>` | Add a note event |
| delete-event | `delete-event <eventId>` | Delete an event |
| select-container | `select-container <ctrId>` | Select a container |
| api-get | `api-get <path>` | Call internal API (GET) |
| api-post | `api-post <path> <body>` | Call internal API (POST) |
| make-noise | `make-noise` | Quick audio test |
| panic-stop | `panic-stop` | Emergency audio stop |

---

## Troubleshooting

**Q: Command not recognized**  
A: Type `help` to see all available commands. Check spelling and syntax.

**Q: Syntax error**  
A: Check for proper quoting of strings, correct number of arguments, and commas/spaces.

**Q: Command executes but nothing happens**  
A: Check the preview for error messages. Some commands may require specific state (e.g., selected container).

**Q: How do I undo commands?**  
A: Use Ctrl/Cmd+Z as usual. For grouped undo, use Ctrl/Cmd+Enter when running commands.

**Q: Can I save command scripts?**  
A: Not directly in Cardplay yet. Copy/paste from a text editor for now.

**Q: What's Activity-Safe Mode?**  
A: During guided activities, only safe commands (view-only, non-destructive) are allowed to prevent breaking activity state.

**Q: Can I extend the command system?**  
A: Yes—commands are extensible. Write new command parsers following the API (see docs/commands.md if available).
