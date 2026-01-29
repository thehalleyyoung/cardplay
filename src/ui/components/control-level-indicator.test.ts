/**
 * @fileoverview Tests for Control Level Indicator Component
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createControlLevelIndicator,
  createControlLevelPicker,
  updateControlLevelIndicator,
} from './control-level-indicator';
import type { ControlLevel } from '../../boards/types';

describe('Control Level Indicator', () => {
  describe('createControlLevelIndicator', () => {
    it('creates badge format indicator', () => {
      const indicator = createControlLevelIndicator({
        level: 'full-manual',
        format: 'badge',
        size: 'medium',
        showLabel: true,
      });

      expect(indicator).toBeInstanceOf(HTMLElement);
      expect(indicator.dataset.level).toBe('full-manual');
      expect(indicator.className).toContain('control-level-indicator--badge');
      expect(indicator.textContent).toBe('Manual');
    });

    it('creates bar format indicator', () => {
      const indicator = createControlLevelIndicator({
        level: 'assisted',
        format: 'bar',
        size: 'medium',
      });

      expect(indicator.className).toContain('control-level-indicator--bar');
      expect(indicator.dataset.level).toBe('assisted');
      expect(indicator.style.width).toBe('4px');
    });

    it('creates dot format indicator', () => {
      const indicator = createControlLevelIndicator({
        level: 'generative',
        format: 'dot',
        size: 'small',
      });

      expect(indicator.className).toContain('control-level-indicator--dot');
      expect(indicator.dataset.level).toBe('generative');
      expect(indicator.style.borderRadius).toBe('50%');
    });

    it('creates icon format indicator', () => {
      const indicator = createControlLevelIndicator({
        level: 'directed',
        format: 'icon',
        size: 'large',
        showLabel: true,
      });

      expect(indicator.className).toContain('control-level-indicator--icon');
      expect(indicator.dataset.level).toBe('directed');
      expect(indicator.textContent).toContain('Directed');
    });

    it('creates interactive indicator', () => {
      const onClick = vi.fn();
      const indicator = createControlLevelIndicator({
        level: 'collaborative',
        format: 'badge',
        interactive: true,
        onClick,
      });

      expect(indicator.classList.contains('control-level-indicator--interactive')).toBe(true);
      expect(indicator.getAttribute('role')).toBe('button');
      expect(indicator.getAttribute('tabindex')).toBe('0');

      indicator.click();
      expect(onClick).toHaveBeenCalledWith('collaborative');
    });

    it('handles keyboard interaction', () => {
      const onClick = vi.fn();
      const indicator = createControlLevelIndicator({
        level: 'assisted',
        format: 'badge',
        interactive: true,
        onClick,
      });

      // Enter key
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      indicator.dispatchEvent(enterEvent);
      expect(onClick).toHaveBeenCalledWith('assisted');

      // Space key
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      indicator.dispatchEvent(spaceEvent);
      expect(onClick).toHaveBeenCalledTimes(2);
    });

    it('creates small size indicator', () => {
      const indicator = createControlLevelIndicator({
        level: 'full-manual',
        format: 'badge',
        size: 'small',
      });

      expect(indicator.className).toContain('control-level-indicator--small');
    });

    it('hides label when showLabel is false', () => {
      const indicator = createControlLevelIndicator({
        level: 'assisted',
        format: 'badge',
        showLabel: false,
      });

      // Should show only initial
      expect(indicator.textContent).toBe('A');
    });
  });

  describe('createControlLevelPicker', () => {
    it('creates picker with current level', () => {
      const onChange = vi.fn();
      const picker = createControlLevelPicker({
        currentLevel: 'assisted',
        onChange,
      });

      expect(picker).toBeInstanceOf(HTMLElement);
      expect(picker.className).toContain('control-level-picker');
      
      const button = picker.querySelector('button');
      expect(button).toBeTruthy();
      expect(button?.getAttribute('aria-haspopup')).toBe('listbox');
    });

    it('shows dropdown menu on click', () => {
      const onChange = vi.fn();
      const picker = createControlLevelPicker({
        currentLevel: 'assisted',
        onChange,
      });

      const button = picker.querySelector('.control-level-picker__button') as HTMLButtonElement;
      const menu = picker.querySelector('.control-level-picker__menu') as HTMLElement;

      expect(menu.style.display).toBe('none');

      button?.click();
      expect(menu.style.display).toBe('block');
      expect(button?.getAttribute('aria-expanded')).toBe('true');
    });

    it('calls onChange when option selected', () => {
      const onChange = vi.fn();
      const picker = createControlLevelPicker({
        currentLevel: 'assisted',
        availableLevels: ['full-manual', 'assisted', 'directed'],
        onChange,
      });

      const button = picker.querySelector('.control-level-picker__button') as HTMLButtonElement;
      button?.click();

      const options = picker.querySelectorAll('.control-level-picker__option');
      expect(options.length).toBe(3);

      // Click the "directed" option (third option)
      (options[2] as HTMLButtonElement).click();
      expect(onChange).toHaveBeenCalledWith('directed');
    });

    it('highlights current level in menu', () => {
      const onChange = vi.fn();
      const picker = createControlLevelPicker({
        currentLevel: 'assisted',
        onChange,
      });

      const button = picker.querySelector('.control-level-picker__button') as HTMLButtonElement;
      button?.click();

      const options = picker.querySelectorAll('.control-level-picker__option');
      const selectedOption = Array.from(options).find(
        opt => opt.getAttribute('aria-selected') === 'true'
      );

      expect(selectedOption).toBeTruthy();
      expect(selectedOption?.textContent).toContain('Assisted');
    });

    it('respects available levels filter', () => {
      const onChange = vi.fn();
      const picker = createControlLevelPicker({
        currentLevel: 'full-manual',
        availableLevels: ['full-manual', 'manual-with-hints'],
        onChange,
      });

      const button = picker.querySelector('.control-level-picker__button') as HTMLButtonElement;
      button?.click();

      const options = picker.querySelectorAll('.control-level-picker__option');
      expect(options.length).toBe(2);
    });
  });

  describe('updateControlLevelIndicator', () => {
    it('updates badge indicator', () => {
      const indicator = createControlLevelIndicator({
        level: 'full-manual',
        format: 'badge',
        showLabel: true,
      });

      expect(indicator.textContent).toBe('Manual');
      expect(indicator.dataset.level).toBe('full-manual');

      updateControlLevelIndicator(indicator, 'generative');
      expect(indicator.textContent).toBe('Generate');
      expect(indicator.dataset.level).toBe('generative');
    });

    it('updates bar indicator color', () => {
      const indicator = createControlLevelIndicator({
        level: 'assisted',
        format: 'bar',
      });

      const initialColor = indicator.style.backgroundColor;
      updateControlLevelIndicator(indicator, 'directed');
      const newColor = indicator.style.backgroundColor;

      expect(newColor).not.toBe(initialColor);
      expect(indicator.dataset.level).toBe('directed');
    });

    it('updates dot indicator color', () => {
      const indicator = createControlLevelIndicator({
        level: 'collaborative',
        format: 'dot',
      });

      const initialColor = indicator.style.backgroundColor;
      updateControlLevelIndicator(indicator, 'generative');
      const newColor = indicator.style.backgroundColor;

      expect(newColor).not.toBe(initialColor);
      expect(indicator.dataset.level).toBe('generative');
    });

    it('updates aria-label', () => {
      const indicator = createControlLevelIndicator({
        level: 'full-manual',
        format: 'badge',
      });

      expect(indicator.getAttribute('aria-label')).toContain('Full Manual');

      updateControlLevelIndicator(indicator, 'assisted');
      expect(indicator.getAttribute('aria-label')).toContain('Assisted');
    });
  });

  describe('Control Level Labels', () => {
    const levels: ControlLevel[] = [
      'full-manual',
      'manual-with-hints',
      'assisted',
      'collaborative',
      'directed',
      'generative',
    ];

    it('creates indicators for all control levels', () => {
      levels.forEach(level => {
        const indicator = createControlLevelIndicator({
          level,
          format: 'badge',
        });

        expect(indicator.dataset.level).toBe(level);
        expect(indicator.textContent).toBeTruthy();
        expect(indicator.style.backgroundColor).toBeTruthy();
      });
    });

    it('generates unique colors for each level', () => {
      const colors = new Set<string>();

      levels.forEach(level => {
        const indicator = createControlLevelIndicator({
          level,
          format: 'badge',
        });
        colors.add(indicator.style.backgroundColor);
      });

      expect(colors.size).toBe(levels.length);
    });
  });

  describe('Accessibility', () => {
    it('includes aria-label for all formats', () => {
      const formats: Array<'badge' | 'bar' | 'dot' | 'icon'> = ['badge', 'bar', 'dot', 'icon'];

      formats.forEach(format => {
        const indicator = createControlLevelIndicator({
          level: 'assisted',
          format,
        });

        expect(indicator.getAttribute('aria-label')).toBeTruthy();
        expect(indicator.getAttribute('aria-label')).toContain('Assisted');
      });
    });

    it('sets role=button for interactive indicators', () => {
      const indicator = createControlLevelIndicator({
        level: 'assisted',
        format: 'badge',
        interactive: true,
        onClick: vi.fn(),
      });

      expect(indicator.getAttribute('role')).toBe('button');
      expect(indicator.getAttribute('tabindex')).toBe('0');
    });

    it('picker has proper ARIA attributes', () => {
      const picker = createControlLevelPicker({
        currentLevel: 'assisted',
        onChange: vi.fn(),
      });

      const button = picker.querySelector('button');
      expect(button?.getAttribute('aria-haspopup')).toBe('listbox');
      expect(button?.getAttribute('aria-expanded')).toBe('false');

      const menu = picker.querySelector('[role="listbox"]');
      expect(menu).toBeTruthy();
    });
  });
});
