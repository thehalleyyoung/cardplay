/**
 * @fileoverview Tests for Design System Foundation.
 */

import { describe, it, expect } from 'vitest';
import {
  // Types
  type ThemeMode,
  type ColorIntent,
  type ColorShade,
  type TypographySize,
  
  // Color Scales
  NEUTRAL_SCALE,
  PRIMARY_SCALE,
  COLOR_SCALES,
  
  // Semantic Colors
  LIGHT_COLORS,
  DARK_COLORS,
  HIGH_CONTRAST_COLORS,
  
  // Typography
  DEFAULT_TYPOGRAPHY,
  
  // Spacing & Sizing
  SPACING_SCALE,
  RADIUS_SCALE,
  SHADOW_SCALE,
  
  // Animation
  ANIMATION_DURATIONS,
  ANIMATION_EASINGS,
  
  // Theme Factory
  createTheme,
  LIGHT_THEME,
  DARK_THEME,
  HIGH_CONTRAST_THEME,
  
  // CSS Properties
  themeToCSSProperties,
  themeToCSSString,
  
  // Focus & State
  DEFAULT_FOCUS_RING,
  focusRingCSS,
  DEFAULT_STATE_STYLES,
  
  // Theme Context
  getSystemThemeMode,
  getStoredThemeMode,
  storeThemeMode,
  
  // Accessibility
  prefersReducedMotion,
  getAnimationDuration,
  prefersHighContrast,
} from './theme';

// ============================================================================
// COLOR SCALE TESTS
// ============================================================================

describe('Color Scales', () => {
  it('should have all shades in NEUTRAL_SCALE', () => {
    expect(NEUTRAL_SCALE[50]).toBeDefined();
    expect(NEUTRAL_SCALE[100]).toBeDefined();
    expect(NEUTRAL_SCALE[500]).toBeDefined();
    expect(NEUTRAL_SCALE[900]).toBeDefined();
    expect(NEUTRAL_SCALE[950]).toBeDefined();
  });

  it('should have all shades in PRIMARY_SCALE', () => {
    expect(PRIMARY_SCALE[50]).toBe('#eff6ff');
    expect(PRIMARY_SCALE[500]).toBe('#3b82f6');
    expect(PRIMARY_SCALE[950]).toBe('#172554');
  });

  it('should have all color intents in COLOR_SCALES', () => {
    const intents: ColorIntent[] = [
      'primary', 'secondary', 'accent', 'success',
      'warning', 'error', 'info', 'neutral'
    ];
    
    for (const intent of intents) {
      expect(COLOR_SCALES[intent]).toBeDefined();
      expect(COLOR_SCALES[intent][500]).toBeDefined();
    }
  });
});

// ============================================================================
// SEMANTIC COLORS TESTS
// ============================================================================

describe('Semantic Colors', () => {
  describe('LIGHT_COLORS', () => {
    it('should have light backgrounds', () => {
      expect(LIGHT_COLORS.bgPrimary).toBe('#ffffff');
    });

    it('should have dark text', () => {
      expect(LIGHT_COLORS.textPrimary).toBe(NEUTRAL_SCALE[900]);
    });

    it('should have all required properties', () => {
      expect(LIGHT_COLORS.interactive).toBeDefined();
      expect(LIGHT_COLORS.borderFocus).toBeDefined();
      expect(LIGHT_COLORS.success).toBeDefined();
    });
  });

  describe('DARK_COLORS', () => {
    it('should have dark backgrounds', () => {
      expect(DARK_COLORS.bgPrimary).toBe(NEUTRAL_SCALE[900]);
    });

    it('should have light text', () => {
      expect(DARK_COLORS.textPrimary).toBe('#ffffff');
    });
  });

  describe('HIGH_CONTRAST_COLORS', () => {
    it('should have pure black background', () => {
      expect(HIGH_CONTRAST_COLORS.bgPrimary).toBe('#000000');
    });

    it('should have pure white text', () => {
      expect(HIGH_CONTRAST_COLORS.textPrimary).toBe('#ffffff');
    });

    it('should use high contrast colors for status', () => {
      expect(HIGH_CONTRAST_COLORS.error).toBe('#ff0000');
      expect(HIGH_CONTRAST_COLORS.success).toBe('#00ff00');
    });
  });
});

// ============================================================================
// TYPOGRAPHY TESTS
// ============================================================================

describe('Typography', () => {
  it('should have font families', () => {
    expect(DEFAULT_TYPOGRAPHY.fontFamily).toContain('system');
    expect(DEFAULT_TYPOGRAPHY.fontFamilyMono).toContain('mono');
  });

  it('should have all size definitions', () => {
    const sizes: TypographySize[] = [
      'xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl'
    ];
    
    for (const size of sizes) {
      expect(DEFAULT_TYPOGRAPHY.sizes[size]).toBeDefined();
      expect(DEFAULT_TYPOGRAPHY.sizes[size].fontSize).toBeDefined();
      expect(DEFAULT_TYPOGRAPHY.sizes[size].lineHeight).toBeDefined();
    }
  });

  it('should have increasing font sizes', () => {
    const sizes = DEFAULT_TYPOGRAPHY.sizes;
    expect(parseInt(sizes.xs.fontSize)).toBeLessThan(parseInt(sizes.sm.fontSize));
    expect(parseInt(sizes.sm.fontSize)).toBeLessThan(parseInt(sizes.base.fontSize));
    expect(parseInt(sizes.base.fontSize)).toBeLessThan(parseInt(sizes.lg.fontSize));
  });

  it('should have all weights', () => {
    expect(DEFAULT_TYPOGRAPHY.weights.regular).toBe(400);
    expect(DEFAULT_TYPOGRAPHY.weights.medium).toBe(500);
    expect(DEFAULT_TYPOGRAPHY.weights.semibold).toBe(600);
    expect(DEFAULT_TYPOGRAPHY.weights.bold).toBe(700);
  });
});

// ============================================================================
// SPACING & SIZING TESTS
// ============================================================================

describe('Spacing Scale', () => {
  it('should have 4px base unit', () => {
    expect(SPACING_SCALE['1']).toBe('4px');
    expect(SPACING_SCALE['2']).toBe('8px');
    expect(SPACING_SCALE['4']).toBe('16px');
  });

  it('should have zero spacing', () => {
    expect(SPACING_SCALE['0']).toBe('0px');
  });

  it('should have half-step spacing', () => {
    expect(SPACING_SCALE['0.5']).toBe('2px');
    expect(SPACING_SCALE['1.5']).toBe('6px');
    expect(SPACING_SCALE['2.5']).toBe('10px');
  });
});

describe('Radius Scale', () => {
  it('should have none radius', () => {
    expect(RADIUS_SCALE.none).toBe('0px');
  });

  it('should have full radius for pills', () => {
    expect(RADIUS_SCALE.full).toBe('9999px');
  });

  it('should have intermediate values', () => {
    expect(RADIUS_SCALE.base).toBe('4px');
    expect(RADIUS_SCALE.lg).toBe('8px');
  });
});

describe('Shadow Scale', () => {
  it('should have none shadow', () => {
    expect(SHADOW_SCALE.none).toBe('none');
  });

  it('should have shadow definitions with CSS variable', () => {
    expect(SHADOW_SCALE.sm).toContain('var(--shadow-color)');
    expect(SHADOW_SCALE.lg).toContain('var(--shadow-color)');
  });
});

// ============================================================================
// ANIMATION TESTS
// ============================================================================

describe('Animation Durations', () => {
  it('should have instant duration', () => {
    expect(ANIMATION_DURATIONS.instant).toBe('0ms');
  });

  it('should have increasing durations', () => {
    expect(parseInt(ANIMATION_DURATIONS.fast)).toBeLessThan(
      parseInt(ANIMATION_DURATIONS.normal)
    );
    expect(parseInt(ANIMATION_DURATIONS.normal)).toBeLessThan(
      parseInt(ANIMATION_DURATIONS.slow)
    );
  });
});

describe('Animation Easings', () => {
  it('should have linear easing', () => {
    expect(ANIMATION_EASINGS.linear).toBe('linear');
  });

  it('should have spring easing with overshoot', () => {
    expect(ANIMATION_EASINGS.spring).toContain('1.275');
  });
});

// ============================================================================
// THEME FACTORY TESTS
// ============================================================================

describe('createTheme', () => {
  it('should create light theme', () => {
    const theme = createTheme('light');
    expect(theme.mode).toBe('light');
    expect(theme.colors.bgPrimary).toBe('#ffffff');
  });

  it('should create dark theme', () => {
    const theme = createTheme('dark');
    expect(theme.mode).toBe('dark');
    expect(theme.colors.textPrimary).toBe('#ffffff');
  });

  it('should create high-contrast theme', () => {
    const theme = createTheme('high-contrast');
    expect(theme.mode).toBe('high-contrast');
    expect(theme.colors.bgPrimary).toBe('#000000');
  });

  it('should include all token scales', () => {
    const theme = createTheme('light');
    expect(theme.typography).toBeDefined();
    expect(theme.spacing).toBeDefined();
    expect(theme.radius).toBeDefined();
    expect(theme.shadows).toBeDefined();
    expect(theme.animation).toBeDefined();
  });
});

describe('Pre-built themes', () => {
  it('should have LIGHT_THEME', () => {
    expect(LIGHT_THEME.mode).toBe('light');
  });

  it('should have DARK_THEME', () => {
    expect(DARK_THEME.mode).toBe('dark');
  });

  it('should have HIGH_CONTRAST_THEME', () => {
    expect(HIGH_CONTRAST_THEME.mode).toBe('high-contrast');
  });
});

// ============================================================================
// CSS PROPERTIES TESTS
// ============================================================================

describe('themeToCSSProperties', () => {
  it('should generate color properties', () => {
    const props = themeToCSSProperties(LIGHT_THEME);
    expect(props['--color-bg-primary']).toBe('#ffffff');
    expect(props['--color-text-primary']).toBeDefined();
  });

  it('should generate color scale properties', () => {
    const props = themeToCSSProperties(LIGHT_THEME);
    expect(props['--color-primary-500']).toBe(PRIMARY_SCALE[500]);
    expect(props['--color-neutral-900']).toBe(NEUTRAL_SCALE[900]);
  });

  it('should generate typography properties', () => {
    const props = themeToCSSProperties(LIGHT_THEME);
    expect(props['--font-family']).toBeDefined();
    expect(props['--font-size-base']).toBe('14px');
    expect(props['--font-weight-bold']).toBe('700');
  });

  it('should generate spacing properties', () => {
    const props = themeToCSSProperties(LIGHT_THEME);
    expect(props['--spacing-4']).toBe('16px');
  });

  it('should generate animation properties', () => {
    const props = themeToCSSProperties(LIGHT_THEME);
    expect(props['--duration-fast']).toBe('100ms');
    expect(props['--easing-ease-out']).toBeDefined();
  });
});

describe('themeToCSSString', () => {
  it('should generate valid CSS string', () => {
    const css = themeToCSSString(LIGHT_THEME);
    expect(css).toContain(':root {');
    expect(css).toContain('--color-bg-primary');
    expect(css).toContain('}');
  });

  it('should use custom selector', () => {
    const css = themeToCSSString(DARK_THEME, '[data-theme="dark"]');
    expect(css).toContain('[data-theme="dark"] {');
  });
});

// ============================================================================
// FOCUS & STATE STYLING TESTS
// ============================================================================

describe('Focus Ring', () => {
  it('should have default focus ring config', () => {
    expect(DEFAULT_FOCUS_RING.width).toBe('2px');
    expect(DEFAULT_FOCUS_RING.offset).toBe('2px');
    expect(DEFAULT_FOCUS_RING.style).toBe('solid');
  });

  it('should generate focus ring CSS', () => {
    const css = focusRingCSS();
    expect(css).toContain('outline:');
    expect(css).toContain('2px');
    expect(css).toContain('solid');
    expect(css).toContain('outline-offset:');
  });
});

describe('State Styles', () => {
  it('should have hover state', () => {
    expect(DEFAULT_STATE_STYLES.hover.background).toBeDefined();
  });

  it('should have disabled state', () => {
    expect(DEFAULT_STATE_STYLES.disabled.opacity).toBe('0.5');
    expect(DEFAULT_STATE_STYLES.disabled['pointer-events']).toBe('none');
  });

  it('should have focus state', () => {
    expect(DEFAULT_STATE_STYLES.focus.outline).toBeDefined();
  });
});

// ============================================================================
// THEME CONTEXT TESTS
// ============================================================================

describe('Theme Storage', () => {
  it('should handle missing localStorage gracefully', () => {
    // In node environment, the functions should handle missing localStorage
    // The implementation checks typeof localStorage === 'undefined'
    // Since we're in node, we test the return values
    expect(getStoredThemeMode()).toBeNull();
  });
});

describe('System Theme Detection', () => {
  it('should return light theme when window is undefined', () => {
    // In node environment, getSystemThemeMode should default to 'light'
    expect(getSystemThemeMode()).toBe('light');
  });
});

// ============================================================================
// ACCESSIBILITY TESTS
// ============================================================================

describe('Reduced Motion', () => {
  it('should return false for reduced motion in node environment', () => {
    // In node environment, prefersReducedMotion should return false
    expect(prefersReducedMotion()).toBe(false);
  });

  it('should return 0ms duration when reduced motion', () => {
    const duration = getAnimationDuration('slow', true);
    expect(duration).toBe('0ms');
  });

  it('should return normal duration when not reduced motion', () => {
    const duration = getAnimationDuration('slow', false);
    expect(duration).toBe('300ms');
  });
});

describe('High Contrast', () => {
  it('should return false for high contrast in node environment', () => {
    // In node environment, prefersHighContrast should return false
    expect(prefersHighContrast()).toBe(false);
  });
});

// ============================================================================
// TYPE TESTS
// ============================================================================

describe('Type Definitions', () => {
  it('should accept valid theme modes', () => {
    const modes: ThemeMode[] = ['light', 'dark', 'high-contrast'];
    expect(modes).toHaveLength(3);
  });

  it('should accept valid color shades', () => {
    const shades: ColorShade[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
    expect(shades).toHaveLength(11);
  });

  it('should accept valid typography sizes', () => {
    const sizes: TypographySize[] = ['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl'];
    expect(sizes).toHaveLength(8);
  });
});
