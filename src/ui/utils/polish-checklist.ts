/**
 * UI Polish Checklist and Utilities
 *
 * Comprehensive checklist and helper utilities for Phase P UI polish tasks
 */

/**
 * UI Polish Checklist
 * 
 * Use this checklist to audit and verify UI polish across the application
 */
export interface UIPolishChecklist {
  // P002: Consistent spacing/padding
  spacing: {
    verified: boolean;
    notes: string[];
  };
  
  // P003: Consistent typography
  typography: {
    verified: boolean;
    notes: string[];
  };
  
  // P004: Consistent color usage
  colors: {
    verified: boolean;
    notes: string[];
  };
  
  // P005: Consistent iconography
  icons: {
    verified: boolean;
    notes: string[];
  };
  
  // P006: Consistent interaction patterns
  interactions: {
    verified: boolean;
    notes: string[];
  };
  
  // P007: Smooth animations (60fps)
  animations: {
    verified: boolean;
    fps: number;
    notes: string[];
  };
  
  // P008: Loading states
  loadingStates: {
    verified: boolean;
    components: string[];
  };
  
  // P009: Empty states
  emptyStates: {
    verified: boolean;
    components: string[];
  };
  
  // P010: Error states
  errorStates: {
    verified: boolean;
    components: string[];
  };
  
  // P011: Modals and overlays
  modals: {
    verified: boolean;
    components: string[];
  };
  
  // P012: Tooltips
  tooltips: {
    verified: boolean;
    placement: boolean;
    timing: boolean;
  };
  
  // P013: Notifications/toasts
  notifications: {
    verified: boolean;
    positioning: boolean;
  };
  
  // P016: Text readability (contrast)
  contrast: {
    verified: boolean;
    wcagAA: boolean;
    notes: string[];
  };
  
  // P018: Focus indicators
  focusIndicators: {
    verified: boolean;
    components: string[];
  };
  
  // P019: Hover states
  hoverStates: {
    verified: boolean;
    components: string[];
  };
  
  // P021: Theme compatibility
  themes: {
    lightMode: boolean;
    darkMode: boolean;
    notes: string[];
  };
  
  // P023: Reduced motion
  reducedMotion: {
    verified: boolean;
    respectsPreference: boolean;
  };
  
  // P028: Progress indicators
  progressIndicators: {
    verified: boolean;
    operations: string[];
  };
  
  // P030: Undo support
  undoSupport: {
    verified: boolean;
    actions: string[];
  };
  
  // P031: Confirmation dialogs
  confirmations: {
    verified: boolean;
    destructiveActions: string[];
  };
  
  // P032: Keyboard navigation
  keyboardNav: {
    verified: boolean;
    components: string[];
  };
  
  // P033: Screen reader support
  screenReader: {
    verified: boolean;
    ariaLabels: boolean;
    semanticHTML: boolean;
  };
}

/**
 * Create an empty checklist
 */
export function createUIPolishChecklist(): UIPolishChecklist {
  return {
    spacing: { verified: false, notes: [] },
    typography: { verified: false, notes: [] },
    colors: { verified: false, notes: [] },
    icons: { verified: false, notes: [] },
    interactions: { verified: false, notes: [] },
    animations: { verified: false, fps: 0, notes: [] },
    loadingStates: { verified: false, components: [] },
    emptyStates: { verified: false, components: [] },
    errorStates: { verified: false, components: [] },
    modals: { verified: false, components: [] },
    tooltips: { verified: false, placement: false, timing: false },
    notifications: { verified: false, positioning: false },
    contrast: { verified: false, wcagAA: false, notes: [] },
    focusIndicators: { verified: false, components: [] },
    hoverStates: { verified: false, components: [] },
    themes: { lightMode: false, darkMode: false, notes: [] },
    reducedMotion: { verified: false, respectsPreference: false },
    progressIndicators: { verified: false, operations: [] },
    undoSupport: { verified: false, actions: [] },
    confirmations: { verified: false, destructiveActions: [] },
    keyboardNav: { verified: false, components: [] },
    screenReader: { verified: false, ariaLabels: false, semanticHTML: false },
  };
}

/**
 * Calculate completion percentage of the checklist
 */
export function calculateChecklistCompletion(
  checklist: UIPolishChecklist
): number {
  const keys = Object.keys(checklist) as (keyof UIPolishChecklist)[];
  const verified = keys.filter((key) => {
    const item = checklist[key];
    return typeof item === 'object' && 'verified' in item && item.verified;
  });
  
  return Math.round((verified.length / keys.length) * 100);
}

/**
 * Generate checklist report
 */
export function generateChecklistReport(
  checklist: UIPolishChecklist
): string {
  const completion = calculateChecklistCompletion(checklist);
  const lines: string[] = [];
  
  lines.push('# UI Polish Checklist Report');
  lines.push('');
  lines.push(`**Completion:** ${completion}%`);
  lines.push('');
  
  lines.push('## Status by Category');
  lines.push('');
  
  const entries = Object.entries(checklist) as [keyof UIPolishChecklist, any][];
  for (const [key, value] of entries) {
    if (typeof value === 'object' && 'verified' in value) {
      const status = value.verified ? '✅' : '⏳';
      lines.push(`- ${status} **${key}**`);
      
      if (value.notes && value.notes.length > 0) {
        value.notes.forEach((note: string) => {
          lines.push(`  - ${note}`);
        });
      }
    }
  }
  
  lines.push('');
  lines.push('## Next Steps');
  lines.push('');
  
  const incomplete = entries.filter(
    ([_, value]) =>
      typeof value === 'object' && 'verified' in value && !value.verified
  );
  
  if (incomplete.length === 0) {
    lines.push('🎉 All checklist items complete!');
  } else {
    lines.push('Focus on the following areas:');
    incomplete.slice(0, 5).forEach(([key, _]) => {
      lines.push(`- ${key}`);
    });
  }
  
  return lines.join('\n');
}

/**
 * WCAG Contrast Checker Utility
 * 
 * Checks color contrast ratios for WCAG compliance
 */
export interface ContrastCheckResult {
  ratio: number;
  passesAA: boolean; // 4.5:1 for normal text, 3:1 for large text
  passesAAA: boolean; // 7:1 for normal text, 4.5:1 for large text
  foreground: string;
  background: string;
}

/**
 * Calculate relative luminance of a color
 * @param rgb RGB values (0-255)
 */
function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;

  const r =
    rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g =
    gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b =
    bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Parse hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, '');
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
  return result
    ? {
        r: parseInt(result[1] ?? '0', 16),
        g: parseInt(result[2] ?? '0', 16),
        b: parseInt(result[3] ?? '0', 16),
      }
    : null;
}

/**
 * Calculate contrast ratio between two colors
 * @param foreground Foreground color (hex)
 * @param background Background color (hex)
 */
export function calculateContrastRatio(
  foreground: string,
  background: string
): ContrastCheckResult {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  if (!fg || !bg) {
    throw new Error('Invalid hex color format');
  }

  const l1 = getRelativeLuminance(fg);
  const l2 = getRelativeLuminance(bg);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  const ratio = (lighter + 0.05) / (darker + 0.05);

  return {
    ratio,
    passesAA: ratio >= 4.5,
    passesAAA: ratio >= 7.0,
    foreground,
    background,
  };
}

/**
 * Check if large text meets WCAG AA standards
 * Large text: 18pt+ or 14pt+ bold
 */
export function checkLargeTextContrast(
  foreground: string,
  background: string
): ContrastCheckResult {
  const result = calculateContrastRatio(foreground, background);
  return {
    ...result,
    passesAA: result.ratio >= 3.0,
    passesAAA: result.ratio >= 4.5,
  };
}

/**
 * Batch check multiple color combinations
 */
export function batchCheckContrast(
  combinations: Array<{ foreground: string; background: string; label: string }>
): Array<ContrastCheckResult & { label: string }> {
  return combinations.map((combo) => ({
    ...calculateContrastRatio(combo.foreground, combo.background),
    label: combo.label,
  }));
}

/**
 * Generate contrast report
 */
export function generateContrastReport(
  results: Array<ContrastCheckResult & { label: string }>
): string {
  const lines: string[] = [];
  
  lines.push('# WCAG Contrast Audit Report');
  lines.push('');
  lines.push('## Results');
  lines.push('');
  lines.push('| Component | Ratio | AA | AAA | Colors |');
  lines.push('|-----------|-------|----|----|--------|');
  
  for (const result of results) {
    const aaStatus = result.passesAA ? '✅' : '❌';
    const aaaStatus = result.passesAAA ? '✅' : '❌';
    const colors = `${result.foreground} on ${result.background}`;
    lines.push(
      `| ${result.label} | ${result.ratio.toFixed(2)}:1 | ${aaStatus} | ${aaaStatus} | ${colors} |`
    );
  }
  
  lines.push('');
  
  const failures = results.filter((r) => !r.passesAA);
  if (failures.length > 0) {
    lines.push('## ⚠️ Failed Combinations');
    lines.push('');
    failures.forEach((f) => {
      lines.push(`- **${f.label}**: ${f.ratio.toFixed(2)}:1 (needs 4.5:1)`);
    });
  } else {
    lines.push('## ✅ All combinations pass WCAG AA');
  }
  
  return lines.join('\n');
}
