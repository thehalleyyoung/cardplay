# Pack installation UX guide (Phase 9)
Assumes canonical model and terminology in `cardplay2.md` (repo root).

The Pack panel supports:

- installing a new pack from the editor
- updating an existing pack (Edit → Update)
- reloading a pack (reinstall current revision)
- rolling back to the previous revision
- importing/exporting packs as JSON bundles
- importing from URL (fetch JSON bundle)

## Permissions prompts

When installing:

- Trust level is selected (`trusted`, `local`, `untrusted`)
- Capabilities can be granted (high-risk caps are unchecked by default)
- A “remember” toggle persists the decision for the pack id

## Conflict resolution (imports)

If a pack id already exists and differs, you’ll be prompted:

- `overwrite` (replace/update)
- `new` (install under a fresh id)
- `skip`

