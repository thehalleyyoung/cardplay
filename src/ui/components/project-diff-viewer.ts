/**
 * Project Diff Viewer Component
 * 
 * Displays visual comparison of changes between two project versions.
 * Shows added, removed, and modified streams, clips, and routing.
 */

import type { ProjectDiff, StreamDiff, ClipDiff, RoutingDiff } from '../../export/project-diff';
import { generateDiffSummary } from '../../export/project-diff';

export interface DiffViewerOptions {
  readonly diff: ProjectDiff;
  readonly onClose?: () => void;
  readonly onAccept?: () => void;
  readonly onReject?: () => void;
}

export class ProjectDiffViewer {
  private element: HTMLElement;
  private options: Required<DiffViewerOptions>;
  
  constructor(options: DiffViewerOptions) {
    this.options = {
      onClose: () => {},
      onAccept: () => {},
      onReject: () => {},
      ...options
    };
    
    this.element = this.createElement();
  }
  
  private createElement(): HTMLElement {
    const viewer = document.createElement('div');
    viewer.className = 'diff-viewer';
    viewer.setAttribute('role', 'dialog');
    viewer.setAttribute('aria-labelledby', 'diff-viewer-title');
    
    viewer.innerHTML = `
      <div class="diff-viewer__header">
        <h2 id="diff-viewer-title" class="diff-viewer__title">Project Changes</h2>
        <button
          class="diff-viewer__close"
          aria-label="Close diff viewer"
          type="button"
        >
          ×
        </button>
      </div>
      
      <div class="diff-viewer__content">
        ${this.renderSummary()}
        ${this.renderConflicts()}
        ${this.renderStreamDiffs()}
        ${this.renderClipDiffs()}
        ${this.renderRoutingDiffs()}
      </div>
      
      ${this.renderActions()}
    `;
    
    this.wireUpEventHandlers(viewer);
    
    return viewer;
  }
  
  private wireUpEventHandlers(viewer: HTMLElement): void {
    const closeBtn = viewer.querySelector('.diff-viewer__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.options.onClose());
    }
    
    const acceptBtn = viewer.querySelector('.diff-viewer__accept');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', () => this.options.onAccept());
    }
    
    const rejectBtn = viewer.querySelector('.diff-viewer__reject');
    if (rejectBtn) {
      rejectBtn.addEventListener('click', () => this.options.onReject());
    }
  }
  
  private renderSummary(): string {
    const summary = generateDiffSummary(this.options.diff);
    
    return `
      <section class="diff-viewer__section diff-viewer__summary">
        <h3 class="diff-viewer__section-title">Summary</h3>
        <div class="diff-viewer__summary-grid">
          <div class="diff-viewer__summary-stat">
            <div class="diff-viewer__summary-value">${summary.totalChanges}</div>
            <div class="diff-viewer__summary-label">Total Changes</div>
          </div>
          
          <div class="diff-viewer__summary-stat">
            <div class="diff-viewer__summary-value diff-viewer__summary-value--added">
              +${summary.streamChanges.added + summary.clipChanges.added + summary.routingChanges.added}
            </div>
            <div class="diff-viewer__summary-label">Added</div>
          </div>
          
          <div class="diff-viewer__summary-stat">
            <div class="diff-viewer__summary-value diff-viewer__summary-value--removed">
              -${summary.streamChanges.removed + summary.clipChanges.removed + summary.routingChanges.removed}
            </div>
            <div class="diff-viewer__summary-label">Removed</div>
          </div>
          
          <div class="diff-viewer__summary-stat">
            <div class="diff-viewer__summary-value diff-viewer__summary-value--modified">
              ~${summary.streamChanges.modified + summary.clipChanges.modified + summary.routingChanges.modified}
            </div>
            <div class="diff-viewer__summary-label">Modified</div>
          </div>
        </div>
      </section>
    `;
  }
  
  private renderConflicts(): string {
    const { diff } = this.options;
    
    if (!diff.hasConflicts || diff.conflicts.length === 0) {
      return '';
    }
    
    const conflictItems = diff.conflicts
      .map(conflict => `
        <div class="diff-viewer__conflict-item">
          <div class="diff-viewer__conflict-icon">⚠️</div>
          <div class="diff-viewer__conflict-content">
            <div class="diff-viewer__conflict-type">${conflict.type}</div>
            <div class="diff-viewer__conflict-description">
              ${this.escapeHtml(conflict.description)}
            </div>
          </div>
        </div>
      `)
      .join('');
    
    return `
      <section class="diff-viewer__section diff-viewer__conflicts">
        <h3 class="diff-viewer__section-title diff-viewer__section-title--warning">
          ⚠️ Merge Conflicts (${diff.conflicts.length})
        </h3>
        <div class="diff-viewer__conflict-list">
          ${conflictItems}
        </div>
      </section>
    `;
  }
  
  private renderStreamDiffs(): string {
    const { diff } = this.options;
    
    if (diff.streamDiffs.length === 0) {
      return '';
    }
    
    const items = diff.streamDiffs
      .map(streamDiff => this.renderStreamDiff(streamDiff))
      .join('');
    
    return `
      <section class="diff-viewer__section">
        <h3 class="diff-viewer__section-title">Stream Changes (${diff.streamDiffs.length})</h3>
        <div class="diff-viewer__change-list">
          ${items}
        </div>
      </section>
    `;
  }
  
  private renderStreamDiff(streamDiff: StreamDiff): string {
    const changeClass = `diff-viewer__change-item--${streamDiff.changeType}`;
    const changeIcon = this.getChangeIcon(streamDiff.changeType);
    
    const name = streamDiff.newStream?.name || streamDiff.oldStream?.name || 'Unknown';
    
    let details = '';
    if (streamDiff.changeType === 'modified' && streamDiff.eventChanges) {
      const ec = streamDiff.eventChanges;
      details = `
        <div class="diff-viewer__change-details">
          ${ec.added > 0 ? `<span class="diff-viewer__change-detail diff-viewer__change-detail--added">+${ec.added} events</span>` : ''}
          ${ec.removed > 0 ? `<span class="diff-viewer__change-detail diff-viewer__change-detail--removed">-${ec.removed} events</span>` : ''}
        </div>
      `;
    }
    
    return `
      <div class="diff-viewer__change-item ${changeClass}">
        <div class="diff-viewer__change-icon">${changeIcon}</div>
        <div class="diff-viewer__change-content">
          <div class="diff-viewer__change-type">Stream ${streamDiff.changeType}</div>
          <div class="diff-viewer__change-name">${this.escapeHtml(name)}</div>
          ${details}
        </div>
      </div>
    `;
  }
  
  private renderClipDiffs(): string {
    const { diff } = this.options;
    
    if (diff.clipDiffs.length === 0) {
      return '';
    }
    
    const items = diff.clipDiffs
      .map(clipDiff => this.renderClipDiff(clipDiff))
      .join('');
    
    return `
      <section class="diff-viewer__section">
        <h3 class="diff-viewer__section-title">Clip Changes (${diff.clipDiffs.length})</h3>
        <div class="diff-viewer__change-list">
          ${items}
        </div>
      </section>
    `;
  }
  
  private renderClipDiff(clipDiff: ClipDiff): string {
    const changeClass = `diff-viewer__change-item--${clipDiff.changeType}`;
    const changeIcon = this.getChangeIcon(clipDiff.changeType);
    
    const name = clipDiff.newClip?.name || clipDiff.oldClip?.name || 'Unknown';
    
    let details = '';
    if (clipDiff.changeType === 'modified' && clipDiff.changes && clipDiff.changes.length > 0) {
      details = `
        <div class="diff-viewer__change-details">
          <span class="diff-viewer__change-detail">
            Modified: ${clipDiff.changes.join(', ')}
          </span>
        </div>
      `;
    }
    
    return `
      <div class="diff-viewer__change-item ${changeClass}">
        <div class="diff-viewer__change-icon">${changeIcon}</div>
        <div class="diff-viewer__change-content">
          <div class="diff-viewer__change-type">Clip ${clipDiff.changeType}</div>
          <div class="diff-viewer__change-name">${this.escapeHtml(name)}</div>
          ${details}
        </div>
      </div>
    `;
  }
  
  private renderRoutingDiffs(): string {
    const { diff } = this.options;
    
    if (diff.routingDiffs.length === 0) {
      return '';
    }
    
    const items = diff.routingDiffs
      .map(routingDiff => this.renderRoutingDiff(routingDiff))
      .join('');
    
    return `
      <section class="diff-viewer__section">
        <h3 class="diff-viewer__section-title">Routing Changes (${diff.routingDiffs.length})</h3>
        <div class="diff-viewer__change-list">
          ${items}
        </div>
      </section>
    `;
  }
  
  private renderRoutingDiff(routingDiff: RoutingDiff): string {
    const changeClass = `diff-viewer__change-item--${routingDiff.changeType}`;
    const changeIcon = this.getChangeIcon(routingDiff.changeType);
    
    const route = routingDiff.newRoute || routingDiff.oldRoute;
    if (!route) return '';
    
    return `
      <div class="diff-viewer__change-item ${changeClass}">
        <div class="diff-viewer__change-icon">${changeIcon}</div>
        <div class="diff-viewer__change-content">
          <div class="diff-viewer__change-type">Route ${routingDiff.changeType}</div>
          <div class="diff-viewer__change-name">
            ${this.escapeHtml(route.sourceId)} → ${this.escapeHtml(route.targetId)}
          </div>
          <div class="diff-viewer__change-details">
            <span class="diff-viewer__change-detail">${route.type}</span>
          </div>
        </div>
      </div>
    `;
  }
  
  private renderActions(): string {
    const { diff } = this.options;
    
    return `
      <div class="diff-viewer__actions">
        ${diff.hasConflicts ? `
          <div class="diff-viewer__conflict-warning">
            ⚠️ This merge has conflicts that need resolution
          </div>
        ` : ''}
        <button class="diff-viewer__reject" type="button">
          Reject Changes
        </button>
        <button 
          class="diff-viewer__accept" 
          type="button"
          ${diff.hasConflicts ? 'disabled' : ''}
        >
          Accept Changes
        </button>
      </div>
    `;
  }
  
  private getChangeIcon(changeType: 'added' | 'removed' | 'modified'): string {
    switch (changeType) {
      case 'added':
        return '+';
      case 'removed':
        return '−';
      case 'modified':
        return '~';
    }
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
 * CSS styles for the diff viewer
 */
export const diffViewerStyles = `
.diff-viewer {
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  max-width: 900px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.diff-viewer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.diff-viewer__title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  margin: 0;
}

.diff-viewer__close {
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

.diff-viewer__close:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.diff-viewer__content {
  overflow-y: auto;
  padding: var(--spacing-lg);
  flex: 1;
}

.diff-viewer__section {
  margin-bottom: var(--spacing-xl);
}

.diff-viewer__section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-text-primary);
}

.diff-viewer__section-title--warning {
  color: var(--color-warning);
}

.diff-viewer__summary {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
}

.diff-viewer__summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-md);
}

.diff-viewer__summary-stat {
  text-align: center;
}

.diff-viewer__summary-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-xs);
  color: var(--color-text-primary);
}

.diff-viewer__summary-value--added {
  color: var(--color-success);
}

.diff-viewer__summary-value--removed {
  color: var(--color-error);
}

.diff-viewer__summary-value--modified {
  color: var(--color-warning);
}

.diff-viewer__summary-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.diff-viewer__conflicts {
  background: var(--color-bg-warning, #fff3cd);
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
}

.diff-viewer__conflict-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.diff-viewer__conflict-item {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-primary);
  border-radius: var(--radius-sm);
}

.diff-viewer__conflict-icon {
  font-size: var(--font-size-xl);
  flex-shrink: 0;
}

.diff-viewer__conflict-content {
  flex: 1;
}

.diff-viewer__conflict-type {
  font-weight: var(--font-weight-semibold);
  color: var(--color-warning);
  text-transform: uppercase;
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-xs);
}

.diff-viewer__conflict-description {
  color: var(--color-text-primary);
}

.diff-viewer__change-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.diff-viewer__change-item {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.diff-viewer__change-item--added {
  background: var(--color-bg-success, #d4edda);
  border-color: var(--color-success);
}

.diff-viewer__change-item--removed {
  background: var(--color-bg-error, #f8d7da);
  border-color: var(--color-error);
}

.diff-viewer__change-item--modified {
  background: var(--color-bg-warning, #fff3cd);
  border-color: var(--color-warning);
}

.diff-viewer__change-icon {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.diff-viewer__change-content {
  flex: 1;
  min-width: 0;
}

.diff-viewer__change-type {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.diff-viewer__change-name {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: var(--spacing-xs);
}

.diff-viewer__change-details {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.diff-viewer__change-detail {
  font-size: var(--font-size-sm);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
}

.diff-viewer__change-detail--added {
  background: var(--color-bg-success, #d4edda);
  color: var(--color-success);
}

.diff-viewer__change-detail--removed {
  background: var(--color-bg-error, #f8d7da);
  color: var(--color-error);
}

.diff-viewer__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.diff-viewer__conflict-warning {
  flex: 1;
  color: var(--color-warning);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
}

.diff-viewer__reject,
.diff-viewer__accept {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.diff-viewer__reject {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
}

.diff-viewer__reject:hover {
  background: var(--color-bg-hover);
}

.diff-viewer__accept {
  background: var(--color-primary);
  border: 1px solid var(--color-primary);
  color: white;
}

.diff-viewer__accept:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.diff-viewer__accept:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`;
