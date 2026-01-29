# AI FAQ

## Is this “AI” a model?

No. It’s a **rule-based Prolog system** (knowledge bases + inference) running locally.

## Does CardPlay’s AI send data to a server?

No by default. Knowledge bases are bundled locally and learning data stays local unless the host explicitly exports/persists it.

See: `privacy.md`

## How do I add new rules?

Add or extend a `.pl` file under `src/ai/knowledge/`, then expose it via a loader and a TypeScript query wrapper.

See: `kb-architecture.md`

