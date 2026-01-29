/**
 * @fileoverview Empty State Tests
 * 
 * Tests for empty state UI components.
 * 
 * @module @cardplay/ui/components/empty-state.test
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { createEmptyState, EmptyStates } from './empty-state';

describe('createEmptyState', () => {
  it('should create empty state with title and message', () => {
    const state = createEmptyState({
      title: 'Test Title',
      message: 'Test message'
    });

    expect(state.tagName).toBe('DIV');
    expect(state.className).toBe('empty-state');
    expect(state.textContent).toContain('Test Title');
    expect(state.textContent).toContain('Test message');
  });

  it('should include icon when provided', () => {
    const state = createEmptyState({
      icon: '🎹',
      title: 'Test',
      message: 'Message'
    });

    const icon = state.querySelector('.empty-state-icon');
    expect(icon).toBeTruthy();
    expect(icon?.textContent).toBe('🎹');
  });

  it('should create action button when provided', () => {
    const onClick = vi.fn();
    const state = createEmptyState({
      title: 'Test',
      message: 'Message',
      action: {
        label: 'Click Me',
        onClick
      }
    });

    const button = state.querySelector('.empty-state-action') as HTMLButtonElement;
    expect(button).toBeTruthy();
    expect(button.textContent).toBe('Click Me');
    
    button.click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('should create secondary action button when provided', () => {
    const onClick = vi.fn();
    const state = createEmptyState({
      title: 'Test',
      message: 'Message',
      secondaryAction: {
        label: 'Secondary',
        onClick
      }
    });

    const button = state.querySelector('.empty-state-secondary-action') as HTMLButtonElement;
    expect(button).toBeTruthy();
    expect(button.textContent).toBe('Secondary');
    
    button.click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('should create both action buttons when both provided', () => {
    const primaryClick = vi.fn();
    const secondaryClick = vi.fn();
    
    const state = createEmptyState({
      title: 'Test',
      message: 'Message',
      action: {
        label: 'Primary',
        onClick: primaryClick
      },
      secondaryAction: {
        label: 'Secondary',
        onClick: secondaryClick
      }
    });

    const actions = state.querySelector('.empty-state-actions');
    expect(actions).toBeTruthy();
    expect(actions?.children.length).toBe(2);
  });
});

describe('EmptyStates presets', () => {
  it('should create noPattern state', () => {
    const state = EmptyStates.noPattern();
    expect(state.textContent).toContain('No Pattern');
    expect(state.textContent).toContain('create stream/pattern');
  });

  it('should create noInstruments state', () => {
    const state = EmptyStates.noInstruments();
    expect(state.textContent).toContain('No Instruments');
    expect(state.textContent).toContain('Add instruments');
  });

  it('should create noEffects state', () => {
    const state = EmptyStates.noEffects();
    expect(state.textContent).toContain('No Effects');
    expect(state.textContent).toContain('DSP chain');
  });

  it('should create noSamples state', () => {
    const state = EmptyStates.noSamples();
    expect(state.textContent).toContain('No Samples');
    expect(state.textContent).toContain('Import WAV/AIFF');
  });

  it('should create noArrangement state', () => {
    const state = EmptyStates.noArrangement();
    expect(state.textContent).toContain('No Arrangement');
    expect(state.textContent).toContain('Drag clips');
  });

  it('should create noClips state', () => {
    const state = EmptyStates.noClips();
    expect(state.textContent).toContain('No Clips');
    expect(state.textContent).toContain('empty slot');
  });

  it('should create noScenes state', () => {
    const state = EmptyStates.noScenes();
    expect(state.textContent).toContain('No Scenes');
    expect(state.textContent).toContain('Create scenes');
  });

  it('should create noScore state', () => {
    const state = EmptyStates.noScore();
    expect(state.textContent).toContain('No Score');
    expect(state.textContent).toContain('Add notes or import MIDI');
  });

  it('should create noSelection state', () => {
    const state = EmptyStates.noSelection();
    expect(state.textContent).toContain('No Selection');
    expect(state.textContent).toContain('Select an item');
  });

  it('should create noResults state with search term', () => {
    const state = EmptyStates.noResults('test query');
    expect(state.textContent).toContain('No Results');
    expect(state.textContent).toContain('test query');
  });

  it('should create noResults state without search term', () => {
    const state = EmptyStates.noResults();
    expect(state.textContent).toContain('No Results');
    expect(state.textContent).toContain('adjusting your search');
  });

  it('should create noContent state with custom message', () => {
    const state = EmptyStates.noContent('Custom Title', 'Custom message');
    expect(state.textContent).toContain('Custom Title');
    expect(state.textContent).toContain('Custom message');
  });
});
