/**
 * Code Splitting Utilities
 * 
 * Provides dynamic imports and lazy loading for optional features
 * to improve initial load time.
 */

export interface LazyModule<T> {
  /** Load the module */
  load: () => Promise<T>;
  
  /** Check if module is loaded */
  isLoaded: () => boolean;
  
  /** Get loaded module (undefined if not loaded) */
  get: () => T | undefined;
}

/**
 * Create a lazy-loaded module wrapper
 */
export function lazyModule<T>(loader: () => Promise<T>): LazyModule<T> {
  let module: T | undefined;
  let loading: Promise<T> | undefined;

  return {
    async load() {
      if (module) return module;
      if (loading) return loading;

      loading = loader().then(loaded => {
        module = loaded;
        loading = undefined;
        return loaded;
      });

      return loading;
    },

    isLoaded() {
      return module !== undefined;
    },

    get() {
      return module;
    },
  };
}

/**
 * Lazy-load modules for optional features
 */

// Prolog AI Engine (Phase L)
export const aiEngine = lazyModule(() =>
  import('../ai/index').catch(() => ({ AIEngine: null }))
);

// Advanced Notation (engraving, part extraction)
export const notationAdvanced = lazyModule(() =>
  Promise.resolve({ engravingChecks: [] })
);

// Video Tutorial System
export const tutorialVideo = lazyModule(() =>
  import('../ui/components/tutorial-mode').catch(() => ({ TutorialMode: null }))
);

// Extension System (Phase O)
export const extensionSystem = lazyModule(() =>
  Promise.resolve({ ExtensionAPI: null })
);

// Project Export (already loaded, but can be lazy)
export const projectExport = lazyModule(() =>
  import('../export/project-export').then(m => ({
    exportProject: m.exportProject,
  }))
);

// Audio Rendering (bounce/render)
export const audioRender = lazyModule(() =>
  import('../audio/render').catch(() => ({
    renderToFile: null,
  }))
);

// Sample Packs
export const samplePacks = lazyModule(() =>
  import('../community/sample-packs').then(m => ({
    SamplePackBrowser: m.SamplePackBrowser,
    registerBuiltinSamplePacks: m.registerBuiltinSamplePacks,
  }))
);

// Deck Packs
export const deckPacks = lazyModule(() =>
  Promise.resolve({
    DeckPackBrowser: null,
    registerBuiltinDeckPacks: null,
  })
);

/**
 * Preload critical modules during idle time
 */
export function preloadCriticalModules(): void {
  if (typeof window === 'undefined') return;
  if (!('requestIdleCallback' in window)) return;

  // Preload during idle time
  window.requestIdleCallback(() => {
    // Preload project export (commonly used)
    projectExport.load().catch(() => {});
  });

  window.requestIdleCallback(() => {
    // Preload sample/deck packs (first-run experience)
    samplePacks.load().catch(() => {});
    deckPacks.load().catch(() => {});
  });
}

/**
 * Preload modules based on user persona
 */
export function preloadPersonaModules(persona: string): void {
  if (typeof window === 'undefined') return;
  if (!('requestIdleCallback' in window)) return;

  window.requestIdleCallback(() => {
    switch (persona) {
      case 'notation-composer':
        notationAdvanced.load().catch(() => {});
        break;
      case 'sound-designer':
        audioRender.load().catch(() => {});
        break;
      case 'producer':
        audioRender.load().catch(() => {});
        projectExport.load().catch(() => {});
        break;
      case 'ai-assisted':
        aiEngine.load().catch(() => {});
        break;
    }
  });
}
