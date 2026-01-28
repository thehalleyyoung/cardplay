/**
 * @fileoverview CardScript Module System.
 * 
 * Provides import/export capabilities for CardScript with support for:
 * - Module resolution and loading
 * - Namespace management
 * - Circular dependency detection
 * - Hot module reloading for live coding
 * 
 * @module @cardplay/user-cards/cardscript/modules
 */

import type { Program, ImportDeclaration, ExportDeclaration } from './ast';
import { parse } from './parser';

// ============================================================================
// MODULE TYPES
// ============================================================================

/**
 * Module identifier (path or name).
 */
export type ModuleId = string;

/**
 * Module resolution result.
 */
export interface ResolvedModule {
  readonly id: ModuleId;
  readonly path: string;
  readonly source: string;
  readonly ast: Program;
}

/**
 * Module exports.
 */
export interface ModuleExports {
  readonly cards: Map<string, unknown>;
  readonly functions: Map<string, Function>;
  readonly types: Map<string, unknown>;
  readonly constants: Map<string, unknown>;
  readonly default?: unknown;
}

/**
 * Loaded module.
 */
export interface Module {
  readonly id: ModuleId;
  readonly exports: ModuleExports;
  readonly dependencies: readonly ModuleId[];
  readonly loadedAt: number;
  readonly source?: string;
}

/**
 * Module loader options.
 */
export interface ModuleLoaderOptions {
  /** Base path for relative imports */
  basePath?: string;
  /** Custom module resolver */
  resolver?: ModuleResolver;
  /** Enable hot module reload */
  hotReload?: boolean;
  /** Module cache */
  cache?: ModuleCache;
}

/**
 * Module resolver function.
 */
export type ModuleResolver = (id: ModuleId, from: ModuleId) => Promise<ResolvedModule | null>;

/**
 * Module cache interface.
 */
export interface ModuleCache {
  get(id: ModuleId): Module | undefined;
  set(id: ModuleId, module: Module): void;
  delete(id: ModuleId): boolean;
  clear(): void;
  has(id: ModuleId): boolean;
}

// ============================================================================
// DEFAULT MODULE CACHE
// ============================================================================

/**
 * In-memory module cache.
 */
export class InMemoryModuleCache implements ModuleCache {
  private readonly modules = new Map<ModuleId, Module>();
  
  get(id: ModuleId): Module | undefined {
    return this.modules.get(id);
  }
  
  set(id: ModuleId, module: Module): void {
    this.modules.set(id, module);
  }
  
  delete(id: ModuleId): boolean {
    return this.modules.delete(id);
  }
  
  clear(): void {
    this.modules.clear();
  }
  
  has(id: ModuleId): boolean {
    return this.modules.has(id);
  }
  
  getAll(): Map<ModuleId, Module> {
    return new Map(this.modules);
  }
}

// ============================================================================
// BUILT-IN MODULES
// ============================================================================

/**
 * Built-in module definitions.
 */
const builtInModules = new Map<ModuleId, ModuleExports>();

// @cardplay/math
builtInModules.set('@cardplay/math', {
  cards: new Map(),
  functions: new Map([
    ['abs', Math.abs],
    ['sin', Math.sin],
    ['cos', Math.cos],
    ['tan', Math.tan],
    ['asin', Math.asin],
    ['acos', Math.acos],
    ['atan', Math.atan],
    ['atan2', Math.atan2],
    ['floor', Math.floor],
    ['ceil', Math.ceil],
    ['round', Math.round],
    ['sqrt', Math.sqrt],
    ['pow', Math.pow],
    ['exp', Math.exp],
    ['log', Math.log],
    ['log2', Math.log2],
    ['log10', Math.log10],
    ['min', Math.min],
    ['max', Math.max],
    ['clamp', (x: number, min: number, max: number) => Math.max(min, Math.min(max, x))],
    ['lerp', (a: number, b: number, t: number) => a + (b - a) * t],
    ['map', (x: number, inMin: number, inMax: number, outMin: number, outMax: number) => 
      outMin + (x - inMin) * (outMax - outMin) / (inMax - inMin)],
    ['random', Math.random],
    ['randomRange', (min: number, max: number) => min + Math.random() * (max - min)],
    ['randomInt', (min: number, max: number) => Math.floor(min + Math.random() * (max - min + 1))],
  ]),
  types: new Map(),
  constants: new Map([
    ['PI', Math.PI],
    ['TAU', Math.PI * 2],
    ['E', Math.E],
    ['SQRT2', Math.SQRT2],
    ['LN2', Math.LN2],
    ['LN10', Math.LN10],
  ]),
});

// @cardplay/audio
builtInModules.set('@cardplay/audio', {
  cards: new Map(),
  functions: new Map([
    ['mtof', (m: number) => 440 * Math.pow(2, (m - 69) / 12)],
    ['ftom', (f: number) => 69 + 12 * Math.log2(f / 440)],
    ['dbtoa', (db: number) => Math.pow(10, db / 20)],
    ['atodb', (a: number) => 20 * Math.log10(a)],
    ['btoms', (beats: number, bpm: number) => beats * 60000 / bpm],
    ['mstob', (ms: number, bpm: number) => ms * bpm / 60000],
    ['hzToSamples', (hz: number, sr: number) => sr / hz],
    ['samplesToHz', (samples: number, sr: number) => sr / samples],
    ['msToSamples', (ms: number, sr: number) => ms * sr / 1000],
    ['samplesToMs', (samples: number, sr: number) => samples * 1000 / sr],
  ]),
  types: new Map(),
  constants: new Map([
    ['SAMPLE_RATE_44100', 44100],
    ['SAMPLE_RATE_48000', 48000],
    ['SAMPLE_RATE_96000', 96000],
    ['A4', 440],
    ['MIDDLE_C', 60],
  ]),
});

// @cardplay/midi
builtInModules.set('@cardplay/midi', {
  cards: new Map(),
  functions: new Map([
    ['noteOn', (channel: number, note: number, velocity: number) => 
      [0x90 | (channel & 0x0F), note & 0x7F, velocity & 0x7F]],
    ['noteOff', (channel: number, note: number, velocity = 0) => 
      [0x80 | (channel & 0x0F), note & 0x7F, velocity & 0x7F]],
    ['cc', (channel: number, cc: number, value: number) => 
      [0xB0 | (channel & 0x0F), cc & 0x7F, value & 0x7F]],
    ['pitchBend', (channel: number, value: number) => {
      const v = Math.floor((value + 1) * 8192);
      return [0xE0 | (channel & 0x0F), v & 0x7F, (v >> 7) & 0x7F];
    }],
    ['programChange', (channel: number, program: number) => 
      [0xC0 | (channel & 0x0F), program & 0x7F]],
    ['aftertouch', (channel: number, pressure: number) => 
      [0xD0 | (channel & 0x0F), pressure & 0x7F]],
    ['polyAftertouch', (channel: number, note: number, pressure: number) => 
      [0xA0 | (channel & 0x0F), note & 0x7F, pressure & 0x7F]],
  ]),
  types: new Map(),
  constants: new Map([
    ['NOTE_ON', 0x90],
    ['NOTE_OFF', 0x80],
    ['CONTROL_CHANGE', 0xB0],
    ['PROGRAM_CHANGE', 0xC0],
    ['PITCH_BEND', 0xE0],
    ['AFTERTOUCH', 0xD0],
    ['CC_MOD_WHEEL', 1],
    ['CC_BREATH', 2],
    ['CC_VOLUME', 7],
    ['CC_PAN', 10],
    ['CC_EXPRESSION', 11],
    ['CC_SUSTAIN', 64],
  ]),
});

// @cardplay/time
builtInModules.set('@cardplay/time', {
  cards: new Map(),
  functions: new Map([
    ['now', () => performance.now()],
    ['beatsToMs', (beats: number, bpm: number) => beats * 60000 / bpm],
    ['msToBeats', (ms: number, bpm: number) => ms * bpm / 60000],
    ['barsToBeats', (bars: number, beatsPerBar: number) => bars * beatsPerBar],
    ['beatsToBar', (beats: number, beatsPerBar: number) => Math.floor(beats / beatsPerBar)],
    ['beatInBar', (beats: number, beatsPerBar: number) => beats % beatsPerBar],
    ['quantize', (beat: number, grid: number) => Math.round(beat / grid) * grid],
    ['quantizeFloor', (beat: number, grid: number) => Math.floor(beat / grid) * grid],
    ['quantizeCeil', (beat: number, grid: number) => Math.ceil(beat / grid) * grid],
  ]),
  types: new Map(),
  constants: new Map([
    ['PPQ', 480],
    ['WHOLE', 4],
    ['HALF', 2],
    ['QUARTER', 1],
    ['EIGHTH', 0.5],
    ['SIXTEENTH', 0.25],
    ['THIRTYSECOND', 0.125],
    ['TRIPLET_QUARTER', 4/3],
    ['TRIPLET_EIGHTH', 2/3],
    ['TRIPLET_SIXTEENTH', 1/3],
    ['DOTTED_QUARTER', 1.5],
    ['DOTTED_EIGHTH', 0.75],
  ]),
});

// ============================================================================
// MODULE LOADER
// ============================================================================

/**
 * Module loader for CardScript.
 */
export class ModuleLoader {
  private readonly cache: ModuleCache;
  private readonly basePath: string;
  private readonly resolver: ModuleResolver;
  private readonly hotReload: boolean;
  private readonly loadingStack: ModuleId[] = [];
  
  constructor(options: ModuleLoaderOptions = {}) {
    this.cache = options.cache ?? new InMemoryModuleCache();
    this.basePath = options.basePath ?? '';
    this.resolver = options.resolver ?? this.defaultResolver.bind(this);
    this.hotReload = options.hotReload ?? false;
  }
  
  /**
   * Loads a module by ID.
   */
  async load(id: ModuleId, from?: ModuleId): Promise<Module> {
    // Check for built-in module
    const builtIn = builtInModules.get(id);
    if (builtIn) {
      return {
        id,
        exports: builtIn,
        dependencies: [],
        loadedAt: Date.now(),
      };
    }
    
    // Check cache
    const cached = this.cache.get(id);
    if (cached && !this.hotReload) {
      return cached;
    }
    
    // Detect circular dependency
    if (this.loadingStack.includes(id)) {
      throw new Error(`Circular dependency detected: ${this.loadingStack.join(' -> ')} -> ${id}`);
    }
    
    // Resolve module
    const resolved = await this.resolver(id, from ?? '');
    if (!resolved) {
      throw new Error(`Module not found: ${id}`);
    }
    
    // Parse and load
    this.loadingStack.push(id);
    try {
      const module = await this.loadResolved(resolved);
      this.cache.set(id, module);
      return module;
    } finally {
      this.loadingStack.pop();
    }
  }
  
  /**
   * Loads a resolved module.
   */
  private async loadResolved(resolved: ResolvedModule): Promise<Module> {
    const exports: ModuleExports = {
      cards: new Map(),
      functions: new Map(),
      types: new Map(),
      constants: new Map(),
    };
    
    const dependencies: ModuleId[] = [];
    
    // Process imports
    for (const decl of resolved.ast.body) {
      if (decl.kind === 'ImportDeclaration') {
        const importDecl = decl as ImportDeclaration;
        const depModule = await this.load(importDecl.source, resolved.id);
        dependencies.push(importDecl.source);
        
        // Handle namespace imports
        if (importDecl.isNamespace && importDecl.namespaceAlias) {
          exports.constants.set(importDecl.namespaceAlias, depModule.exports);
          continue;
        }
        
        // Add imported symbols to local namespace
        if (importDecl.specifiers) {
          for (const spec of importDecl.specifiers) {
            // import { foo, bar as baz } from 'module'
            const name = spec.imported;
            const localName = spec.local;
            
            if (depModule.exports.cards.has(name)) {
              exports.cards.set(localName, depModule.exports.cards.get(name));
            } else if (depModule.exports.functions.has(name)) {
              exports.functions.set(localName, depModule.exports.functions.get(name)!);
            } else if (depModule.exports.types.has(name)) {
              exports.types.set(localName, depModule.exports.types.get(name));
            } else if (depModule.exports.constants.has(name)) {
              exports.constants.set(localName, depModule.exports.constants.get(name));
            } else if (name === 'default' && depModule.exports.default) {
              // import { default as foo } from 'module'
              exports.constants.set(localName, depModule.exports.default);
            }
          }
        }
      }
    }
    
    // Process exports (simplified - real implementation would execute the module)
    for (const decl of resolved.ast.body) {
      if (decl.kind === 'ExportDeclaration') {
        const exportDecl = decl as ExportDeclaration;
        if (exportDecl.declaration) {
          const d = exportDecl.declaration;
          if (d.kind === 'CardDeclaration') {
            exports.cards.set(d.name, d);
          } else if (d.kind === 'FunctionDeclaration') {
            // Would need to compile the function
            exports.functions.set(d.name, () => {});
          } else if (d.kind === 'ConstDeclaration') {
            exports.constants.set(d.name, null); // Would need to evaluate
          } else if (d.kind === 'TypeDeclaration') {
            exports.types.set(d.name, d);
          }
        }
      }
    }
    
    return {
      id: resolved.id,
      exports,
      dependencies,
      loadedAt: Date.now(),
      source: resolved.source,
    };
  }
  
  /**
   * Default module resolver.
   */
  private async defaultResolver(id: ModuleId, from: ModuleId): Promise<ResolvedModule | null> {
    // Built-in modules are handled separately
    if (id.startsWith('@cardplay/')) {
      return null;
    }
    
    // Resolve relative path
    let path = id;
    if (id.startsWith('./') || id.startsWith('../')) {
      const fromDir = from.substring(0, from.lastIndexOf('/'));
      path = this.resolvePath(fromDir, id);
    } else if (!id.startsWith('/')) {
      path = this.basePath + '/' + id;
    }
    
    // Add .cs extension if needed
    if (!path.endsWith('.cs')) {
      path += '.cs';
    }
    
    // Fetch source (in browser would use fetch, in Node would use fs)
    try {
      const source = await this.fetchSource(path);
      const parseResult = parse(source, path);
      
      if (!parseResult.success) {
        throw new Error(`Parse error in ${path}: ${parseResult.errors[0]?.message}`);
      }
      
      return {
        id,
        path,
        source,
        ast: parseResult.ast,
      };
    } catch (e) {
      return null;
    }
  }
  
  /**
   * Resolves a relative path.
   */
  private resolvePath(from: string, to: string): string {
    const parts = from.split('/').filter(p => p);
    const toParts = to.split('/').filter(p => p);
    
    for (const part of toParts) {
      if (part === '..') {
        parts.pop();
      } else if (part !== '.') {
        parts.push(part);
      }
    }
    
    return '/' + parts.join('/');
  }
  
  /**
   * Fetches source code (override for different environments).
   */
  protected async fetchSource(path: string): Promise<string> {
    // Browser implementation
    if (typeof fetch !== 'undefined') {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${path}`);
      }
      return response.text();
    }
    
    // Node.js implementation would use fs.readFile
    throw new Error('Source fetching not implemented for this environment');
  }
  
  /**
   * Invalidates a module and its dependents.
   */
  invalidate(id: ModuleId): void {
    this.cache.delete(id);
    
    // Also invalidate modules that depend on this one
    if (this.cache instanceof InMemoryModuleCache) {
      const allModules = this.cache.getAll();
      for (const [moduleId, module] of Array.from(allModules)) {
        if (module.dependencies.includes(id)) {
          this.invalidate(moduleId);
        }
      }
    }
  }
  
  /**
   * Gets a built-in module.
   */
  getBuiltIn(id: ModuleId): ModuleExports | undefined {
    return builtInModules.get(id);
  }
  
  /**
   * Lists all built-in modules.
   */
  listBuiltIns(): ModuleId[] {
    return Array.from(builtInModules.keys());
  }
}

// ============================================================================
// MODULE NAMESPACE
// ============================================================================

/**
 * Namespace for managing module symbols.
 */
export class ModuleNamespace {
  private readonly symbols = new Map<string, { module: ModuleId; name: string; value: unknown }>();
  
  /**
   * Imports symbols from a module.
   */
  import(module: Module, specifiers?: { imported: string; local: string }[]): void {
    if (!specifiers) {
      // Import all exports
      for (const [name, value] of Array.from(module.exports.cards)) {
        this.symbols.set(name, { module: module.id, name, value });
      }
      for (const [name, value] of Array.from(module.exports.functions)) {
        this.symbols.set(name, { module: module.id, name, value });
      }
      for (const [name, value] of Array.from(module.exports.types)) {
        this.symbols.set(name, { module: module.id, name, value });
      }
      for (const [name, value] of Array.from(module.exports.constants)) {
        this.symbols.set(name, { module: module.id, name, value });
      }
    } else {
      for (const spec of specifiers) {
        const value = this.getExport(module, spec.imported);
        if (value !== undefined) {
          this.symbols.set(spec.local, { module: module.id, name: spec.imported, value });
        }
      }
    }
  }
  
  /**
   * Gets an export from a module.
   */
  private getExport(module: Module, name: string): unknown {
    if (module.exports.cards.has(name)) return module.exports.cards.get(name);
    if (module.exports.functions.has(name)) return module.exports.functions.get(name);
    if (module.exports.types.has(name)) return module.exports.types.get(name);
    if (module.exports.constants.has(name)) return module.exports.constants.get(name);
    return undefined;
  }
  
  /**
   * Resolves a symbol name.
   */
  resolve(name: string): unknown {
    return this.symbols.get(name)?.value;
  }
  
  /**
   * Checks if a symbol exists.
   */
  has(name: string): boolean {
    return this.symbols.has(name);
  }
  
  /**
   * Lists all symbols.
   */
  list(): string[] {
    return Array.from(this.symbols.keys());
  }
}

// ============================================================================
// SINGLETON LOADER
// ============================================================================

let defaultLoader: ModuleLoader | null = null;

/**
 * Gets the default module loader.
 */
export function getModuleLoader(): ModuleLoader {
  if (!defaultLoader) {
    defaultLoader = new ModuleLoader();
  }
  return defaultLoader;
}

/**
 * Sets the default module loader.
 */
export function setModuleLoader(loader: ModuleLoader): void {
  defaultLoader = loader;
}

/**
 * Loads a module using the default loader.
 */
export async function importModule(id: ModuleId): Promise<Module> {
  return getModuleLoader().load(id);
}
