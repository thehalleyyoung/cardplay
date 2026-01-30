/**
 * @fileoverview Bounce/Render Dialog Component
 * 
 * Implements I042, M302, M304:
 * - Comprehensive render/bounce to audio
 * - Export settings (sample rate, bit depth, normalization)
 * - Progress tracking with stage-by-stage feedback
 * - Beautiful browser UI with accessibility
 * 
 * @module @cardplay/ui/components/bounce-dialog
 */

import type { EventStreamId } from '../../state/event-store';
import { getSharedEventStore } from '../../state/event-store';
import type { RenderOptions, RenderProgress } from '../../audio/render';
import { renderToAudio } from '../../audio/render';
import { asTick, PPQ } from '../../types/primitives';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface BounceTarget {
  type: 'stream' | 'track' | 'selection' | 'master';
  id?: EventStreamId | string;
  name: string;
  startTick?: number;
  endTick?: number;
}

export interface BounceDialogConfig {
  target: BounceTarget;
  defaultFormat?: 'wav' | 'mp3' | 'ogg';
  defaultSampleRate?: 44100 | 48000 | 96000;
  defaultBitDepth?: 16 | 24 | 32;
  onComplete?: (blob: Blob, filename: string) => void;
  onCancel?: () => void;
}

export interface BounceSettings {
  format: 'wav' | 'mp3' | 'ogg';
  sampleRate: 44100 | 48000 | 96000;
  bitDepth: 16 | 24 | 32;
  normalize: boolean;
  normalizePeak: number; // dBFS
  fadeIn: number; // seconds
  fadeOut: number; // seconds;
  includeReverb: boolean;
  reverbTail: number; // seconds
  filename: string;
}

interface BounceState {
  phase: 'config' | 'rendering' | 'complete' | 'error';
  progress: RenderProgress | null;
  error: string | null;
  blob: Blob | null;
  downloadUrl: string | null;
}

// --------------------------------------------------------------------------
// Constants
// --------------------------------------------------------------------------

const FORMAT_LABELS: Record<string, string | undefined> = {
  wav: 'WAV (Uncompressed)',
  mp3: 'MP3 (Lossy)',
  ogg: 'OGG Vorbis (Lossy)'
};

const SAMPLE_RATE_LABELS: Record<number, string> = {
  44100: '44.1 kHz (CD Quality)',
  48000: '48 kHz (Professional)',
  96000: '96 kHz (High Quality)'
};

const BIT_DEPTH_LABELS: Record<number, string> = {
  16: '16-bit (CD Quality)',
  24: '24-bit (Professional)',
  32: '32-bit Float (Maximum)'
};

// --------------------------------------------------------------------------
// Component
// --------------------------------------------------------------------------

export class BounceDialog {
  private container: HTMLDivElement;
  private config: BounceDialogConfig;
  private settings: BounceSettings;
  private state: BounceState;
  private abortController: AbortController | null = null;

  constructor(config: BounceDialogConfig) {
    this.config = config;
    this.settings = this.createDefaultSettings();
    this.state = {
      phase: 'config',
      progress: null,
      error: null,
      blob: null,
      downloadUrl: null
    };
    
    this.container = this.createContainer();
    this.render();
  }

  private createDefaultSettings(): BounceSettings {
    return {
      format: this.config.defaultFormat || 'wav',
      sampleRate: this.config.defaultSampleRate || 48000,
      bitDepth: this.config.defaultBitDepth || 24,
      normalize: true,
      normalizePeak: -0.3,
      fadeIn: 0,
      fadeOut: 0,
      includeReverb: true,
      reverbTail: 3,
      filename: this.generateFilename()
    };
  }

  private generateFilename(): string {
    const date = new Date().toISOString().split('T')[0];
    const targetName = this.config.target.name.replace(/[^a-z0-9]/gi, '_');
    return `${targetName}_${date}`;
  }

  private createContainer(): HTMLDivElement {
    const div = document.createElement('div');
    div.className = 'bounce-dialog-backdrop';
    div.setAttribute('role', 'dialog');
    div.setAttribute('aria-modal', 'true');
    div.setAttribute('aria-labelledby', 'bounce-dialog-title');
    
    // Close on backdrop click
    div.addEventListener('click', (e) => {
      if (e.target === div && this.state.phase === 'config') {
        this.cancel();
      }
    });
    
    // Escape key to close
    div.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.state.phase === 'config') {
        this.cancel();
      }
    });
    
    return div;
  }

  private render(): void {
    this.container.innerHTML = '';
    
    const dialog = document.createElement('div');
    dialog.className = 'bounce-dialog';
    
    // Header
    const header = this.renderHeader();
    dialog.appendChild(header);
    
    // Content (changes based on phase)
    const content = this.renderContent();
    dialog.appendChild(content);
    
    // Footer
    const footer = this.renderFooter();
    dialog.appendChild(footer);
    
    this.container.appendChild(dialog);
    
    // Inject styles
    this.injectStyles();
  }

  private renderHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'bounce-dialog__header';
    
    const title = document.createElement('h2');
    title.id = 'bounce-dialog-title';
    title.className = 'bounce-dialog__title';
    
    switch (this.state.phase) {
      case 'config':
        title.textContent = `Bounce ${this.config.target.name}`;
        break;
      case 'rendering':
        title.textContent = 'Rendering Audio...';
        break;
      case 'complete':
        title.textContent = 'Bounce Complete!';
        break;
      case 'error':
        title.textContent = 'Bounce Failed';
        break;
    }
    
    header.appendChild(title);
    
    // Close button (only in config/complete/error phase)
    if (this.state.phase !== 'rendering') {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'bounce-dialog__close';
      closeBtn.setAttribute('aria-label', 'Close dialog');
      closeBtn.innerHTML = '✕';
      closeBtn.addEventListener('click', () => this.cancel());
      header.appendChild(closeBtn);
    }
    
    return header;
  }

  private renderContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'bounce-dialog__content';
    
    switch (this.state.phase) {
      case 'config':
        content.appendChild(this.renderConfigForm());
        break;
      case 'rendering':
        content.appendChild(this.renderProgress());
        break;
      case 'complete':
        content.appendChild(this.renderComplete());
        break;
      case 'error':
        content.appendChild(this.renderError());
        break;
    }
    
    return content;
  }

  private renderConfigForm(): HTMLElement {
    const form = document.createElement('form');
    form.className = 'bounce-form';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.startBounce();
    });
    
    // Target info
    const targetInfo = document.createElement('div');
    targetInfo.className = 'bounce-form__section';
    targetInfo.innerHTML = `
      <div class="bounce-form__info">
        <strong>Target:</strong> ${this.config.target.name} (${this.config.target.type})
      </div>
    `;
    form.appendChild(targetInfo);
    
    // Format section
    const formatSection = this.renderFormatSection();
    form.appendChild(formatSection);
    
    // Quality section
    const qualitySection = this.renderQualitySection();
    form.appendChild(qualitySection);
    
    // Processing section
    const processingSection = this.renderProcessingSection();
    form.appendChild(processingSection);
    
    // Filename section
    const filenameSection = this.renderFilenameSection();
    form.appendChild(filenameSection);
    
    return form;
  }

  private renderFormatSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'bounce-form__section';
    
    const label = document.createElement('label');
    label.className = 'bounce-form__label';
    label.textContent = 'Export Format';
    
    const formats = ['wav', 'mp3', 'ogg'] as const;
    const formatGroup = document.createElement('div');
    formatGroup.className = 'bounce-form__radio-group';
    
    formats.forEach(format => {
      const wrapper = document.createElement('label');
      wrapper.className = 'bounce-form__radio';
      
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'format';
      input.value = format;
      input.checked = this.settings.format === format;
      input.addEventListener('change', () => {
        this.settings.format = format;
        this.render();
      });
      
      const text = document.createElement('span');
      text.textContent = FORMAT_LABELS[format] || format;
      
      wrapper.appendChild(input);
      wrapper.appendChild(text);
      formatGroup.appendChild(wrapper);
    });
    
    section.appendChild(label);
    section.appendChild(formatGroup);
    return section;
  }

  private renderQualitySection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'bounce-form__section';
    
    // Sample Rate
    const srLabel = document.createElement('label');
    srLabel.className = 'bounce-form__label';
    srLabel.textContent = 'Sample Rate';
    
    const srSelect = document.createElement('select');
    srSelect.className = 'bounce-form__select';
    [44100, 48000, 96000].forEach(rate => {
      const option = document.createElement('option');
      option.value = String(rate);
      option.textContent = SAMPLE_RATE_LABELS[rate] || String(rate);
      option.selected = this.settings.sampleRate === rate;
      srSelect.appendChild(option);
    });
    srSelect.addEventListener('change', () => {
      this.settings.sampleRate = Number(srSelect.value) as 44100 | 48000 | 96000;
    });
    
    section.appendChild(srLabel);
    section.appendChild(srSelect);
    
    // Bit Depth (only for WAV)
    if (this.settings.format === 'wav') {
      const bdLabel = document.createElement('label');
      bdLabel.className = 'bounce-form__label';
      bdLabel.textContent = 'Bit Depth';
      
      const bdSelect = document.createElement('select');
      bdSelect.className = 'bounce-form__select';
      [16, 24, 32].forEach(depth => {
        const option = document.createElement('option');
        option.value = String(depth);
        option.textContent = BIT_DEPTH_LABELS[depth] || String(depth);
        option.selected = this.settings.bitDepth === depth;
        bdSelect.appendChild(option);
      });
      bdSelect.addEventListener('change', () => {
        this.settings.bitDepth = Number(bdSelect.value) as 16 | 24 | 32;
      });
      
      section.appendChild(bdLabel);
      section.appendChild(bdSelect);
    }
    
    return section;
  }

  private renderProcessingSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'bounce-form__section';
    
    const label = document.createElement('label');
    label.className = 'bounce-form__label';
    label.textContent = 'Processing Options';
    section.appendChild(label);
    
    // Normalize checkbox
    const normalizeWrapper = this.createCheckbox(
      'Normalize Audio',
      this.settings.normalize,
      (checked) => {
        this.settings.normalize = checked;
        this.render();
      }
    );
    section.appendChild(normalizeWrapper);
    
    // Normalize peak (if normalize enabled)
    if (this.settings.normalize) {
      const peakLabel = document.createElement('label');
      peakLabel.className = 'bounce-form__label bounce-form__label--indent';
      peakLabel.textContent = `Target Peak Level: ${this.settings.normalizePeak.toFixed(1)} dBFS`;
      
      const peakSlider = document.createElement('input');
      peakSlider.type = 'range';
      peakSlider.min = '-6';
      peakSlider.max = '0';
      peakSlider.step = '0.1';
      peakSlider.value = String(this.settings.normalizePeak);
      peakSlider.className = 'bounce-form__slider';
      peakSlider.addEventListener('input', () => {
        this.settings.normalizePeak = Number(peakSlider.value);
        peakLabel.textContent = `Target Peak Level: ${this.settings.normalizePeak.toFixed(1)} dBFS`;
      });
      
      section.appendChild(peakLabel);
      section.appendChild(peakSlider);
    }
    
    // Include reverb tail
    const reverbWrapper = this.createCheckbox(
      'Include Reverb Tail',
      this.settings.includeReverb,
      (checked) => {
        this.settings.includeReverb = checked;
        this.render();
      }
    );
    section.appendChild(reverbWrapper);
    
    // Reverb tail length (if enabled)
    if (this.settings.includeReverb) {
      const tailLabel = document.createElement('label');
      tailLabel.className = 'bounce-form__label bounce-form__label--indent';
      tailLabel.textContent = `Tail Length: ${this.settings.reverbTail.toFixed(1)}s`;
      
      const tailSlider = document.createElement('input');
      tailSlider.type = 'range';
      tailSlider.min = '0';
      tailSlider.max = '10';
      tailSlider.step = '0.5';
      tailSlider.value = String(this.settings.reverbTail);
      tailSlider.className = 'bounce-form__slider';
      tailSlider.addEventListener('input', () => {
        this.settings.reverbTail = Number(tailSlider.value);
        tailLabel.textContent = `Tail Length: ${this.settings.reverbTail.toFixed(1)}s`;
      });
      
      section.appendChild(tailLabel);
      section.appendChild(tailSlider);
    }
    
    return section;
  }

  private renderFilenameSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'bounce-form__section';
    
    const label = document.createElement('label');
    label.className = 'bounce-form__label';
    label.textContent = 'Filename';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'bounce-form__input';
    input.value = this.settings.filename;
    input.addEventListener('input', () => {
      this.settings.filename = input.value;
    });
    
    const extension = document.createElement('span');
    extension.className = 'bounce-form__extension';
    extension.textContent = `.${this.settings.format}`;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'bounce-form__filename-group';
    wrapper.appendChild(input);
    wrapper.appendChild(extension);
    
    section.appendChild(label);
    section.appendChild(wrapper);
    return section;
  }

  private createCheckbox(
    label: string,
    checked: boolean,
    onChange: (checked: boolean) => void
  ): HTMLElement {
    const wrapper = document.createElement('label');
    wrapper.className = 'bounce-form__checkbox';
    
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    input.addEventListener('change', () => onChange(input.checked));
    
    const text = document.createElement('span');
    text.textContent = label;
    
    wrapper.appendChild(input);
    wrapper.appendChild(text);
    return wrapper;
  }

  private renderProgress(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'bounce-progress';
    
    if (this.state.progress) {
      // Stage label
      const stageLabel = document.createElement('div');
      stageLabel.className = 'bounce-progress__stage';
      stageLabel.textContent = this.getStageLabel(this.state.progress.stage);
      container.appendChild(stageLabel);
      
      // Progress bar
      const progressBar = document.createElement('div');
      progressBar.className = 'bounce-progress__bar';
      
      const progressFill = document.createElement('div');
      progressFill.className = 'bounce-progress__fill';
      progressFill.style.width = `${this.state.progress.progress * 100}%`;
      
      progressBar.appendChild(progressFill);
      container.appendChild(progressBar);
      
      // Message
      const message = document.createElement('div');
      message.className = 'bounce-progress__message';
      message.textContent = this.state.progress.message;
      container.appendChild(message);
      
      // Percentage
      const percentage = document.createElement('div');
      percentage.className = 'bounce-progress__percentage';
      percentage.textContent = `${Math.round(this.state.progress.progress * 100)}%`;
      container.appendChild(percentage);
    }
    
    return container;
  }

  private getStageLabel(stage: string): string {
    const labels: Record<string, string> = {
      preparing: '1/4 Preparing',
      rendering: '2/4 Rendering',
      encoding: '3/4 Encoding',
      finalizing: '4/4 Finalizing'
    };
    return labels[stage] || stage;
  }

  private renderComplete(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'bounce-complete';
    
    // Success icon
    const icon = document.createElement('div');
    icon.className = 'bounce-complete__icon';
    icon.innerHTML = '✓';
    container.appendChild(icon);
    
    // Message
    const message = document.createElement('div');
    message.className = 'bounce-complete__message';
    message.textContent = `Successfully exported ${this.settings.filename}.${this.settings.format}`;
    container.appendChild(message);
    
    // Download button
    if (this.state.downloadUrl) {
      const downloadBtn = document.createElement('a');
      downloadBtn.href = this.state.downloadUrl;
      downloadBtn.download = `${this.settings.filename}.${this.settings.format}`;
      downloadBtn.className = 'bounce-complete__download';
      downloadBtn.textContent = 'Download File';
      container.appendChild(downloadBtn);
    }
    
    return container;
  }

  private renderError(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'bounce-error';
    
    // Error icon
    const icon = document.createElement('div');
    icon.className = 'bounce-error__icon';
    icon.innerHTML = '✕';
    container.appendChild(icon);
    
    // Error message
    const message = document.createElement('div');
    message.className = 'bounce-error__message';
    message.textContent = this.state.error || 'An unknown error occurred';
    container.appendChild(message);
    
    return container;
  }

  private renderFooter(): HTMLElement {
    const footer = document.createElement('div');
    footer.className = 'bounce-dialog__footer';
    
    switch (this.state.phase) {
      case 'config':
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'bounce-dialog__button bounce-dialog__button--secondary';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => this.cancel());
        footer.appendChild(cancelBtn);
        
        const bounceBtn = document.createElement('button');
        bounceBtn.type = 'submit';
        bounceBtn.className = 'bounce-dialog__button bounce-dialog__button--primary';
        bounceBtn.textContent = 'Start Bounce';
        bounceBtn.addEventListener('click', () => this.startBounce());
        footer.appendChild(bounceBtn);
        break;
        
      case 'rendering':
        const abortBtn = document.createElement('button');
        abortBtn.type = 'button';
        abortBtn.className = 'bounce-dialog__button bounce-dialog__button--secondary';
        abortBtn.textContent = 'Cancel Bounce';
        abortBtn.addEventListener('click', () => this.abortBounce());
        footer.appendChild(abortBtn);
        break;
        
      case 'complete':
      case 'error':
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'bounce-dialog__button bounce-dialog__button--primary';
        closeBtn.textContent = 'Close';
        closeBtn.addEventListener('click', () => this.cancel());
        footer.appendChild(closeBtn);
        break;
    }
    
    return footer;
  }

  private async startBounce(): Promise<void> {
    this.state.phase = 'rendering';
    this.abortController = new AbortController();
    this.render();
    
    try {
      // Determine tick range
      const store = getSharedEventStore();
      let startTick = asTick(0);
      let endTick = asTick(0);
      
      if (this.config.target.type === 'stream' && this.config.target.id) {
        const stream = store.getStream(this.config.target.id as EventStreamId);
        if (stream) {
          const events = stream.events;
          if (events.length > 0) {
            const firstEvent = events[0];
            const lastEvent = events[events.length - 1];
            if (firstEvent && lastEvent) {
              startTick = firstEvent.start;
              endTick = lastEvent.start;
            }
          }
        }
      }
      
      // Add reverb tail if enabled
      if (this.settings.includeReverb) {
        const tailTicks = Math.floor(this.settings.reverbTail * (120 / 60) * PPQ);
        endTick = asTick((endTick as number) + tailTicks);
      }
      
      // Create render options
      const options: RenderOptions = {
        format: this.settings.format,
        sampleRate: this.settings.sampleRate,
        bitDepth: this.settings.bitDepth,
        normalize: this.settings.normalize,
        startTick,
        endTick,
        fadeIn: this.settings.fadeIn,
        fadeOut: this.settings.fadeOut
      };
      
      // Render audio
      const result = await renderToAudio(
        this.config.target.id as EventStreamId || 'default-stream' as EventStreamId,
        options,
        (progress) => {
          this.state.progress = progress;
          this.render();
        }
      );
      
      if (result.success && result.blob) {
        this.state.blob = result.blob;
        this.state.downloadUrl = URL.createObjectURL(result.blob);
        this.state.phase = 'complete';
        
        // Call onComplete callback
        if (this.config.onComplete) {
          this.config.onComplete(result.blob, `${this.settings.filename}.${this.settings.format}`);
        }
      } else {
        this.state.error = result.error || 'Render failed';
        this.state.phase = 'error';
      }
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Unknown error';
      this.state.phase = 'error';
    }
    
    this.render();
  }

  private abortBounce(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.cancel();
  }

  private cancel(): void {
    // Clean up download URL
    if (this.state.downloadUrl) {
      URL.revokeObjectURL(this.state.downloadUrl);
    }
    
    if (this.config.onCancel) {
      this.config.onCancel();
    }
    
    this.destroy();
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  public mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
    
    // Focus first interactive element
    const firstButton = this.container.querySelector('button, input, select') as HTMLElement;
    if (firstButton) {
      firstButton.focus();
    }
  }

  public destroy(): void {
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
  }

  // --------------------------------------------------------------------------
  // Styles
  // --------------------------------------------------------------------------

  private injectStyles(): void {
    const styleId = 'bounce-dialog-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .bounce-dialog-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.75);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(4px);
      }
      
      .bounce-dialog {
        background: var(--surface-2, #2a2a2a);
        border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        max-width: 600px;
        width: 90%;
        max-height: 90vh;
        overflow: auto;
        animation: bounceDialogEnter 0.3s ease-out;
      }
      
      @keyframes bounceDialogEnter {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      
      .bounce-dialog__header {
        padding: 24px;
        border-bottom: 1px solid var(--border-color, #3a3a3a);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .bounce-dialog__title {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: var(--text-primary, #ffffff);
      }
      
      .bounce-dialog__close {
        background: none;
        border: none;
        color: var(--text-secondary, #999);
        font-size: 24px;
        cursor: pointer;
        padding: 4px 8px;
        transition: color 0.2s;
      }
      
      .bounce-dialog__close:hover {
        color: var(--text-primary, #ffffff);
      }
      
      .bounce-dialog__content {
        padding: 24px;
        min-height: 300px;
      }
      
      .bounce-form__section {
        margin-bottom: 24px;
      }
      
      .bounce-form__label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary, #ffffff);
        margin-bottom: 8px;
      }
      
      .bounce-form__label--indent {
        margin-left: 24px;
        margin-top: 8px;
        font-size: 13px;
        color: var(--text-secondary, #999);
      }
      
      .bounce-form__info {
        padding: 12px;
        background: var(--surface-3, #1a1a1a);
        border-radius: 6px;
        font-size: 14px;
        color: var(--text-secondary, #999);
      }
      
      .bounce-form__radio-group {
        display: flex;
        gap: 12px;
      }
      
      .bounce-form__radio {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        background: var(--surface-3, #1a1a1a);
        border: 2px solid transparent;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .bounce-form__radio:has(input:checked) {
        border-color: var(--accent-color, #4a9eff);
        background: var(--surface-4, #333);
      }
      
      .bounce-form__radio input {
        margin: 0;
      }
      
      .bounce-form__select,
      .bounce-form__input {
        width: 100%;
        padding: 10px 12px;
        background: var(--surface-3, #1a1a1a);
        border: 1px solid var(--border-color, #3a3a3a);
        border-radius: 6px;
        color: var(--text-primary, #ffffff);
        font-size: 14px;
        transition: border-color 0.2s;
      }
      
      .bounce-form__select:focus,
      .bounce-form__input:focus {
        outline: none;
        border-color: var(--accent-color, #4a9eff);
      }
      
      .bounce-form__slider {
        width: 100%;
        margin-top: 4px;
      }
      
      .bounce-form__checkbox {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        padding: 8px 0;
        color: var(--text-primary, #ffffff);
      }
      
      .bounce-form__filename-group {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      .bounce-form__extension {
        padding: 10px 12px;
        background: var(--surface-3, #1a1a1a);
        border: 1px solid var(--border-color, #3a3a3a);
        border-radius: 6px;
        color: var(--text-secondary, #999);
        font-size: 14px;
        white-space: nowrap;
      }
      
      .bounce-progress {
        text-align: center;
        padding: 40px 0;
      }
      
      .bounce-progress__stage {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary, #ffffff);
        margin-bottom: 24px;
      }
      
      .bounce-progress__bar {
        width: 100%;
        height: 8px;
        background: var(--surface-3, #1a1a1a);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 12px;
      }
      
      .bounce-progress__fill {
        height: 100%;
        background: var(--accent-color, #4a9eff);
        transition: width 0.3s ease-out;
      }
      
      .bounce-progress__message {
        font-size: 14px;
        color: var(--text-secondary, #999);
        margin-bottom: 8px;
      }
      
      .bounce-progress__percentage {
        font-size: 24px;
        font-weight: 600;
        color: var(--accent-color, #4a9eff);
      }
      
      .bounce-complete,
      .bounce-error {
        text-align: center;
        padding: 40px 0;
      }
      
      .bounce-complete__icon {
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
      
      .bounce-error__icon {
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
      
      .bounce-complete__message,
      .bounce-error__message {
        font-size: 16px;
        color: var(--text-primary, #ffffff);
        margin-bottom: 24px;
      }
      
      .bounce-complete__download {
        display: inline-block;
        padding: 12px 24px;
        background: var(--accent-color, #4a9eff);
        color: white;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
        transition: background 0.2s;
      }
      
      .bounce-complete__download:hover {
        background: var(--accent-hover, #3a8eef);
      }
      
      .bounce-dialog__footer {
        padding: 16px 24px;
        border-top: 1px solid var(--border-color, #3a3a3a);
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
      
      .bounce-dialog__button {
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
      }
      
      .bounce-dialog__button--primary {
        background: var(--accent-color, #4a9eff);
        color: white;
      }
      
      .bounce-dialog__button--primary:hover {
        background: var(--accent-hover, #3a8eef);
      }
      
      .bounce-dialog__button--secondary {
        background: var(--surface-3, #1a1a1a);
        color: var(--text-primary, #ffffff);
        border: 1px solid var(--border-color, #3a3a3a);
      }
      
      .bounce-dialog__button--secondary:hover {
        background: var(--surface-4, #333);
      }
    `;
    
    document.head.appendChild(style);
  }
}

// --------------------------------------------------------------------------
// Factory Functions
// --------------------------------------------------------------------------

export function openBounceDialog(config: BounceDialogConfig): BounceDialog {
  const dialog = new BounceDialog(config);
  dialog.mount();
  return dialog;
}
