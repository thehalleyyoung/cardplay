# UI Storage Keys (localStorage)
Assumes canonical model and terminology in `cardplay2.md` (repo root).

Cardplay stores some UI preferences and UI layout state in `localStorage` under stable, versioned keys.

## Layout

These keys are included in the **Layout** dialog export/import:

- `cardplay.ui.panels.v1`: panel visibility map (key -> boolean)
- `cardplay.ui.panelOrder.v1`: panel host order (array of panel keys)
- `cardplay.ui.panelDock.v1`: panel docking (key -> `primary|secondary`)
- `cardplay.ui.panelPins.v1`: pinned panels list (array of panel keys)
- `cardplay.ui.secondaryWidth.v1`: secondary column width (px)

## UI preferences

These are not currently included in layout export/import:

- `cardplay.ui.theme.v1`: `light|dark`
- `cardplay.ui.prefs.v1`: favorites/recents (panel keys, card types, container ids)
- `cardplay.ui.tutorial.v1.dismissed`: tutorial overlay dismissed flag

## Local “share links”

“Share link (local)” for Graph Report stores payloads keyed by id:

- `cardplay.share.graphReport.v1.<id>`: JSON payload for a shared Graph Report view

These “links” are **device-local** (they won’t work on another machine or after clearing storage).

