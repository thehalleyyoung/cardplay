/**
 * GOFAI Vocabulary Policy Tests — Step 004 Complete
 *
 * Comprehensive test suite for vocabulary namespacing policy.
 *
 * @module gofai/canon/__tests__/vocabulary-policy
 */

import { describe, it, expect } from 'vitest';
import {
  isNamespaced,
  getNamespace,
  isValidLexemeId,
  isValidAxisId,
  isValidOpcodeId,
  isValidConstraintTypeId,
  createLexemeId,
  createAxisId,
  createOpcodeId,
  createConstraintTypeId,
} from '../types';

describe('Vocabulary Policy: ID Format Validation', () => {
  describe('Builtin IDs (un-namespaced)', () => {
    it('should validate simple builtin lexeme IDs', () => {
      expect(isValidLexemeId('lexeme:dark')).toBe(true);
      expect(isValidLexemeId('lexeme:bright')).toBe(true);
      expect(isValidLexemeId('lexeme:transpose')).toBe(true);
    });

    it('should validate builtin axis IDs', () => {
      expect(isValidAxisId('axis:brightness')).toBe(true);
      expect(isValidAxisId('axis:lift')).toBe(true);
      expect(isValidAxisId('axis:intimacy')).toBe(true);
    });

    it('should validate builtin opcode IDs', () => {
      expect(isValidOpcodeId('opcode:transpose')).toBe(true);
      expect(isValidOpcodeId('opcode:quantize')).toBe(true);
      expect(isValidOpcodeId('opcode:adjust_brightness')).toBe(true);
    });

    it('should validate builtin constraint IDs', () => {
      expect(isValidConstraintTypeId('preserve_melody')).toBe(true);
      expect(isValidConstraintTypeId('only_change')).toBe(true);
      expect(isValidConstraintTypeId('no_new_layers')).toBe(true);
    });

    it('should reject builtin IDs with invalid characters', () => {
      expect(isValidLexemeId('lexeme:Dark')).toBe(false); // Uppercase
      expect(isValidLexemeId('lexeme:dark!')).toBe(false); // Special char
      expect(isValidLexemeId('lexeme:dark space')).toBe(false); // Space
    });

    it('should reject empty builtin IDs', () => {
      expect(isValidLexemeId('lexeme:')).toBe(false);
      expect(isValidAxisId('axis:')).toBe(false);
      expect(isValidOpcodeId('opcode:')).toBe(false);
    });

    it('should handle hyphenated and underscored names', () => {
      expect(isValidLexemeId('lexeme:very-dark')).toBe(true);
      expect(isValidLexemeId('lexeme:super_bright')).toBe(true);
      expect(isValidOpcodeId('opcode:adjust_brightness')).toBe(true);
    });
  });

  describe('Extension IDs (namespaced)', () => {
    it('should validate simple namespaced lexeme IDs', () => {
      expect(isValidLexemeId('lexeme:mypack:dark')).toBe(true);
      expect(isValidLexemeId('lexeme:custom-pack:bright')).toBe(true);
      expect(isValidLexemeId('lexeme:my_pack:transpose')).toBe(true);
    });

    it('should validate namespaced axis IDs', () => {
      expect(isValidAxisId('axis:mypack:grit')).toBe(true);
      expect(isValidAxisId('axis:custom-pack:warmth')).toBe(true);
    });

    it('should validate namespaced opcode IDs', () => {
      expect(isValidOpcodeId('opcode:mypack:wobble')).toBe(true);
      expect(isValidOpcodeId('opcode:custom-pack:stutter')).toBe(true);
    });

    it('should validate namespaced constraint IDs', () => {
      expect(isValidConstraintTypeId('mypack:preserve_timbre')).toBe(true);
      expect(isValidConstraintTypeId('custom-pack:no_wobble')).toBe(true);
    });

    it('should reject namespaced IDs with invalid namespace', () => {
      expect(isValidLexemeId('lexeme:MyPack:dark')).toBe(false); // Uppercase
      expect(isValidLexemeId('lexeme:2pack:dark')).toBe(false); // Starts with number
      expect(isValidLexemeId('lexeme:my--pack:dark')).toBe(false); // Consecutive hyphens
    });

    it('should reject namespaced IDs with invalid local name', () => {
      expect(isValidLexemeId('lexeme:mypack:Dark')).toBe(false); // Uppercase
      expect(isValidLexemeId('lexeme:mypack:dark!')).toBe(false); // Special char
    });

    it('should reject namespace that is too short or too long', () => {
      expect(isValidLexemeId('lexeme:a:dark')).toBe(false); // Too short (1 char)
      expect(isValidLexemeId('lexeme:' + 'a'.repeat(33) + ':dark')).toBe(false); // Too long
    });
  });

  describe('Namespace Detection', () => {
    it('should detect un-namespaced IDs', () => {
      expect(isNamespaced('lexeme:dark')).toBe(false);
      expect(isNamespaced('axis:brightness')).toBe(false);
      expect(isNamespaced('opcode:transpose')).toBe(false);
    });

    it('should detect namespaced IDs', () => {
      expect(isNamespaced('lexeme:mypack:dark')).toBe(true);
      expect(isNamespaced('axis:mypack:grit')).toBe(true);
      expect(isNamespaced('opcode:mypack:wobble')).toBe(true);
    });

    it('should extract namespace from namespaced IDs', () => {
      expect(getNamespace('lexeme:mypack:dark')).toBe('mypack');
      expect(getNamespace('axis:custom-pack:grit')).toBe('custom-pack');
      expect(getNamespace('opcode:my_pack:wobble')).toBe('my_pack');
    });

    it('should return undefined for un-namespaced IDs', () => {
      expect(getNamespace('lexeme:dark')).toBeUndefined();
      expect(getNamespace('axis:brightness')).toBeUndefined();
    });
  });
});

describe('Vocabulary Policy: ID Construction', () => {
  describe('Builtin ID Construction', () => {
    it('should create valid builtin lexeme IDs', () => {
      const id = createLexemeId('dark');
      expect(id).toBe('lexeme:dark');
      expect(isValidLexemeId(id)).toBe(true);
      expect(isNamespaced(id)).toBe(false);
    });

    it('should create valid builtin axis IDs', () => {
      const id = createAxisId('brightness');
      expect(id).toBe('axis:brightness');
      expect(isValidAxisId(id)).toBe(true);
      expect(isNamespaced(id)).toBe(false);
    });

    it('should create valid builtin opcode IDs', () => {
      const id = createOpcodeId('transpose');
      expect(id).toBe('opcode:transpose');
      expect(isValidOpcodeId(id)).toBe(true);
      expect(isNamespaced(id)).toBe(false);
    });

    it('should throw on invalid builtin IDs', () => {
      expect(() => createLexemeId('Dark')).toThrow();
      expect(() => createLexemeId('dark space')).toThrow();
      expect(() => createLexemeId('')).toThrow();
    });
  });

  describe('Extension ID Construction', () => {
    it('should create valid namespaced lexeme IDs', () => {
      const id = createLexemeId('dark', 'mypack');
      expect(id).toBe('lexeme:mypack:dark');
      expect(isValidLexemeId(id)).toBe(true);
      expect(isNamespaced(id)).toBe(true);
      expect(getNamespace(id)).toBe('mypack');
    });

    it('should create valid namespaced axis IDs', () => {
      const id = createAxisId('grit', 'mypack');
      expect(id).toBe('axis:mypack:grit');
      expect(isValidAxisId(id)).toBe(true);
      expect(isNamespaced(id)).toBe(true);
    });

    it('should create valid namespaced opcode IDs', () => {
      const id = createOpcodeId('wobble', 'mypack');
      expect(id).toBe('opcode:mypack:wobble');
      expect(isValidOpcodeId(id)).toBe(true);
      expect(isNamespaced(id)).toBe(true);
    });

    it('should throw on invalid namespace', () => {
      expect(() => createLexemeId('dark', 'MyPack')).toThrow();
      expect(() => createLexemeId('dark', '2pack')).toThrow();
      expect(() => createLexemeId('dark', 'a')).toThrow();
      expect(() => createLexemeId('dark', 'my--pack')).toThrow();
    });

    it('should throw on invalid local name', () => {
      expect(() => createLexemeId('Dark', 'mypack')).toThrow();
      expect(() => createLexemeId('dark!', 'mypack')).toThrow();
      expect(() => createLexemeId('', 'mypack')).toThrow();
    });
  });

  describe('Constraint ID Construction', () => {
    it('should create valid builtin constraint IDs', () => {
      const id = createConstraintTypeId('preserve_melody');
      expect(id).toBe('preserve_melody');
      expect(isValidConstraintTypeId(id)).toBe(true);
      expect(isNamespaced(id)).toBe(false);
    });

    it('should create valid namespaced constraint IDs', () => {
      const id = createConstraintTypeId('preserve_timbre', 'mypack');
      expect(id).toBe('mypack:preserve_timbre');
      expect(isValidConstraintTypeId(id)).toBe(true);
      expect(isNamespaced(id)).toBe(true);
      expect(getNamespace(id)).toBe('mypack');
    });
  });
});

describe('Vocabulary Policy: Reserved Namespaces', () => {
  it('should reject reserved namespace "core"', () => {
    expect(() => createLexemeId('dark', 'core')).toThrow(/reserved/i);
  });

  it('should reject reserved namespace "builtin"', () => {
    expect(() => createLexemeId('dark', 'builtin')).toThrow(/reserved/i);
  });

  it('should reject reserved namespace "system"', () => {
    expect(() => createLexemeId('dark', 'system')).toThrow(/reserved/i);
  });

  it('should reject reserved namespace "internal"', () => {
    expect(() => createLexemeId('dark', 'internal')).toThrow(/reserved/i);
  });

  it('should reject reserved namespace "gofai"', () => {
    expect(() => createLexemeId('dark', 'gofai')).toThrow(/reserved/i);
  });

  it('should reject reserved namespace "cardplay"', () => {
    expect(() => createLexemeId('dark', 'cardplay')).toThrow(/reserved/i);
  });

  it('should allow non-reserved namespaces', () => {
    expect(() => createLexemeId('dark', 'mypack')).not.toThrow();
    expect(() => createLexemeId('dark', 'custom-pack')).not.toThrow();
    expect(() => createLexemeId('dark', 'user_pack')).not.toThrow();
  });
});

describe('Vocabulary Policy: Collision Prevention', () => {
  it('should prevent builtin/extension collisions via namespacing', () => {
    // These should be different IDs
    const builtinId = createLexemeId('dark');
    const extensionId = createLexemeId('dark', 'mypack');
    
    expect(builtinId).not.toBe(extensionId);
    expect(builtinId).toBe('lexeme:dark');
    expect(extensionId).toBe('lexeme:mypack:dark');
  });

  it('should prevent cross-extension collisions via namespacing', () => {
    const pack1Id = createLexemeId('dark', 'pack1');
    const pack2Id = createLexemeId('dark', 'pack2');
    
    expect(pack1Id).not.toBe(pack2Id);
    expect(pack1Id).toBe('lexeme:pack1:dark');
    expect(pack2Id).toBe('lexeme:pack2:dark');
  });

  it('should allow same local name in different namespaces', () => {
    const builtinDark = createLexemeId('dark');
    const mypackDark = createLexemeId('dark', 'mypack');
    const customDark = createLexemeId('dark', 'custom');
    
    const ids = [builtinDark, mypackDark, customDark];
    const uniqueIds = new Set(ids);
    
    expect(uniqueIds.size).toBe(3); // All different
  });
});

describe('Vocabulary Policy: Real-World Examples', () => {
  describe('Builtin Core Vocabulary', () => {
    it('should validate common perceptual adjectives', () => {
      const adjectives = [
        'lexeme:dark',
        'lexeme:bright',
        'lexeme:wide',
        'lexeme:intimate',
        'lexeme:hopeful',
        'lexeme:sad',
        'lexeme:energetic',
        'lexeme:calm',
      ];
      
      adjectives.forEach((id) => {
        expect(isValidLexemeId(id)).toBe(true);
        expect(isNamespaced(id)).toBe(false);
      });
    });

    it('should validate common musical axes', () => {
      const axes = [
        'axis:brightness',
        'axis:width',
        'axis:lift',
        'axis:intimacy',
        'axis:energy',
        'axis:complexity',
      ];
      
      axes.forEach((id) => {
        expect(isValidAxisId(id)).toBe(true);
        expect(isNamespaced(id)).toBe(false);
      });
    });

    it('should validate common musical opcodes', () => {
      const opcodes = [
        'opcode:transpose',
        'opcode:quantize',
        'opcode:adjust_brightness',
        'opcode:thin_texture',
        'opcode:halftime',
        'opcode:insert_break',
      ];
      
      opcodes.forEach((id) => {
        expect(isValidOpcodeId(id)).toBe(true);
        expect(isNamespaced(id)).toBe(false);
      });
    });
  });

  describe('Extension Vocabulary', () => {
    it('should validate custom pack lexemes', () => {
      const lexemes = [
        'lexeme:wobble-pack:wobble',
        'lexeme:wobble-pack:stutter',
        'lexeme:wobble-pack:glitch',
        'lexeme:lo-fi-pack:crunchy',
        'lexeme:lo-fi-pack:dusty',
        'lexeme:lo-fi-pack:vinyl',
      ];
      
      lexemes.forEach((id) => {
        expect(isValidLexemeId(id)).toBe(true);
        expect(isNamespaced(id)).toBe(true);
      });
    });

    it('should validate custom pack axes', () => {
      const axes = [
        'axis:wobble-pack:wobble_amount',
        'axis:lo-fi-pack:vinyl_wear',
        'axis:glitch-pack:glitch_density',
      ];
      
      axes.forEach((id) => {
        expect(isValidAxisId(id)).toBe(true);
        expect(isNamespaced(id)).toBe(true);
      });
    });

    it('should validate custom pack opcodes', () => {
      const opcodes = [
        'opcode:wobble-pack:add_wobble',
        'opcode:lo-fi-pack:add_vinyl_noise',
        'opcode:glitch-pack:randomize_slices',
      ];
      
      opcodes.forEach((id) => {
        expect(isValidOpcodeId(id)).toBe(true);
        expect(isNamespaced(id)).toBe(true);
      });
    });
  });
});

describe('Vocabulary Policy: Edge Cases', () => {
  it('should handle hyphens correctly', () => {
    expect(isValidLexemeId('lexeme:very-dark')).toBe(true);
    expect(isValidLexemeId('lexeme:super-duper-bright')).toBe(true);
    expect(isValidLexemeId('lexeme:my-pack:very-dark')).toBe(true);
  });

  it('should handle underscores correctly', () => {
    expect(isValidLexemeId('lexeme:very_dark')).toBe(true);
    expect(isValidLexemeId('lexeme:super_duper_bright')).toBe(true);
    expect(isValidLexemeId('lexeme:my_pack:very_dark')).toBe(true);
  });

  it('should handle mixed hyphens and underscores', () => {
    expect(isValidLexemeId('lexeme:very_dark-tone')).toBe(true);
    expect(isValidLexemeId('lexeme:my-pack:very_dark')).toBe(true);
    expect(isValidLexemeId('lexeme:my_pack:very-dark')).toBe(true);
  });

  it('should reject consecutive hyphens', () => {
    expect(isValidLexemeId('lexeme:very--dark')).toBe(false);
    expect(isValidLexemeId('lexeme:my--pack:dark')).toBe(false);
  });

  it('should reject consecutive underscores', () => {
    expect(isValidLexemeId('lexeme:very__dark')).toBe(false);
    expect(isValidLexemeId('lexeme:my__pack:dark')).toBe(false);
  });

  it('should handle numbers in names', () => {
    expect(isValidLexemeId('lexeme:filter2')).toBe(true);
    expect(isValidLexemeId('lexeme:dark3000')).toBe(true);
    expect(isValidLexemeId('lexeme:my-pack-2:dark')).toBe(true);
  });

  it('should reject names starting with numbers', () => {
    expect(isValidLexemeId('lexeme:2dark')).toBe(false);
    expect(isValidLexemeId('lexeme:2pack:dark')).toBe(false);
  });

  it('should handle maximum length names', () => {
    const longLocal = 'a'.repeat(64);
    const longNamespace = 'a'.repeat(32);
    
    expect(isValidLexemeId(`lexeme:${longLocal}`)).toBe(true);
    expect(isValidLexemeId(`lexeme:${longNamespace}:dark`)).toBe(true);
  });

  it('should reject names exceeding maximum length', () => {
    const tooLongLocal = 'a'.repeat(65);
    const tooLongNamespace = 'a'.repeat(33);
    
    expect(isValidLexemeId(`lexeme:${tooLongLocal}`)).toBe(false);
    expect(isValidLexemeId(`lexeme:${tooLongNamespace}:dark`)).toBe(false);
  });
});

describe('Vocabulary Policy: Integration with CardPlay ID System', () => {
  it('should follow same namespacing rules as CardPlayId', () => {
    // Both systems use `namespace:localname` format
    expect(createLexemeId('dark', 'mypack')).toBe('lexeme:mypack:dark');
    expect(createAxisId('grit', 'mypack')).toBe('axis:mypack:grit');
  });

  it('should allow same namespace rules for consistency', () => {
    // Valid CardPlay namespace = valid GOFAI namespace
    const validNamespaces = ['mypack', 'my-pack', 'my_pack', 'mypack2'];
    
    validNamespaces.forEach((ns) => {
      expect(() => createLexemeId('test', ns)).not.toThrow();
    });
  });

  it('should reject same invalid patterns as CardPlayId', () => {
    const invalidNamespaces = ['MyPack', '2pack', 'my--pack', 'a', 'core'];
    
    invalidNamespaces.forEach((ns) => {
      expect(() => createLexemeId('test', ns)).toThrow();
    });
  });
});
