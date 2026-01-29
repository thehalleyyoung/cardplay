/**
 * Control Spectrum Badge Tests
 */

import { describe, it, expect } from 'vitest';
import { ControlSpectrumBadge } from './control-spectrum-badge';
import type { ControlLevel } from '../../boards/types';

describe('ControlSpectrumBadge', () => {
  it('should create a badge with the correct control level', () => {
    const badge = new ControlSpectrumBadge({
      controlLevel: 'full-manual',
    });
    
    const element = badge.getElement();
    expect(element).toBeTruthy();
    expect(element.className).toContain('control-spectrum-badge');
  });
  
  it('should show label when showLabel is true', () => {
    const badge = new ControlSpectrumBadge({
      controlLevel: 'assisted',
      showLabel: true,
    });
    
    const element = badge.getElement();
    const label = element.querySelector('.control-spectrum-badge__label');
    expect(label).toBeTruthy();
    expect(label?.textContent).toBe('Assisted');
  });
  
  it('should hide label when showLabel is false', () => {
    const badge = new ControlSpectrumBadge({
      controlLevel: 'assisted',
      showLabel: false,
    });
    
    const element = badge.getElement();
    const label = element.querySelector('.control-spectrum-badge__label');
    expect(label).toBeFalsy();
  });
  
  it('should update control level dynamically', () => {
    const badge = new ControlSpectrumBadge({
      controlLevel: 'full-manual',
      showLabel: true,
    });
    
    badge.updateControlLevel('generative');
    
    const element = badge.getElement();
    const label = element.querySelector('.control-spectrum-badge__label');
    expect(label?.textContent).toBe('Generative');
  });
  
  it('should apply correct size classes', () => {
    const smallBadge = new ControlSpectrumBadge({
      controlLevel: 'full-manual',
      size: 'small',
    });
    expect(smallBadge.getElement().className).toContain('control-spectrum-badge--small');
    
    const mediumBadge = new ControlSpectrumBadge({
      controlLevel: 'full-manual',
      size: 'medium',
    });
    expect(mediumBadge.getElement().className).toContain('control-spectrum-badge--medium');
    
    const largeBadge = new ControlSpectrumBadge({
      controlLevel: 'full-manual',
      size: 'large',
    });
    expect(largeBadge.getElement().className).toContain('control-spectrum-badge--large');
  });
  
  it('should cleanup when destroyed', () => {
    const badge = new ControlSpectrumBadge({
      controlLevel: 'full-manual',
    });
    
    const element = badge.getElement();
    badge.destroy();
    
    // Element should be removed from DOM (if it was attached)
    expect(element.parentElement).toBeFalsy();
  });
});
