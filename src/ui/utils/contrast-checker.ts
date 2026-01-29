/**
 * Contrast Ratio Checker
 * 
 * Utilities for checking WCAG contrast ratios and identifying
 * accessibility issues in the UI.
 */

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return [r, g, b];
}

/**
 * Calculate relative luminance
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(val => {
    const sRGB = val / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/WAI/GL/wiki/Contrast_ratio
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(hexToRgb(color1));
  const lum2 = getLuminance(hexToRgb(color2));
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG conformance level
 */
export type WCAGLevel = 'AAA' | 'AA' | 'A' | 'fail';

/**
 * Text size category
 */
export type TextSize = 'normal' | 'large';

/**
 * Check if contrast ratio meets WCAG level
 */
export function meetsWCAG(
  ratio: number,
  level: WCAGLevel,
  textSize: TextSize = 'normal'
): boolean {
  if (level === 'AAA') {
    return textSize === 'large' ? ratio >= 4.5 : ratio >= 7;
  }
  if (level === 'AA') {
    return textSize === 'large' ? ratio >= 3 : ratio >= 4.5;
  }
  if (level === 'A') {
    return ratio >= 3;
  }
  return false;
}

/**
 * Get WCAG level achieved by contrast ratio
 */
export function getWCAGLevel(ratio: number, textSize: TextSize = 'normal'): WCAGLevel {
  if (meetsWCAG(ratio, 'AAA', textSize)) return 'AAA';
  if (meetsWCAG(ratio, 'AA', textSize)) return 'AA';
  if (meetsWCAG(ratio, 'A', textSize)) return 'A';
  return 'fail';
}

/**
 * Contrast check result
 */
export interface ContrastCheckResult {
  ratio: number;
  level: WCAGLevel;
  passes: boolean;
  recommendation?: string | undefined;
}

/**
 * Check contrast and provide recommendation
 */
export function checkContrast(
  foreground: string,
  background: string,
  textSize: TextSize = 'normal',
  targetLevel: WCAGLevel = 'AA'
): ContrastCheckResult {
  const ratio = getContrastRatio(foreground, background);
  const level = getWCAGLevel(ratio, textSize);
  const passes = meetsWCAG(ratio, targetLevel, textSize);
  
  let recommendation: string | undefined;
  if (!passes) {
    const required = targetLevel === 'AAA' 
      ? (textSize === 'large' ? 4.5 : 7)
      : (textSize === 'large' ? 3 : 4.5);
    const deficit = required - ratio;
    recommendation = `Increase contrast by ${deficit.toFixed(2)} to meet ${targetLevel} (${textSize})`;
  }
  
  return { ratio, level, passes, recommendation };
}

export default {
  getContrastRatio,
  meetsWCAG,
  getWCAGLevel,
  checkContrast
};
