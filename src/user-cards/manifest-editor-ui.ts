/**
 * @fileoverview Card Manifest Editor UI Component.
 * 
 * Provides a visual editor for card manifest files with:
 * - Form-based editing for common manifest fields
 * - JSON preview and editing
 * - Validation feedback
 * - Import/export functionality
 * 
 * @module @cardplay/user-cards/manifest-editor-ui
 */

import type { CardManifest, ValidationResult, ValidationError } from './manifest';
import { validateManifest } from './manifest';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Manifest editor state.
 */
export interface ManifestEditorState {
  /** Current manifest being edited */
  readonly manifest: CardManifest;
  /** Whether manifest has unsaved changes */
  readonly isDirty: boolean;
  /** Validation result */
  readonly validation: ValidationResult;
  /** Current editing mode */
  readonly mode: 'form' | 'json';
}

// ============================================================================
// DEFAULT MANIFEST
// ============================================================================

/**
 * Create minimal valid manifest for new card.
 */
export function createDefaultManifest(): CardManifest {
  return {
    manifestVersion: '1.0.0',
    name: 'untitled-card',
    version: '1.0.0',
    displayName: 'Untitled Card',
    description: 'A new CardPlay card',
    category: 'custom',
    keywords: [],
    cards: [],
  };
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Create initial editor state.
 */
export function createEditorState(
  initialManifest?: CardManifest
): ManifestEditorState {
  const manifest = initialManifest ?? createDefaultManifest();
  const validation = validateManifest(manifest);
  
  return Object.freeze({
    manifest,
    isDirty: false,
    validation,
    mode: 'form',
  });
}

/**
 * Update manifest field.
 */
export function updateManifestField<K extends keyof CardManifest>(
  state: ManifestEditorState,
  field: K,
  value: CardManifest[K]
): ManifestEditorState {
  const manifest = {
    ...state.manifest,
    [field]: value,
  };
  
  const validation = validateManifest(manifest);
  
  return Object.freeze({
    ...state,
    manifest,
    isDirty: true,
    validation,
  });
}

/**
 * Switch editor mode.
 */
export function switchEditorMode(
  state: ManifestEditorState,
  mode: 'form' | 'json'
): ManifestEditorState {
  return Object.freeze({
    ...state,
    mode,
  });
}

/**
 * Import manifest from JSON.
 */
export function importManifestJSON(
  state: ManifestEditorState,
  json: string
): ManifestEditorState {
  try {
    const manifest = JSON.parse(json) as CardManifest;
    const validation = validateManifest(manifest);
    
    return Object.freeze({
      ...state,
      manifest,
      isDirty: true,
      validation: validation as ValidationResult,
    });
  } catch (error) {
    const errorMessage: ValidationError = {
      path: 'json',
      message: `Invalid JSON: ${error}`,
      severity: 'error',
    };
    const errorValidation: ValidationResult = {
      valid: false,
      errors: [errorMessage],
      warnings: [],
    };
    return Object.freeze({
      ...state,
      validation: errorValidation,
    });
  }
}

/**
 * Export manifest to JSON.
 */
export function exportManifestJSON(state: ManifestEditorState): string {
  return JSON.stringify(state.manifest, null, 2);
}

// ============================================================================
// UI RENDERING (HTML Generation)
// ============================================================================

/**
 * Render manifest editor to HTML string.
 */
export function renderManifestEditorHTML(state: ManifestEditorState): string {
  const formView = renderFormView(state);
  const jsonView = renderJSONView(state);
  
  const validationStatus = state.validation.valid
    ? '<div class="editor-success">✓ Manifest is valid</div>'
    : `<div class="editor-errors">
        <h3>⚠️ Validation Errors</h3>
        <ul>
          ${state.validation.errors.map(err => `<li>${err}</li>`).join('')}
        </ul>
      </div>`;
  
  return `
    <div class="manifest-editor">
      <div class="editor-header">
        <h2>Card Manifest Editor</h2>
        <div class="editor-mode-toggle">
          <button
            class="btn-mode ${state.mode === 'form' ? 'active' : ''}"
            data-mode="form"
          >
            📝 Form
          </button>
          <button
            class="btn-mode ${state.mode === 'json' ? 'active' : ''}"
            data-mode="json"
          >
            {} JSON
          </button>
        </div>
      </div>
      
      ${validationStatus}
      
      <div class="editor-content">
        <div class="editor-form ${state.mode === 'form' ? 'visible' : 'hidden'}">
          ${formView}
        </div>
        
        <div class="editor-json ${state.mode === 'json' ? 'visible' : 'hidden'}">
          ${jsonView}
        </div>
      </div>
      
      <div class="editor-footer">
        <button class="btn-save" ${!state.validation.valid ? 'disabled' : ''}>
          💾 Save Manifest
        </button>
        <button class="btn-export">
          📥 Export JSON
        </button>
        ${state.isDirty ? '<span class="unsaved-indicator">● Unsaved changes</span>' : ''}
      </div>
    </div>
  `;
}

/**
 * Render form view (simplified for core fields).
 */
function renderFormView(state: ManifestEditorState): string {
  const { manifest } = state;
  
  return `
    <div class="form-section">
      <h3>Basic Information</h3>
      
      <div class="form-field">
        <label for="card-name">Package Name *</label>
        <input
          type="text"
          id="card-name"
          name="name"
          value="${manifest.name}"
          placeholder="my-card"
          required
        />
        <small>Unique package identifier (lowercase, hyphens)</small>
      </div>
      
      <div class="form-field">
        <label for="card-version">Version *</label>
        <input
          type="text"
          id="card-version"
          name="version"
          value="${manifest.version}"
          placeholder="1.0.0"
          required
        />
        <small>Semantic version (e.g., 1.0.0)</small>
      </div>
      
      <div class="form-field">
        <label for="card-display-name">Display Name</label>
        <input
          type="text"
          id="card-display-name"
          name="displayName"
          value="${manifest.displayName ?? ''}"
          placeholder="My Card"
        />
      </div>
      
      <div class="form-field">
        <label for="card-description">Description</label>
        <textarea
          id="card-description"
          name="description"
          rows="3"
          placeholder="Describe what this card does..."
        >${manifest.description ?? ''}</textarea>
      </div>
      
      <div class="form-field">
        <label for="card-category">Category</label>
        <input
          type="text"
          id="card-category"
          name="category"
          value="${manifest.category ?? ''}"
          placeholder="generator"
        />
        <small>Card category (e.g., generator, effect, transform)</small>
      </div>
      
      <div class="form-field">
        <label for="card-keywords">Keywords</label>
        <input
          type="text"
          id="card-keywords"
          name="keywords"
          value="${(manifest.keywords ?? []).join(', ')}"
          placeholder="audio, effect, reverb"
        />
        <small>Comma-separated list for search</small>
      </div>
      
      <div class="form-notice">
        <p>ℹ️ For advanced fields (dependencies, cards, configuration, etc.), switch to JSON mode.</p>
      </div>
    </div>
  `;
}

/**
 * Render JSON view.
 */
function renderJSONView(state: ManifestEditorState): string {
  const json = exportManifestJSON(state);
  
  return `
    <div class="json-editor">
      <textarea
        class="json-textarea"
        spellcheck="false"
      >${json}</textarea>
      <button class="btn-import-json">Import from JSON</button>
    </div>
  `;
}

/**
 * Generate CSS for manifest editor.
 */
export function getManifestEditorCSS(): string {
  return `
    .manifest-editor {
      display: flex;
      flex-direction: column;
      height: 100%;
      font-family: system-ui, -apple-system, sans-serif;
      background: #fff;
    }
    
    .editor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #ccc;
      background: #f5f5f5;
    }
    
    .editor-header h2 {
      margin: 0;
      font-size: 1.5rem;
    }
    
    .editor-mode-toggle {
      display: flex;
      gap: 0;
      border: 1px solid #ccc;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .btn-mode {
      padding: 0.5rem 1rem;
      border: none;
      background: white;
      cursor: pointer;
      font-size: 0.9rem;
    }
    
    .btn-mode.active {
      background: #007bff;
      color: white;
    }
    
    .editor-errors,
    .editor-success {
      padding: 1rem;
      border-bottom: 1px solid #ccc;
    }
    
    .editor-errors {
      background: #fff5f5;
      color: #dc3545;
    }
    
    .editor-success {
      background: #f0fff0;
      color: #28a745;
    }
    
    .editor-errors h3 {
      margin-top: 0;
      font-size: 1rem;
    }
    
    .editor-errors ul {
      margin: 0.5rem 0 0 0;
      padding-left: 1.5rem;
    }
    
    .editor-content {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }
    
    .editor-form.hidden,
    .editor-json.hidden {
      display: none;
    }
    
    .form-section {
      margin-bottom: 2rem;
    }
    
    .form-section h3 {
      margin-top: 0;
      font-size: 1.2rem;
      border-bottom: 1px solid #ddd;
      padding-bottom: 0.5rem;
    }
    
    .form-field {
      margin-bottom: 1rem;
    }
    
    .form-field label {
      display: block;
      font-weight: bold;
      margin-bottom: 0.25rem;
      font-size: 0.9rem;
    }
    
    .form-field input[type="text"],
    .form-field textarea {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 0.9rem;
      font-family: inherit;
    }
    
    .form-field small {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.75rem;
      color: #666;
    }
    
    .form-notice {
      padding: 1rem;
      background: #f0f9ff;
      border: 1px solid #bde4ff;
      border-radius: 4px;
      margin-top: 1rem;
    }
    
    .form-notice p {
      margin: 0;
      font-size: 0.9rem;
      color: #0369a1;
    }
    
    .json-editor {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .json-textarea {
      flex: 1;
      min-height: 400px;
      padding: 1rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      font-size: 0.9rem;
      line-height: 1.5;
    }
    
    .btn-import-json {
      padding: 0.5rem 1rem;
      border: 1px solid #007bff;
      border-radius: 4px;
      background: #007bff;
      color: white;
      cursor: pointer;
      font-size: 0.9rem;
    }
    
    .editor-footer {
      display: flex;
      gap: 1rem;
      align-items: center;
      padding: 1rem;
      border-top: 1px solid #ccc;
      background: #f5f5f5;
    }
    
    .editor-footer button {
      padding: 0.5rem 1rem;
      border: 1px solid #007bff;
      border-radius: 4px;
      background: #007bff;
      color: white;
      cursor: pointer;
      font-size: 0.9rem;
    }
    
    .editor-footer button[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .editor-footer button:hover:not([disabled]) {
      background: #0056b3;
      border-color: #0056b3;
    }
    
    .unsaved-indicator {
      color: #ffc107;
      font-size: 0.9rem;
      font-weight: bold;
    }
  `;
}
