# Sandbox threat model + limitations (Phase 9)
Assumes canonical model and terminology in `cardplay2.md` (repo root).

This is a pragmatic, incremental sandbox:

- CardScript is a custom language (no JS eval), so code execution is constrained.
- Capabilities gate host effects.
- Untrusted packs are restricted by registry policy.
- Worker-based preflight is best-effort and primarily used to reduce UI jank and enforce timeouts.

Limitations (current):

- Worker isolation is not a hard security boundary for a hostile browser environment.
- Memory/CPU budgets are best-effort (timeouts + output limiting).
- External pack distribution is treated as untrusted by default.

