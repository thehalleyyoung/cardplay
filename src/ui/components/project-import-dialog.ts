/**
 * @fileoverview Project Import Dialog Component
 * 
 * Implements O054-O058:
 * - Import .cardplay archives
 * - Conflict resolution UI
 * - Progress tracking
 * - Beautiful browser UI with accessibility
 * 
 * @module @cardplay/ui/components/project-import-dialog
 */

import { importProject, type ImportProgress, type ImportConflict, type ProjectImportOptions } from '../../export/project-import';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface ProjectImportConfig {
  onComplete?: (success: boolean) => void;
  onCancel?: () => void;
}

// --------------------------------------------------------------------------
// Component
// --------------------------------------------------------------------------

export class ProjectImportDialog {
  private root: HTMLElement | null = null;
  private config: ProjectImportConfig;
  private selectedFile: File | null = null;
  private conflicts: ImportConflict[] = [];
  private options: Partial<ProjectImportOptions> = {
    overwriteExisting: false,
    conflictResolution: 'rename',
    mergeWithCurrent: false,
    createBackup: true
  };

  constructor(config: ProjectImportConfig) {
    this.config = config;
  }

  public open(): void {
    if (this.root) return;
    
    this.root = document.createElement('div');
    this.root.className = 'project-import-dialog-overlay';
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-labelledby', 'import-dialog-title');
    this.root.setAttribute('aria-modal', 'true');
    
    this.render();
    this.injectStyles();
    
    document.body.appendChild(this.root);
    
    // Focus first interactive element
    const firstInput = this.root.querySelector('input, button') as HTMLElement;
    firstInput?.focus();
    
    // Trap focus
    this.root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    });
  }

  public close(): void {
    if (this.root) {
      this.root.remove();
      this.root = null;
    }
    this.config.onCancel?.();
  }

  private render(): void {
    if (!this.root) return;
    
    this.root.innerHTML = '';
    
    const dialog = document.createElement('div');
    dialog.className = 'project-import-dialog';
    
    // Header
    const header = document.createElement('div');
    header.className = 'import-dialog-header';
    
    const title = document.createElement('h2');
    title.id = 'import-dialog-title';
    title.textContent = 'Import Project';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'import-dialog-close';
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Close dialog');
    closeBtn.addEventListener('click', () => this.close());
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    dialog.appendChild(header);
    
    // Content
    const content = document.createElement('div');
    content.className = 'import-dialog-content';
    
    if (!this.selectedFile) {
      content.appendChild(this.renderFileSelection());
    } else if (this.conflicts.length > 0) {
      content.appendChild(this.renderConflictResolution());
    } else {
      content.appendChild(this.renderOptions());
    }
    
    dialog.appendChild(content);
    
    // Footer
    const footer = document.createElement('div');
    footer.className = 'import-dialog-footer';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => this.close());
    
    const importBtn = document.createElement('button');
    importBtn.className = 'btn-primary';
    importBtn.textContent = this.conflicts.length > 0 ? 'Resolve & Import' : 'Import';
    importBtn.disabled = !this.selectedFile;
    importBtn.addEventListener('click', () => this.startImport());
    
    footer.appendChild(cancelBtn);
    footer.appendChild(importBtn);
    dialog.appendChild(footer);
    
    this.root.appendChild(dialog);
  }

  private renderFileSelection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'import-section';
    
    const desc = document.createElement('p');
    desc.textContent = 'Select a .cardplay archive file to import:';
    section.appendChild(desc);
    
    // File input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.cardplay,.gz';
    fileInput.id = 'project-file-input';
    fileInput.addEventListener('change', async () => {
      if (fileInput.files && fileInput.files[0]) {
        this.selectedFile = fileInput.files[0];
        await this.validateFile();
        this.render();
      }
    });
    
    const fileLabel = document.createElement('label');
    fileLabel.htmlFor = 'project-file-input';
    fileLabel.className = 'file-input-label';
    fileLabel.textContent = 'Choose File';
    
    section.appendChild(fileLabel);
    section.appendChild(fileInput);
    
    // Drop zone
    const dropZone = document.createElement('div');
    dropZone.className = 'import-drop-zone';
    dropZone.textContent = 'Or drag and drop a file here';
    
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      
      if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
        this.selectedFile = e.dataTransfer.files[0];
        await this.validateFile();
        this.render();
      }
    });
    
    section.appendChild(dropZone);
    
    return section;
  }

  private renderOptions(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'import-section';
    
    // File info
    if (this.selectedFile) {
      const fileInfo = document.createElement('div');
      fileInfo.className = 'file-info';
      fileInfo.innerHTML = `
        <strong>Selected file:</strong> ${this.selectedFile.name}<br>
        <strong>Size:</strong> ${(this.selectedFile.size / 1024).toFixed(2)} KB
      `;
      section.appendChild(fileInfo);
    }
    
    // Options
    const optionsTitle = document.createElement('h3');
    optionsTitle.textContent = 'Import Options';
    section.appendChild(optionsTitle);
    
    // Merge with current
    const mergeWrapper = this.createCheckbox(
      'merge-with-current',
      'Merge with current project',
      this.options.mergeWithCurrent || false,
      (checked) => {
        this.options.mergeWithCurrent = checked;
      }
    );
    section.appendChild(mergeWrapper);
    
    // Create backup
    const backupWrapper = this.createCheckbox(
      'create-backup',
      'Create backup before importing',
      this.options.createBackup ?? true,
      (checked) => {
        this.options.createBackup = checked;
      }
    );
    section.appendChild(backupWrapper);
    
    // Conflict resolution
    const conflictLabel = document.createElement('label');
    conflictLabel.textContent = 'If conflicts are found:';
    conflictLabel.className = 'option-label';
    section.appendChild(conflictLabel);
    
    const conflictSelect = document.createElement('select');
    conflictSelect.className = 'conflict-resolution-select';
    conflictSelect.innerHTML = `
      <option value="rename" ${this.options.conflictResolution === 'rename' ? 'selected' : ''}>Rename new items</option>
      <option value="skip" ${this.options.conflictResolution === 'skip' ? 'selected' : ''}>Skip conflicting items</option>
      <option value="overwrite" ${this.options.conflictResolution === 'overwrite' ? 'selected' : ''}>Overwrite existing items</option>
    `;
    conflictSelect.addEventListener('change', () => {
      this.options.conflictResolution = conflictSelect.value as 'rename' | 'skip' | 'overwrite';
    });
    section.appendChild(conflictSelect);
    
    return section;
  }

  private renderConflictResolution(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'import-section conflicts-section';
    
    const title = document.createElement('h3');
    title.textContent = `Conflicts Detected (${this.conflicts.length})`;
    section.appendChild(title);
    
    const desc = document.createElement('p');
    desc.textContent = 'The following items already exist in your project:';
    section.appendChild(desc);
    
    const list = document.createElement('ul');
    list.className = 'conflict-list';
    
    for (const conflict of this.conflicts) {
      const item = document.createElement('li');
      item.className = 'conflict-item';
      
      const icon = document.createElement('span');
      icon.className = 'conflict-icon';
      icon.textContent = '⚠️';
      
      const details = document.createElement('div');
      details.className = 'conflict-details';
      details.innerHTML = `
        <strong>${conflict.type}:</strong> "${conflict.existingName}"<br>
        <span class="conflict-resolution">${this.getResolutionText(conflict.resolution)}</span>
      `;
      
      item.appendChild(icon);
      item.appendChild(details);
      list.appendChild(item);
    }
    
    section.appendChild(list);
    
    return section;
  }

  private createCheckbox(
    id: string,
    label: string,
    checked: boolean,
    onChange: (checked: boolean) => void
  ): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'checkbox-wrapper';
    
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = id;
    input.checked = checked;
    input.addEventListener('change', () => onChange(input.checked));
    
    const labelEl = document.createElement('label');
    labelEl.htmlFor = id;
    labelEl.textContent = label;
    
    wrapper.appendChild(input);
    wrapper.appendChild(labelEl);
    
    return wrapper;
  }

  private getResolutionText(resolution: string): string {
    switch (resolution) {
      case 'rename': return 'Will be renamed';
      case 'skip': return 'Will be skipped';
      case 'overwrite': return 'Will be overwritten';
      default: return 'Pending';
    }
  }

  private async validateFile(): Promise<void> {
    if (!this.selectedFile) return;
    
    try {
      // TODO: Quick validation without full import
      // For now, just check file extension
      const ext = this.selectedFile.name.split('.').pop()?.toLowerCase();
      if (ext !== 'cardplay' && ext !== 'gz') {
        alert('Invalid file type. Please select a .cardplay file.');
        this.selectedFile = null;
      }
    } catch (error) {
      console.error('File validation error:', error);
      alert('Error validating file: ' + (error instanceof Error ? error.message : String(error)));
      this.selectedFile = null;
    }
  }

  private async startImport(): Promise<void> {
    if (!this.selectedFile) return;
    
    // Show progress
    this.renderProgress({ stage: 'reading', progress: 0, message: 'Starting import...' });
    
    try {
      const result = await importProject(
        this.selectedFile,
        this.options,
        (progress) => this.renderProgress(progress)
      );
      
      if (result.success) {
        this.showSuccess(result.streamsImported, result.clipsImported);
        setTimeout(() => {
          this.close();
          this.config.onComplete?.(true);
        }, 2000);
      } else {
        if (result.conflicts && result.conflicts.length > 0) {
          this.conflicts = result.conflicts;
          this.render();
        } else {
          this.showError(result.error || 'Import failed');
        }
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : String(error));
    }
  }

  private renderProgress(progress: ImportProgress): void {
    if (!this.root) return;
    
    const content = this.root.querySelector('.import-dialog-content');
    if (!content) return;
    
    content.innerHTML = '';
    
    const section = document.createElement('div');
    section.className = 'import-progress';
    
    // Stage message
    const message = document.createElement('div');
    message.className = 'progress-message';
    message.textContent = progress.message;
    section.appendChild(message);
    
    // Progress bar
    const barContainer = document.createElement('div');
    barContainer.className = 'progress-bar-container';
    
    const bar = document.createElement('div');
    bar.className = 'progress-bar';
    bar.style.width = `${progress.progress * 100}%`;
    
    barContainer.appendChild(bar);
    section.appendChild(barContainer);
    
    // Percentage
    const percentage = document.createElement('div');
    percentage.className = 'progress-percentage';
    percentage.textContent = `${Math.round(progress.progress * 100)}%`;
    section.appendChild(percentage);
    
    content.appendChild(section);
  }

  private showSuccess(streamsImported: number, clipsImported: number): void {
    if (!this.root) return;
    
    const content = this.root.querySelector('.import-dialog-content');
    if (!content) return;
    
    content.innerHTML = '';
    
    const section = document.createElement('div');
    section.className = 'import-success';
    section.innerHTML = `
      <div class="success-icon">✓</div>
      <h3>Import Complete!</h3>
      <p>Successfully imported:</p>
      <ul>
        <li>${streamsImported} stream${streamsImported !== 1 ? 's' : ''}</li>
        <li>${clipsImported} clip${clipsImported !== 1 ? 's' : ''}</li>
      </ul>
    `;
    
    content.appendChild(section);
  }

  private showError(error: string): void {
    if (!this.root) return;
    
    const content = this.root.querySelector('.import-dialog-content');
    if (!content) return;
    
    content.innerHTML = '';
    
    const section = document.createElement('div');
    section.className = 'import-error';
    section.innerHTML = `
      <div class="error-icon">✗</div>
      <h3>Import Failed</h3>
      <p>${error}</p>
    `;
    
    content.appendChild(section);
  }

  private injectStyles(): void {
    if (document.getElementById('project-import-dialog-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'project-import-dialog-styles';
    style.textContent = `
      .project-import-dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.2s ease;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .project-import-dialog {
        background: var(--surface-color, #2a2a2a);
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        animation: slideUp 0.3s ease;
      }
      
      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      .import-dialog-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 24px;
        border-bottom: 1px solid var(--border-color, #444);
      }
      
      .import-dialog-header h2 {
        margin: 0;
        font-size: 24px;
        color: var(--text-primary, #fff);
      }
      
      .import-dialog-close {
        background: none;
        border: none;
        font-size: 32px;
        color: var(--text-secondary, #999);
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        line-height: 1;
      }
      
      .import-dialog-close:hover {
        color: var(--text-primary, #fff);
      }
      
      .import-dialog-content {
        padding: 24px;
        overflow-y: auto;
        flex: 1;
      }
      
      .import-section {
        margin-bottom: 24px;
      }
      
      .file-input-label {
        display: inline-block;
        padding: 12px 24px;
        background: var(--primary-color, #007bff);
        color: white;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
      }
      
      .file-input-label:hover {
        background: var(--primary-hover, #0056b3);
      }
      
      input[type="file"] {
        display: none;
      }
      
      .import-drop-zone {
        margin-top: 16px;
        padding: 48px 24px;
        border: 2px dashed var(--border-color, #666);
        border-radius: 8px;
        text-align: center;
        color: var(--text-secondary, #999);
        transition: all 0.2s ease;
      }
      
      .import-drop-zone.drag-over {
        border-color: var(--primary-color, #007bff);
        background: rgba(0, 123, 255, 0.1);
        color: var(--primary-color, #007bff);
      }
      
      .file-info {
        padding: 16px;
        background: var(--surface-secondary, #333);
        border-radius: 4px;
        margin-bottom: 16px;
        line-height: 1.6;
      }
      
      .checkbox-wrapper {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .checkbox-wrapper input[type="checkbox"] {
        margin-right: 8px;
      }
      
      .checkbox-wrapper label {
        cursor: pointer;
        user-select: none;
      }
      
      .option-label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
      }
      
      .conflict-resolution-select {
        width: 100%;
        padding: 8px 12px;
        background: var(--surface-secondary, #333);
        color: var(--text-primary, #fff);
        border: 1px solid var(--border-color, #666);
        border-radius: 4px;
        font-size: 14px;
      }
      
      .conflicts-section h3 {
        color: var(--warning-color, #ff9800);
      }
      
      .conflict-list {
        list-style: none;
        padding: 0;
        margin: 16px 0 0 0;
      }
      
      .conflict-item {
        display: flex;
        gap: 12px;
        padding: 12px;
        background: var(--surface-secondary, #333);
        border-radius: 4px;
        margin-bottom: 8px;
      }
      
      .conflict-icon {
        font-size: 20px;
      }
      
      .conflict-details {
        flex: 1;
        line-height: 1.6;
      }
      
      .conflict-resolution {
        color: var(--text-secondary, #999);
        font-size: 12px;
      }
      
      .import-progress {
        text-align: center;
        padding: 32px;
      }
      
      .progress-message {
        margin-bottom: 24px;
        font-size: 16px;
      }
      
      .progress-bar-container {
        height: 8px;
        background: var(--surface-secondary, #333);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 16px;
      }
      
      .progress-bar {
        height: 100%;
        background: var(--primary-color, #007bff);
        transition: width 0.3s ease;
        border-radius: 4px;
      }
      
      .progress-percentage {
        font-size: 24px;
        font-weight: bold;
        color: var(--primary-color, #007bff);
      }
      
      .import-success,
      .import-error {
        text-align: center;
        padding: 32px;
      }
      
      .success-icon,
      .error-icon {
        font-size: 64px;
        margin-bottom: 16px;
      }
      
      .success-icon {
        color: var(--success-color, #4caf50);
      }
      
      .error-icon {
        color: var(--error-color, #f44336);
      }
      
      .import-success ul,
      .import-error ul {
        list-style: none;
        padding: 0;
        margin: 16px 0 0 0;
        text-align: left;
        display: inline-block;
      }
      
      .import-success li {
        padding: 4px 0;
      }
      
      .import-dialog-footer {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        padding: 24px;
        border-top: 1px solid var(--border-color, #444);
      }
      
      .btn-secondary,
      .btn-primary {
        padding: 10px 20px;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: all 0.2s ease;
      }
      
      .btn-secondary {
        background: var(--surface-secondary, #555);
        color: var(--text-primary, #fff);
      }
      
      .btn-secondary:hover {
        background: var(--surface-tertiary, #666);
      }
      
      .btn-primary {
        background: var(--primary-color, #007bff);
        color: white;
      }
      
      .btn-primary:hover:not(:disabled) {
        background: var(--primary-hover, #0056b3);
      }
      
      .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      @media (prefers-reduced-motion: reduce) {
        .project-import-dialog-overlay,
        .project-import-dialog,
        .progress-bar {
          animation: none;
          transition: none;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
}
