/**
 * @fileoverview Event Kind Registry Snapshot Tests
 * 
 * Change 494: Snapshot test for event kind registry output.
 * Ensures EventKind naming changes are intentional.
 * 
 * @module @cardplay/src/tests/snapshots/event-kind-registry.snapshot.test
 */

import { describe, it, expect } from 'vitest';
import { EventKinds } from '../../types/event-kind';

describe('Event Kind Registry Snapshots', () => {
  it('should match registered event kinds snapshot', () => {
    // Extract all registered event kinds from EventKinds constant
    const eventKinds = Object.values(EventKinds).sort();

    expect(eventKinds).toMatchSnapshot();
  });

  it('should match builtin event kinds snapshot', () => {
    // Core event kinds that should always be present
    const builtinKinds = [
      EventKinds.NOTE,
      EventKinds.CONTROL_CHANGE,
      EventKinds.PROGRAM_CHANGE,
      EventKinds.PITCH_BEND,
      EventKinds.TEMPO,
      EventKinds.TIME_SIGNATURE,
      EventKinds.MARKER,
    ].sort();

    expect(builtinKinds).toMatchSnapshot();
  });

  it('should match event kind metadata snapshot', () => {
    // Build metadata for all event kinds
    const metadata = Object.entries(EventKinds).map(([key, kind]) => {
      return {
        constantName: key,
        eventKind: kind,
        isBuiltin: !kind.includes(':'),
        hasUnderscore: kind.includes('_'),
        hasCamelCase: /[a-z][A-Z]/.test(kind),
      };
    }).sort((a, b) => a.eventKind.localeCompare(b.eventKind));

    expect(metadata).toMatchSnapshot();
  });

  it('should validate event kind naming conventions', () => {
    // All builtin event kinds should use snake_case or camelCase consistently
    const eventKinds = Object.values(EventKinds);
    
    const inconsistentNames: string[] = [];
    
    for (const kind of eventKinds) {
      // Skip namespaced kinds (extensions)
      if (kind.includes(':')) continue;
      
      // Check if it mixes snake_case and camelCase
      const hasUnderscore = kind.includes('_');
      const hasCamelCase = /[a-z][A-Z]/.test(kind);
      
      if (hasUnderscore && hasCamelCase) {
        inconsistentNames.push(kind);
      }
    }

    // Should not have mixed naming
    expect(inconsistentNames).toEqual([]);
  });

  it('should validate no legacy event kind aliases', () => {
    const eventKinds = Object.values(EventKinds);
    
    // Check for known legacy patterns that should have been normalized
    const legacyPatterns = [
      /^midi[A-Z]/,  // midiNote, midiCC (should be note, control_change)
      /^pattern[A-Z]/, // patternRef (should be pattern_ref)
    ];
    
    const legacyKinds = eventKinds.filter(kind =>
      legacyPatterns.some(pattern => pattern.test(kind))
    );

    // Might be empty if all normalized, or might contain allowed legacy names
    // Snapshot will track changes
    expect(legacyKinds).toMatchSnapshot();
  });

  it('should match extension event kind examples', () => {
    // Examples of how extension event kinds should be formatted
    const extensionExamples = [
      'my-pack:custom-event',
      'drums:pattern-event',
      'theory:constraint-change',
    ];

    // Validate format
    for (const example of extensionExamples) {
      expect(example).toMatch(/^[a-z0-9-]+:[a-z0-9-]+$/);
    }

    expect(extensionExamples).toMatchSnapshot();
  });

  it('should validate event kinds are unique', () => {
    const eventKinds = Object.values(EventKinds);
    const uniqueKinds = [...new Set(eventKinds)];

    // All event kinds should be unique
    expect(eventKinds.length).toBe(uniqueKinds.length);
  });

  it('should validate event kinds are lowercase with underscores or hyphens', () => {
    const eventKinds = Object.values(EventKinds);
    
    const invalidNames = eventKinds.filter(kind => {
      // Allow namespaced format (namespace:name)
      const [namespace, name] = kind.includes(':') ? kind.split(':') : [null, kind];
      
      const toCheck = name || kind;
      
      // Should be lowercase with underscores/hyphens only
      // Allow camelCase for backward compatibility but track it
      const isValid = /^[a-z0-9_-]+$/.test(toCheck) || /^[a-z][a-zA-Z0-9]*$/.test(toCheck);
      
      return !isValid;
    });

    // Should be empty or contain only approved exceptions
    expect(invalidNames).toEqual([]);
  });
});
