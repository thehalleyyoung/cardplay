# AI Privacy & Data Handling

CardPlay’s AI is designed to run **fully offline**:

- Knowledge bases are bundled via `?raw` imports (no remote fetch).
- Learning/adaptation operates on local state (in-memory by default) and can be exported/imported explicitly.

## Learning data

The learning subsystem can export a full local backup:

- `exportLearningDataJSON()` / `importLearningData(...)` in `src/ai/learning/user-preferences.ts`

By default, the host decides where (and whether) to persist it (file, IndexedDB, localStorage).

## Verifying “no network calls”

There is a dedicated test that blocks `fetch` and asserts representative AI operations don’t use the network:

- `src/ai/learning/privacy-offline.test.ts`

