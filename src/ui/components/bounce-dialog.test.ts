/**
 * @fileoverview Tests for Bounce Dialog Component
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BounceDialog, type BounceDialogConfig } from './bounce-dialog';
import type { EventStreamId } from '../../state/event-store';

describe('BounceDialog', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should create dialog with default settings', () => {
    const config: BounceDialogConfig = {
      target: {
        type: 'stream',
        id: 'test-stream' as EventStreamId,
        name: 'Test Stream'
      }
    };

    const dialog = new BounceDialog(config);
    dialog.mount(container);

    expect(container.querySelector('.bounce-dialog')).toBeTruthy();
    expect(container.querySelector('.bounce-dialog__title')?.textContent).toContain('Test Stream');
  });

  it('should show format options', () => {
    const config: BounceDialogConfig = {
      target: {
        type: 'stream',
        name: 'Test'
      }
    };

    const dialog = new BounceDialog(config);
    dialog.mount(container);

    const formats = container.querySelectorAll('input[name="format"]');
    expect(formats.length).toBe(3); // wav, mp3, ogg
  });

  it('should show quality settings', () => {
    const config: BounceDialogConfig = {
      target: {
        type: 'stream',
        name: 'Test'
      }
    };

    const dialog = new BounceDialog(config);
    dialog.mount(container);

    const sampleRate = container.querySelector('select.bounce-form__select');
    expect(sampleRate).toBeTruthy();
    expect(sampleRate?.querySelectorAll('option').length).toBeGreaterThan(0);
  });

  it('should handle cancel action', () => {
    const onCancel = vi.fn();
    const config: BounceDialogConfig = {
      target: {
        type: 'stream',
        name: 'Test'
      },
      onCancel
    };

    const dialog = new BounceDialog(config);
    dialog.mount(container);

    const cancelBtn = container.querySelector('.bounce-dialog__button--secondary') as HTMLButtonElement;
    expect(cancelBtn).toBeTruthy();
    
    cancelBtn.click();
    expect(onCancel).toHaveBeenCalled();
  });

  it('should update filename extension based on format', () => {
    const config: BounceDialogConfig = {
      target: {
        type: 'stream',
        name: 'Test'
      }
    };

    const dialog = new BounceDialog(config);
    dialog.mount(container);

    // Select MP3 format
    const mp3Radio = container.querySelector('input[value="mp3"]') as HTMLInputElement;
    mp3Radio.click();

    // Check extension updated
    const extension = container.querySelector('.bounce-form__extension');
    expect(extension?.textContent).toContain('.mp3');
  });

  it('should show normalize options when enabled', () => {
    const config: BounceDialogConfig = {
      target: {
        type: 'stream',
        name: 'Test'
      }
    };

    const dialog = new BounceDialog(config);
    dialog.mount(container);

    // Normalize should be enabled by default
    const normalizeCheckbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(normalizeCheckbox?.checked).toBe(true);

    // Should see peak level slider
    const peakSlider = container.querySelector('input[type="range"]');
    expect(peakSlider).toBeTruthy();
  });

  it('should hide bit depth for lossy formats', () => {
    const config: BounceDialogConfig = {
      target: {
        type: 'stream',
        name: 'Test'
      }
    };

    const dialog = new BounceDialog(config);
    dialog.mount(container);

    // Default is WAV, should show bit depth
    let selects = container.querySelectorAll('select.bounce-form__select');
    expect(selects.length).toBe(2); // Sample rate + bit depth

    // Switch to MP3
    const mp3Radio = container.querySelector('input[value="mp3"]') as HTMLInputElement;
    mp3Radio.click();

    // Should only show sample rate now
    selects = container.querySelectorAll('select.bounce-form__select');
    expect(selects.length).toBe(1); // Sample rate only
  });

  it('should show reverb tail settings when enabled', () => {
    const config: BounceDialogConfig = {
      target: {
        type: 'stream',
        name: 'Test'
      }
    };

    const dialog = new BounceDialog(config);
    dialog.mount(container);

    // Include reverb should be enabled by default
    const reverbCheckboxes = container.querySelectorAll('input[type="checkbox"]');
    const reverbCheckbox = Array.from(reverbCheckboxes).find(
      cb => cb.nextElementSibling?.textContent?.includes('Reverb')
    ) as HTMLInputElement;
    
    expect(reverbCheckbox?.checked).toBe(true);

    // Should see tail length slider
    const sliders = container.querySelectorAll('input[type="range"]');
    expect(sliders.length).toBeGreaterThan(0);
  });

  it('should generate default filename', () => {
    const config: BounceDialogConfig = {
      target: {
        type: 'stream',
        name: 'My Cool Track'
      }
    };

    const dialog = new BounceDialog(config);
    dialog.mount(container);

    const filenameInput = container.querySelector('.bounce-form__input') as HTMLInputElement;
    expect(filenameInput?.value).toContain('My_Cool_Track');
  });

  it('should be keyboard accessible', () => {
    const config: BounceDialogConfig = {
      target: {
        type: 'stream',
        name: 'Test'
      }
    };

    const dialog = new BounceDialog(config);
    dialog.mount(container);

    // Check ARIA attributes
    const dialogEl = container.querySelector('.bounce-dialog-backdrop');
    expect(dialogEl?.getAttribute('role')).toBe('dialog');
    expect(dialogEl?.getAttribute('aria-modal')).toBe('true');
    expect(dialogEl?.getAttribute('aria-labelledby')).toBe('bounce-dialog-title');
  });
});
