/**
 * @fileoverview Extension Permission System Tests
 * 
 * Tests permission checking, enforcement, and API construction.
 * 
 * @module @cardplay/extensions/permissions.test
 */

import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getMissingPermissions,
  PermissionDeniedError,
  guardPermission,
  buildPermissionedAPI,
  getPermissionInfo,
  getExtensionPermissionInfo,
  hasHighRiskPermissions,
  PERMISSION_DESCRIPTIONS,
  PERMISSION_RISK_LEVELS
} from '../permissions';
import type { ExtensionManifest } from './types';

describe('Extension Permission System', () => {
  // ========================================================================
  // TEST FIXTURES
  // ========================================================================

  const minimalManifest: ExtensionManifest = {
    id: 'com.test.minimal',
    name: 'Minimal Extension',
    version: '1.0.0',
    author: 'Test Author',
    description: 'A minimal test extension',
    category: 'utility',
    tags: ['test'],
    license: 'MIT',
    cardplayVersion: '^1.0.0',
    permissions: ['ui-extension'],
    entryPoint: 'index.js'
  };

  const fullAccessManifest: ExtensionManifest = {
    ...minimalManifest,
    id: 'com.test.fullaccess',
    name: 'Full Access Extension',
    permissions: [
      'audio-engine',
      'event-store',
      'clip-registry',
      'routing-graph',
      'prolog-kb',
      'file-system',
      'network',
      'ui-extension'
    ]
  };

  const highRiskManifest: ExtensionManifest = {
    ...minimalManifest,
    id: 'com.test.highrisk',
    name: 'High Risk Extension',
    permissions: ['file-system', 'network']
  };

  // ========================================================================
  // PERMISSION CHECKING
  // ========================================================================

  describe('hasPermission', () => {
    it('returns true for granted permission', () => {
      expect(hasPermission(minimalManifest, 'ui-extension')).toBe(true);
    });

    it('returns false for missing permission', () => {
      expect(hasPermission(minimalManifest, 'audio-engine')).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('returns true when all permissions are granted', () => {
      expect(hasAllPermissions(fullAccessManifest, ['audio-engine', 'ui-extension'])).toBe(true);
    });

    it('returns false when any permission is missing', () => {
      expect(hasAllPermissions(minimalManifest, ['ui-extension', 'audio-engine'])).toBe(false);
    });

    it('returns true for empty permission list', () => {
      expect(hasAllPermissions(minimalManifest, [])).toBe(true);
    });
  });

  describe('hasAnyPermission', () => {
    it('returns true when at least one permission is granted', () => {
      expect(hasAnyPermission(minimalManifest, ['audio-engine', 'ui-extension'])).toBe(true);
    });

    it('returns false when no permissions are granted', () => {
      expect(hasAnyPermission(minimalManifest, ['audio-engine', 'event-store'])).toBe(false);
    });

    it('returns false for empty permission list', () => {
      expect(hasAnyPermission(minimalManifest, [])).toBe(false);
    });
  });

  describe('getMissingPermissions', () => {
    it('returns empty array when all permissions are granted', () => {
      expect(getMissingPermissions(fullAccessManifest, ['audio-engine', 'ui-extension'])).toEqual([]);
    });

    it('returns missing permissions', () => {
      const missing = getMissingPermissions(minimalManifest, ['audio-engine', 'event-store']);
      expect(missing).toEqual(['audio-engine', 'event-store']);
    });

    it('returns only missing permissions when some are granted', () => {
      const missing = getMissingPermissions(minimalManifest, ['ui-extension', 'audio-engine']);
      expect(missing).toEqual(['audio-engine']);
    });
  });

  // ========================================================================
  // PERMISSION ENFORCEMENT
  // ========================================================================

  describe('PermissionDeniedError', () => {
    it('creates error with correct properties', () => {
      const error = new PermissionDeniedError('com.test.extension', 'audio-engine', 'create audio node');
      expect(error.name).toBe('PermissionDeniedError');
      expect(error.extensionId).toBe('com.test.extension');
      expect(error.requiredPermission).toBe('audio-engine');
      expect(error.action).toBe('create audio node');
      expect(error.message).toContain('com.test.extension');
      expect(error.message).toContain('audio-engine');
    });
  });

  describe('guardPermission', () => {
    const mockAPI = { method: () => 'success' };

    it('returns API when permission is granted', () => {
      const guarded = guardPermission(
        minimalManifest.id,
        minimalManifest,
        'ui-extension',
        'test action',
        mockAPI
      );
      expect(guarded).toBe(mockAPI);
      expect(guarded.method()).toBe('success');
    });

    it('throws PermissionDeniedError when permission is missing', () => {
      expect(() => {
        guardPermission(
          minimalManifest.id,
          minimalManifest,
          'audio-engine',
          'create audio node',
          mockAPI
        );
      }).toThrow(PermissionDeniedError);
    });

    it('throws error when API is undefined', () => {
      expect(() => {
        guardPermission(
          minimalManifest.id,
          minimalManifest,
          'ui-extension',
          'test action',
          undefined
        );
      }).toThrow('API not available');
    });
  });

  // ========================================================================
  // API CONSTRUCTION
  // ========================================================================

  describe('buildPermissionedAPI', () => {
    const mockFullAPI = {
      eventStore: { subscribe: () => {} },
      clipRegistry: { getClip: () => {} },
      routingGraph: { addConnection: () => {} },
      audioEngine: { createNode: () => {} },
      prologKB: { query: () => [] },
      ui: { showNotification: () => {} }
    };

    it('includes only permitted APIs', () => {
      const api = buildPermissionedAPI(minimalManifest, mockFullAPI);
      expect(api.version).toBe('1.0.0');
      expect(api.ui).toBeDefined();
      expect(api.audio).toBeUndefined();
      expect(api.prolog).toBeUndefined();
      expect(api.stores).toBeUndefined();
    });

    it('includes all APIs for full access manifest', () => {
      const api = buildPermissionedAPI(fullAccessManifest, mockFullAPI);
      expect(api.version).toBe('1.0.0');
      expect(api.ui).toBeDefined();
      expect(api.audio).toBeDefined();
      expect(api.prolog).toBeDefined();
      expect(api.stores).toBeDefined();
      expect(api.stores!.eventStore).toBeDefined();
      expect(api.stores!.clipRegistry).toBeDefined();
      expect(api.stores!.routingGraph).toBeDefined();
    });

    it('omits undefined APIs even with permission', () => {
      const partialAPI = {
        eventStore: mockFullAPI.eventStore
      };
      const api = buildPermissionedAPI(fullAccessManifest, partialAPI);
      expect(api.stores?.eventStore).toBeDefined();
      expect(api.audio).toBeUndefined();
      expect(api.prolog).toBeUndefined();
    });

    it('creates stores object only if any store permission granted', () => {
      const manifest: ExtensionManifest = {
        ...minimalManifest,
        permissions: ['ui-extension']
      };
      const api = buildPermissionedAPI(manifest, mockFullAPI);
      expect(api.stores).toBeUndefined();
    });

    it('includes individual store APIs based on permissions', () => {
      const manifest: ExtensionManifest = {
        ...minimalManifest,
        permissions: ['event-store', 'routing-graph']
      };
      const api = buildPermissionedAPI(manifest, mockFullAPI);
      expect(api.stores).toBeDefined();
      expect(api.stores!.eventStore).toBeDefined();
      expect(api.stores!.routingGraph).toBeDefined();
      expect(api.stores!.clipRegistry).toBeUndefined();
    });
  });

  // ========================================================================
  // PERMISSION METADATA
  // ========================================================================

  describe('Permission Descriptions', () => {
    it('provides descriptions for all permissions', () => {
      const permissions = [
        'audio-engine',
        'event-store',
        'clip-registry',
        'routing-graph',
        'prolog-kb',
        'file-system',
        'network',
        'ui-extension'
      ] as const;

      permissions.forEach(permission => {
        expect(PERMISSION_DESCRIPTIONS[permission]).toBeDefined();
        expect(PERMISSION_DESCRIPTIONS[permission].length).toBeGreaterThan(0);
      });
    });
  });

  describe('Permission Risk Levels', () => {
    it('provides risk levels for all permissions', () => {
      const permissions = [
        'audio-engine',
        'event-store',
        'clip-registry',
        'routing-graph',
        'prolog-kb',
        'file-system',
        'network',
        'ui-extension'
      ] as const;

      permissions.forEach(permission => {
        expect(PERMISSION_RISK_LEVELS[permission]).toBeDefined();
        expect(['low', 'medium', 'high']).toContain(PERMISSION_RISK_LEVELS[permission]);
      });
    });

    it('assigns high risk to file-system and network', () => {
      expect(PERMISSION_RISK_LEVELS['file-system']).toBe('high');
      expect(PERMISSION_RISK_LEVELS['network']).toBe('high');
    });
  });

  describe('getPermissionInfo', () => {
    it('returns complete permission information', () => {
      const info = getPermissionInfo('audio-engine');
      expect(info.permission).toBe('audio-engine');
      expect(info.description).toBe(PERMISSION_DESCRIPTIONS['audio-engine']);
      expect(info.riskLevel).toBe(PERMISSION_RISK_LEVELS['audio-engine']);
    });
  });

  describe('getExtensionPermissionInfo', () => {
    it('returns info for all extension permissions', () => {
      const info = getExtensionPermissionInfo(minimalManifest);
      expect(info).toHaveLength(1);
      expect(info[0].permission).toBe('ui-extension');
      expect(info[0].description).toBeDefined();
      expect(info[0].riskLevel).toBe('low');
    });

    it('returns multiple permission infos for full access', () => {
      const info = getExtensionPermissionInfo(fullAccessManifest);
      expect(info).toHaveLength(8);
      expect(info.every(i => i.description && i.riskLevel)).toBe(true);
    });
  });

  describe('hasHighRiskPermissions', () => {
    it('returns false for low-risk extensions', () => {
      expect(hasHighRiskPermissions(minimalManifest)).toBe(false);
    });

    it('returns true for high-risk extensions', () => {
      expect(hasHighRiskPermissions(highRiskManifest)).toBe(true);
    });

    it('returns true for full access extension', () => {
      expect(hasHighRiskPermissions(fullAccessManifest)).toBe(true);
    });
  });
});
