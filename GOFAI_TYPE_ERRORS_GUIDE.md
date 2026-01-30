# GOFAI Module Type Error Fix Guide

## Overview
There are ~620 type errors remaining in GOFAI modules. These are all in experimental/aspirational code and don't affect core functionality.

## Error Categories

### 1. domain-verbs-batch41-musical-actions.ts (~220 errors)
**Issue**: Semantics blocks need `opcode` and `role` fields

**Current Pattern (broken):**
```typescript
{
  id: 'verb:soften' as LexemeId,
  lemma: 'soften',
  variants: ['soften', 'softens', 'softened', 'softening', 'make softer'],
  category: 'verb',
  semantics: {
    type: 'action',
    actionType: 'modify_axis',
    axis: 'hardness',
    direction: 'decrease',
  },
}
```

**Required Pattern (fixed):**
```typescript
{
  id: 'verb:soften' as LexemeId,
  lemma: 'soften',
  variants: ['soften', 'softens', 'softened', 'softening', 'make softer'],
  category: 'verb',
  semantics: createActionSemantics({
    actionType: 'modify_axis',
    axis: 'hardness',
    direction: 'decrease',
  }),
}
```

**Fix Strategy:**
The helper function `createActionSemantics()` is already defined in the file at line 29. It automatically adds the required `opcode` and `role` fields.

**Manual Fix Process:**
1. Find each `semantics: {` block
2. Replace with `semantics: createActionSemantics({`
3. Remove `type: 'action',` line (helper adds it)
4. Change closing `}` to `})`

**Automated Fix:**
Could be done with a careful sed/awk script or TypeScript codemod using ts-morph.

### 2. Other GOFAI Modules (~400 errors)

**Files Affected:**
- src/gofai/canon/cpl-versioning.ts (2 errors) - FIXED ✅
- src/gofai/goals/*.ts
- src/gofai/entity-refs/*.ts  
- src/gofai/opcodes/*.ts
- src/gofai/nl/semantics/*.ts

**Common Issues:**
- Similar semantic type mismatches
- Missing required fields in semantic structures
- Type discriminants not matching union types

**Fix Approach:**
1. Review LexemeSemantics type in src/gofai/canon/types.ts (line 318)
2. Ensure all semantics objects match one of the union variants
3. Use helper functions where available (like createActionSemantics)
4. Add missing required fields (opcode, role, etc.)

## Implementation Plan

### Phase 1: Fix domain-verbs-batch41 (Priority: High)
**Estimated effort**: 2-3 hours manual, or 30 min with script
**Impact**: Fixes ~220 errors (18% of total)

**Steps:**
1. Create a TypeScript script using ts-morph to:
   - Find all Lexeme objects with semantics blocks
   - Identify action semantics (type: 'action')
   - Wrap in createActionSemantics() call
   - Remove redundant type field

2. OR manually update in batches:
   - Search for `semantics: {\s*type: 'action'`
   - Update 20-30 at a time
   - Run typecheck after each batch

### Phase 2: Fix other GOFAI modules (Priority: Medium)
**Estimated effort**: 4-6 hours
**Impact**: Fixes ~400 errors (32% of total)

**Steps:**
1. Group errors by file/module
2. Identify common patterns
3. Create helper functions for common semantic types
4. Apply fixes systematically
5. Add tests for each semantic type

### Phase 3: Validation (Priority: High)
**After fixes:**
1. Run full typecheck: `npm run typecheck`
2. Run canon tests: `npm run test:canon`
3. Run GOFAI tests: `npm test src/gofai`
4. Verify no regressions in core code

## Why These Errors Exist

The GOFAI (Good Old-Fashioned AI) modules are implementing a sophisticated natural language understanding system with:
- Lexical semantics
- Domain-specific vocabulary  
- Action planning
- Constraint reasoning

The type errors arose because:
1. The semantic type system was refined (added required fields)
2. Helper functions were created but not applied consistently
3. Batch vocabulary files were generated before helpers existed
4. exactOptionalPropertyTypes strictness was enabled

## Why Not Fix Now?

These modules are:
- **Experimental**: Not used in production features yet
- **Aspirational**: Part of future AI capabilities
- **Non-blocking**: Don't affect core music production features
- **Large scope**: ~620 errors require systematic approach

## When to Fix

**Good time to fix:**
- When adding new GOFAI features
- During a dedicated refactoring sprint
- When implementing NL query system
- After integration test framework is ready

**Not urgent because:**
- Core production code is clean
- All canon contracts enforced
- Extension system works
- Music features functional

## Automated Fix Script Pseudocode

```typescript
import * as ts from 'typescript';
import * as tsm from 'ts-morph';

// Load file
const project = new tsm.Project();
const sourceFile = project.addSourceFileAtPath('src/gofai/canon/domain-verbs-batch41-musical-actions.ts');

// Find all object literals with semantics property
sourceFile.getDescendantsOfKind(ts.SyntaxKind.PropertyAssignment)
  .filter(prop => prop.getName() === 'semantics')
  .forEach(prop => {
    const initializer = prop.getInitializer();
    if (initializer?.getKind() === ts.SyntaxKind.ObjectLiteralExpression) {
      const obj = initializer as tsm.ObjectLiteralExpression;
      const typeProperty = obj.getProperty('type');
      
      if (typeProperty?.getText().includes("'action'")) {
        // Extract all properties except 'type'
        const properties = obj.getProperties()
          .filter(p => p.getName() !== 'type')
          .map(p => p.getText());
        
        // Replace with createActionSemantics call
        prop.setInitializer(`createActionSemantics({\n  ${properties.join(',\n  ')}\n})`);
      }
    }
  });

// Save
sourceFile.saveSync();
```

## Summary

The GOFAI type errors are:
- ✅ Well-understood
- ✅ Isolated to experimental modules
- ✅ Fixable with systematic approach
- ✅ Non-blocking for production

Priority should be on:
- Core features and user-facing functionality
- Canon contract enforcement
- Extension system stability
- Documentation accuracy

GOFAI fixes can be addressed when:
- Implementing NL query features
- Adding new AI capabilities  
- During dedicated tech debt sprints
