/**
 * Tree Shaking Utilities
 * 
 * Helps identify and eliminate dead code during bundling.
 */

export interface TreeShakingConfig {
  /** Enable tree shaking */
  enabled: boolean;
  
  /** Side effect-free modules (can be safely removed if unused) */
  sideEffectFreeModules: string[];
  
  /** Modules with side effects (must always be included) */
  sideEffectModules: string[];
  
  /** Analyze unused exports */
  analyzeExports: boolean;
}

export const DEFAULT_TREE_SHAKING_CONFIG: TreeShakingConfig = {
  enabled: true,
  sideEffectFreeModules: [
    // Pure utility modules
    'src/music/theory',
    'src/music/scales',
    'src/music/chords',
    'src/types',
    'src/utils',
    
    // Pure components (no side effects in module scope)
    'src/ui/components/properties-panel',
    'src/ui/components/help-browser-deck',
  ],
  sideEffectModules: [
    // Store initialization
    'src/state/event-store',
    'src/state/clip-registry',
    'src/boards/store/store',
    
    // Audio engine
    'src/audio/engine',
    
    // Registration functions
    'src/boards/builtins/register',
    'src/community/deck-packs/register',
    'src/community/sample-packs/register',
  ],
  analyzeExports: true,
};

/**
 * Mark modules as side-effect-free in package.json
 */
export function generateSideEffectsConfig(config: TreeShakingConfig): {
  sideEffects: boolean | string[];
} {
  if (!config.enabled) {
    return { sideEffects: true };
  }

  // If we have specific side effect modules, list them
  if (config.sideEffectModules.length > 0) {
    return {
      sideEffects: config.sideEffectModules,
    };
  }

  // Otherwise, mark all modules as side-effect-free
  return { sideEffects: false };
}

/**
 * Analyze module for potential tree shaking issues
 */
export interface TreeShakingIssue {
  /** Module path */
  module: string;
  
  /** Issue type */
  type: 'side-effect' | 'dynamic-import' | 'circular-dependency' | 'unused-export';
  
  /** Description */
  description: string;
  
  /** Suggestion for fix */
  suggestion: string;
}

/**
 * Common tree shaking issues and fixes
 */
export const TREE_SHAKING_BEST_PRACTICES = [
  {
    issue: 'Module-level side effects (e.g., global state initialization)',
    fix: 'Move initialization into explicit init functions',
    example: `
// ❌ Bad: Side effect at module level
const globalState = initializeGlobalState();

// ✅ Good: Explicit initialization
export function initializeGlobalState() { ... }
`,
  },
  {
    issue: 'Circular dependencies',
    fix: 'Extract shared types/interfaces into separate module',
    example: `
// ❌ Bad: A imports B, B imports A
// A.ts: import { B } from './B'
// B.ts: import { A } from './A'

// ✅ Good: Extract to types.ts
// types.ts: export interface A { ... } export interface B { ... }
`,
  },
  {
    issue: 'Dynamic imports with template literals',
    fix: 'Use static import paths',
    example: `
// ❌ Bad: Template literal (can't analyze statically)
import(\`./modules/\${name}.js\`)

// ✅ Good: Explicit dynamic imports
name === 'foo' ? import('./modules/foo.js') : import('./modules/bar.js')
`,
  },
  {
    issue: 'Re-exporting entire modules',
    fix: 'Re-export only what you need',
    example: `
// ❌ Bad: Re-exports everything
export * from './large-module'

// ✅ Good: Selective re-exports
export { usedFunction, usedType } from './large-module'
`,
  },
];

/**
 * Get tree shaking recommendations
 */
export function getTreeShakingRecommendations(): string[] {
  return [
    'Mark pure modules as side-effect-free in package.json',
    'Use named imports instead of default imports',
    'Avoid module-level code execution',
    'Extract side effects into explicit init functions',
    'Use static import paths for dynamic imports',
    'Prefer selective re-exports over "export *"',
    'Check bundle analyzer for unexpectedly large modules',
  ];
}
