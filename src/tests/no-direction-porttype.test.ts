/**
 * @fileoverview No Direction PortType Test
 * 
 * Change 468: Fails if any port type string contains _in/_out outside CSS classnames.
 * Ensures canonical port types don't encode direction.
 * 
 * @module @cardplay/tests/no-direction-porttype.test.ts
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Pattern for port types with embedded direction
const DIRECTION_PORT_PATTERN = /['"](\w+)_(in|out)['"]/g;

// Allowed contexts (CSS, UI legacy compat)
const ALLOWED_CONTEXTS = [
  /\.card-port-/,
  /className.*=/,
  /cssClass/i,
  /UIPortType/,
  /legacyType/i,
  /formatUIPortType/,
  /parsePortCssClass/,
  /getLegacyPortCssClass/,
  /port-css-class\.ts/,
];

describe('No Direction in PortType (Change 468)', () => {
  it('should not embed direction in port type strings (except CSS)', async () => {
    const srcDir = path.resolve(__dirname, '../../');
    
    // Find relevant TypeScript files
    const files = await glob('**/*.ts', {
      cwd: srcDir,
      ignore: [
        '**/node_modules/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/ui/ports/**', // These files handle legacy format
        '**/ui/components/card-component.ts', // Handles legacy UIPortType
      ],
    });
    
    const violations: string[] = [];
    
    for (const file of files) {
      const fullPath = path.join(srcDir, file);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // Skip comments
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
          return;
        }
        
        // Check if line is in allowed context
        const isAllowed = ALLOWED_CONTEXTS.some(pattern => pattern.test(line));
        if (isAllowed) {
          return;
        }
        
        // Check for direction-embedded port types
        const matches = [...line.matchAll(DIRECTION_PORT_PATTERN)];
        for (const match of matches) {
          const fullMatch = match[0];
          const portBase = match[1];
          const direction = match[2];
          
          // Check if this looks like a port type (audio, midi, mod, trigger)
          const portTypes = ['audio', 'midi', 'mod', 'trigger', 'control', 'cv'];
          if (portTypes.some(pt => portBase?.includes(pt))) {
            violations.push(
              `${file}:${index + 1}: Direction-embedded port type ${fullMatch} (should use { direction: '${direction}', type: '${portBase}' })`
            );
          }
        }
      });
    }
    
    if (violations.length > 0) {
      const message = [
        'Found direction-embedded port type strings:',
        '',
        ...violations.slice(0, 15).map(v => `  - ${v}`),
        violations.length > 15 ? `  ... and ${violations.length - 15} more` : '',
        '',
        'Use the new PortSpec model instead:',
        '  OLD: "audio_in"',
        '  NEW: { direction: "in", type: "audio" }',
        '',
        'Or use helpers from ui/ports/port-mapping.ts',
      ].filter(Boolean).join('\n');
      
      throw new Error(message);
    }
    
    expect(violations).toHaveLength(0);
  });
  
  it('PortSpec model should be used for new code', () => {
    // Informational: describe the new model
    const portSpecExample = {
      direction: 'in' as const,
      type: 'audio' as const,
    };
    
    console.log('Use PortSpec for port definitions:', JSON.stringify(portSpecExample));
    expect(portSpecExample.direction).toBe('in');
    expect(portSpecExample.type).toBe('audio');
  });
});
