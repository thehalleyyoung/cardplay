/**
 * @fileoverview Extension Validation
 * 
 * Validates extension manifests and packages for security and compatibility.
 * 
 * @module @cardplay/extensions/validate
 */

import type {
  ExtensionValidationResult,
  ExtensionValidationError,
  ExtensionValidationWarning,
  ExtensionPermission,
  ExtensionCategory
} from './types';

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validates an extension manifest.
 */
export function validateExtensionManifest(manifest: any): ExtensionValidationResult {
  const errors: ExtensionValidationError[] = [];
  const warnings: ExtensionValidationWarning[] = [];

  // Required fields
  if (!manifest.id || typeof manifest.id !== 'string') {
    errors.push({
      code: 'MISSING_ID',
      message: 'Extension ID is required and must be a string',
      field: 'id'
    });
  } else if (!isValidExtensionId(manifest.id)) {
    errors.push({
      code: 'INVALID_ID',
      message: 'Extension ID must be in reverse DNS format (e.g., com.author.extension)',
      field: 'id'
    });
  }

  if (!manifest.name || typeof manifest.name !== 'string') {
    errors.push({
      code: 'MISSING_NAME',
      message: 'Extension name is required and must be a string',
      field: 'name'
    });
  }

  if (!manifest.version || typeof manifest.version !== 'string') {
    errors.push({
      code: 'MISSING_VERSION',
      message: 'Extension version is required and must be a string',
      field: 'version'
    });
  } else if (!isValidVersion(manifest.version)) {
    errors.push({
      code: 'INVALID_VERSION',
      message: 'Extension version must be in semver format (e.g., 1.0.0)',
      field: 'version'
    });
  }

  if (!manifest.author || typeof manifest.author !== 'string') {
    errors.push({
      code: 'MISSING_AUTHOR',
      message: 'Extension author is required and must be a string',
      field: 'author'
    });
  }

  if (!manifest.description || typeof manifest.description !== 'string') {
    errors.push({
      code: 'MISSING_DESCRIPTION',
      message: 'Extension description is required and must be a string',
      field: 'description'
    });
  }

  if (!manifest.category || typeof manifest.category !== 'string') {
    errors.push({
      code: 'MISSING_CATEGORY',
      message: 'Extension category is required and must be a string',
      field: 'category'
    });
  } else if (!isValidCategory(manifest.category)) {
    errors.push({
      code: 'INVALID_CATEGORY',
      message: `Extension category must be one of: card, deck, board, generator, effect, prolog, theme, utility`,
      field: 'category'
    });
  }

  if (!manifest.license || typeof manifest.license !== 'string') {
    errors.push({
      code: 'MISSING_LICENSE',
      message: 'Extension license is required and must be a string (SPDX identifier)',
      field: 'license'
    });
  }

  if (!manifest.cardplayVersion || typeof manifest.cardplayVersion !== 'string') {
    errors.push({
      code: 'MISSING_CARDPLAY_VERSION',
      message: 'CardPlay version requirement is required and must be a string (semver range)',
      field: 'cardplayVersion'
    });
  }

  if (!Array.isArray(manifest.permissions)) {
    errors.push({
      code: 'MISSING_PERMISSIONS',
      message: 'Extension permissions must be an array',
      field: 'permissions'
    });
  } else {
    for (const permission of manifest.permissions) {
      if (!isValidPermission(permission)) {
        errors.push({
          code: 'INVALID_PERMISSION',
          message: `Invalid permission: ${permission}`,
          field: 'permissions'
        });
      }
    }
  }

  if (!manifest.entryPoint || typeof manifest.entryPoint !== 'string') {
    errors.push({
      code: 'MISSING_ENTRY_POINT',
      message: 'Extension entry point is required and must be a string',
      field: 'entryPoint'
    });
  }

  // Optional fields with validation
  if (manifest.tags && !Array.isArray(manifest.tags)) {
    errors.push({
      code: 'INVALID_TAGS',
      message: 'Extension tags must be an array of strings',
      field: 'tags'
    });
  }

  if (manifest.homepage && typeof manifest.homepage !== 'string') {
    errors.push({
      code: 'INVALID_HOMEPAGE',
      message: 'Extension homepage must be a string (URL)',
      field: 'homepage'
    });
  }

  if (manifest.repository && typeof manifest.repository !== 'string') {
    errors.push({
      code: 'INVALID_REPOSITORY',
      message: 'Extension repository must be a string (URL)',
      field: 'repository'
    });
  }

  if (manifest.dependencies) {
    if (!Array.isArray(manifest.dependencies)) {
      errors.push({
        code: 'INVALID_DEPENDENCIES',
        message: 'Extension dependencies must be an array',
        field: 'dependencies'
      });
    } else {
      for (const dep of manifest.dependencies) {
        if (!dep.id || typeof dep.id !== 'string') {
          errors.push({
            code: 'INVALID_DEPENDENCY',
            message: 'Dependency ID is required and must be a string',
            field: 'dependencies'
          });
        }
        if (!dep.version || typeof dep.version !== 'string') {
          errors.push({
            code: 'INVALID_DEPENDENCY',
            message: 'Dependency version is required and must be a string (semver range)',
            field: 'dependencies'
          });
        }
      }
    }
  }

  if (manifest.assets) {
    if (!Array.isArray(manifest.assets)) {
      errors.push({
        code: 'INVALID_ASSETS',
        message: 'Extension assets must be an array of strings',
        field: 'assets'
      });
    }
  }

  // Warnings
  if (!manifest.tags || manifest.tags.length === 0) {
    warnings.push({
      code: 'NO_TAGS',
      message: 'Extension has no tags (recommended for discoverability)',
      field: 'tags'
    });
  }

  if (!manifest.homepage) {
    warnings.push({
      code: 'NO_HOMEPAGE',
      message: 'Extension has no homepage URL (recommended for documentation)',
      field: 'homepage'
    });
  }

  if (manifest.permissions && manifest.permissions.includes('network')) {
    warnings.push({
      code: 'NETWORK_PERMISSION',
      message: 'Extension requests network access (users will be warned)',
      field: 'permissions'
    });
  }

  if (manifest.permissions && manifest.permissions.includes('file-system')) {
    warnings.push({
      code: 'FILE_SYSTEM_PERMISSION',
      message: 'Extension requests file system access (users will be warned)',
      field: 'permissions'
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Checks if an extension ID is in valid reverse DNS format.
 */
function isValidExtensionId(id: string): boolean {
  // Reverse DNS format: com.author.extension
  const parts = id.split('.');
  return parts.length >= 3 && parts.every(part => /^[a-z0-9-]+$/.test(part));
}

/**
 * Checks if a version string is valid semver.
 */
function isValidVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(version);
}

/**
 * Checks if a category is valid.
 */
function isValidCategory(category: string): category is ExtensionCategory {
  const validCategories: ExtensionCategory[] = [
    'card',
    'deck',
    'board',
    'generator',
    'effect',
    'prolog',
    'theme',
    'utility'
  ];
  return validCategories.includes(category as ExtensionCategory);
}

/**
 * Checks if a permission is valid.
 */
function isValidPermission(permission: string): permission is ExtensionPermission {
  const validPermissions: ExtensionPermission[] = [
    'audio-engine',
    'event-store',
    'clip-registry',
    'routing-graph',
    'prolog-kb',
    'file-system',
    'network',
    'ui-extension'
  ];
  return validPermissions.includes(permission as ExtensionPermission);
}

/**
 * Validates extension file structure (async).
 */
export async function validateExtensionPackage(
  _extensionPath: string
): Promise<ExtensionValidationResult> {
  const errors: ExtensionValidationError[] = [];
  const warnings: ExtensionValidationWarning[] = [];

  // Check if manifest exists
  try {
    // Note: In a real implementation, this would check the file system
    // For now, we just validate the structure
    warnings.push({
      code: 'FILE_SYSTEM_CHECK_SKIPPED',
      message: 'File system checks not implemented yet',
      field: 'package'
    });
  } catch (err) {
    errors.push({
      code: 'MANIFEST_NOT_FOUND',
      message: 'Extension manifest file not found',
      field: 'package'
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Checks if an extension is compatible with the current CardPlay version.
 */
export function isCompatibleVersion(
  requiredVersion: string,
  currentVersion: string
): boolean {
  // Handle semver ranges (simplified - just check >= prefix)
  if (requiredVersion.startsWith('>=')) {
    const minVersion = requiredVersion.substring(2).trim();
    const reqParts = minVersion.split('.').map(Number);
    const curParts = currentVersion.split('.').map(Number);
    const reqMajor: number = reqParts[0] ?? 0;
    const reqMinor: number = reqParts[1] ?? 0;
    const curMajor: number = curParts[0] ?? 0;
    const curMinor: number = curParts[1] ?? 0;
    
    // Current must be >= required
    if (curMajor > reqMajor) return true;
    if (curMajor === reqMajor && curMinor >= reqMinor) return true;
    return false;
  }
  
  // Exact version match
  const reqParts = requiredVersion.split('.').map(Number);
  const curParts = currentVersion.split('.').map(Number);
  const reqMajor: number = reqParts[0] ?? 0;
  const reqMinor: number = reqParts[1] ?? 0;
  const curMajor: number = curParts[0] ?? 0;
  const curMinor: number = curParts[1] ?? 0;

  // Compatible if major version matches and current >= required
  return curMajor === reqMajor && curMinor >= reqMinor;
}
