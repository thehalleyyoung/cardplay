/**
 * @fileoverview Event Styling Tests
 * 
 * @module @cardplay/ui/event-styling
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createEvent } from '../types/event';
import { EventKinds } from '../types/event-kind';
import { asTick, asTickDuration } from '../types/primitives';
import {
  detectEventOrigin,
  detectOriginBulk,
  getEventStyling,
  applyEventStyling,
  removeEventStyling,
  DEFAULT_OPACITIES,
  EVENT_ORIGIN_CLASSES,
  type EventOrigin,
} from './event-styling';

describe('Event Styling', () => {
  describe('detectEventOrigin', () => {
    it('should detect manual events', () => {
      const event = createEvent({
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(96),
        payload: { pitch: 60, velocity: 100 },
      });
      
      expect(detectEventOrigin(event)).toBe('manual');
    });
    
    it('should detect generated events', () => {
      const event = createEvent({
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(96),
        payload: { 
          pitch: 60, 
          velocity: 100,
          meta: { generated: true }
        },
      });
      
      expect(detectEventOrigin(event)).toBe('generated');
    });
    
    it('should detect adapted events', () => {
      const event = createEvent({
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(96),
        payload: { 
          pitch: 60, 
          velocity: 100,
          meta: { adapted: true }
        },
      });
      
      expect(detectEventOrigin(event)).toBe('adapted');
    });
    
    it('should detect imported events', () => {
      const event = createEvent({
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(96),
        payload: { 
          pitch: 60, 
          velocity: 100,
          meta: { imported: true }
        },
      });
      
      expect(detectEventOrigin(event)).toBe('imported');
    });
    
    it('should handle events without meta', () => {
      const event = createEvent({
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(96),
        payload: { pitch: 60, velocity: 100 },
      });
      
      expect(detectEventOrigin(event)).toBe('manual');
    });
    
    it('should handle events with null payload', () => {
      const event = createEvent({
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(96),
        payload: null,
      });
      
      expect(detectEventOrigin(event)).toBe('manual');
    });
  });
  
  describe('detectOriginBulk', () => {
    it('should return manual for empty array', () => {
      expect(detectOriginBulk([])).toBe('manual');
    });
    
    it('should return most common origin', () => {
      const events = [
        createEvent({
          kind: EventKinds.NOTE,
          start: asTick(0),
          duration: asTickDuration(96),
          payload: { pitch: 60, velocity: 100, meta: { generated: true } },
        }),
        createEvent({
          kind: EventKinds.NOTE,
          start: asTick(96),
          duration: asTickDuration(96),
          payload: { pitch: 62, velocity: 100, meta: { generated: true } },
        }),
        createEvent({
          kind: EventKinds.NOTE,
          start: asTick(192),
          duration: asTickDuration(96),
          payload: { pitch: 64, velocity: 100 },
        }),
      ];
      
      expect(detectOriginBulk(events)).toBe('generated');
    });
  });
  
  describe('getEventStyling', () => {
    it('should return correct styling for manual event', () => {
      const event = createEvent({
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(96),
        payload: { pitch: 60, velocity: 100 },
      });
      
      const styling = getEventStyling(event);
      expect(styling.origin).toBe('manual');
      expect(styling.opacity).toBe(DEFAULT_OPACITIES.manual);
      expect(styling.classes).toContain(EVENT_ORIGIN_CLASSES.manual);
    });
    
    it('should return correct styling for generated event', () => {
      const event = createEvent({
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(96),
        payload: { pitch: 60, velocity: 100, meta: { generated: true } },
      });
      
      const styling = getEventStyling(event);
      expect(styling.origin).toBe('generated');
      expect(styling.opacity).toBe(DEFAULT_OPACITIES.generated);
      expect(styling.classes).toContain(EVENT_ORIGIN_CLASSES.generated);
      expect(styling.styles.filter).toBe('brightness(0.95)');
    });
    
    it('should accept opacity override', () => {
      const event = createEvent({
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(96),
        payload: { pitch: 60, velocity: 100, meta: { generated: true } },
      });
      
      const styling = getEventStyling(event, { opacityOverride: 0.5 });
      expect(styling.opacity).toBe(0.5);
    });
    
    it('should accept additional classes', () => {
      const event = createEvent({
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(96),
        payload: { pitch: 60, velocity: 100 },
      });
      
      const styling = getEventStyling(event, { additionalClasses: ['custom-class'] });
      expect(styling.classes).toContain('custom-class');
    });
  });
  
  describe('applyEventStyling', () => {
    let element: HTMLElement;
    
    beforeEach(() => {
      element = document.createElement('div');
    });
    
    it('should apply styling to element', () => {
      const event = createEvent({
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(96),
        payload: { pitch: 60, velocity: 100, meta: { generated: true } },
      });
      
      applyEventStyling(element, event);
      
      expect(element.classList.contains(EVENT_ORIGIN_CLASSES.generated)).toBe(true);
      expect(element.style.opacity).toBe(String(DEFAULT_OPACITIES.generated));
      expect(element.style.filter).toBe('brightness(0.95)');
    });
  });
  
  describe('removeEventStyling', () => {
    let element: HTMLElement;
    
    beforeEach(() => {
      element = document.createElement('div');
      element.classList.add(EVENT_ORIGIN_CLASSES.generated);
      element.style.opacity = '0.7';
      element.style.filter = 'brightness(0.95)';
    });
    
    it('should remove styling from element', () => {
      removeEventStyling(element);
      
      expect(element.classList.contains(EVENT_ORIGIN_CLASSES.generated)).toBe(false);
      expect(element.style.opacity).toBe('');
      expect(element.style.filter).toBe('');
    });
  });
});
