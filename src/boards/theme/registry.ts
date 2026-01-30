/**
 * @fileoverview Theme Extension Registry
 * 
 * Registry for extension themes with namespaced IDs.
 * Allows packs to register custom themes that can be selected in the theme picker.
 * 
 * ## Theme ID Namespacing
 * 
 * - Builtin themes use simple IDs: `dark`, `light`, `high-contrast`
 * - Extension themes must use namespaced IDs: `my-pack:neon`, `my-pack:retro`
 * 
 * @module @cardplay/boards/theme/registry
 * @see to_fix_repo_plan_500.md Change 417
 */

import { isNamespacedId, isBuiltinId } from '../../canon/id-validation';
import type { RegistryEntryProvenance } from '../../extensions/validators';
import { createBuiltinProvenance, createExtensionProvenance } from '../../extensions/validators';

// ============================================================================
// THEME TYPES
// ============================================================================

/**
 * Theme ID type (branded for type safety).
 */
export type ThemeId = string & { readonly __brand: 'ThemeId' };

/**
 * Color palette for a theme.
 */
export interface ThemeColorPalette {
  // Background colors
  readonly bgPrimary: string;
  readonly bgSecondary: string;
  readonly bgTertiary: string;
  readonly bgSurface: string;
  readonly bgOverlay: string;
  
  // Foreground/text colors
  readonly fgPrimary: string;
  readonly fgSecondary: string;
  readonly fgMuted: string;
  readonly fgDisabled: string;
  
  // Accent colors
  readonly accent: string;
  readonly accentHover: string;
  readonly accentActive: string;
  
  // Semantic colors
  readonly success: string;
  readonly warning: string;
  readonly error: string;
  readonly info: string;
  
  // Border colors
  readonly borderPrimary: string;
  readonly borderSecondary: string;
  readonly borderFocus: string;
  
  // Control level colors
  readonly controlBasic: string;
  readonly controlStandard: string;
  readonly controlAdvanced: string;
  readonly controlExpert: string;
}

/**
 * Theme typography settings.
 */
export interface ThemeTypography {
  readonly fontFamily: string;
  readonly fontFamilyMono: string;
  readonly fontSizeBase: string;
  readonly fontSizeSmall: string;
  readonly fontSizeLarge: string;
  readonly lineHeight: number;
}

/**
 * Theme spacing settings.
 */
export interface ThemeSpacing {
  readonly xs: string;
  readonly sm: string;
  readonly md: string;
  readonly lg: string;
  readonly xl: string;
}

/**
 * Complete theme definition.
 */
export interface ThemeDefinition {
  readonly id: ThemeId;
  readonly name: string;
  readonly description?: string;
  readonly variant: 'dark' | 'light';
  readonly colors: ThemeColorPalette;
  readonly typography?: Partial<ThemeTypography>;
  readonly spacing?: Partial<ThemeSpacing>;
  readonly customProperties?: Record<string, string>;
}

/**
 * Registered theme entry with provenance.
 */
export interface RegisteredTheme {
  readonly definition: ThemeDefinition;
  readonly provenance: RegistryEntryProvenance;
}

// ============================================================================
// BUILTIN THEMES
// ============================================================================

const DARK_THEME: ThemeDefinition = {
  id: 'dark' as ThemeId,
  name: 'Dark',
  description: 'Default dark theme',
  variant: 'dark',
  colors: {
    bgPrimary: '#1a1a2e',
    bgSecondary: '#16213e',
    bgTertiary: '#0f3460',
    bgSurface: '#1e1e30',
    bgOverlay: 'rgba(0, 0, 0, 0.5)',
    fgPrimary: '#ffffff',
    fgSecondary: '#a0a0a0',
    fgMuted: '#666666',
    fgDisabled: '#444444',
    accent: '#e94560',
    accentHover: '#ff6b6b',
    accentActive: '#c73e54',
    success: '#00d26a',
    warning: '#ffbe0b',
    error: '#ff006e',
    info: '#00b4d8',
    borderPrimary: '#333366',
    borderSecondary: '#222244',
    borderFocus: '#e94560',
    controlBasic: '#4CAF50',
    controlStandard: '#2196F3',
    controlAdvanced: '#9C27B0',
    controlExpert: '#FF5722',
  },
};

const LIGHT_THEME: ThemeDefinition = {
  id: 'light' as ThemeId,
  name: 'Light',
  description: 'Light theme for bright environments',
  variant: 'light',
  colors: {
    bgPrimary: '#ffffff',
    bgSecondary: '#f5f5f5',
    bgTertiary: '#e0e0e0',
    bgSurface: '#fafafa',
    bgOverlay: 'rgba(255, 255, 255, 0.8)',
    fgPrimary: '#1a1a1a',
    fgSecondary: '#666666',
    fgMuted: '#999999',
    fgDisabled: '#cccccc',
    accent: '#1976d2',
    accentHover: '#1565c0',
    accentActive: '#0d47a1',
    success: '#2e7d32',
    warning: '#f9a825',
    error: '#c62828',
    info: '#0288d1',
    borderPrimary: '#e0e0e0',
    borderSecondary: '#eeeeee',
    borderFocus: '#1976d2',
    controlBasic: '#4CAF50',
    controlStandard: '#2196F3',
    controlAdvanced: '#9C27B0',
    controlExpert: '#FF5722',
  },
};

const HIGH_CONTRAST_THEME: ThemeDefinition = {
  id: 'high-contrast' as ThemeId,
  name: 'High Contrast',
  description: 'High contrast theme for accessibility',
  variant: 'dark',
  colors: {
    bgPrimary: '#000000',
    bgSecondary: '#1a1a1a',
    bgTertiary: '#333333',
    bgSurface: '#0a0a0a',
    bgOverlay: 'rgba(0, 0, 0, 0.9)',
    fgPrimary: '#ffffff',
    fgSecondary: '#ffff00',
    fgMuted: '#cccccc',
    fgDisabled: '#666666',
    accent: '#00ffff',
    accentHover: '#00cccc',
    accentActive: '#009999',
    success: '#00ff00',
    warning: '#ffff00',
    error: '#ff0000',
    info: '#00ffff',
    borderPrimary: '#ffffff',
    borderSecondary: '#cccccc',
    borderFocus: '#ffff00',
    controlBasic: '#00ff00',
    controlStandard: '#00ffff',
    controlAdvanced: '#ff00ff',
    controlExpert: '#ff6600',
  },
};

// ============================================================================
// THEME REGISTRY
// ============================================================================

/**
 * Theme registry singleton.
 */
class ThemeRegistry {
  private themes = new Map<string, RegisteredTheme>();
  private listeners = new Set<() => void>();

  constructor() {
    // Register builtin themes
    this.registerBuiltin(DARK_THEME);
    this.registerBuiltin(LIGHT_THEME);
    this.registerBuiltin(HIGH_CONTRAST_THEME);
  }

  private registerBuiltin(definition: ThemeDefinition): void {
    this.themes.set(definition.id, {
      definition,
      provenance: createBuiltinProvenance(),
    });
  }

  /**
   * Registers an extension theme.
   * Theme ID must be namespaced.
   */
  register(
    definition: ThemeDefinition,
    packId: string,
    packVersion: string
  ): void {
    // Validate namespacing
    if (!isNamespacedId(definition.id)) {
      throw new Error(
        `Extension theme ID "${definition.id}" must be namespaced (e.g., "${packId}:${definition.id}")`
      );
    }

    // Check for builtin collision
    if (this.themes.has(definition.id)) {
      const existing = this.themes.get(definition.id)!;
      if (existing.provenance.source === 'builtin') {
        throw new Error(
          `Cannot override builtin theme "${definition.id}"`
        );
      }
    }

    this.themes.set(definition.id, {
      definition,
      provenance: createExtensionProvenance(packId, packVersion),
    });

    this.notifyListeners();
  }

  /**
   * Unregisters an extension theme.
   */
  unregister(themeId: ThemeId): boolean {
    const theme = this.themes.get(themeId);
    if (!theme) return false;

    // Cannot unregister builtins
    if (theme.provenance.source === 'builtin') {
      return false;
    }

    this.themes.delete(themeId);
    this.notifyListeners();
    return true;
  }

  /**
   * Gets a theme by ID.
   */
  get(themeId: ThemeId): RegisteredTheme | undefined {
    return this.themes.get(themeId);
  }

  /**
   * Gets a theme definition by ID.
   */
  getDefinition(themeId: ThemeId): ThemeDefinition | undefined {
    return this.themes.get(themeId)?.definition;
  }

  /**
   * Gets all registered themes.
   */
  getAll(): readonly RegisteredTheme[] {
    return Array.from(this.themes.values());
  }

  /**
   * Gets all theme IDs.
   */
  getAllIds(): readonly ThemeId[] {
    return Array.from(this.themes.keys()) as ThemeId[];
  }

  /**
   * Gets themes filtered by variant.
   */
  getByVariant(variant: 'dark' | 'light'): readonly RegisteredTheme[] {
    return this.getAll().filter(t => t.definition.variant === variant);
  }

  /**
   * Gets themes from a specific pack.
   */
  getByPack(packId: string): readonly RegisteredTheme[] {
    return this.getAll().filter(t => t.provenance.packId === packId);
  }

  /**
   * Checks if a theme ID is registered.
   */
  has(themeId: ThemeId): boolean {
    return this.themes.has(themeId);
  }

  /**
   * Subscribes to registry changes.
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (error) {
        console.error('Error in theme registry listener:', error);
      }
    }
  }
}

/**
 * Global theme registry instance.
 */
export const themeRegistry = new ThemeRegistry();

/**
 * Creates a theme ID from a namespaced string.
 */
export function createThemeId(id: string): ThemeId {
  return id as ThemeId;
}

/**
 * Validates a theme ID.
 */
export function isValidThemeId(id: string): id is ThemeId {
  return typeof id === 'string' && id.length > 0;
}
