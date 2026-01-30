/**
 * Sample Pack Browser UI Component
 */

import type { SamplePack, SampleCategory, SamplePackDifficulty } from './types';
import { getSamplePackRegistry } from './registry';
import { installSamplePack } from './install';

export interface SamplePackBrowserOptions {
  /** Container element */
  container: HTMLElement;
  
  /** Initial filter category */
  initialCategory?: SampleCategory;
  
  /** Callback when pack is installed */
  onInstall?: (packId: string) => void;
}

export class SamplePackBrowser {
  private container: HTMLElement;
  private searchQuery = '';
  private selectedCategory: SampleCategory | null = null;
  private selectedDifficulty: SamplePackDifficulty | null = null;
  private selectedTags: string[] = [];
  private onInstall?: (packId: string) => void;

  constructor(options: SamplePackBrowserOptions) {
    this.container = options.container;
    this.selectedCategory = options.initialCategory || null;
    if (options.onInstall !== undefined) {
      this.onInstall = options.onInstall;
    }
    this.render();
  }

  private render(): void {
    const registry = getSamplePackRegistry();
    let packs = registry.getAllPacks();

    // Apply filters
    if (this.searchQuery) {
      packs = registry.search(this.searchQuery);
    }
    if (this.selectedCategory) {
      packs = packs.filter(p => p.category === this.selectedCategory);
    }
    if (this.selectedDifficulty) {
      packs = packs.filter(p => p.difficulty === this.selectedDifficulty);
    }
    if (this.selectedTags.length > 0) {
      packs = packs.filter(p =>
        this.selectedTags.some(tag => p.tags.includes(tag))
      );
    }

    this.container.innerHTML = `
      <div class="sample-pack-browser" role="region" aria-label="Sample Pack Browser">
        <div class="browser-header">
          <h2>Sample Packs</h2>
          <input
            type="search"
            placeholder="Search packs..."
            class="search-input"
            aria-label="Search sample packs"
            value="${this.searchQuery}"
          />
        </div>
        
        <div class="browser-filters">
          <div class="filter-group">
            <label>Category</label>
            <select class="category-filter" aria-label="Filter by category">
              <option value="">All Categories</option>
              <option value="drums" ${this.selectedCategory === 'drums' ? 'selected' : ''}>Drums</option>
              <option value="bass" ${this.selectedCategory === 'bass' ? 'selected' : ''}>Bass</option>
              <option value="leads" ${this.selectedCategory === 'leads' ? 'selected' : ''}>Leads</option>
              <option value="pads" ${this.selectedCategory === 'pads' ? 'selected' : ''}>Pads</option>
              <option value="fx" ${this.selectedCategory === 'fx' ? 'selected' : ''}>FX</option>
              <option value="percussion" ${this.selectedCategory === 'percussion' ? 'selected' : ''}>Percussion</option>
              <option value="orchestral" ${this.selectedCategory === 'orchestral' ? 'selected' : ''}>Orchestral</option>
              <option value="vocals" ${this.selectedCategory === 'vocals' ? 'selected' : ''}>Vocals</option>
              <option value="ambience" ${this.selectedCategory === 'ambience' ? 'selected' : ''}>Ambience</option>
              <option value="foley" ${this.selectedCategory === 'foley' ? 'selected' : ''}>Foley</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>Difficulty</label>
            <select class="difficulty-filter" aria-label="Filter by difficulty">
              <option value="">All Levels</option>
              <option value="beginner" ${this.selectedDifficulty === 'beginner' ? 'selected' : ''}>Beginner</option>
              <option value="intermediate" ${this.selectedDifficulty === 'intermediate' ? 'selected' : ''}>Intermediate</option>
              <option value="advanced" ${this.selectedDifficulty === 'advanced' ? 'selected' : ''}>Advanced</option>
            </select>
          </div>
        </div>
        
        <div class="browser-results" role="list">
          ${packs.length === 0 ? `
            <div class="no-results">
              <p>No sample packs found</p>
              <p class="hint">Try adjusting your filters</p>
            </div>
          ` : packs.map(pack => this.renderPackCard(pack)).join('')}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private renderPackCard(pack: SamplePack): string {
    const registry = getSamplePackRegistry();
    const isInstalled = registry.isInstalled(pack.id);
    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return `
      <div class="pack-card" data-pack-id="${pack.id}" role="listitem">
        <div class="pack-icon">
          ${pack.icon ? `<img src="${pack.icon}" alt="${pack.name} icon" />` : '🎵'}
        </div>
        <div class="pack-info">
          <h3>${pack.name}</h3>
          <p class="description">${pack.description}</p>
          <div class="pack-meta">
            <span class="category">${pack.category}</span>
            <span class="difficulty">${pack.difficulty}</span>
            <span class="sample-count">${pack.samples.length} samples</span>
            <span class="size">${formatSize(pack.totalSize)}</span>
          </div>
          <div class="pack-tags">
            ${pack.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        </div>
        <div class="pack-actions">
          ${isInstalled ? `
            <span class="installed-badge" aria-label="Installed">✓ Installed</span>
          ` : `
            <button
              class="install-btn"
              data-pack-id="${pack.id}"
              aria-label="Install ${pack.name}"
            >
              Install
            </button>
          `}
          <button
            class="preview-btn"
            data-pack-id="${pack.id}"
            aria-label="Preview ${pack.name}"
          >
            Preview
          </button>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    // Search input
    const searchInput = this.container.querySelector('.search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = (e.target as HTMLInputElement).value;
        this.render();
      });
    }

    // Category filter
    const categoryFilter = this.container.querySelector('.category-filter') as HTMLSelectElement;
    if (categoryFilter) {
      categoryFilter.addEventListener('change', (e) => {
        const value = (e.target as HTMLSelectElement).value;
        this.selectedCategory = value ? value as SampleCategory : null;
        this.render();
      });
    }

    // Difficulty filter
    const difficultyFilter = this.container.querySelector('.difficulty-filter') as HTMLSelectElement;
    if (difficultyFilter) {
      difficultyFilter.addEventListener('change', (e) => {
        const value = (e.target as HTMLSelectElement).value;
        this.selectedDifficulty = value ? value as SamplePackDifficulty : null;
        this.render();
      });
    }

    // Install buttons
    const installBtns = this.container.querySelectorAll('.install-btn');
    installBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const packId = (e.target as HTMLElement).dataset.packId;
        if (packId) {
          await this.handleInstall(packId);
        }
      });
    });

    // Preview buttons
    const previewBtns = this.container.querySelectorAll('.preview-btn');
    previewBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const packId = (e.target as HTMLElement).dataset.packId;
        if (packId) {
          this.handlePreview(packId);
        }
      });
    });
  }

  private async handleInstall(packId: string): Promise<void> {
    const registry = getSamplePackRegistry();
    const pack = registry.getPack(packId);
    if (!pack) return;

    // Show progress (in real implementation, this would be a modal)
    const btn = this.container.querySelector(`[data-pack-id="${packId}"]`) as HTMLButtonElement;
    if (btn) {
      btn.textContent = 'Installing...';
      btn.disabled = true;
    }

    const result = await installSamplePack(pack, {
      onProgress: (progress) => {
        if (btn) {
          btn.textContent = `${Math.round(progress)}%`;
        }
      },
    });

    if (result.success) {
      this.onInstall?.(packId);
      this.render();
    } else {
      alert(`Installation failed: ${result.errors.join('\n')}`);
      if (btn) {
        btn.textContent = 'Install';
        btn.disabled = false;
      }
    }
  }

  private handlePreview(packId: string): void {
    const registry = getSamplePackRegistry();
    const pack = registry.getPack(packId);
    if (!pack) return;

    // Show preview modal
    const modal = document.createElement('div');
    modal.className = 'sample-pack-preview-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'preview-title');
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <h2 id="preview-title">${pack.name}</h2>
        <p>${pack.description}</p>
        <div class="sample-list">
          <h3>Samples (${pack.samples.length})</h3>
          <ul>
            ${pack.samples.map(sample => `
              <li>
                <span class="sample-name">${sample.name}</span>
                <span class="sample-duration">${sample.duration ? `${sample.duration.toFixed(1)}s` : ''}</span>
                ${sample.key ? `<span class="sample-key">${sample.key}</span>` : ''}
              </li>
            `).join('')}
          </ul>
        </div>
        <button class="close-btn" aria-label="Close preview">Close</button>
      </div>
    `;

    document.body.appendChild(modal);

    // Close on overlay or button click
    modal.querySelector('.modal-overlay')?.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    modal.querySelector('.close-btn')?.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    // Trap focus in modal
    const closeBtn = modal.querySelector('.close-btn');
    if (closeBtn instanceof HTMLElement) {
      closeBtn.focus();
    }
  }

  public destroy(): void {
    this.container.innerHTML = '';
  }
}
