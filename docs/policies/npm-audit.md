# `npm audit` policy
Assumes canonical model and terminology in `cardplay2.md` (repo root).

This project is a local-only tool and may use dev dependencies that occasionally report vulnerabilities.

Policy:

- Fix high/critical vulnerabilities in runtime dependencies promptly.
- For dev-only vulnerabilities, prefer upgrading during normal dependency maintenance unless there is a clear exploit path.

