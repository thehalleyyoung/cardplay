/**
 * Credits Panel Component
 * 
 * Displays collaboration metadata: contributors, roles, and project changelog.
 * Shows proper attribution for collaborative projects.
 */

import type { CollaborationMetadata, Contributor, ChangelogEntry, ChangeType } from '../../export/collaboration-metadata';
import { generateCollaborationSummary } from '../../export/collaboration-metadata';

export interface CreditsPanelOptions {
  readonly metadata: CollaborationMetadata;
  readonly showChangelog?: boolean;
  readonly showStatistics?: boolean;
  readonly changelogLimit?: number;
  readonly onClose?: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  'composer': '🎵 Composer',
  'arranger': '🎼 Arranger',
  'mixer': '🎚️ Mixer',
  'producer': '🎛️ Producer',
  'sound-designer': '🔊 Sound Designer',
  'performer': '🎹 Performer',
  'editor': '✏️ Editor',
  'reviewer': '👁️ Reviewer'
};

const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  'composition': '🎵 Composition',
  'arrangement': '🎼 Arrangement',
  'mixing': '🎚️ Mixing',
  'routing': '🔀 Routing',
  'effects': '✨ Effects',
  'instruments': '🎹 Instruments',
  'automation': '🤖 Automation',
  'structure': '🏗️ Structure'
};

export class CreditsPanel {
  private element: HTMLElement;
  private options: Required<CreditsPanelOptions>;
  
  constructor(options: CreditsPanelOptions) {
    this.options = {
      showChangelog: true,
      showStatistics: true,
      changelogLimit: 20,
      onClose: () => {},
      ...options
    };
    
    this.element = this.createElement();
  }
  
  private createElement(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'credits-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', 'credits-panel-title');
    
    panel.innerHTML = `
      <div class="credits-panel__header">
        <h2 id="credits-panel-title" class="credits-panel__title">Project Credits</h2>
        <button
          class="credits-panel__close"
          aria-label="Close credits panel"
          type="button"
        >
          ×
        </button>
      </div>
      
      <div class="credits-panel__content">
        ${this.renderProjectInfo()}
        ${this.renderContributors()}
        ${this.options.showStatistics ? this.renderStatistics() : ''}
        ${this.options.showChangelog ? this.renderChangelog() : ''}
      </div>
    `;
    
    // Wire up close button
    const closeBtn = panel.querySelector('.credits-panel__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.options.onClose());
    }
    
    return panel;
  }
  
  private renderProjectInfo(): string {
    const { metadata } = this.options;
    const createdDate = new Date(metadata.createdAt).toLocaleDateString();
    const modifiedDate = new Date(metadata.lastModifiedAt).toLocaleDateString();
    
    return `
      <section class="credits-panel__section">
        <h3 class="credits-panel__section-title">Project Information</h3>
        <dl class="credits-panel__info-list">
          <dt>Project Name:</dt>
          <dd>${this.escapeHtml(metadata.projectName)}</dd>
          
          <dt>Created:</dt>
          <dd>${createdDate}</dd>
          
          <dt>Last Modified:</dt>
          <dd>${modifiedDate}</dd>
          
          <dt>Contributors:</dt>
          <dd>${metadata.contributors.length} ${metadata.contributors.length === 1 ? 'person' : 'people'}</dd>
        </dl>
      </section>
    `;
  }
  
  private renderContributors(): string {
    const { metadata } = this.options;
    
    const contributorCards = metadata.contributors
      .map(contributor => this.renderContributor(contributor))
      .join('');
    
    return `
      <section class="credits-panel__section">
        <h3 class="credits-panel__section-title">Contributors</h3>
        <div class="credits-panel__contributors">
          ${contributorCards}
        </div>
      </section>
    `;
  }
  
  private renderContributor(contributor: Contributor): string {
    const roleLabel = ROLE_LABELS[contributor.role] || contributor.role;
    const joinedDate = new Date(contributor.joinedAt).toLocaleDateString();
    const lastActive = new Date(contributor.lastActiveAt).toLocaleDateString();
    
    return `
      <div class="credits-panel__contributor-card">
        <div class="credits-panel__contributor-header">
          <div class="credits-panel__contributor-avatar">
            ${this.getInitials(contributor.name)}
          </div>
          <div class="credits-panel__contributor-info">
            <div class="credits-panel__contributor-name">
              ${this.escapeHtml(contributor.name)}
            </div>
            <div class="credits-panel__contributor-role">
              ${roleLabel}
            </div>
          </div>
        </div>
        <div class="credits-panel__contributor-meta">
          <div>Joined: ${joinedDate}</div>
          <div>Last active: ${lastActive}</div>
          ${contributor.email ? `<div>Email: ${this.escapeHtml(contributor.email)}</div>` : ''}
        </div>
      </div>
    `;
  }
  
  private renderStatistics(): string {
    const summary = generateCollaborationSummary(this.options.metadata);
    
    const changeTypeStats = Object.entries(summary.changesByType)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => {
        const label = CHANGE_TYPE_LABELS[type as ChangeType] || type;
        return `<div class="credits-panel__stat-item">${label}: ${count}</div>`;
      })
      .join('');
    
    const timeSpanDays = Math.floor(summary.timespan / (1000 * 60 * 60 * 24));
    
    return `
      <section class="credits-panel__section">
        <h3 class="credits-panel__section-title">Statistics</h3>
        <div class="credits-panel__statistics">
          <div class="credits-panel__stat-card">
            <div class="credits-panel__stat-value">${summary.totalChanges}</div>
            <div class="credits-panel__stat-label">Total Changes</div>
          </div>
          
          <div class="credits-panel__stat-card">
            <div class="credits-panel__stat-value">${timeSpanDays}</div>
            <div class="credits-panel__stat-label">Days Active</div>
          </div>
          
          ${summary.mostActiveContributor ? `
            <div class="credits-panel__stat-card">
              <div class="credits-panel__stat-value">
                ${this.escapeHtml(summary.mostActiveContributor.name)}
              </div>
              <div class="credits-panel__stat-label">Most Active</div>
            </div>
          ` : ''}
        </div>
        
        ${changeTypeStats ? `
          <div class="credits-panel__change-types">
            <h4>Changes by Type</h4>
            ${changeTypeStats}
          </div>
        ` : ''}
      </section>
    `;
  }
  
  private renderChangelog(): string {
    const { metadata, changelogLimit } = this.options;
    
    if (metadata.changelog.length === 0) {
      return `
        <section class="credits-panel__section">
          <h3 class="credits-panel__section-title">Changelog</h3>
          <p class="credits-panel__empty-state">No changes recorded yet.</p>
        </section>
      `;
    }
    
    const entries = [...metadata.changelog]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, changelogLimit)
      .map(entry => this.renderChangelogEntry(entry))
      .join('');
    
    return `
      <section class="credits-panel__section">
        <h3 class="credits-panel__section-title">
          Recent Changes
          ${metadata.changelog.length > changelogLimit ? 
            `<span class="credits-panel__section-subtitle">(showing ${changelogLimit} of ${metadata.changelog.length})</span>` : ''}
        </h3>
        <div class="credits-panel__changelog">
          ${entries}
        </div>
      </section>
    `;
  }
  
  private renderChangelogEntry(entry: ChangelogEntry): string {
    const contributor = this.options.metadata.contributors.find(
      c => c.id === entry.contributorId
    );
    const contributorName = contributor?.name || 'Unknown';
    const typeLabel = CHANGE_TYPE_LABELS[entry.type] || entry.type;
    const date = new Date(entry.timestamp).toLocaleString();
    
    return `
      <div class="credits-panel__changelog-entry">
        <div class="credits-panel__changelog-header">
          <span class="credits-panel__changelog-type">${typeLabel}</span>
          <span class="credits-panel__changelog-contributor">
            ${this.escapeHtml(contributorName)}
          </span>
          <span class="credits-panel__changelog-date">${date}</span>
        </div>
        <div class="credits-panel__changelog-description">
          ${this.escapeHtml(entry.description)}
        </div>
        ${this.renderAffectedItems(entry)}
      </div>
    `;
  }
  
  private renderAffectedItems(entry: ChangelogEntry): string {
    const items: string[] = [];
    
    if (entry.affectedStreams && entry.affectedStreams.length > 0) {
      items.push(`Streams: ${entry.affectedStreams.length}`);
    }
    
    if (entry.affectedClips && entry.affectedClips.length > 0) {
      items.push(`Clips: ${entry.affectedClips.length}`);
    }
    
    if (entry.affectedDecks && entry.affectedDecks.length > 0) {
      items.push(`Decks: ${entry.affectedDecks.length}`);
    }
    
    if (items.length === 0) return '';
    
    return `
      <div class="credits-panel__changelog-affected">
        ${items.join(' • ')}
      </div>
    `;
  }
  
  private getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }
  
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  public getElement(): HTMLElement {
    return this.element;
  }
  
  public mount(container: HTMLElement): void {
    container.appendChild(this.element);
  }
  
  public unmount(): void {
    this.element.remove();
  }
  
  public destroy(): void {
    this.unmount();
  }
}

/**
 * CSS styles for the credits panel
 */
export const creditsPanelStyles = `
.credits-panel {
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.credits-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.credits-panel__title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  margin: 0;
}

.credits-panel__close {
  background: none;
  border: none;
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  padding: var(--spacing-xs);
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.credits-panel__close:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.credits-panel__content {
  overflow-y: auto;
  padding: var(--spacing-lg);
}

.credits-panel__section {
  margin-bottom: var(--spacing-xl);
}

.credits-panel__section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-text-primary);
}

.credits-panel__section-subtitle {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-normal);
  color: var(--color-text-tertiary);
  margin-left: var(--spacing-sm);
}

.credits-panel__info-list {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--spacing-sm) var(--spacing-md);
}

.credits-panel__info-list dt {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.credits-panel__info-list dd {
  margin: 0;
  color: var(--color-text-primary);
}

.credits-panel__contributors {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-md);
}

.credits-panel__contributor-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

.credits-panel__contributor-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.credits-panel__contributor-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-lg);
  flex-shrink: 0;
}

.credits-panel__contributor-info {
  flex: 1;
  min-width: 0;
}

.credits-panel__contributor-name {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.credits-panel__contributor-role {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.credits-panel__contributor-meta {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  line-height: 1.6;
}

.credits-panel__statistics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.credits-panel__stat-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  text-align: center;
}

.credits-panel__stat-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-xs);
}

.credits-panel__stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.credits-panel__change-types {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

.credits-panel__change-types h4 {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
}

.credits-panel__stat-item {
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-primary);
}

.credits-panel__stat-item:last-child {
  border-bottom: none;
}

.credits-panel__empty-state {
  color: var(--color-text-tertiary);
  text-align: center;
  padding: var(--spacing-xl);
  font-style: italic;
}

.credits-panel__changelog {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.credits-panel__changelog-entry {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

.credits-panel__changelog-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  flex-wrap: wrap;
}

.credits-panel__changelog-type {
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}

.credits-panel__changelog-contributor {
  color: var(--color-text-secondary);
}

.credits-panel__changelog-date {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  margin-left: auto;
}

.credits-panel__changelog-description {
  color: var(--color-text-primary);
  line-height: 1.6;
  margin-bottom: var(--spacing-xs);
}

.credits-panel__changelog-affected {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}
`;
