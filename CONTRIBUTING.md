# Contributing to CardPlay

Thank you for your interest in contributing to CardPlay!

## Development Setup

```bash
# Install dependencies
npm install

# Run type checking
npm run typecheck

# Run tests
npm test

# Build the project
npm run build

# Run all checks
npm run check
```

## Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Include unit tests for new features

## Canon Contracts

**Critical:** CardPlay uses a canonical documentation system to maintain consistency between docs and code. Before making changes that affect:

- Type names and branded IDs (DeckType, DeckId, PanelId, PortType, etc.)
- Core vocabulary (port types, event kinds, deck types, control levels)
- Board/deck schemas and structure
- AI/theory integration points

Please review the relevant canon documentation in `docs/canon/` and run the canon validation scripts:

### Canon Check Scripts

```bash
# Check all canon contracts
npm run canon:check

# Individual checks
npm run canon:check-ids        # Verify ID tables match code
npm run canon:check-ports      # Verify port vocabulary
npm run canon:check-modules    # Verify module mappings
npm run canon:check-aliases    # Verify legacy type aliases
```

### Documentation Linting

```bash
# Lint all documentation
npm run docs:lint

# Check that doc claims match implementation
npm run docs:verify
```

### Key Canon Files

- `docs/canon/ids.md` - Canonical ID tables (DeckType, ControlLevel, etc.)
- `docs/canon/port-vocabulary.md` - Port type definitions and compatibility
- `docs/canon/deck-systems.md` - Board and deck model schemas
- `docs/canon/legacy-type-aliases.md` - Legacy aliases and migration paths
- `docs/canon/ssot-stores.md` - Single source of truth store locations
- `docs/canon/module-map.md` - Module organization and imports

### Making Breaking Changes

If you need to make breaking changes to core types or APIs:

1. Add migration helpers in `src/canon/legacy-aliases.ts`
2. Update the legacy aliases documentation
3. Provide backward-compatible aliases for at least one minor version
4. Update all tests to use canonical types
5. Add deprecation warnings via `src/test-utils/deprecation.ts`

### Testing Canon Compliance

Canon compliance tests run automatically in CI:

```bash
# Run canon test suite
npm run test:canon

# Run full test suite
npm test
```

These tests ensure:
- ID tables in docs match code constants
- Port compatibility matrix is consistent
- Board schemas match the model
- No phantom module references exist
- Legacy aliases are documented

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Run `npm run check` to verify all checks pass
4. If you modified canon contracts, run `npm run canon:check`
5. Update tests as needed
6. Submit a pull request with a clear description

## Commit Messages

Use conventional commit format:

```
type(scope): brief description

Longer description if needed.

Refs: #issue-number
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Questions?

- Check the `docs/` folder for architecture and design docs
- Review `docs/canon/` for canonical contracts
- See `CANON_IMPLEMENTATION_GAPS.md` for known gaps and work in progress

## License

By contributing, you agree that your contributions will be licensed under the project's license.
