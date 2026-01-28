# Learn: Card Packs
Assumes canonical model and terminology in `cardplay2.md` (repo root).

This guide covers Cardplay's Card Pack system, which allows you to install, manage, and create collections of cards (`Card<A,B>` morphisms — instruments, effects, generators, transformers) to extend the system's functionality. See cardplay2.md §2.1 for the Card type definition.

## Prerequisites

- Completed [Learn: Getting Started](./learn-getting-started.md)
- Basic familiarity with cards and stacks
- See [Pack Format Reference](./pack-format-reference.md) for technical details

## Workflow 1: Installing Your First Card Pack (3 minutes)

### Goal
Browse available card packs, install one, and use its cards in your project.

### Steps

1. **Open the Card Pack Manager**
   - Click the **Card Packs** or **Library** tab
   - You see a list of installed packs and a browse/search interface
   - ✅ Pack manager is ready

2. **Browse available packs**
   - View the "Available" or "Registry" section
   - Packs are categorized: Instruments, Effects, Generators, Utilities
   - Each pack shows:
     - Name and version
     - Author/source
     - Description
     - Number of cards included
   - ✅ You can see what's available

3. **Preview pack contents**
   - Click on a pack to expand details
   - View the list of cards it contains
   - See example usage or screenshots
   - ✅ You know what you'll get

4. **Install a pack**
   - Click **"Install"** button
   - The pack downloads and validates
   - Progress indicator shows installation status
   - ✅ Pack installed successfully

5. **Use cards from the pack**
   - Open the Card Library panel
   - New cards from the pack appear in the library
   - Drag a card into a stack or add via menu
   - ✅ Pack cards are usable immediately

### Troubleshooting
- **Pack won't install?** Check network connection and pack signature/integrity
- **Cards not showing up?** Refresh the Card Library or restart Cardplay
- **Installation fails?** Check browser console for errors (permissions, sandbox restrictions)

### What You Learned
✓ How to open and browse the Card Pack Manager  
✓ How to preview pack contents before installing  
✓ How to install a pack  
✓ Installed cards appear in the Card Library  

---

## Workflow 2: Managing Installed Packs (4 minutes)

### Goal
View, update, disable, and uninstall card packs.

### Steps

1. **View installed packs**
   - In the Card Pack Manager, see the "Installed" section
   - Each pack shows:
     - Name, version, and author
     - Install date
     - Status: active or disabled
     - Update available indicator
   - ✅ You see all installed packs

2. **Check for updates**
   - Click **"Check for Updates"** button (global)
   - Or click a pack's update icon
   - If a new version is available, you see an **"Update"** button
   - ✅ Update status is shown

3. **Update a pack**
   - Click **"Update"** button
   - New version downloads and replaces the old one
   - Existing cards using the pack are automatically updated
   - ✅ Pack updated

4. **Disable a pack (without uninstalling)**
   - Right-click a pack or click the toggle icon
   - Select **"Disable"**
   - The pack's cards are hidden from the library
   - Existing instances in your project remain but are marked as "disabled"
   - ✅ Pack disabled

5. **Re-enable a pack**
   - Click the disabled pack
   - Select **"Enable"**
   - Cards reappear in the library
   - ✅ Pack re-enabled

6. **Uninstall a pack**
   - Right-click a pack or click the delete icon
   - Select **"Uninstall"**
   - Confirm uninstallation
   - Pack and its code are removed
   - Existing cards in your project show as "missing pack" errors
   - ✅ Pack uninstalled

### Troubleshooting
- **Update fails?** Check network and pack signature; some packs may not be backward-compatible
- **Can't disable a pack?** Packs with dependencies may require disabling dependent packs first
- **Uninstall warning?** Projects using pack cards will break—export a backup first

### What You Learned
✓ How to view and manage installed packs  
✓ How to update packs to new versions  
✓ How to disable packs temporarily  
✓ How to uninstall packs (and the consequences)  

---

## Workflow 3: Creating Your Own Card Pack (8 minutes)

### Goal
Build a simple card pack with custom cards using CardScript and share it.

### Steps

1. **Open the Pack Builder**
   - In the Card Pack Manager, click **"Create New Pack"**
   - You see a pack editor interface
   - ✅ Pack builder is ready

2. **Configure pack metadata**
   - Enter **Pack Name** (e.g., "My Synths")
   - Enter **Version** (e.g., "1.0.0")
   - Enter **Author** (your name or handle)
   - Enter **Description** (what the pack provides)
   - ✅ Metadata filled in

3. **Add a card definition**
   - Click **"Add Card"**
   - Choose **"CardScript"** as the format
   - Write a simple card (example below)
   - ✅ Card defined

4. **Example: Simple Sine Wave Generator**
   ```cardscript
   card SineTone {
     meta {
       name: "Sine Tone"
       category: "Generator"
       description: "Simple sine wave oscillator"
     }
     
     params {
       frequency: Float { default: 440.0, min: 20.0, max: 20000.0, unit: "Hz" }
       amplitude: Float { default: 0.5, min: 0.0, max: 1.0 }
     }
     
     ports {
       out audio: AudioOut
     }
     
     process {
       let phase = state.phase ?? 0.0;
       let freq = params.frequency;
       let amp = params.amplitude;
       
       for (let i = 0; i < blockSize; i++) {
         out.audio[i] = amp * Math.sin(2 * Math.PI * phase);
         phase += freq / sampleRate;
         if (phase >= 1.0) phase -= 1.0;
       }
       
       state.phase = phase;
     }
   }
   ```

5. **Validate the card**
   - Click **"Validate"** or **"Check Syntax"**
   - The system checks for type errors and compatibility
   - Fix any errors shown
   - ✅ Card is valid

6. **Test the card locally**
   - Click **"Test Card"**
   - A test instance appears in a sandbox stack
   - Verify it produces audio/output as expected
   - ✅ Card works

7. **Build the pack**
   - Click **"Build Pack"**
   - The system compiles the pack into a manifest
   - Optional: Sign the pack with a signature (for trust)
   - ✅ Pack built

8. **Export or publish**
   - **Export to file**: Download a `.pack.json` file
   - **Publish to registry** (if available): Submit to the community registry
   - Share the file or registry link with others
   - ✅ Pack shared

### Troubleshooting
- **Validation fails?** Check CardScript syntax; see [CardScript Reference](./cardscript-syntax-reference.md)
- **Test card crashes?** Add error handling and bounds checks
- **Build fails?** Ensure all required fields (name, version, entry) are filled in

### What You Learned
✓ How to create a new pack with the Pack Builder  
✓ How to write a simple card in CardScript  
✓ How to validate and test cards  
✓ How to build and export a pack  

---

## Key Concepts

### Card Pack
- A collection of one or more card definitions (instruments, effects, generators, transformers)
- Packaged in a versioned manifest file
- Can be installed, updated, and uninstalled

### Pack Manifest
- JSON envelope containing pack metadata and card code
- Fields: `name`, `version`, `author`, `description`, `entry` (CardScript source)
- Optional: `capabilities` (requested permissions), `dependencies` (other packs)
- See [Pack Format Reference](./pack-format-reference.md)

### CardScript
- A domain-specific language for defining cards
- Type-safe: ports, parameters, and state are typed
- Compiled into runnable card instances
- See [CardScript Syntax Reference](./cardscript-syntax-reference.md)

### Pack Registry
- A central repository of community-contributed packs
- Packs are indexed by name and version
- Registry API supports search, download, and version resolution
- See [Registry API Reference](./registry-api.md)

### Pack Signing
- Packs can be signed with a cryptographic signature
- Signatures verify integrity and authorship
- Two methods: SHA-256 hash (integrity), Ed25519 (author verification)
- See [Pack Signing and Trust Model](./pack-signing-trust-model.md)

### Pack Dependencies
- A pack can depend on other packs (best-effort)
- Dependency resolution is not strict—missing deps show warnings
- Use semantic versioning ranges (e.g., `"^1.0.0"`)

### Sandbox
- Card code runs in a restricted sandbox environment
- Limited access to browser APIs and system resources
- Capabilities system controls what a pack can request
- See [Sandbox Threat Model](./sandbox-threat-model.md)

---

## Tips and Tricks

1. **Start with simple packs**: One or two cards, basic parameters
2. **Test thoroughly**: Use the test sandbox before publishing
3. **Follow naming conventions**: `PascalCase` for card names, `camelCase` for params
4. **Document your cards**: Add descriptions and example usage
5. **Version carefully**: Semantic versioning (major.minor.patch)
6. **Sign your packs**: Builds trust with users
7. **Check dependencies**: Ensure required packs are listed
8. **Use the community registry**: Discover and share packs
9. **Read existing packs**: Learn by example—view source of popular packs
10. **Handle errors gracefully**: Add bounds checks and fallback values

---

## Common Workflows

### Installing a Popular Pack
```
1. Open Card Pack Manager
2. Browse "Popular" or "Featured" section
3. Preview pack contents
4. Click Install
5. Use new cards in your project
```

### Creating a Custom Effect Pack
```
1. Open Pack Builder
2. Set name: "My Audio FX"
3. Add cards: reverb, delay, chorus
4. Write CardScript for each effect
5. Validate and test
6. Build pack
7. Export to file
8. Share with friends or publish to registry
```

### Updating All Installed Packs
```
1. Open Card Pack Manager
2. Click "Check for Updates"
3. Review available updates
4. Click "Update All" or update individually
5. Confirm updates
6. Packs update automatically
```

### Troubleshooting a Broken Card
```
1. Find the card in a stack (shows error icon)
2. Open Card Pack Manager
3. Find the pack containing the card
4. Check if pack is disabled or needs update
5. Re-enable or update pack
6. Card resumes working
```

---

## Next Steps

- [Docs: Pack Format Reference](./pack-format-reference.md) - Manifest structure and fields
- [Docs: CardScript Syntax Reference](./cardscript-syntax-reference.md) - Language guide
- [Docs: Registry API](./registry-api.md) - How to publish packs
- [Docs: Sandbox Threat Model](./sandbox-threat-model.md) - Security considerations
- [Learn: Creating Custom Cards](./learn-custom-cards.md) - Advanced card building (if available)

---

## Reference

### Card Pack Manager Controls

| Control | Description |
|---------|-------------|
| Installed Tab | View and manage installed packs |
| Available Tab | Browse registry for new packs |
| Create New Pack | Open Pack Builder |
| Install Button | Download and install a pack |
| Update Button | Update pack to latest version |
| Disable Toggle | Temporarily hide pack's cards |
| Uninstall Button | Remove pack and its code |
| Check for Updates | Query registry for new versions |

### Pack Metadata Fields

| Field | Description |
|-------|-------------|
| `name` | Human-readable pack name |
| `version` | Semantic version (e.g., `1.2.3`) |
| `author` | Creator's name or handle |
| `description` | What the pack provides |
| `packId` | Stable identifier (optional) |
| `entry.kind` | Format (`cardscript`) |
| `entry.source` | Card code |
| `capabilities` | Requested permissions (optional) |
| `dependencies` | Other packs required (optional) |
| `signature` | Integrity and author signatures (optional) |

### Common Pack Categories

| Category | Examples |
|----------|----------|
| Instruments | Synths, samplers, drum machines |
| Effects | Reverb, delay, distortion, EQ |
| Generators | LFOs, envelopes, sequencers |
| Transformers | Note quantizers, harmonizers, arpeggios |
| Utilities | Mixers, routers, analyzers |
| Notation | Chord symbols, dynamics, articulation |

---

## Troubleshooting

**Q: Pack installation fails—why?**  
A: Check network connection, pack signature, and browser sandbox restrictions. Some browsers block unsigned code.

**Q: Can I install packs offline?**  
A: Yes, if you have a `.pack.json` file. Use "Import from file" instead of browsing the registry.

**Q: What happens if I uninstall a pack used in my project?**  
A: Cards from that pack show as "missing" errors. Export a backup before uninstalling.

**Q: Can I edit an installed pack?**  
A: Not directly—packs are immutable. Export the pack source, edit, and build a new version.

**Q: How do I trust a pack?**  
A: Check the signature (SHA-256 or Ed25519). Packs from known authors or the official registry are safer. Review the code if uncertain.

**Q: Can packs access my files or network?**  
A: No—packs run in a sandbox with restricted capabilities. Only requested capabilities are granted.

**Q: What if a pack has a bug?**  
A: Disable the pack and report the issue to the author. Downgrade to an older version if available.

**Q: Can I share packs with friends without using the registry?**  
A: Yes—export to `.pack.json` and send the file. They can import it locally.

**Q: Are packs backward-compatible?**  
A: Depends on the pack author. Semantic versioning helps: major version changes may break compatibility.

**Q: How do I contribute a pack to the community?**  
A: Build your pack, sign it, and submit to the registry via the Publish flow (or manual API submission).
