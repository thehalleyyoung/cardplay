# Learn: Persistence
Assumes canonical model and terminology in `cardplay2.md` (repo root).

This guide covers Cardplay's persistence system, which automatically saves your work (`AppState` containing containers, cards, stacks, and session data) to browser storage and allows you to manage multiple project slots, with optional compression and encryption.

## Prerequisites

- Completed [Learn: Getting Started](./learn-getting-started.md)
- Basic familiarity with creating and editing projects

## Workflow 1: Automatic Saves (2 minutes)

### Goal
Understand how autosave works and verify your project is being saved automatically.

### Steps

1. **Make a change to your project**
   - Add a new clip, card, or note
   - Or edit existing content
   - ✅ You've modified the project state

2. **Observe the autosave indicator**
   - Look for a save status indicator (e.g., "Saved", "Saving...", or a disk icon)
   - The indicator shows when autosave is active
   - ✅ Autosave is working

3. **Close and reopen the browser tab**
   - Close Cardplay completely
   - Reopen the URL in a new tab
   - Your project loads automatically with all changes preserved
   - ✅ Your work persists across sessions

4. **Check last saved time**
   - Look for a "Last saved: X seconds ago" message
   - This shows when the most recent autosave occurred
   - ✅ You can verify save freshness

### Troubleshooting
- **Changes not saving?** Check that browser storage is enabled and not full
- **Project doesn't load?** Check browser console for storage errors
- **Autosave too frequent?** Autosave throttles to avoid excessive writes

### What You Learned
✓ Autosave happens automatically after changes  
✓ Projects persist in browser storage (localStorage/IndexedDB)  
✓ Reopening Cardplay restores your last state  
✓ Last saved time shows save freshness  

---

## Workflow 2: Managing Project Slots (4 minutes)

### Goal
Use multiple project slots to organize different works-in-progress.

### Steps

1. **Open the Persistence panel**
   - Click the **Persistence** or **Storage** tab
   - You see the slot manager interface
   - ✅ Panel is ready

2. **View the current slot**
   - The active slot is highlighted (e.g., "Default")
   - Metadata shows: name, last saved time, size
   - ✅ You know which slot is active

3. **Create a new slot**
   - Click **"New Slot"** button
   - Enter a slot name (e.g., "Beat Sketch", "Song Draft")
   - Press **Enter** or **"Create"**
   - A new empty project opens in the new slot
   - ✅ New slot created and active

4. **Switch between slots**
   - Click on a different slot in the list
   - Confirm the switch if prompted (unsaved changes warning)
   - The project loads from the selected slot
   - ✅ You can switch projects easily

5. **Rename a slot**
   - Right-click a slot or click the edit icon
   - Select **"Rename"**
   - Enter new name and confirm
   - ✅ Slot renamed

6. **Delete a slot**
   - Right-click a slot or click the delete icon
   - Select **"Delete"**
   - Confirm deletion (this is permanent!)
   - The slot and its data are removed
   - ✅ Slot deleted

### Troubleshooting
- **Slot list empty?** Create a new slot or check if autosave created one automatically
- **Can't switch slots?** Save or discard changes in the current slot first
- **Slot won't delete?** Ensure you're not trying to delete the active slot

### What You Learned
✓ Slots let you organize multiple projects  
✓ How to create, switch, rename, and delete slots  
✓ Each slot stores a complete project snapshot  
✓ Active slot is highlighted and auto-saved  

---

## Workflow 3: Export, Import, and Encryption (5 minutes)

### Goal
Export project snapshots to files, import from files, and use encryption for sensitive projects.

### Steps

1. **Export the current project**
   - In the Persistence panel, click **"Export"** or **"Download"**
   - Choose a format:
     - **JSON**: Uncompressed, human-readable
     - **Compressed**: Gzip-compressed JSON (smaller file)
   - Save the file (e.g., `my-project-2026-01-27.json`)
   - ✅ Project exported to disk

2. **Import a project file**
   - Click **"Import"** or **"Load from file"**
   - Select a previously exported `.json` file
   - The project loads into the current slot (or a new slot)
   - ✅ Project imported successfully

3. **Enable encryption for a slot**
   - Select a slot (or create a new one)
   - Click **"Enable Encryption"** or the lock icon
   - Enter a passphrase (store this securely!)
   - Confirm the passphrase
   - ✅ Slot is now encrypted with AES-GCM

4. **Unlock an encrypted slot**
   - Try to switch to an encrypted slot
   - You are prompted for the passphrase
   - Enter the correct passphrase
   - The slot unlocks and loads
   - ✅ Encrypted data decrypted

5. **Export an encrypted project**
   - Export from an encrypted slot
   - The exported file is **also encrypted**
   - You must provide the passphrase when importing
   - ✅ Encrypted export created

### Troubleshooting
- **Export fails?** Check browser allows file downloads
- **Import fails?** Verify the file is a valid Cardplay export (JSON envelope)
- **Wrong passphrase?** Re-enter carefully; passphrases are case-sensitive
- **Forgot passphrase?** Encrypted data cannot be recovered without it

### What You Learned
✓ Export projects to JSON files (compressed or not)  
✓ Import projects from files  
✓ Encrypt slots with a passphrase (AES-GCM)  
✓ Encrypted exports preserve encryption  
✓ Passphrases are required to unlock encrypted slots  

---

## Key Concepts

### Autosave
- Cardplay automatically saves changes to browser storage
- Throttled to avoid excessive writes (typically every few seconds after changes)
- No manual save button needed (but can be triggered manually if provided)

### Slot
- A named storage location for a complete project snapshot
- Each slot contains: containers, cards, stacks, session, mixer, settings
- Slots are isolated—changes in one slot don't affect others

### Persistence Envelope
- Saved data is wrapped in a versioned envelope
- Contains: schema version, saved timestamp, encoding (compression/encryption), payload
- See [Persistence Format Reference](./persistence-format.md) for details

### Compression
- Uses browser `CompressionStream` (gzip) to reduce storage size
- Transparent to users—projects compress/decompress automatically
- Falls back to uncompressed if browser doesn't support compression

### Encryption
- Uses WebCrypto API with AES-GCM
- Passphrase → PBKDF2 → encryption key
- Random salt and IV stored in envelope metadata
- Encrypted data cannot be read without the passphrase

### Migration
- When loading older projects, schema version is migrated forward
- Each migration step is validated to ensure data integrity
- Unknown future versions are rejected (backward compatibility, not forward)

---

## Tips and Tricks

1. **Use descriptive slot names**: "Lo-fi Beat 3" instead of "Slot 1"
2. **Export before major changes**: Create a backup export before refactoring
3. **Encrypt sensitive projects**: Use encryption for unreleased tracks or private work
4. **Compressed exports save space**: Use gzip compression for large projects
5. **Check last saved time**: Verify autosave is working after big edits
6. **Don't rely on browser storage alone**: Export important projects regularly
7. **Test passphrase recovery**: Write down passphrases securely—there's no recovery
8. **Switch slots for experiments**: Use a new slot to try ideas without affecting main work

---

## Common Workflows

### Creating a Backup Before Experimenting
```
1. Open Persistence panel
2. Export current project → save to disk
3. Create new slot "Experiment"
4. Make radical changes
5. If experiment fails, delete "Experiment" slot and continue with original
```

### Organizing Multiple Projects
```
1. Slot "Beat Sketch": rough ideas, loops
2. Slot "Song Draft": structured arrangement
3. Slot "Final Mix": polished, ready for export
4. Switch between slots as you work
```

### Sharing a Project Securely
```
1. Export project with encryption enabled
2. Send file + passphrase separately (secure channel)
3. Recipient imports file and enters passphrase
4. Project loads with all content intact
```

### Recovering After Browser Crash
```
1. Reopen Cardplay
2. Default slot loads automatically
3. Check "Last saved" time to see how much was saved
4. If autosave was recent, minimal work lost
```

---

## Next Steps

- [Docs: Persistence Format Reference](./persistence-format.md) - Technical details of the envelope format
- [Docs: State Schema Versioning](./state-schema-versioning.md) - How migrations work
- [Learn: Export and Render](./learn-export.md) - Exporting audio/stems (if available)

---

## Reference

### Persistence Panel Controls

| Control | Description |
|---------|-------------|
| Slot List | Shows all saved project slots |
| Active Slot | Highlighted slot being autosaved |
| New Slot | Create a new empty project slot |
| Rename Slot | Change slot name |
| Delete Slot | Remove slot and its data (permanent) |
| Export | Download project to JSON file |
| Import | Load project from JSON file |
| Enable Encryption | Encrypt slot with passphrase |
| Unlock | Enter passphrase to open encrypted slot |
| Last Saved | Shows when autosave last ran |

### Storage Keys

| Key | Description |
|-----|-------------|
| `cardplay.appstate.v1` | Default slot baseline |
| `cardplay.appstate.slots.v1` | Slot index/metadata |
| `cardplay.appstate.slot.<id>.v1` | Individual slot payload |

### Envelope Fields

| Field | Description |
|-------|-------------|
| `envelopeVersion` | Always `1` for current format |
| `schemaVersion` | State schema version (migrated forward) |
| `savedAt` | Unix timestamp (milliseconds) |
| `encoding` | `{compression, encryption}` flags |
| `payload` | JSON string or base64-encoded bytes |
| `meta` | Slot ID, name, encryption params (IV, salt) |

---

## Troubleshooting

**Q: My project didn't save—why?**  
A: Check browser storage quota. Clear space or export to files. Some browsers disable storage in private/incognito mode.

**Q: Can I use Cardplay offline?**  
A: Yes, once loaded. Persistence works offline (browser storage). Only export/import require file access.

**Q: What happens if I exceed storage quota?**  
A: Autosave fails. Export large projects and delete old slots. Use compression to save space.

**Q: Can I sync projects across devices?**  
A: Not yet—browser storage is local. Export projects and import on other devices manually.

**Q: How secure is encryption?**  
A: AES-GCM via WebCrypto is strong. Security depends on passphrase strength. Use a long, unique passphrase.

**Q: Can I recover a deleted slot?**  
A: No—deletion is permanent. Export important projects before deleting.

**Q: What if I forget my passphrase?**  
A: Encrypted data is unrecoverable without the passphrase. Write passphrases down securely.

**Q: Do exported files work in future versions of Cardplay?**  
A: Yes—schema migrations ensure forward compatibility. Older exports load and migrate automatically.
