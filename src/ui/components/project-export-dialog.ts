/**
 * @fileoverview Project Export/Import Dialog UI
 * 
 * Beautiful browser interface for exporting and importing CardPlay projects.
 * 
 * @module @cardplay/ui/components/project-export-dialog
 */

import {
  exportProject,
  generateProjectFilename,
  type ProjectExportOptions,
  type ProjectMetadata,
  type ExportProgress
} from '../../export/project-export';

// --------------------------------------------------------------------------
// Export Dialog
// --------------------------------------------------------------------------

export class ProjectExportDialog {
  private container: HTMLDivElement;
  private options: ProjectExportOptions;
  private metadata: ProjectMetadata;
  private phase: 'config' | 'exporting' | 'complete' | 'error';
  private progress: ExportProgress | null = null;
  private blob: Blob | null = null;
  private downloadUrl: string | null = null;
  private error: string | null = null;

  constructor() {
    this.options = {
      includeSamples: true,
      includePresets: true,
      includeAudioFiles: false,
      includeVideos: false,
      compress: true,
      compressionLevel: 5,
      includeMetadata: true
    };

    this.metadata = {
      projectName: 'Untitled Project',
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      version: '1.0',
      cardplayVersion: '0.1.0'
    };

    this.phase = 'config';
    this.container = this.createContainer();
    this.render();
  }

  private createContainer(): HTMLDivElement {
    const div = document.createElement('div');
    div.className = 'project-export-dialog-backdrop';
    div.setAttribute('role', 'dialog');
    div.setAttribute('aria-modal', 'true');
    div.setAttribute('aria-labelledby', 'project-export-title');
    
    div.addEventListener('click', (e) => {
      if (e.target === div && this.phase === 'config') {
        this.cancel();
      }
    });
    
    return div;
  }

  private render(): void {
    this.container.innerHTML = '';
    
    const dialog = document.createElement('div');
    dialog.className = 'project-export-dialog';
    
    // Header
    const header = document.createElement('div');
    header.className = 'project-export-dialog__header';
    const title = document.createElement('h2');
    title.id = 'project-export-title';
    title.textContent = this.phase === 'config' ? 'Export Project' :
                       this.phase === 'exporting' ? 'Exporting...' :
                       this.phase === 'complete' ? 'Export Complete!' :
                       'Export Failed';
    header.appendChild(title);
    
    if (this.phase !== 'exporting') {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'project-export-dialog__close';
      closeBtn.innerHTML = '✕';
      closeBtn.addEventListener('click', () => this.cancel());
      header.appendChild(closeBtn);
    }
    
    dialog.appendChild(header);
    
    // Content
    const content = document.createElement('div');
    content.className = 'project-export-dialog__content';
    
    switch (this.phase) {
      case 'config':
        content.appendChild(this.renderConfigForm());
        break;
      case 'exporting':
        content.appendChild(this.renderProgress());
        break;
      case 'complete':
        content.appendChild(this.renderComplete());
        break;
      case 'error':
        content.appendChild(this.renderError());
        break;
    }
    
    dialog.appendChild(content);
    
    // Footer
    const footer = document.createElement('div');
    footer.className = 'project-export-dialog__footer';
    
    if (this.phase === 'config') {
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'project-export-dialog__button project-export-dialog__button--secondary';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', () => this.cancel());
      footer.appendChild(cancelBtn);
      
      const exportBtn = document.createElement('button');
      exportBtn.className = 'project-export-dialog__button project-export-dialog__button--primary';
      exportBtn.textContent = 'Export Project';
      exportBtn.addEventListener('click', () => this.startExport());
      footer.appendChild(exportBtn);
    } else if (this.phase === 'complete' || this.phase === 'error') {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'project-export-dialog__button project-export-dialog__button--primary';
      closeBtn.textContent = 'Close';
      closeBtn.addEventListener('click', () => this.cancel());
      footer.appendChild(closeBtn);
    }
    
    dialog.appendChild(footer);
    this.container.appendChild(dialog);
    
    this.injectStyles();
  }

  private renderConfigForm(): HTMLElement {
    const form = document.createElement('form');
    form.className = 'project-export-form';
    
    // Project Name
    const nameSection = document.createElement('div');
    nameSection.className = 'project-export-form__section';
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Project Name';
    nameLabel.className = 'project-export-form__label';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'project-export-form__input';
    nameInput.value = this.metadata.projectName;
    nameInput.addEventListener('input', () => {
      this.metadata.projectName = nameInput.value;
    });
    nameSection.appendChild(nameLabel);
    nameSection.appendChild(nameInput);
    form.appendChild(nameSection);
    
    // Author
    const authorSection = document.createElement('div');
    authorSection.className = 'project-export-form__section';
    const authorLabel = document.createElement('label');
    authorLabel.textContent = 'Author (optional)';
    authorLabel.className = 'project-export-form__label';
    const authorInput = document.createElement('input');
    authorInput.type = 'text';
    authorInput.className = 'project-export-form__input';
    authorInput.value = this.metadata.author || '';
    authorInput.addEventListener('input', () => {
      this.metadata.author = authorInput.value;
    });
    authorSection.appendChild(authorLabel);
    authorSection.appendChild(authorInput);
    form.appendChild(authorSection);
    
    // Description
    const descSection = document.createElement('div');
    descSection.className = 'project-export-form__section';
    const descLabel = document.createElement('label');
    descLabel.textContent = 'Description (optional)';
    descLabel.className = 'project-export-form__label';
    const descTextarea = document.createElement('textarea');
    descTextarea.className = 'project-export-form__textarea';
    descTextarea.rows = 3;
    descTextarea.value = this.metadata.description || '';
    descTextarea.addEventListener('input', () => {
      this.metadata.description = descTextarea.value;
    });
    descSection.appendChild(descLabel);
    descSection.appendChild(descTextarea);
    form.appendChild(descSection);
    
    // Options
    const optionsSection = document.createElement('div');
    optionsSection.className = 'project-export-form__section';
    const optionsLabel = document.createElement('label');
    optionsLabel.textContent = 'Export Options';
    optionsLabel.className = 'project-export-form__label';
    optionsSection.appendChild(optionsLabel);
    
    const options = [
      { key: 'includeSamples', label: 'Include Samples' },
      { key: 'includePresets', label: 'Include Presets' },
      { key: 'includeAudioFiles', label: 'Include Audio Files' },
      { key: 'compress', label: 'Compress Archive (Recommended)' }
    ];
    
    options.forEach(opt => {
      const checkbox = document.createElement('label');
      checkbox.className = 'project-export-form__checkbox';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = (this.options as any)[opt.key];
      input.addEventListener('change', () => {
        (this.options as any)[opt.key] = input.checked;
      });
      const text = document.createElement('span');
      text.textContent = opt.label;
      checkbox.appendChild(input);
      checkbox.appendChild(text);
      optionsSection.appendChild(checkbox);
    });
    
    form.appendChild(optionsSection);
    
    // Estimated size
    const sizeInfo = document.createElement('div');
    sizeInfo.className = 'project-export-form__info';
    sizeInfo.textContent = 'Estimated size: ~2-5 MB (with compression)';
    form.appendChild(sizeInfo);
    
    return form;
  }

  private renderProgress(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'project-export-progress';
    
    if (this.progress) {
      const stage = document.createElement('div');
      stage.className = 'project-export-progress__stage';
      stage.textContent = this.getStageLabel(this.progress.stage);
      container.appendChild(stage);
      
      const bar = document.createElement('div');
      bar.className = 'project-export-progress__bar';
      const fill = document.createElement('div');
      fill.className = 'project-export-progress__fill';
      fill.style.width = `${this.progress.progress * 100}%`;
      bar.appendChild(fill);
      container.appendChild(bar);
      
      const message = document.createElement('div');
      message.className = 'project-export-progress__message';
      message.textContent = this.progress.message;
      container.appendChild(message);
      
      if (this.progress.bytesProcessed && this.progress.totalBytes) {
        const bytes = document.createElement('div');
        bytes.className = 'project-export-progress__bytes';
        bytes.textContent = `${this.formatBytes(this.progress.bytesProcessed)} / ${this.formatBytes(this.progress.totalBytes)}`;
        container.appendChild(bytes);
      }
    }
    
    return container;
  }

  private renderComplete(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'project-export-complete';
    
    const icon = document.createElement('div');
    icon.className = 'project-export-complete__icon';
    icon.innerHTML = '✓';
    container.appendChild(icon);
    
    const message = document.createElement('div');
    message.className = 'project-export-complete__message';
    message.textContent = 'Your project has been exported successfully!';
    container.appendChild(message);
    
    if (this.downloadUrl && this.blob) {
      const filename = generateProjectFilename(this.metadata);
      const size = document.createElement('div');
      size.className = 'project-export-complete__size';
      size.textContent = `File size: ${this.formatBytes(this.blob.size)}`;
      container.appendChild(size);
      
      const downloadBtn = document.createElement('a');
      downloadBtn.href = this.downloadUrl;
      downloadBtn.download = filename;
      downloadBtn.className = 'project-export-complete__download';
      downloadBtn.textContent = 'Download Project';
      container.appendChild(downloadBtn);
    }
    
    return container;
  }

  private renderError(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'project-export-error';
    
    const icon = document.createElement('div');
    icon.className = 'project-export-error__icon';
    icon.innerHTML = '✕';
    container.appendChild(icon);
    
    const message = document.createElement('div');
    message.className = 'project-export-error__message';
    message.textContent = this.error || 'An unknown error occurred';
    container.appendChild(message);
    
    return container;
  }

  private async startExport(): Promise<void> {
    this.phase = 'exporting';
    this.render();
    
    try {
      this.blob = await exportProject(
        this.options,
        this.metadata,
        (progress) => {
          this.progress = progress;
          this.render();
        }
      );
      
      this.downloadUrl = URL.createObjectURL(this.blob);
      this.phase = 'complete';
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Unknown error';
      this.phase = 'error';
    }
    
    this.render();
  }

  private getStageLabel(stage: string): string {
    const labels: Record<string, string> = {
      collecting: '1/4 Collecting Data',
      serializing: '2/4 Serializing',
      compressing: '3/4 Compressing',
      packaging: '4/4 Packaging',
      complete: 'Complete'
    };
    return labels[stage] || stage;
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private cancel(): void {
    if (this.downloadUrl) {
      URL.revokeObjectURL(this.downloadUrl);
    }
    this.destroy();
  }

  public mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
  }

  public destroy(): void {
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
  }

  private injectStyles(): void {
    const styleId = 'project-export-dialog-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .project-export-dialog-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.75);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(4px);
      }
      
      .project-export-dialog {
        background: var(--surface-2, #2a2a2a);
        border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        max-width: 600px;
        width: 90%;
        max-height: 90vh;
        overflow: auto;
      }
      
      .project-export-dialog__header {
        padding: 24px;
        border-bottom: 1px solid var(--border-color, #3a3a3a);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .project-export-dialog__header h2 {
        margin: 0;
        font-size: 20px;
        color: var(--text-primary, #fff);
      }
      
      .project-export-dialog__close {
        background: none;
        border: none;
        color: var(--text-secondary, #999);
        font-size: 24px;
        cursor: pointer;
        padding: 4px 8px;
      }
      
      .project-export-dialog__content {
        padding: 24px;
        min-height: 300px;
      }
      
      .project-export-form__section {
        margin-bottom: 20px;
      }
      
      .project-export-form__label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary, #fff);
        margin-bottom: 8px;
      }
      
      .project-export-form__input,
      .project-export-form__textarea {
        width: 100%;
        padding: 10px 12px;
        background: var(--surface-3, #1a1a1a);
        border: 1px solid var(--border-color, #3a3a3a);
        border-radius: 6px;
        color: var(--text-primary, #fff);
        font-size: 14px;
      }
      
      .project-export-form__textarea {
        resize: vertical;
        font-family: inherit;
      }
      
      .project-export-form__checkbox {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 0;
        color: var(--text-primary, #fff);
        cursor: pointer;
      }
      
      .project-export-form__info {
        padding: 12px;
        background: var(--surface-3, #1a1a1a);
        border-radius: 6px;
        font-size: 13px;
        color: var(--text-secondary, #999);
      }
      
      .project-export-progress {
        text-align: center;
        padding: 40px 0;
      }
      
      .project-export-progress__stage {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary, #fff);
        margin-bottom: 24px;
      }
      
      .project-export-progress__bar {
        width: 100%;
        height: 8px;
        background: var(--surface-3, #1a1a1a);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 12px;
      }
      
      .project-export-progress__fill {
        height: 100%;
        background: var(--accent-color, #4a9eff);
        transition: width 0.3s ease-out;
      }
      
      .project-export-progress__message {
        font-size: 14px;
        color: var(--text-secondary, #999);
        margin-bottom: 8px;
      }
      
      .project-export-progress__bytes {
        font-size: 12px;
        color: var(--text-secondary, #999);
      }
      
      .project-export-complete,
      .project-export-error {
        text-align: center;
        padding: 40px 0;
      }
      
      .project-export-complete__icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 24px;
        background: var(--success-color, #4caf50);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 48px;
        color: white;
      }
      
      .project-export-error__icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 24px;
        background: var(--error-color, #f44336);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 48px;
        color: white;
      }
      
      .project-export-complete__message,
      .project-export-error__message {
        font-size: 16px;
        color: var(--text-primary, #fff);
        margin-bottom: 16px;
      }
      
      .project-export-complete__size {
        font-size: 14px;
        color: var(--text-secondary, #999);
        margin-bottom: 24px;
      }
      
      .project-export-complete__download {
        display: inline-block;
        padding: 12px 24px;
        background: var(--accent-color, #4a9eff);
        color: white;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
        transition: background 0.2s;
      }
      
      .project-export-complete__download:hover {
        background: var(--accent-hover, #3a8eef);
      }
      
      .project-export-dialog__footer {
        padding: 16px 24px;
        border-top: 1px solid var(--border-color, #3a3a3a);
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
      
      .project-export-dialog__button {
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
      }
      
      .project-export-dialog__button--primary {
        background: var(--accent-color, #4a9eff);
        color: white;
      }
      
      .project-export-dialog__button--primary:hover {
        background: var(--accent-hover, #3a8eef);
      }
      
      .project-export-dialog__button--secondary {
        background: var(--surface-3, #1a1a1a);
        color: var(--text-primary, #fff);
        border: 1px solid var(--border-color, #3a3a3a);
      }
      
      .project-export-dialog__button--secondary:hover {
        background: var(--surface-4, #333);
      }
    `;
    
    document.head.appendChild(style);
  }
}

// --------------------------------------------------------------------------
// Factory
// --------------------------------------------------------------------------

export function openProjectExportDialog(): ProjectExportDialog {
  const dialog = new ProjectExportDialog();
  dialog.mount();
  return dialog;
}
