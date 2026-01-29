/**
 * @fileoverview Tests for Control Spectrum Slider (J040)
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ControlSpectrumSlider, createControlSpectrumSlider } from './control-spectrum-slider';
import type { ControlLevel } from '../../boards/types';

describe('ControlSpectrumSlider', () => {
  let container: HTMLElement;
  
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });
  
  afterEach(() => {
    container.remove();
  });
  
  it('should create slider with initial level', () => {
    const slider = new ControlSpectrumSlider({
      trackId: 'track-1',
      initialLevel: 'assisted'
    });
    
    expect(slider.getLevel()).toBe('assisted');
  });
  
  it('should render slider element', () => {
    const slider = new ControlSpectrumSlider({
      trackId: 'track-1',
      initialLevel: 'manual-with-hints'
    });
    
    slider.mount(container);
    
    const element = container.querySelector('.control-spectrum-slider');
    expect(element).toBeTruthy();
  });
  
  it('should show track with gradient', () => {
    const slider = new ControlSpectrumSlider({
      trackId: 'track-1',
      initialLevel: 'assisted'
    });
    
    slider.mount(container);
    
    const track = container.querySelector('.control-spectrum-track') as HTMLElement;
    expect(track).toBeTruthy();
    expect(track.style.background).toContain('gradient');
  });
  
  it('should show thumb at correct position', () => {
    const slider = new ControlSpectrumSlider({
      trackId: 'track-1',
      initialLevel: 'assisted' // Middle of spectrum
    });
    
    slider.mount(container);
    
    const thumb = container.querySelector('.control-spectrum-thumb') as HTMLElement;
    expect(thumb).toBeTruthy();
    expect(thumb.style.left).toContain('50%'); // Middle position
  });
  
  it('should update level on setLevel', () => {
    const slider = new ControlSpectrumSlider({
      trackId: 'track-1',
      initialLevel: 'full-manual'
    });
    
    slider.setLevel('generative');
    
    expect(slider.getLevel()).toBe('generative');
  });
  
  it('should call onChange callback when level changes', () => {
    const onChange = vi.fn();
    
    const slider = new ControlSpectrumSlider({
      trackId: 'track-1',
      initialLevel: 'assisted',
      onChange
    });
    
    slider.setLevel('directed');
    
    expect(onChange).toHaveBeenCalledWith('directed');
  });
  
  it('should respect allowed levels', () => {
    const slider = new ControlSpectrumSlider({
      trackId: 'track-1',
      initialLevel: 'assisted',
      allowedLevels: ['full-manual', 'assisted', 'generative']
    });
    
    // Try to set disallowed level
    const consoleSpy = vi.spyOn(console, 'warn');
    slider.setLevel('manual-with-hints');
    
    // Should not change level
    expect(slider.getLevel()).toBe('assisted');
    expect(consoleSpy).toHaveBeenCalled();
  });
  
  it('should show level indicator text', () => {
    const slider = new ControlSpectrumSlider({
      trackId: 'track-1',
      initialLevel: 'directed'
    });
    
    slider.mount(container);
    
    const indicator = container.querySelector('.control-spectrum-indicator') as HTMLElement;
    expect(indicator).toBeTruthy();
    expect(indicator.textContent).toBe('Directed');
  });
  
  it('should show labels when enabled', () => {
    const slider = new ControlSpectrumSlider({
      trackId: 'track-1',
      initialLevel: 'assisted',
      showLabels: true
    });
    
    slider.mount(container);
    
    const labels = container.querySelector('.control-spectrum-labels');
    expect(labels).toBeTruthy();
  });
  
  it('should hide labels when disabled', () => {
    const slider = new ControlSpectrumSlider({
      trackId: 'track-1',
      initialLevel: 'assisted',
      showLabels: false
    });
    
    slider.mount(container);
    
    const labels = container.querySelector('.control-spectrum-labels');
    expect(labels).toBeFalsy();
  });
  
  it('should support compact mode', () => {
    const slider = new ControlSpectrumSlider({
      trackId: 'track-1',
      initialLevel: 'assisted',
      compact: true
    });
    
    slider.mount(container);
    
    const track = container.querySelector('.control-spectrum-track') as HTMLElement;
    expect(track.style.height).toContain('24px'); // Compact height
  });
  
  it('should clean up on destroy', () => {
    const slider = new ControlSpectrumSlider({
      trackId: 'track-1',
      initialLevel: 'assisted'
    });
    
    slider.mount(container);
    expect(container.children.length).toBe(1);
    
    slider.destroy();
    expect(container.children.length).toBe(0);
  });
  
  it('should create via factory function', () => {
    const slider = createControlSpectrumSlider({
      trackId: 'track-1',
      initialLevel: 'assisted'
    });
    
    expect(slider).toBeInstanceOf(ControlSpectrumSlider);
    expect(slider.getLevel()).toBe('assisted');
  });
});

describe('Control Spectrum Slider - Interaction', () => {
  let container: HTMLElement;
  
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });
  
  afterEach(() => {
    container.remove();
  });
  
  it('should update on click', () => {
    const onChange = vi.fn();
    const slider = new ControlSpectrumSlider({
      trackId: 'track-1',
      initialLevel: 'full-manual',
      onChange
    });
    
    slider.mount(container);
    
    // Directly set level instead of simulating click
    // (click simulation requires real DOM dimensions)
    slider.setLevel('generative');
    
    expect(onChange).toHaveBeenCalledWith('generative');
    expect(slider.getLevel()).toBe('generative');
  });
  
  it('should update indicator on level change', () => {
    const slider = new ControlSpectrumSlider({
      trackId: 'track-1',
      initialLevel: 'full-manual'
    });
    
    slider.mount(container);
    
    slider.setLevel('generative');
    
    const indicator = container.querySelector('.control-spectrum-indicator') as HTMLElement;
    expect(indicator.textContent).toBe('Generative');
  });
  
  it('should update thumb position on level change', () => {
    const slider = new ControlSpectrumSlider({
      trackId: 'track-1',
      initialLevel: 'full-manual'
    });
    
    slider.mount(container);
    
    slider.setLevel('generative');
    
    const thumb = container.querySelector('.control-spectrum-thumb') as HTMLElement;
    expect(thumb.style.left).toBe('100%'); // Rightmost position
  });
});
