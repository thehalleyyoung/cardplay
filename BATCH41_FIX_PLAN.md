# Batch41 Systematic Fix Plan

## Problem
The file `src/gofai/canon/domain-verbs-batch41-musical-actions.ts` has 720 verb lexeme entries that need `description` and `examples` fields added to match the `Lexeme` interface.

## Solution Implemented
Created a `createActionLexeme` helper function that provides default values:
```typescript
function createActionLexeme(params: {
  id: LexemeId;
  lemma: string;
  variants: readonly string[];
  category: 'verb';
  semantics: ReturnType<typeof createActionSemantics>;
  description?: string;
  examples?: readonly string[];
}): Lexeme {
  return {
    ...params,
    description: params.description ?? `Action verb: ${params.lemma}`,
    examples: params.examples ?? [`${params.variants[0]} the sound`],
  };
}
```

## Next Steps
1. Wrap all 720 lexeme object literals with `createActionLexeme({...})`
2. Fix a few entries that use non-standard `direction` values (should use `technique` instead)
3. Run typecheck to verify all errors are resolved

## Systematic Approach
Use a Python script to:
1. Find all naked object literals: `{\n    id: 'verb:...'`
2. Replace with: `createActionLexeme({\n    id: 'verb:...'`
3. Ensure all closing `},` become `}),`
4. Handle special cases where `direction` should be `technique`

## Status
- Helper function: ✅ Created
- First 4 entries: ✅ Wrapped as examples  
- Remaining 716 entries: ⏳ Requires careful batch transformation
- Type errors reduced from ~220 to 4 in partial attempt

This is a mechanical transformation that should be done carefully to avoid introducing syntax errors.
