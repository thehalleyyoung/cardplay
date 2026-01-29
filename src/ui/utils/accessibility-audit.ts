/**
 * Accessibility Audit Utility
 *
 * Checks UI elements for common accessibility issues and WCAG compliance.
 * Useful for development and automated testing.
 */

export interface AccessibilityIssue {
  readonly severity: 'error' | 'warning' | 'info';
  readonly rule: string;
  readonly element: HTMLElement;
  readonly message: string;
  readonly suggestion?: string;
}

export interface AccessibilityAuditResult {
  readonly passed: boolean;
  readonly errors: AccessibilityIssue[];
  readonly warnings: AccessibilityIssue[];
  readonly info: AccessibilityIssue[];
  readonly summary: string;
}

/**
 * Run accessibility audit on an element and its descendants
 */
export function auditAccessibility(root: HTMLElement): AccessibilityAuditResult {
  const errors: AccessibilityIssue[] = [];
  const warnings: AccessibilityIssue[] = [];
  const info: AccessibilityIssue[] = [];
  
  // Check all interactive elements
  const interactiveSelectors = 'button, a, input, select, textarea, [role="button"], [tabindex]';
  const interactiveElements = root.querySelectorAll(interactiveSelectors);
  
  interactiveElements.forEach((el) => {
    if (!(el instanceof HTMLElement)) return;
    
    // Check for accessible name
    checkAccessibleName(el, errors, warnings);
    
    // Check focus visibility
    checkFocusVisibility(el, warnings);
    
    // Check hit target size
    checkHitTargetSize(el, warnings);
    
    // Check color contrast
    checkColorContrast(el, warnings);
  });
  
  // Check for landmarks
  checkLandmarks(root, info);
  
  // Check heading hierarchy
  checkHeadingHierarchy(root, warnings);
  
  // Check images for alt text
  checkImageAltText(root, errors);
  
  // Check form labels
  checkFormLabels(root, errors);
  
  const passed = errors.length === 0;
  const summary = `${passed ? 'Passed' : 'Failed'}: ${errors.length} errors, ${warnings.length} warnings, ${info.length} info`;
  
  return {
    passed,
    errors,
    warnings,
    info,
    summary,
  };
}

/**
 * Check if interactive element has an accessible name
 */
function checkAccessibleName(
  element: HTMLElement,
  errors: AccessibilityIssue[],
  warnings: AccessibilityIssue[]
): void {
  const tagName = element.tagName.toLowerCase();
  const role = element.getAttribute('role');
  
  // Skip elements that don't need names
  if (tagName === 'input' && element.getAttribute('type') === 'hidden') return;
  
  const accessibleName =
    element.getAttribute('aria-label') ||
    element.getAttribute('aria-labelledby') ||
    element.textContent?.trim() ||
    (element as HTMLInputElement).value ||
    element.getAttribute('title') ||
    element.getAttribute('alt');
  
  if (!accessibleName) {
    const severity = role === 'button' || tagName === 'button' ? 'error' : 'warning';
    const issue: AccessibilityIssue = {
      severity,
      rule: 'accessible-name',
      element,
      message: `${tagName} element has no accessible name`,
      suggestion: 'Add aria-label, aria-labelledby, or text content',
    };
    
    if (severity === 'error') {
      errors.push(issue);
    } else {
      warnings.push(issue);
    }
  }
}

/**
 * Check if element has visible focus indicator
 */
function checkFocusVisibility(element: HTMLElement, warnings: AccessibilityIssue[]): void {
  const styles = window.getComputedStyle(element);
  const hasFocusVisible =
    styles.outlineWidth !== '0px' ||
    styles.outlineStyle !== 'none' ||
    element.style.outline !== 'none';
  
  if (!hasFocusVisible) {
    warnings.push({
      severity: 'warning',
      rule: 'focus-visible',
      element,
      message: 'Interactive element may not have visible focus indicator',
      suggestion: 'Ensure :focus and :focus-visible styles are defined',
    });
  }
}

/**
 * Check if interactive element meets minimum hit target size (44x44px WCAG 2.1 AAA, 24x24 AA)
 */
function checkHitTargetSize(element: HTMLElement, warnings: AccessibilityIssue[]): void {
  const rect = element.getBoundingClientRect();
  const minSize = 44; // WCAG 2.1 Level AAA (24 for AA)
  
  if (rect.width < minSize || rect.height < minSize) {
    warnings.push({
      severity: 'warning',
      rule: 'hit-target-size',
      element,
      message: `Hit target is ${Math.round(rect.width)}x${Math.round(rect.height)}px (minimum recommended: ${minSize}x${minSize}px)`,
      suggestion: 'Increase padding or dimensions to meet WCAG 2.1 AAA standards',
    });
  }
}

/**
 * Check color contrast ratio (simplified check)
 */
function checkColorContrast(element: HTMLElement, warnings: AccessibilityIssue[]): void {
  const styles = window.getComputedStyle(element);
  const color = styles.color;
  const background = styles.backgroundColor;
  
  // Skip if no background color set (inherited)
  if (!background || background === 'rgba(0, 0, 0, 0)') return;
  
  const ratio = calculateContrastRatio(color, background);
  const minRatio = 4.5; // WCAG AA for normal text
  
  if (ratio < minRatio) {
    warnings.push({
      severity: 'warning',
      rule: 'color-contrast',
      element,
      message: `Color contrast ratio is ${ratio.toFixed(2)}:1 (minimum: ${minRatio}:1)`,
      suggestion: 'Increase contrast between text and background',
    });
  }
}

/**
 * Calculate contrast ratio between two colors
 */
function calculateContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get relative luminance of a color
 */
function getRelativeLuminance(color: string): number {
  // Parse RGB values from color string
  const rgb = parseColor(color);
  if (!rgb) return 0;
  
  // Convert to linear RGB
  const [r = 0, g = 0, b = 0] = rgb.map((val) => {
    const srgb = val / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  
  // Calculate relative luminance
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Parse color string to RGB array
 */
function parseColor(color: string): [number, number, number] | null {
  // Handle rgb() and rgba()
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return [parseInt(rgbMatch[1] ?? '0'), parseInt(rgbMatch[2] ?? '0'), parseInt(rgbMatch[3] ?? '0')];
  }
  
  // Handle hex colors
  const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    return [
      parseInt(hexMatch[1] ?? '0', 16),
      parseInt(hexMatch[2] ?? '0', 16),
      parseInt(hexMatch[3] ?? '0', 16),
    ];
  }
  
  return null;
}

/**
 * Check for ARIA landmarks
 */
function checkLandmarks(root: HTMLElement, info: AccessibilityIssue[]): void {
  const landmarks = root.querySelectorAll('[role="banner"], [role="navigation"], [role="main"], [role="contentinfo"], header, nav, main, footer');
  
  if (landmarks.length === 0) {
    info.push({
      severity: 'info',
      rule: 'landmarks',
      element: root,
      message: 'No ARIA landmarks found',
      suggestion: 'Consider adding semantic HTML elements (header, nav, main, footer) or ARIA roles',
    });
  }
}

/**
 * Check heading hierarchy
 */
function checkHeadingHierarchy(root: HTMLElement, warnings: AccessibilityIssue[]): void {
  const headings = Array.from(root.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let lastLevel = 0;
  
  headings.forEach((heading) => {
    if (!(heading instanceof HTMLElement)) return;
    const level = parseInt(heading.tagName[1] ?? '0');
    
    if (lastLevel > 0 && level > lastLevel + 1) {
      warnings.push({
        severity: 'warning',
        rule: 'heading-hierarchy',
        element: heading,
        message: `Heading level skipped: <h${lastLevel}> followed by <h${level}>`,
        suggestion: 'Use heading levels in sequential order',
      });
    }
    
    lastLevel = level;
  });
}

/**
 * Check images for alt text
 */
function checkImageAltText(root: HTMLElement, errors: AccessibilityIssue[]): void {
  const images = root.querySelectorAll('img');
  
  images.forEach((img) => {
    if (!(img instanceof HTMLImageElement)) return;
    
    const hasAlt = img.hasAttribute('alt');
    const isDecorative = img.getAttribute('role') === 'presentation' || img.getAttribute('role') === 'none';
    
    if (!hasAlt && !isDecorative) {
      errors.push({
        severity: 'error',
        rule: 'image-alt',
        element: img,
        message: 'Image missing alt attribute',
        suggestion: 'Add alt="" for decorative images or descriptive alt text',
      });
    }
  });
}

/**
 * Check form inputs for labels
 */
function checkFormLabels(root: HTMLElement, errors: AccessibilityIssue[]): void {
  const inputs = root.querySelectorAll('input:not([type="hidden"]), select, textarea');
  
  inputs.forEach((input) => {
    if (!(input instanceof HTMLElement)) return;
    
    const hasLabel =
      input.hasAttribute('aria-label') ||
      input.hasAttribute('aria-labelledby') ||
      input.getAttribute('title') ||
      (input.id && root.querySelector(`label[for="${input.id}"]`));
    
    if (!hasLabel) {
      errors.push({
        severity: 'error',
        rule: 'form-label',
        element: input,
        message: 'Form control has no associated label',
        suggestion: 'Add <label>, aria-label, or aria-labelledby',
      });
    }
  });
}

/**
 * Print audit report to console
 */
export function printAuditReport(result: AccessibilityAuditResult): void {
  console.group('♿ Accessibility Audit');
  console.log(result.summary);
  
  if (result.errors.length > 0) {
    console.group(`❌ ${result.errors.length} Error(s)`);
    result.errors.forEach((issue) => {
      console.log(`${issue.rule}: ${issue.message}`, issue.element);
      if (issue.suggestion) {
        console.log(`  💡 ${issue.suggestion}`);
      }
    });
    console.groupEnd();
  }
  
  if (result.warnings.length > 0) {
    console.group(`⚠️  ${result.warnings.length} Warning(s)`);
    result.warnings.forEach((issue) => {
      console.log(`${issue.rule}: ${issue.message}`, issue.element);
      if (issue.suggestion) {
        console.log(`  💡 ${issue.suggestion}`);
      }
    });
    console.groupEnd();
  }
  
  if (result.info.length > 0) {
    console.group(`ℹ️  ${result.info.length} Info`);
    result.info.forEach((issue) => {
      console.log(`${issue.rule}: ${issue.message}`, issue.element);
      if (issue.suggestion) {
        console.log(`  💡 ${issue.suggestion}`);
      }
    });
    console.groupEnd();
  }
  
  console.groupEnd();
}

/**
 * Auto-fix simple accessibility issues
 */
export function autoFixAccessibility(root: HTMLElement): number {
  let fixed = 0;
  
  // Auto-add alt="" to decorative images without alt
  const images = root.querySelectorAll('img:not([alt])');
  images.forEach((img) => {
    if (img instanceof HTMLImageElement && !img.getAttribute('role')) {
      img.setAttribute('alt', '');
      fixed++;
    }
  });
  
  return fixed;
}

/**
 * Check if specific element passes accessibility requirements
 */
export function checkElement(element: HTMLElement): AccessibilityIssue[] {
  const container = document.createElement('div');
  container.appendChild(element.cloneNode(true));
  const result = auditAccessibility(container);
  return [...result.errors, ...result.warnings];
}
