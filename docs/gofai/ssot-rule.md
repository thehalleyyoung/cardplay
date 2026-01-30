# GOFAI Documentation SSOT Rule — Step 100

**Status:** ✅ IMPLEMENTED

**Goal:** Define the "GOFAI docs SSOT rule": canonical vocab lives in code; docs are generated or validated from that code.

---

## The SSOT Principle for GOFAI Documentation

The Single Source of Truth (SSOT) for GOFAI vocabulary and semantics is the **code**, not the documentation files. This prevents documentation drift and ensures that what users read matches what the system actually implements.

### Core Rules

1. **Code is Canon**
   - All lexemes, axioms, opcodes, constraints, and entity types are defined in TypeScript source files under `src/gofai/canon/`
   - These files are the SSOT for IDs, semantics, and bindings
   - Documentation in `docs/gofai/` is derived from or validated against this code

2. **Documentation Generation**
   - Where possible, documentation should be **generated** from code
   - Type definitions, ID lists, and vocabulary tables should be auto-generated
   - Examples: API references, vocabulary catalogs, opcode lists

3. **Documentation Validation**
   - Where documentation is hand-written (guides, tutorials, design docs), it must be **validated** against code
   - The ontology drift lint (`src/gofai/canon/ontology-drift-lint.ts`) enforces this
   - CI must run drift checks and fail on critical errors

4. **Update Flow**
   - When adding new vocabulary: **Code first, then docs**
   - When changing semantics: **Update code, regenerate/validate docs**
   - Never update docs without corresponding code changes

5. **ID Stability**
   - IDs defined in code are **immutable contracts**
   - Changing an ID breaks backwards compatibility
   - Entity binding stability tests (`src/gofai/canon/__tests__/entity-binding-stability.test.ts`) enforce this

---

## Implementation Components

### 1. Canon Source Files (SSOT)

Located in `src/gofai/canon/`:

- `lexemes.ts` — SSOT for lexemes (words/phrases)
- `perceptual-axes.ts` — SSOT for perceptual axes
- `edit-opcodes.ts` — SSOT for edit opcodes
- `section-vocabulary.ts` — SSOT for section types
- `layer-vocabulary.ts` — SSOT for layer types
- `constraint-types.ts` — SSOT for constraint types
- `units.ts` — SSOT for units of measurement

### 2. Canon Validation (`check.ts`)

- Validates internal consistency of canon tables
- Checks for ID uniqueness, format compliance, and referential integrity
- Run via: `import { validateAllVocabularies } from 'src/gofai/canon/check'`

### 3. Ontology Drift Lint (`ontology-drift-lint.ts`)

- Compares code canon with documentation
- Detects orphaned doc entries and undocumented code entities
- Run via: `import { checkOntologyDrift } from 'src/gofai/canon/ontology-drift-lint'`

### 4. Entity Binding Stability Tests (`entity-binding-stability.test.ts`)

- Regression tests ensuring critical IDs remain stable
- Prevents accidental breaking changes
- Enforces ID-based (not display-name-based) references

### 5. Vocabulary Coverage Report (`vocab-coverage-report.ts`)

- Analyzes which entities have language bindings
- Identifies gaps in vocabulary coverage
- Run via: `npm run gofai:vocab-coverage`

---

## Workflow for Vocabulary Changes

### Adding New Vocabulary

1. **Add to Canon Source**
   ```ts
   // src/gofai/canon/lexemes.ts
   export const CORE_LEXEMES: readonly Lexeme[] = [
     // ... existing entries
     {
       id: 'lex:verb:widen' as LexemeId,
       lemma: 'widen',
       variants: ['make wider', 'broaden'],
       category: 'verb',
       semantics: {
         type: 'action',
         axis: 'axis:width',
         direction: 'increase',
       },
     },
   ];
   ```

2. **Run Canon Checks**
   ```bash
   npm run typecheck
   npm test src/gofai/canon/__tests__/
   ```

3. **Update Documentation**
   - If auto-generated: regenerate
   - If hand-written: add references and validate
   ```bash
   npm run gofai:drift-check
   ```

4. **Verify Stability**
   - Run entity binding tests
   - Ensure no critical IDs changed
   - Run coverage report to confirm binding quality

### Changing Existing Semantics

1. **Update Canon Source**
   - Modify the SSOT file
   - Keep IDs stable (only change semantics if necessary)

2. **Version Check**
   - If breaking change: bump semantic version
   - Add migration function if needed

3. **Validate Documentation**
   - Run drift lint
   - Update examples to match new semantics

4. **Test Stability**
   - Ensure entity binding tests still pass
   - Add new test cases if behavior changed

---

## CI/CD Integration

### Required Checks (must pass before merge)

1. **Type Check**
   ```bash
   npm run typecheck
   ```

2. **Canon Validation**
   ```bash
   npm test src/gofai/canon/__tests__/check.test.ts
   ```

3. **Ontology Drift Lint**
   ```bash
   npm run gofai:drift-check
   ```

4. **Entity Binding Stability**
   ```bash
   npm test src/gofai/canon/__tests__/entity-binding-stability.test.ts
   ```

### Recommended Checks (warnings, not failures)

1. **Vocabulary Coverage Report**
   ```bash
   npm run gofai:vocab-coverage
   ```

2. **Documentation Quality**
   - Check for broken links
   - Verify examples compile
   - Ensure glossary is up-to-date

---

## Documentation Structure

### Auto-Generated Docs

These are generated from code and should not be edited manually:

- `docs/gofai/api-reference.md` (planned)
- `docs/gofai/vocabulary-catalog.md` (planned)
- `docs/gofai/opcode-reference.md` (planned)

### Hand-Written Docs (Validated Against Code)

These are written manually but validated for consistency:

- `docs/gofai/glossary.md` — Term definitions (validated via drift lint)
- `docs/gofai/pipeline.md` — Compilation pipeline (validated via drift lint)
- `docs/gofai/vocabulary-policy.md` — Naming conventions (validated via drift lint)
- `docs/gofai/product-contract.md` — User-facing contract
- `docs/gofai/semantic-safety-invariants.md` — Safety guarantees

### Design Docs (Not Validated)

These describe intent and rationale, not strict implementation:

- `gofai_goalB.md` — Backend implementation roadmap
- `gofaimusicplus.md` — Architecture and design philosophy

---

## Benefits of Code-First SSOT

1. **No Drift**: Docs cannot get out of sync with implementation
2. **Refactor-Safe**: Renaming code automatically invalidates stale docs
3. **Testable**: Documentation claims can be validated programmatically
4. **DRY**: Avoid duplicating vocabulary definitions
5. **Version Control**: Changes to vocab are explicit in commits

---

## Exceptions and Edge Cases

### When Docs Can Lead

- **Design docs before implementation**: OK during planning phase
- **User guides introducing concepts**: OK if validated after code complete
- **Examples and tutorials**: OK if tested/validated regularly

### When Code and Docs Diverge Temporarily

- **During active development**: Short-term divergence is acceptable
- **Before release**: Drift must be resolved (fail CI)
- **In branches**: Drift is allowed; must resolve before merge to main

---

## Tools and Scripts

### Check SSOT Compliance

```bash
# Validate canon tables
npm run gofai:canon-check

# Check for ontology drift
npm run gofai:drift-check

# Run entity binding tests
npm test -- entity-binding-stability

# Generate coverage report
npm run gofai:vocab-coverage
```

### Package.json Scripts (to be added)

```json
{
  "scripts": {
    "gofai:canon-check": "ts-node scripts/gofai-canon-check.ts",
    "gofai:drift-check": "ts-node scripts/gofai-drift-check.ts",
    "gofai:vocab-coverage": "node scripts/gofai-vocab-coverage.js"
  }
}
```

---

## Maintenance Responsibilities

### GOFAI Core Team

- Keep canon source files up-to-date
- Run validation checks before commits
- Review and resolve drift warnings
- Update stability tests when adding critical IDs

### Documentation Team

- Write tutorials and guides that reference code IDs
- Validate examples against code
- Report drift issues found during writing
- Keep glossary aligned with canon vocabulary

### Release Engineering

- Enforce CI checks
- Block releases with critical drift errors
- Generate release notes from code changes
- Validate migration paths for ID changes

---

**SSOT Rule Summary:**

> The canonical vocabulary lives in `src/gofai/canon/*.ts`.
> Documentation is generated from or validated against this code.
> Code changes first; docs follow. IDs are stable contracts.

**Step 100: ✅ COMPLETE**
