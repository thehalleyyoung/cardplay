# Learning & Personalization

CardPlay’s learning system tracks *local-only* usage patterns and preferences to improve:

- Board recommendations
- Generator defaults (style/seed/constraints)
- Advisor answer framing (simplify for beginners, suggest likely next steps)

This system is **rule-based**: learned data is synced into a **dynamic Prolog knowledge base** (`src/ai/knowledge/user-prefs.pl`) and then queried via normal Prolog rules.

It also includes an **adaptation layer** (`src/ai/knowledge/adaptation.pl`) that uses skill estimation, progressive disclosure, and error-pattern rules to adjust suggestions and UI visibility.

## What gets tracked

The core preference tracker lives in `src/ai/learning/user-preferences.ts` and learns from host events such as board switches and generator usage.

Typical examples:

- Boards: most-used boards, recent usage, common transitions between boards
- Layouts: favorite deck layouts per board
- Generators: favorite seeds, most-used styles, saved constraint templates
- Skill level (lightweight heuristic): derived from total board sessions and usage patterns

## How learning affects behavior

At runtime, the host calls `updateUserPreferences(action, context)` and then (optionally) calls `syncPreferencesToKB()` so Prolog rules can incorporate the latest facts.

Common integration points:

- Board recommendations: `getKBRecommendedBoards(userId)`
- Advisor personalization: `shouldSimplifyForUser(userId)`, `getKBRecommendedGenre(userId)`
- Generator defaults: `getKBRecommendedGeneratorStyle(userId, generator)`

## Adaptation (skill level, progressive disclosure, error prevention)

The adaptation system uses Prolog rules to tailor behavior without shipping a model:

- Skill estimation: `skill_estimation/3` in `src/ai/knowledge/adaptation.pl`, queried from TypeScript (see `estimateSkillLevel()` in `src/ai/queries/persona-queries.ts`).
- Suggestion adaptation: `adaptive_suggestion_rule/3` (see `adaptSuggestions()` in `src/ai/queries/persona-queries.ts`).
- Progressive disclosure: `progressive_disclosure_rule/2` + `should_disclose/2` (see `decideFeatureVisibility()` and `getVisibleFeatures()`).
- Error prevention: `error_pattern_detection/2` + `corrective_suggestion/2` plus local tracking hooks (see `trackErrorPattern()` and `getProactiveCorrections()` in `src/ai/learning/user-preferences.ts`).

## Privacy guarantees

- **No network calls:** the learning subsystem is designed to work offline and does not call remote APIs.
- **Local-only by default:** learned data stays in memory unless the host explicitly persists it.
- **User control:** callers can reset or override learned preferences.

Relevant APIs:

- Reset: `resetPreferences()`
- Export/import (preferences only): `exportPreferences()`, `importPreferences(json)`
- Export/import (full learning backup): `exportLearningDataJSON()`, `importLearningData(data)`

## Reset, export, and import (host workflow)

Typical host pattern for persistence (fully local):

1. On startup: call `initializePreferences(userId)`, then load a local blob and `importLearningData()`.
2. During usage: call `updateUserPreferences(...)` and periodically `syncPreferencesToKB()`.
3. On shutdown / user action: call `exportLearningDataJSON()` and persist locally (file, IndexedDB, localStorage).
4. When the user clicks “Reset learning”: call `resetPreferences()` (and `resetLearnedPatterns()` if you use the enhanced pattern stores).

## Data retention policy

Current behavior (as implemented):

- Learned data is stored **in memory** for the current runtime session.
- If the host wants persistence across reloads, it should store `exportLearningDataJSON()` somewhere local (e.g. a user file, localStorage, IndexedDB) and re-import on startup.

Recommended retention approach for the host app:

- Default: keep data until user resets.
- Provide “Reset learning” and “Export/Import learning” UI affordances.
- Keep exports local; never upload by default.

## Troubleshooting

- If recommendations feel “stuck”, call `resetPreferences()` (and `resetLearnedPatterns()` if using enhanced learning stores) and rebuild context.
- If you’re adding new learned signals, ensure you also update the Prolog sync step so the KB sees the new facts.
