# Builtin samples (predownloaded)
Assumes canonical model and terminology in `cardplay2.md` (repo root).

These sample ids are available out of the box (no import needed). Use them as:

- `note.payload.sampleId = "<sample id>"` to trigger a single sample (note events are `Event<Voice<P>>` with `payload` per cardplay2.md §2.0.1)
- `note.payload.sampleId = "<bank id>"` to trigger a Sampler bank (multi-sample instrument)

Tip: In the **Samples** panel, use the filter box with prefixes like `drum:` / `perc:` / `inst:` / `fx:` / `bank:`.

## Drums (single samples)

Legacy ids (kept for backwards compatibility):

- `kick`, `snare`, `hat`, `clap`, `tom`, `rim`, `perc`, `bass`

Variants:

- Kicks: `drum:kick:808`, `drum:kick:short`, `drum:kick:punch`, `drum:kick:soft`
- Snares: `drum:snare:acoustic`, `drum:snare:crisp`, `drum:snare:body`
- Hats: `drum:hat:closed`, `drum:hat:open`, `drum:hat:lofi` (choke group “hat”)
- Cymbals: `drum:cymbal:crash`, `drum:cymbal:ride`
- Toms: `drum:tom:low`, `drum:tom:mid`, `drum:tom:high`
- Extras: `drum:clap:wide`, `drum:rimshot`

## Percussion (single samples)

- `perc:claves`, `perc:cowbell`, `perc:shaker`, `perc:tamb`

## Instruments (single samples; good for banks)

- Plucks: `inst:pluck:C3`, `inst:pluck:C4`, `inst:pluck:C5`
- Bells: `inst:bell:C4`, `inst:bell:C5`

## FX (single samples)

- `fx:sweep:up`, `fx:sweep:down`

## Builtin sampler banks (multi-sample instruments)

- `bank:drums:classic` (maps common drum notes to `kick/snare/hat/...`)
- `bank:drums:electro` (maps common drum notes to `drum:*` variants)
- `bank:inst:pluck` (multi-zone pluck instrument)
- `bank:inst:bell` (multi-zone bell instrument)
