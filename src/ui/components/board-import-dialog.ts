/**
 * Board import dialog component
 * UI for importing board configurations
 */

import { getBoardRegistry } from '../../boards/registry';
import { getBoardStateStore } from '../../boards/store/store';
import { 
  importBoardConfiguration, 
  parseBoardConfiguration, 
  checkBoardCompatibility,
  type BoardExportData 
} from '../../export/board-export';

export interface BoardImportDialogConfig {
  onClose: () => void;
  onImport?: (boardId: string) => void;
}

export function createBoardImportDialog(config: BoardImportDialogConfig): HTMLElement {
  const { onClose, onImport } = config;

  const dialog = document.createElement('div');
  dialog.className = 'board-import-dialog modal-overlay';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-labelledby', 'import-dialog-title');
  dialog.setAttribute('aria-modal', 'true');

  // State
  let importData: BoardExportData | null = null;
  let assignNewId = true;
  let preserveDeckStates = true;
  let errorMessage = '';

  function render() {
    dialog.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h2 id="import-dialog-title">Import Board Configuration</h2>
          <button class="close-button" aria-label="Close">×</button>
        </div>
        
        <div class="modal-body">
          ${!importData ? renderUploadSection() : renderPreviewSection()}
        </div>

        <div class="modal-footer">
          <button class="button secondary" data-action="cancel">Cancel</button>
          ${importData ? `
            <button class="button secondary" data-action="reset">Choose Different File</button>
            <button class="button primary" data-action="import" ${errorMessage ? 'disabled' : ''}>Import Board</button>
          ` : ''}
        </div>
      </div>
    `;

    attachEventListeners();
  }

  function renderUploadSection(): string {
    return `
      <div class="upload-section">
        <div class="upload-area" id="upload-area">
          <div class="upload-icon">📁</div>
          <p class="upload-text">Drop a .cardplay-board.json file here</p>
          <p class="upload-subtext">or</p>
          <button class="button primary" id="choose-file">Choose File</button>
          <input type="file" id="file-input" accept=".json,.cardplay-board.json" style="display: none;">
        </div>

        <div class="paste-section">
          <p class="paste-label">Or paste configuration JSON:</p>
          <textarea id="paste-area" rows="8" placeholder="Paste board configuration JSON here..."></textarea>
          <button class="button secondary" id="parse-button">Load from Clipboard</button>
        </div>

        ${errorMessage ? `
          <div class="error-message" role="alert">
            <strong>Error:</strong> ${errorMessage}
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderPreviewSection(): string {
    if (!importData) return '';

    const board = importData.board;
    const metadata = importData.metadata;
    const compat = checkBoardCompatibility(importData);

    return `
      <div class="preview-section">
        <div class="board-preview">
          <h3>${metadata.name}</h3>
          ${metadata.description ? `<p class="description">${metadata.description}</p>` : ''}
          
          <div class="preview-details">
            <div class="detail-row">
              <span class="label">Board ID:</span>
              <span class="value">${board.id}</span>
            </div>
            <div class="detail-row">
              <span class="label">Control Level:</span>
              <span class="value">${board.controlLevel}</span>
            </div>
            <div class="detail-row">
              <span class="label">Primary View:</span>
              <span class="value">${board.primaryView}</span>
            </div>
            <div class="detail-row">
              <span class="label">Decks:</span>
              <span class="value">${board.decks.length}</span>
            </div>
            ${metadata.author ? `
              <div class="detail-row">
                <span class="label">Author:</span>
                <span class="value">${metadata.author}</span>
              </div>
            ` : ''}
            ${metadata.tags && metadata.tags.length > 0 ? `
              <div class="detail-row">
                <span class="label">Tags:</span>
                <span class="value">${metadata.tags.join(', ')}</span>
              </div>
            ` : ''}
          </div>
        </div>

        ${!compat.compatible ? `
          <div class="error-message" role="alert">
            <strong>Compatibility Issues:</strong>
            <ul>
              ${compat.issues.map((issue: string) => `<li>${issue}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${compat.warnings.length > 0 ? `
          <div class="warning-message" role="status">
            <strong>Warnings:</strong>
            <ul>
              ${compat.warnings.map((warn: string) => `<li>${warn}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <div class="form-section">
          <h4>Import Options</h4>
          
          <label class="checkbox-label">
            <input type="checkbox" id="assign-new-id" ${assignNewId ? 'checked' : ''}>
            Assign new ID (recommended to avoid conflicts)
          </label>

          <label class="checkbox-label">
            <input type="checkbox" id="preserve-deck-states" ${preserveDeckStates ? 'checked' : ''}>
            Preserve deck states (positions, tabs, etc.)
          </label>
        </div>
      </div>
    `;
  }

  function attachEventListeners() {
    // Close button
    const closeBtn = dialog.querySelector('.close-button');
    closeBtn?.addEventListener('click', onClose);

    // Cancel button
    const cancelBtn = dialog.querySelector('[data-action="cancel"]');
    cancelBtn?.addEventListener('click', onClose);

    // Reset button
    const resetBtn = dialog.querySelector('[data-action="reset"]');
    resetBtn?.addEventListener('click', () => {
      importData = null;
      errorMessage = '';
      render();
    });

    // Import button
    const importBtn = dialog.querySelector('[data-action="import"]');
    importBtn?.addEventListener('click', handleImport);

    // File upload
    const uploadArea = dialog.querySelector('#upload-area');
    const fileInput = dialog.querySelector('#file-input') as HTMLInputElement;
    const chooseFileBtn = dialog.querySelector('#choose-file');

    if (uploadArea && fileInput && chooseFileBtn) {
      chooseFileBtn.addEventListener('click', () => fileInput.click());

      fileInput.addEventListener('change', (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          handleFileUpload(file);
        }
      });

      uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
      });

      uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
      });

      uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        const de = e as DragEvent;
        uploadArea.classList.remove('drag-over');
        const file = de.dataTransfer?.files[0];
        if (file) {
          handleFileUpload(file);
        }
      });
    }

    // Paste area
    const parseBtn = dialog.querySelector('#parse-button');
    parseBtn?.addEventListener('click', () => {
      const textarea = dialog.querySelector('#paste-area') as HTMLTextAreaElement;
      if (textarea) {
        handlePastedJSON(textarea.value);
      }
    });

    // Import options checkboxes
    const assignNewIdCheckbox = dialog.querySelector('#assign-new-id') as HTMLInputElement;
    assignNewIdCheckbox?.addEventListener('change', (e) => {
      assignNewId = (e.target as HTMLInputElement).checked;
    });

    const preserveDeckStatesCheckbox = dialog.querySelector('#preserve-deck-states') as HTMLInputElement;
    preserveDeckStatesCheckbox?.addEventListener('change', (e) => {
      preserveDeckStates = (e.target as HTMLInputElement).checked;
    });

    // Click outside to close
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        onClose();
      }
    });

    // Escape key to close
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        document.removeEventListener('keydown', handleKeydown);
      }
    };
    document.addEventListener('keydown', handleKeydown);
  }

  function handleFileUpload(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      handlePastedJSON(text);
    };
    reader.onerror = () => {
      errorMessage = 'Failed to read file';
      render();
    };
    reader.readAsText(file);
  }

  function handlePastedJSON(text: string) {
    try {
      const data = parseBoardConfiguration(text);
      importData = data;
      errorMessage = '';
      render();
    } catch (err) {
      errorMessage = `Invalid JSON: ${(err as Error).message}`;
      render();
    }
  }

  function handleImport() {
    if (!importData) return;

    const result = importBoardConfiguration(importData, {
      assignNewId,
      preserveDeckStates
    });

    if (!result.success) {
      errorMessage = result.errors?.join(', ') || 'Import failed';
      render();
      return;
    }

    if (result.board) {
      // Register the board
      getBoardRegistry().register(result.board);

      // Store deck states if present
      if (result.deckStates && preserveDeckStates) {
        getBoardStateStore().setDeckState(result.board.id, result.deckStates);
      }

      showToast(`Board "${result.board.name}" imported successfully`);
      onImport?.(result.board.id);
      onClose();
    }
  }

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 24px;
      background: var(--surface-2);
      border-radius: 8px;
      box-shadow: var(--shadow-2);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  render();
  return dialog;
}
