# GOFAI Vocabulary Policy and Namespacing

> Version 1.0.0 | Last updated: 2024
>
> **Step 004 from gofai_goalB.md**: Vocabulary policy for meaning IDs

This document defines the vocabulary policy for GOFAI Music+, particularly the namespacing rules for builtin vs extension-provided vocabulary.

---

## Core Principle

**All meaning IDs in GOFAI must be unambiguously attributable to either core or a specific extension.**

This ensures:
- No ID collisions between core and extensions
- Clear provenance for every semantic element
- Safe composition of multiple extensions
- Stable serialization across extension versions

---

## ID Format Rules

### Builtin Meaning IDs (Core)

**Format**: `<type>:<category>:<name>`

**Examples**:
- `lex:verb:make` — Core verb lexeme
- `axis:brightness` — Core perceptual axis
- `op:raise_register` — Core edit opcode
- `constraint:preserve` — Core constraint type
- `section:chorus` — Core section type
- `layer:drums` — Core layer type
- `unit:bars` — Core measurement unit

**Rules**:
1. ✅ NO namespace prefix for builtin IDs
2. ✅ All builtin IDs are immutable (never change)
3. ✅ Builtin IDs use lowercase with underscores
4. ✅ Builtin IDs are validated at build time

### Extension Meaning IDs

**Format**: `<namespace>:<type>:<category>:<name>`

**Examples**:
- `my-pack:lex:verb:stutter` — Extension verb
- `lofi-fx:axis:grit` — Extension axis
- `drum-machine:op:add_swing` — Extension opcode
- `jazz-theory:constraint:voice_leading` — Extension constraint

**Rules**:
1. ✅ MUST have namespace prefix
2. ✅ Namespace MUST match pack ID
3. ✅ Extension IDs follow same format as core after namespace
4. ✅ Extensions cannot use reserved namespaces (`gofai`, `core`, `cardplay`)

---

## Namespace Format

### Valid Namespace Format

```
namespace ::= <alphanumeric-kebab-case>
alphanumeric-kebab-case ::= [a-z0-9]+(-[a-z0-9]+)*

Examples:
✅ my-pack
✅ lofi-fx
✅ drum-machine-2
✅ jazz-theory

❌ MyPack (uppercase)
❌ my_pack (underscore)
❌ my.pack (dot)
❌ -my-pack (leading dash)
❌ my-pack- (trailing dash)
```

### Reserved Namespaces

These namespaces are reserved and CANNOT be used by extensions:

- `gofai` — GOFAI system internals
- `core` — CardPlay core
- `cardplay` — CardPlay namespace
- `builtin` — Builtin vocabulary
- `system` — System-level constructs
- `user` — Reserved for user-created content

Attempting to register an extension with a reserved namespace will fail with a clear error.

---

## Type Prefixes

Each meaning type has a stable prefix:

| Type | Prefix | Example |
|------|--------|---------|
| Lexeme | `lex:` | `lex:verb:make` |
| Perceptual Axis | `axis:` | `axis:brightness` |
| Edit Opcode | `op:` | `op:raise_register` |
| Constraint Type | `constraint:` | `constraint:preserve` |
| Section Type | `section:` | `section:chorus` |
| Layer Type | `layer:` | `layer:drums` |
| Measurement Unit | `unit:` | `unit:bars` |
| Grammar Rule | `rule:` | `rule:imperative:axis_change` |

For extensions, these come after the namespace:

```
<namespace>:lex:verb:stutter
<namespace>:axis:grit
<namespace>:op:add_swing
```

---

## Vocabulary Table Structure

### Core Vocabulary Tables

Located in `src/gofai/canon/`:

```
canon/
  ├── lexemes.ts              — Core lexeme table
  ├── perceptual-axes.ts      — Core axes table
  ├── edit-opcodes.ts         — Core opcodes table
  ├── constraint-types.ts     — Core constraint types
  ├── section-vocabulary.ts   — Core section types
  ├── layer-vocabulary.ts     — Core layer types
  └── units.ts                — Core measurement units
```

Each file exports:

```typescript
// Example: lexemes.ts
export const CORE_LEXEMES: readonly Lexeme[] = [
  {
    id: createLexemeId('verb', 'make'),  // lex:verb:make
    lemma: 'make',
    variants: ['create', 'set'],
    category: 'verb',
    semantics: { type: 'action', opcode: createOpcodeId('set'), role: 'main' },
    description: 'Perform an action',
    examples: ['make it brighter', 'make the chorus louder'],
  },
  // ... more lexemes
];
```

### Extension Vocabulary Registration

Extensions register vocabulary through the extension API:

```typescript
// In extension code
export function registerVocabulary(registry: GofaiExtensionRegistry) {
  registry.registerLexeme({
    id: createLexemeId('verb', 'stutter', 'my-pack'),  // my-pack:lex:verb:stutter
    lemma: 'stutter',
    variants: ['glitch', 'repeat'],
    category: 'verb',
    semantics: { type: 'action', opcode: createOpcodeId('stutter', 'my-pack'), role: 'main' },
    description: 'Apply stutter effect',
    examples: ['stutter the drums', 'glitch the vocals'],
  });
}
```

The registry validates:
- ✅ Namespace matches pack ID
- ✅ ID format is correct
- ✅ No collisions with existing IDs
- ✅ All referenced IDs (opcodes, axes, etc.) are declared

---

## Collision Resolution

### Core vs Extension

**Core always wins.** Extensions cannot shadow builtin vocabulary.

```typescript
// If extension tries to register:
createLexemeId('verb', 'make', 'my-pack')  // my-pack:lex:verb:make

// And core already has:
createLexemeId('verb', 'make')  // lex:verb:make

// Result: ✅ No collision (different IDs)
// Both can coexist, but core is preferred in ambiguous contexts
```

### Extension vs Extension

**First registered wins** within a session. Between sessions, **explicit disambiguation required.**

```typescript
// Pack A registers:
createAxisId('grit', 'pack-a')  // pack-a:axis:grit

// Pack B registers:
createAxisId('grit', 'pack-b')  // pack-b:axis:grit

// Result: ✅ No collision (different namespaces)
// User can choose which "grit" they mean
// Or use full ID: "pack-a:axis:grit"
```

### Surface Form Collisions

Multiple vocabulary entries can have the same surface forms (synonyms), but each must have a unique ID.

```typescript
// Both map to "darker":
{
  id: 'lex:adj:dark',
  lemma: 'dark',
  variants: ['darker', 'dark'],
  semantics: { type: 'axis_modifier', axis: 'axis:brightness', direction: 'decrease' }
}

{
  id: 'lex:adj:dark_harmony',
  lemma: 'dark',
  variants: ['darker'],
  semantics: { type: 'axis_modifier', axis: 'axis:harmonic_tension', direction: 'decrease' }
}

// Result: Ambiguity during parsing → clarification required
// User sees: "Do you mean darker (timbre) or darker (harmony)?"
```

---

## Serialization and Persistence

### CPL Serialization

When CPL is serialized (e.g., for edit history), IDs are preserved exactly:

```json
{
  "type": "cpl_intent",
  "version": "1.0.0",
  "goals": [
    {
      "type": "axis_change",
      "axis": "axis:brightness",           // Core ID
      "direction": "increase"
    }
  ],
  "constraints": [
    {
      "type": "my-pack:constraint:voice_leading",  // Extension ID
      "params": { "strictness": "moderate" }
    }
  ]
}
```

### Loading Across Sessions

When loading a CPL with extension IDs:

1. **Extension present**: Load normally
2. **Extension missing**: Show warning, mark as "unresolved extension ID"
3. **Extension version changed**: Check compatibility, migrate if needed

```typescript
interface UnresolvedExtensionId {
  id: string;
  requiredNamespace: string;
  availableAlternatives: string[];
}

// If loading fails:
{
  status: 'needs_resolution',
  unresolved: [
    {
      id: 'old-pack:constraint:voice_leading',
      requiredNamespace: 'old-pack',
      availableAlternatives: ['new-pack:constraint:voice_leading']
    }
  ]
}
```

---

## Validation and Testing

### Build-Time Validation

A canon check script validates all core vocabulary:

```bash
npm run gofai:check-canon

# Checks:
# ✅ All IDs are un-namespaced
# ✅ No duplicate IDs within category
# ✅ All cross-references resolve
# ✅ All semantic bindings are valid
# ✅ Docs match code
```

### Runtime Validation

When extensions register:

```typescript
function validateExtensionId(id: string, packNamespace: string): ValidationResult {
  // Check format
  if (!isValidExtensionId(id)) {
    return { ok: false, error: 'Invalid ID format' };
  }
  
  // Extract namespace
  const namespace = getNamespace(id);
  if (namespace !== packNamespace) {
    return { ok: false, error: `Namespace mismatch: ${namespace} !== ${packNamespace}` };
  }
  
  // Check not reserved
  if (RESERVED_NAMESPACES.includes(namespace)) {
    return { ok: false, error: `Reserved namespace: ${namespace}` };
  }
  
  return { ok: true };
}
```

### Test Coverage

Every vocabulary module has tests:

```typescript
describe('Core Lexemes', () => {
  test('all lexeme IDs are un-namespaced', () => {
    for (const lexeme of CORE_LEXEMES) {
      expect(isNamespaced(lexeme.id)).toBe(false);
    }
  });
  
  test('all lexeme IDs are unique', () => {
    const ids = CORE_LEXEMES.map(l => l.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });
  
  test('all semantic references resolve', () => {
    for (const lexeme of CORE_LEXEMES) {
      if (lexeme.semantics.type === 'axis_modifier') {
        expect(getAxisById(lexeme.semantics.axis)).toBeDefined();
      }
    }
  });
});
```

---

## Migration Strategy

### Adding New Core Vocabulary

1. Add to appropriate vocabulary file
2. Run canon check
3. Update docs
4. Add tests
5. Bump CPL schema version if breaking

### Deprecating Core Vocabulary

**Never remove, only deprecate:**

```typescript
{
  id: 'lex:verb:old_action',
  lemma: 'old_action',
  deprecated: true,
  deprecationMessage: 'Use lex:verb:new_action instead',
  // Still functional, but generates warnings
}
```

### Extension Version Changes

Extensions declare compatibility:

```typescript
export const EXTENSION_METADATA = {
  namespace: 'my-pack',
  version: '2.0.0',
  vocabularyVersion: '2.0.0',
  compatibleWith: ['1.0.0', '1.5.0'],  // Can load CPL from these versions
  migrations: {
    '1.0.0': (oldCpl) => migrateCpl_1_to_2(oldCpl),
  }
};
```

---

## Best Practices

### For Core Vocabulary

1. ✅ Use descriptive, unambiguous names
2. ✅ Document every entry thoroughly
3. ✅ Provide multiple synonyms for usability
4. ✅ Keep IDs stable (never change)
5. ✅ Test cross-references exhaustively

### For Extension Authors

1. ✅ Choose unique, descriptive namespace
2. ✅ Always include namespace in IDs
3. ✅ Document dependencies on core vocabulary
4. ✅ Provide clear examples
5. ✅ Test with multiple extensions loaded
6. ✅ Version vocabulary changes
7. ✅ Provide migration functions

### For Users

1. ✅ Prefer surface forms over IDs when possible ("brighter" not "axis:brightness")
2. ✅ Use clarification when ambiguous
3. ✅ Check extension provenance in edit history
4. ✅ Back up projects before updating extensions

---

## Implementation Checklist

- [x] Define ID format rules
- [x] Define namespace format and validation
- [x] Create ID constructor functions (in types.ts)
- [x] Create validation functions (in types.ts)
- [x] Document serialization format
- [ ] Implement extension registry (Phase 8)
- [ ] Implement collision resolution (Phase 8)
- [ ] Implement migration system (Phase 9)
- [ ] Build canon check script (Phase 0)
- [ ] Add comprehensive tests (Phase 0)

---

## Related Documentation

- [Canon Types](../../src/gofai/canon/types.ts) — ID type definitions
- [Extension API](extensions.md) — How to register vocabulary
- [CPL Schema](cpl-schema.md) — Serialization format
- [Semantic Safety Invariants](semantic-safety-invariants.md) — Validation requirements

---

*This document is the SSOT for vocabulary policy. All vocabulary MUST follow these rules.*
