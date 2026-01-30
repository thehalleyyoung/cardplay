/**
 * @fileoverview Hit Target Utilities
 * 
 * Ensures interactive elements meet minimum size requirements for
 * accessibility and touch-friendly interaction (WCAG 2.5.5).
 * 
 * @module @cardplay/ui/accessibility/hit-targets
 */

/**
 * Minimum hit target size for touch interactions (WCAG 2.5.5 Level AAA)
 */
export const MIN_HIT_TARGET_SIZE = 44; // pixels

/**
 * Recommended hit target size for comfortable interaction
 */
export const RECOMMENDED_HIT_TARGET_SIZE = 48; // pixels

/**
 * Checks if an element meets minimum hit target requirements
 */
export function meetsHitTargetSize(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width >= MIN_HIT_TARGET_SIZE && rect.height >= MIN_HIT_TARGET_SIZE;
}

/**
 * Applies minimum hit target padding to ensure sufficient size
 * 
 * This adds transparent padding around the element to expand the
 * clickable area without changing visual appearance.
 */
export function ensureHitTargetSize(element: HTMLElement, minSize: number = MIN_HIT_TARGET_SIZE): void {
  const rect = element.getBoundingClientRect();
  
  if (rect.width < minSize) {
    const extraWidth = minSize - rect.width;
    const paddingH = Math.ceil(extraWidth / 2);
    element.style.paddingLeft = `${paddingH}px`;
    element.style.paddingRight = `${paddingH}px`;
  }
  
  if (rect.height < minSize) {
    const extraHeight = minSize - rect.height;
    const paddingV = Math.ceil(extraHeight / 2);
    element.style.paddingTop = `${paddingV}px`;
    element.style.paddingBottom = `${paddingV}px`;
  }
}

/**
 * Creates a transparent overlay to expand hit target without visual change
 * 
 * Useful when padding would affect layout but the hit target needs expansion.
 */
export function addHitTargetOverlay(element: HTMLElement, minSize: number = MIN_HIT_TARGET_SIZE): HTMLElement {
  const rect = element.getBoundingClientRect();
  const widthShortfall = Math.max(0, minSize - rect.width);
  const heightShortfall = Math.max(0, minSize - rect.height);
  
  if (widthShortfall === 0 && heightShortfall === 0) {
    return element; // Already large enough
  }
  
  // Create a wrapper with expanded hit area
  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  wrapper.style.display = 'inline-block';
  
  // Create overlay that expands the clickable area
  const overlay = document.createElement('button');
  overlay.className = 'hit-target-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('tabindex', '-1');
  overlay.style.cssText = `
    position: absolute;
    top: ${-heightShortfall / 2}px;
    left: ${-widthShortfall / 2}px;
    right: ${-widthShortfall / 2}px;
    bottom: ${-heightShortfall / 2}px;
    background: transparent;
    border: none;
    cursor: pointer;
    z-index: 1;
    pointer-events: auto;
  `;
  
  // Forward clicks to the original element
  overlay.addEventListener('click', (e) => {
    e.stopPropagation();
    element.click();
  });
  
  // Wrap the element
  const parent = element.parentNode;
  if (parent) {
    parent.replaceChild(wrapper, element);
    wrapper.appendChild(element);
    wrapper.appendChild(overlay);
  }
  
  return wrapper;
}

/**
 * Audits all interactive elements on the page for hit target compliance
 */
export function auditHitTargets(): Array<{
  element: HTMLElement;
  width: number;
  height: number;
  compliant: boolean;
  selector: string;
}> {
  const interactiveSelectors = [
    'button',
    'a',
    'input[type="button"]',
    'input[type="submit"]',
    'input[type="reset"]',
    '[role="button"]',
    '[role="link"]',
    '[onclick]'
  ];
  
  const elements = document.querySelectorAll(interactiveSelectors.join(','));
  const results: Array<{
    element: HTMLElement;
    width: number;
    height: number;
    compliant: boolean;
    selector: string;
  }> = [];
  
  elements.forEach((el) => {
    if (!(el instanceof HTMLElement)) return;
    
    const rect = el.getBoundingClientRect();
    const compliant = rect.width >= MIN_HIT_TARGET_SIZE && rect.height >= MIN_HIT_TARGET_SIZE;
    
    results.push({
      element: el,
      width: rect.width,
      height: rect.height,
      compliant,
      selector: getSelectorForElement(el)
    });
  });
  
  return results;
}

/**
 * Generates a unique CSS selector for an element (for debugging)
 */
function getSelectorForElement(element: HTMLElement): string {
  if (element.id) {
    return `#${element.id}`;
  }
  
  if (element.className) {
    const classes = element.className.split(' ').filter(c => c.trim());
    if (classes.length > 0) {
      return `${element.tagName.toLowerCase()}.${classes.join('.')}`;
    }
  }
  
  return element.tagName.toLowerCase();
}

/**
 * Logs hit target audit results to console
 */
export function logHitTargetAudit(): void {
  const results = auditHitTargets();
  const nonCompliant = results.filter(r => !r.compliant);
  
  console.group('Hit Target Audit');
  console.log(`Total interactive elements: ${results.length}`);
  console.log(`Compliant: ${results.length - nonCompliant.length}`);
  console.log(`Non-compliant: ${nonCompliant.length}`);
  
  if (nonCompliant.length > 0) {
    console.group('Non-compliant elements:');
    nonCompliant.forEach(({ element, width, height, selector }) => {
      console.log(`${selector}: ${width.toFixed(1)}x${height.toFixed(1)}px`, element);
    });
    console.groupEnd();
  }
  
  console.groupEnd();
}
