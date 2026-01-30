/**
 * Board export dialog component
 * UI for exporting board configurations
 */

import { getBoardStateStore } from '../../boards/store/store';
import { 
  exportBoardConfiguration, 
  downloadBoardConfiguration, 
  serializeBoardConfiguration,
  type BoardExportData
} from '../../export/board-export';
import type { Board } from '../../boards/types';

export interface BoardExportDialogConfig {
  board: Board;
  onClose: () => void;
}

export function createBoardExportDialog(config: BoardExportDialogConfig): HTMLElement {
  const { board, onClose } = config;

  const dialog = document.createElement('div');
  dialog.className = 'board-export-dialog modal-overlay';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-labelledby', 'export-dialog-title');
  dialog.setAttribute('aria-modal', 'true');

  // State
  let includeDeckStates = true;
  let author = '';
  let description = board.description;
  let tags = board.tags?.join(', ') || '';

  function render() {
    dialog.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h2 id="export-dialog-title">Export Board Configuration</h2>
          <button class="close-button" aria-label="Close">×</button>
        </div>
        
        <div class="modal-body">
          <div class="export-info">
            <h3>${board.name}</h3>
            <p class="board-id">ID: ${board.id}</p>
            <p class="control-level">Control Level: ${board.controlLevel}</p>
          </div>

          <div class="form-section">
            <h4>Export Options</h4>
            
            <label class="checkbox-label">
              <input type="checkbox" id="include-deck-states" ${includeDeckStates ? 'checked' : ''}>
              Include deck states (window positions, active tabs, etc.)
            </label>
          </div>

          <div class="form-section">
            <h4>Metadata</h4>
            
            <div class="form-field">
              <label for="author-field">Author (optional)</label>
              <input type="text" id="author-field" value="${author}" placeholder="Your name">
            </div>

            <div class="form-field">
              <label for="description-field">Description</label>
              <textarea id="description-field" rows="3" placeholder="Describe this board configuration...">${description || ''}</textarea>
            </div>

            <div class="form-field">
              <label for="tags-field">Tags (comma-separated)</label>
              <input type="text" id="tags-field" value="${tags}" placeholder="production, mixing, advanced">
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="button secondary" data-action="cancel">Cancel</button>
          <button class="button primary" data-action="copy">Copy to Clipboard</button>
          <button class="button primary" data-action="download">Download File</button>
        </div>
      </div>
    `;

    attachEventListeners();
  }

  function attachEventListeners() {
    // Close button
    const closeBtn = dialog.querySelector('.close-button');
    closeBtn?.addEventListener('click', onClose);

    // Cancel button
    const cancelBtn = dialog.querySelector('[data-action="cancel"]');
    cancelBtn?.addEventListener('click', onClose);

    // Copy button
    const copyBtn = dialog.querySelector('[data-action="copy"]');
    copyBtn?.addEventListener('click', handleCopy);

    // Download button
    const downloadBtn = dialog.querySelector('[data-action="download"]');
    downloadBtn?.addEventListener('click', handleDownload);

    // Form inputs
    const includeCheckbox = dialog.querySelector('#include-deck-states') as HTMLInputElement;
    includeCheckbox?.addEventListener('change', (e) => {
      includeDeckStates = (e.target as HTMLInputElement).checked;
    });

    const authorField = dialog.querySelector('#author-field') as HTMLInputElement;
    authorField?.addEventListener('input', (e) => {
      author = (e.target as HTMLInputElement).value;
    });

    const descriptionField = dialog.querySelector('#description-field') as HTMLTextAreaElement;
    descriptionField?.addEventListener('input', (e) => {
      description = (e.target as HTMLTextAreaElement).value;
    });

    const tagsField = dialog.querySelector('#tags-field') as HTMLInputElement;
    tagsField?.addEventListener('input', (e) => {
      tags = (e.target as HTMLInputElement).value;
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

  function handleCopy() {
    const deckStates = includeDeckStates 
      ? getBoardStateStore().getDeckState(board.id)
      : undefined;

    const metadata: Partial<BoardExportData['metadata']> = {
      name: board.name
    };
    if (description) metadata.description = description;
    if (author) metadata.author = author;
    if (tags) metadata.tags = tags.split(',').map((t: string) => t.trim()).filter(Boolean) as readonly string[];

    const data = exportBoardConfiguration(board, deckStates, metadata);
    const json = serializeBoardConfiguration(data);

    navigator.clipboard.writeText(json).then(() => {
      showToast('Board configuration copied to clipboard');
      onClose();
    }).catch(err => {
      console.error('Failed to copy:', err);
      showToast('Failed to copy to clipboard', 'error');
    });
  }

  function handleDownload() {
    const deckStates = includeDeckStates 
      ? getBoardStateStore().getDeckState(board.id)
      : undefined;

    const metadata: Partial<BoardExportData['metadata']> = {
      name: board.name
    };
    if (description) metadata.description = description;
    if (author) metadata.author = author;
    if (tags) metadata.tags = tags.split(',').map((t: string) => t.trim()).filter(Boolean) as readonly string[];

    downloadBoardConfiguration(board, deckStates, metadata);
    showToast('Board configuration downloaded');
    onClose();
  }

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    // Simple toast implementation
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
