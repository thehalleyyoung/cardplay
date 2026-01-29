#!/usr/bin/env python3
"""
Update currentsteps-branchA.md to mark Phase F tasks as complete
"""

import re

# Read the file
with open('currentsteps-branchA.md', 'r') as f:
    content = f.read()

# Phase F updates - Notation Board
updates_notation = [
    ('F004', 'Set `compositionTools` to full-manual: all tools disabled/hidden'),
    ('F005', "Choose `primaryView: 'notation'` for this board"),
    ('F006', 'Define layout panels: players (left), score (center), properties (right)'),
    ('F007', 'Add deck `notation-score` as the primary deck in the center panel'),
    ('F008', 'Add deck `instrument-browser` in the left panel (manual instruments only)'),
    ('F009', 'Add deck `properties` in the right panel (selection inspector)'),
    ('F010', 'Add deck `dsp-chain` as a secondary panel/tab (manual effect chain)'),
    ('F011', 'Define default deck layout states (tabs, sizes) via `createDefaultLayoutRuntime`'),
    ('F012', 'Ensure deck factories exist for `notation-score/instrument-browser/properties/dsp-chain`'),
    ('F013', 'Bind notation deck to `ActiveContext.activeStreamId` (score edits write to shared store)'),
    ('F014', 'Ensure notation deck uses read/write adapter (`notation-store-adapter.ts`)'),
    ('F015', 'Ensure instrument browser only lists allowed manual instrument cards (Phase D gating)'),
    ('F016', 'Ensure dsp-chain deck only accepts effect cards (Phase D drop validation)'),
    ('F017', 'Ensure properties deck can edit selected notation events without breaking type safety'),
    ('F018', 'Add board-specific shortcut map (note entry, selection tools, zoom, print/export)'),
    ('F019', 'Register board shortcuts on activation; unregister on switch away'),
    ('F020', 'Add board theme defaults (manual control color, notation-focused typography)'),
    ('F021', 'Add board to `registerBuiltinBoards()` and ensure it appears in board browser'),
    ('F022', 'Add board to recommendations for "traditional-composer"'),
    ('F030', 'Lock Notation Manual board once UX, gating, and sync are stable'),
]

# Phase F updates - Basic Tracker Board
updates_tracker = [
    ('F031', 'Create `cardplay/src/boards/builtins/basic-tracker-board.ts` board definition'),
    ('F032', 'Set id/name/description/icon to match `cardplayui.md` Basic Tracker Board'),
    ('F033', 'Set `controlLevel: \'full-manual\'` and "pure tracker" philosophy string'),
    ('F034', 'Set `compositionTools` to full-manual: all tools disabled/hidden'),
    ('F035', "Choose `primaryView: 'tracker'` for this board"),
    ('F036', 'Define layout panels: sidebar (left), pattern editor (center), optional properties (right/bottom)'),
    ('F037', 'Add deck `pattern-editor` as primary deck in center panel'),
    ('F038', 'Add deck `instrument-browser` in sidebar (tracker instruments/samplers)'),
    ('F040', 'Add deck `properties` for editing selected events/track settings'),
    ('F041', 'Ensure tracker deck uses the canonical tracker UI (panel vs card) chosen in Phase A'),
    ('F042', 'Ensure tracker deck binds to `ActiveContext.activeStreamId` and recomputes view from store'),
    ('F043', 'Ensure tracker deck uses tracker shortcuts (hex entry, note entry, navigation)'),
    ('F044', 'Ensure tracker deck renders beat highlights based on transport/PPQ settings'),
    ('F045', 'Ensure instrument browser lists only manual instruments (no generators)'),
    ('F046', 'Ensure dsp-chain drop rules allow only effects; deny generators with clear reason'),
    ('F047', 'Add board shortcut overrides (pattern length, octave, follow playback, toggle loop)'),
    ('F048', 'Add board theme defaults (tracker monospace font, classic column colors)'),
    ('F049', 'Add board to `registerBuiltinBoards()` and ensure it appears under Manual category'),
    ('F050', 'Add board to recommendations for "tracker-purist" and "renoise-user"'),
    ('F060', 'Lock Basic Tracker board once gating, sync, and shortcuts match the manual spec'),
]

# Phase F updates - Basic Sampler Board  
updates_sampler = [
    ('F061', 'Create `cardplay/src/boards/builtins/basic-sampler-board.ts` board definition'),
    ('F062', 'Set id/name/description/icon to match `cardplayui.md` Basic Sampler Board'),
    ('F063', 'Set `controlLevel: \'full-manual\'` and "you chop, you arrange" philosophy string'),
    ('F064', 'Set `compositionTools` to full-manual: all tools disabled/hidden'),
    ('F065', "Choose `primaryView: 'sampler'` (or `'session'` if sampler is clip-based) and document choice"),
    ('F066', 'Define layout panels: sample pool (left), arrangement/timeline (center), waveform editor (bottom)'),
    ('F067', 'Add deck `sample-browser` in left panel (sample pool)'),
    ('F068', 'Add deck `timeline` in center panel (manual arrangement of clips/samples)'),
    ('F069', 'Add deck `dsp-chain` for processing (manual effects)'),
    ('F070', 'Add deck `properties` for sample/clip/event settings'),
    ('F071', 'Ensure sample browser integrates waveform preview (`sample-waveform-preview.ts`)'),
    ('F072', 'Ensure sample browser supports import and tagging (manual operations only)'),
    ('F073', 'Ensure timeline deck can host audio clips or sample-trigger clips (define MVP representation)'),
    ('F077', 'Ensure properties panel can edit `ClipRecord` (duration/loop) and sample metadata'),
    ('F078', 'Add board shortcut map (import, chop, zoom waveform, audition sample, toggle snap)'),
    ('F079', 'Add board theme defaults (sampler colors, waveform contrast, large transport buttons)'),
    ('F080', 'Add board to `registerBuiltinBoards()` and show it under Manual category'),
    ('F081', 'Add board to recommendations for "sample-based" workflows'),
    ('F090', 'Lock Basic Sampler board once core manual sampling loop is stable'),
]

# Phase F updates - Basic Session Board
updates_session = [
    ('F091', 'Create `cardplay/src/boards/builtins/basic-session-board.ts` board definition'),
    ('F092', 'Set id/name/description/icon to match `cardplayui.md` Basic Session Board'),
    ('F093', 'Set `controlLevel: \'full-manual\'` and "manual clip launching" philosophy string'),
    ('F094', 'Set `compositionTools` to full-manual: all tools disabled/hidden'),
    ('F095', "Choose `primaryView: 'session'` for this board"),
    ('F096', 'Define layout panels: clip-session (center), instrument browser (left), mixer (bottom), properties (right)'),
    ('F097', 'Add deck `clip-session` as primary deck in the center panel'),
    ('F098', 'Add deck `instrument-browser` in the left panel (manual instruments only)'),
    ('F099', 'Add deck `mixer` in the bottom panel (mixing controls + meters)'),
    ('F100', 'Add deck `properties` in the right panel (clip/event inspector)'),
    ('F101', 'Ensure session grid panel is fully ClipRegistry-backed (no local clip copies)'),
    ('F102', 'Ensure selecting a slot sets `ActiveContext.activeClipId` and `activeStreamId`'),
    ('F103', 'Ensure clip launch uses transport quantization (bar/beat) and reflects queued/playing state'),
    ('F106', 'Ensure mixer panel reflects track mute/solo/arm and writes changes to shared state'),
    ('F107', 'Ensure properties panel edits clip name/color/loop and persists via ClipRegistry'),
    ('F108', 'Add board shortcut map (launch clip, launch scene, stop, arm track, duplicate slot)'),
    ('F109', 'Add board theme defaults (session grid contrast, clip color readability)'),
    ('F110', 'Add board to `registerBuiltinBoards()` and show it under Manual category'),
    ('F111', 'Add board to recommendations for "ableton-user" manual workflows (no generators)'),
    ('F119', 'Ensure the manual session board can coexist with arrangement timeline (clips share registry)'),
    ('F120', 'Lock Basic Session board once clip creation/launch + mixer + properties loop is stable'),
]

all_updates = updates_notation + updates_tracker + updates_sampler + updates_session

for task_id, _ in all_updates:
    # Replace - [ ] FXXX with - [x] FXXX ✅
    pattern = f'- \\[ \\] {task_id} '
    replacement = f'- [x] {task_id} '
    content = re.sub(pattern, replacement, content)
    
    # Add ✅ at end of line if not already there
    pattern = f'(- \\[x\\] {task_id} .+?)(\\.)?$'
    replacement = r'\1. ✅'
    content = re.sub(pattern, replacement, content, flags=re.MULTILINE)

# Write back
with open('currentsteps-branchA.md', 'w') as f:
    f.write(content)

print("Updated Phase F tasks in currentsteps-branchA.md")
