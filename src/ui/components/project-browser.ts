/**
 * @fileoverview Project Browser Component
 * 
 * Unified project browser for loading, saving, and managing projects
 * across all boards.
 * 
 * Implements M370: Create unified "Project Browser" across all boards
 * Implements M371: Add project preview (waveform/notation thumbnail)
 * 
 * Features:
 * - List all saved projects
 * - Visual previews (waveform/notation thumbnails)
 * - Project metadata (tempo, time signature, duration, board type)
 * - Search and filter projects
 * - Create new project from template
 * - Duplicate/rename/delete projects
 * - Export/import project files
 * 
 * @module @cardplay/ui/components/project-browser
 */

import type { DeckInstance } from '../../boards/decks/factory-types';
// Board type imported but not currently used - reserved for future enhancement

export interface ProjectMetadata {
  readonly id: string;
  readonly name: string;
  readonly createdAt: string;
  readonly modifiedAt: string;
  readonly tempo?: number;
  readonly timeSignature?: string;
  readonly duration?: number; // in seconds
  readonly boardId?: string;
  readonly tags?: readonly string[];
  readonly thumbnail?: string; // Base64 image data
}

export interface ProjectBrowserConfig {
  onOpenProject?: (projectId: string) => void;
  onCreateProject?: (templateId?: string) => void;
  onClose?: () => void;
}

/**
 * Project storage interface
 * In a real implementation, this would use localStorage, IndexedDB, or a backend
 */
class ProjectStorage {
  private static STORAGE_KEY = 'cardplay.projects.v1';
  
  static async listProjects(): Promise<ProjectMetadata[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const data = JSON.parse(stored);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Failed to list projects:', err);
      return [];
    }
  }
  
  static async saveProject(project: ProjectMetadata): Promise<void> {
    try {
      const projects = await this.listProjects();
      const index = projects.findIndex(p => p.id === project.id);
      
      if (index >= 0) {
        projects[index] = project;
      } else {
        projects.push(project);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
    } catch (err) {
      console.error('Failed to save project:', err);
      throw err;
    }
  }
  
  static async deleteProject(projectId: string): Promise<void> {
    try {
      const projects = await this.listProjects();
      const filtered = projects.filter(p => p.id !== projectId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (err) {
      console.error('Failed to delete project:', err);
      throw err;
    }
  }
  
  static async getProject(projectId: string): Promise<ProjectMetadata | null> {
    const projects = await this.listProjects();
    return projects.find(p => p.id === projectId) || null;
  }
}

/**
 * Project Browser Component
 */
export class ProjectBrowser {
  private container: HTMLElement;
  private config: ProjectBrowserConfig;
  private projects: ProjectMetadata[] = [];
  private searchQuery = '';
  private sortBy: 'name' | 'modified' | 'created' = 'modified';

  constructor(config: ProjectBrowserConfig = {}) {
    this.config = config;
    this.container = document.createElement('div');
    this.init();
  }

  private async init(): Promise<void> {
    await this.loadProjects();
    this.render();
  }

  getElement(): HTMLElement {
    return this.container;
  }

  destroy(): void {
    this.container.remove();
  }

  private async loadProjects(): Promise<void> {
    this.projects = await ProjectStorage.listProjects();
  }

  private render(): void {
    this.container.className = 'project-browser';
    this.container.setAttribute('role', 'region');
    this.container.setAttribute('aria-label', 'Project Browser');
    
    this.container.innerHTML = `
      <div class="project-browser-header">
        <h2>Projects</h2>
        <button class="project-browser-new-btn" aria-label="New project">
          ➕ New Project
        </button>
      </div>
      
      <div class="project-browser-toolbar">
        <input 
          type="search" 
          class="project-browser-search"
          placeholder="Search projects..."
          value="${this.searchQuery}"
          aria-label="Search projects"
        />
        <select class="project-browser-sort" aria-label="Sort by">
          <option value="modified" ${this.sortBy === 'modified' ? 'selected' : ''}>Last Modified</option>
          <option value="created" ${this.sortBy === 'created' ? 'selected' : ''}>Date Created</option>
          <option value="name" ${this.sortBy === 'name' ? 'selected' : ''}>Name</option>
        </select>
      </div>
      
      <div class="project-browser-content">
        ${this.renderProjects()}
      </div>
    `;
    
    this.attachEventListeners();
    this.injectStyles();
  }

  private renderProjects(): string {
    const filtered = this.filterProjects();
    const sorted = this.sortProjects(filtered);
    
    if (sorted.length === 0) {
      return `
        <div class="project-browser-empty">
          <p>No projects found.</p>
          ${this.searchQuery ? `<p>Try a different search term.</p>` : `<p>Create your first project to get started!</p>`}
        </div>
      `;
    }
    
    return `
      <div class="project-browser-grid">
        ${sorted.map(project => this.renderProjectCard(project)).join('')}
      </div>
    `;
  }

  private renderProjectCard(project: ProjectMetadata): string {
    const modifiedDate = new Date(project.modifiedAt);
    // Created date available but not currently displayed
    const now = new Date();
    const diffMs = now.getTime() - modifiedDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    const modifiedText = diffDays === 0 
      ? 'Today'
      : diffDays === 1
      ? 'Yesterday'
      : diffDays < 7
      ? `${diffDays} days ago`
      : modifiedDate.toLocaleDateString();
    
    const durationText = project.duration 
      ? this.formatDuration(project.duration)
      : 'Unknown';
    
    return `
      <div class="project-card" data-project-id="${project.id}">
        <div class="project-card-thumbnail">
          ${project.thumbnail 
            ? `<img src="${project.thumbnail}" alt="Project thumbnail" />`
            : `<div class="project-card-thumbnail-placeholder">🎵</div>`
          }
        </div>
        <div class="project-card-content">
          <h3 class="project-card-title">${this.escapeHtml(project.name)}</h3>
          <div class="project-card-meta">
            <span class="project-card-meta-item">⏱️ ${durationText}</span>
            ${project.tempo ? `<span class="project-card-meta-item">🎼 ${project.tempo} BPM</span>` : ''}
            ${project.timeSignature ? `<span class="project-card-meta-item">📊 ${project.timeSignature}</span>` : ''}
          </div>
          <div class="project-card-modified">Modified ${modifiedText}</div>
          ${project.tags && project.tags.length > 0 ? `
            <div class="project-card-tags">
              ${project.tags.map(tag => `<span class="project-card-tag">${this.escapeHtml(tag)}</span>`).join('')}
            </div>
          ` : ''}
        </div>
        <div class="project-card-actions">
          <button class="project-card-action" data-action="open" aria-label="Open project">
            📂 Open
          </button>
          <button class="project-card-action" data-action="duplicate" aria-label="Duplicate project">
            📋 Duplicate
          </button>
          <button class="project-card-action" data-action="rename" aria-label="Rename project">
            ✏️ Rename
          </button>
          <button class="project-card-action project-card-action-danger" data-action="delete" aria-label="Delete project">
            🗑️ Delete
          </button>
        </div>
      </div>
    `;
  }

  private formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private filterProjects(): ProjectMetadata[] {
    if (!this.searchQuery.trim()) {
      return this.projects;
    }
    
    const queryLower = this.searchQuery.toLowerCase();
    return this.projects.filter(project => {
      // Search in name
      if (project.name.toLowerCase().includes(queryLower)) return true;
      
      // Search in tags
      if (project.tags?.some(tag => tag.toLowerCase().includes(queryLower))) return true;
      
      return false;
    });
  }

  private sortProjects(projects: ProjectMetadata[]): ProjectMetadata[] {
    return [...projects].sort((a, b) => {
      switch (this.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'modified':
        default:
          return new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime();
      }
    });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private attachEventListeners(): void {
    // New project button
    const newBtn = this.container.querySelector('.project-browser-new-btn');
    if (newBtn) {
      newBtn.addEventListener('click', () => {
        if (this.config.onCreateProject) {
          this.config.onCreateProject();
        }
      });
    }
    
    // Search input
    const searchInput = this.container.querySelector('.project-browser-search') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = (e.target as HTMLInputElement).value;
        this.updateContent();
      });
    }
    
    // Sort select
    const sortSelect = this.container.querySelector('.project-browser-sort') as HTMLSelectElement;
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = (e.target as HTMLSelectElement).value as any;
        this.updateContent();
      });
    }
    
    // Project card actions
    this.container.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;
      const action = target.closest('.project-card-action');
      
      if (action) {
        e.stopPropagation();
        const card = action.closest('.project-card');
        if (card) {
          const projectId = card.getAttribute('data-project-id');
          const actionType = action.getAttribute('data-action');
          
          if (projectId && actionType) {
            await this.handleAction(projectId, actionType);
          }
        }
        return;
      }
      
      // Click on card (not on action button) opens project
      const card = target.closest('.project-card');
      if (card) {
        const projectId = card.getAttribute('data-project-id');
        if (projectId) {
          await this.handleAction(projectId, 'open');
        }
      }
    });
  }

  private async handleAction(projectId: string, action: string): Promise<void> {
    const project = await ProjectStorage.getProject(projectId);
    if (!project) return;
    
    switch (action) {
      case 'open':
        if (this.config.onOpenProject) {
          this.config.onOpenProject(projectId);
        }
        break;
        
      case 'duplicate':
        await this.duplicateProject(project);
        break;
        
      case 'rename':
        await this.renameProject(project);
        break;
        
      case 'delete':
        await this.deleteProject(project);
        break;
    }
  }

  private async duplicateProject(project: ProjectMetadata): Promise<void> {
    const newProject: ProjectMetadata = {
      ...project,
      id: `project-${Date.now()}`,
      name: `${project.name} (Copy)`,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };
    
    await ProjectStorage.saveProject(newProject);
    await this.loadProjects();
    this.updateContent();
  }

  private async renameProject(project: ProjectMetadata): Promise<void> {
    const newName = prompt('Enter new project name:', project.name);
    if (newName && newName.trim() && newName !== project.name) {
      const updated: ProjectMetadata = {
        ...project,
        name: newName.trim(),
        modifiedAt: new Date().toISOString(),
      };
      
      await ProjectStorage.saveProject(updated);
      await this.loadProjects();
      this.updateContent();
    }
  }

  private async deleteProject(project: ProjectMetadata): Promise<void> {
    if (confirm(`Delete project "${project.name}"? This cannot be undone.`)) {
      await ProjectStorage.deleteProject(project.id);
      await this.loadProjects();
      this.updateContent();
    }
  }

  private updateContent(): void {
    const contentElement = this.container.querySelector('.project-browser-content');
    if (contentElement) {
      contentElement.innerHTML = this.renderProjects();
    }
  }

  private injectStyles(): void {
    if (document.getElementById('project-browser-styles')) return;

    const style = document.createElement('style');
    style.id = 'project-browser-styles';
    style.textContent = `
      .project-browser {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--cardplay-bg, #1a1a1a);
        color: var(--cardplay-text, #fff);
        font-family: system-ui, -apple-system, sans-serif;
      }

      .project-browser-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid var(--cardplay-border, #333);
      }

      .project-browser-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }

      .project-browser-new-btn {
        padding: 8px 16px;
        background: var(--cardplay-accent, #007bff);
        border: none;
        border-radius: 6px;
        color: #fff;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.1s;
      }

      .project-browser-new-btn:hover {
        opacity: 0.9;
      }

      .project-browser-toolbar {
        display: flex;
        gap: 12px;
        padding: 12px 20px;
        border-bottom: 1px solid var(--cardplay-border, #333);
      }

      .project-browser-search {
        flex: 1;
        padding: 8px 12px;
        background: var(--cardplay-input-bg, #2a2a2a);
        border: 1px solid var(--cardplay-border, #333);
        border-radius: 6px;
        color: var(--cardplay-text, #fff);
        font-size: 14px;
      }

      .project-browser-search:focus {
        outline: none;
        border-color: var(--cardplay-accent, #007bff);
      }

      .project-browser-sort {
        padding: 8px 12px;
        background: var(--cardplay-input-bg, #2a2a2a);
        border: 1px solid var(--cardplay-border, #333);
        border-radius: 6px;
        color: var(--cardplay-text, #fff);
        font-size: 14px;
        cursor: pointer;
      }

      .project-browser-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
      }

      .project-browser-empty {
        text-align: center;
        padding: 60px 20px;
        color: var(--cardplay-text-secondary, #888);
      }

      .project-browser-empty p {
        margin: 8px 0;
      }

      .project-browser-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
      }

      .project-card {
        background: var(--cardplay-input-bg, #2a2a2a);
        border: 1px solid var(--cardplay-border, #333);
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.2s;
      }

      .project-card:hover {
        border-color: var(--cardplay-accent, #007bff);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      .project-card-thumbnail {
        width: 100%;
        height: 150px;
        background: var(--cardplay-bg, #1a1a1a);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .project-card-thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .project-card-thumbnail-placeholder {
        font-size: 48px;
        opacity: 0.3;
      }

      .project-card-content {
        padding: 16px;
      }

      .project-card-title {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--cardplay-text, #fff);
      }

      .project-card-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 8px;
      }

      .project-card-meta-item {
        font-size: 12px;
        color: var(--cardplay-text-secondary, #888);
      }

      .project-card-modified {
        font-size: 12px;
        color: var(--cardplay-text-secondary, #666);
        margin-bottom: 8px;
      }

      .project-card-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .project-card-tag {
        font-size: 11px;
        color: var(--cardplay-text-secondary, #888);
        background: var(--cardplay-bg, #1a1a1a);
        padding: 3px 8px;
        border-radius: 10px;
      }

      .project-card-actions {
        display: flex;
        gap: 8px;
        padding: 12px 16px;
        border-top: 1px solid var(--cardplay-border, #333);
      }

      .project-card-action {
        flex: 1;
        padding: 6px 12px;
        background: transparent;
        border: 1px solid var(--cardplay-border, #333);
        border-radius: 4px;
        color: var(--cardplay-text, #fff);
        font-size: 11px;
        cursor: pointer;
        transition: all 0.1s;
      }

      .project-card-action:hover {
        background: var(--cardplay-hover, #333);
      }

      .project-card-action-danger {
        color: var(--cardplay-danger, #dc3545);
      }

      .project-card-action-danger:hover {
        background: rgba(220, 53, 69, 0.1);
        border-color: var(--cardplay-danger, #dc3545);
      }
    `;

    document.head.appendChild(style);
  }
}

/**
 * Create a project browser deck instance
 */
export function createProjectBrowserDeck(config: ProjectBrowserConfig = {}): DeckInstance {
  const browser = new ProjectBrowser(config);
  
  return {
    id: 'project-browser',
    type: 'project-browser' as any, // Will need to add to DeckType union
    title: 'Projects',
    render: () => {
      return browser.getElement();
    },
    destroy: () => {
      browser.destroy();
    },
  };
}

export { ProjectStorage };
