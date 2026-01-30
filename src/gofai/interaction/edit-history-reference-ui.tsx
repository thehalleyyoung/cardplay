/**
 * @file Edit History Reference UI
 * @module gofai/interaction/edit-history-reference-ui
 * 
 * Implements Step 348: Add UI affordances for referencing history
 * ("undo the chorus lift change") by clicking on a past turn.
 * 
 * This component provides:
 * 1. A visual timeline of edit history
 * 2. Click-to-reference affordances for past edits
 * 3. Visual indicators for undone/redone edits
 * 4. Hover previews showing what changed
 * 5. Integration with natural language input ("undo that")
 * 
 * Design principles:
 * - Edits are displayed in chronological order (most recent first)
 * - Clicking an edit generates a reference to it
 * - Undone edits are visually distinguished
 * - Each edit shows scope, axis, and summary
 * - Hovering shows detailed diff information
 * 
 * @see gofai_goalB.md Step 348
 */

import React, { useState, useCallback, useMemo } from 'react';
import type {
  DiscourseState,
  EditHistoryReferent,
  ReferentId,
} from '../pragmatics/discourse-model.js';
import type { EditPackage } from '../execution/edit-package.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Props for EditHistoryReferenceUI component.
 */
export interface EditHistoryReferenceUIProps {
  /** Current discourse state */
  readonly discourseState: DiscourseState;

  /** Map from edit package IDs to full packages (for details) */
  readonly editPackages: ReadonlyMap<string, EditPackage>;

  /** Callback when user clicks to reference an edit */
  readonly onEditReferenced?: (editId: string, referenceType: EditReferenceType) => void;

  /** Callback when user hovers over an edit */
  readonly onEditHovered?: (editId: string | undefined) => void;

  /** Currently hovered edit ID (for external coordination) */
  readonly hoveredEditId?: string;

  /** Maximum number of edits to show */
  readonly maxEdits?: number;

  /** Whether to show undone edits */
  readonly showUndonEdits?: boolean;

  /** Compact mode (smaller UI) */
  readonly compact?: boolean;

  /** CSS class name */
  readonly className?: string;
}

/**
 * Types of edit references users can create.
 */
export type EditReferenceType =
  | 'undo'       // "Undo that edit"
  | 'redo'       // "Redo that edit"
  | 'repeat'     // "Do that again"
  | 'modify'     // "Do that but bigger"
  | 'inspect'    // "What changed?"
  | 'reference'; // Just insert a reference

/**
 * Processed edit entry for display.
 */
interface EditHistoryEntry {
  readonly editId: string;
  readonly turnNumber: number;
  readonly summary: string;
  readonly scope: string;
  readonly axis: string | undefined;
  readonly direction: string | undefined;
  readonly isUndone: boolean;
  readonly layerCount: number;
  readonly changeCount: number;
}

// ============================================================================
// Component
// ============================================================================

/**
 * EditHistoryReferenceUI: Visual timeline of edit history with click-to-reference.
 */
export const EditHistoryReferenceUI: React.FC<EditHistoryReferenceUIProps> = ({
  discourseState,
  editPackages,
  onEditReferenced,
  onEditHovered,
  hoveredEditId,
  maxEdits = 20,
  showUndonEdits = true,
  compact = false,
  className = '',
}) => {
  const [selectedEditId, setSelectedEditId] = useState<string | undefined>();

  // Process edit history into display entries
  const entries = useMemo(() => {
    let history = discourseState.editHistory;

    // Filter undone edits if requested
    if (!showUndonEdits) {
      history = history.filter(e => !e.summary.startsWith('[UNDONE]'));
    }

    // Sort by turn (most recent first)
    const sorted = [...history].sort((a, b) => b.turnNumber - a.turnNumber);

    // Limit count
    const limited = sorted.slice(0, maxEdits);

    // Convert to display entries
    return limited.map(e => processEditEntry(e, editPackages));
  }, [discourseState.editHistory, editPackages, maxEdits, showUndonEdits]);

  // Handle edit click
  const handleEditClick = useCallback((editId: string) => {
    setSelectedEditId(editId);
  }, []);

  // Handle reference action
  const handleReferenceAction = useCallback((editId: string, refType: EditReferenceType) => {
    if (onEditReferenced) {
      onEditReferenced(editId, refType);
    }
    setSelectedEditId(undefined);
  }, [onEditReferenced]);

  // Handle hover
  const handleEditHover = useCallback((editId: string | undefined) => {
    if (onEditHovered) {
      onEditHovered(editId);
    }
  }, [onEditHovered]);

  if (entries.length === 0) {
    return (
      <div className={`edit-history-reference-ui empty ${className}`}>
        <div className="empty-message">
          No edit history yet
        </div>
      </div>
    );
  }

  return (
    <div className={`edit-history-reference-ui ${compact ? 'compact' : ''} ${className}`}>
      <div className="edit-history-header">
        <h3>Edit History</h3>
        <div className="edit-history-subtitle">
          Click an edit to reference it in your next instruction
        </div>
      </div>

      <div className="edit-history-timeline">
        {entries.map((entry) => (
          <EditHistoryEntryItem
            key={entry.editId}
            entry={entry}
            selected={entry.editId === selectedEditId}
            hovered={entry.editId === hoveredEditId}
            compact={compact}
            onClick={() => handleEditClick(entry.editId)}
            onHover={() => handleEditHover(entry.editId)}
            onHoverEnd={() => handleEditHover(undefined)}
            onReferenceAction={(refType) => handleReferenceAction(entry.editId, refType)}
          />
        ))}
      </div>

      {selectedEditId && (
        <EditReferenceActionMenu
          editId={selectedEditId}
          entry={entries.find(e => e.editId === selectedEditId)!}
          onAction={(refType) => handleReferenceAction(selectedEditId, refType)}
          onCancel={() => setSelectedEditId(undefined)}
        />
      )}
    </div>
  );
};

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Props for EditHistoryEntryItem.
 */
interface EditHistoryEntryItemProps {
  readonly entry: EditHistoryEntry;
  readonly selected: boolean;
  readonly hovered: boolean;
  readonly compact: boolean;
  readonly onClick: () => void;
  readonly onHover: () => void;
  readonly onHoverEnd: () => void;
  readonly onReferenceAction: (refType: EditReferenceType) => void;
}

/**
 * Individual edit history entry.
 */
const EditHistoryEntryItem: React.FC<EditHistoryEntryItemProps> = ({
  entry,
  selected,
  hovered,
  compact,
  onClick,
  onHover,
  onHoverEnd,
  onReferenceAction,
}) => {
  const handleQuickAction = useCallback((e: React.MouseEvent, refType: EditReferenceType) => {
    e.stopPropagation();
    onReferenceAction(refType);
  }, [onReferenceAction]);

  return (
    <div
      className={`edit-history-entry ${selected ? 'selected' : ''} ${hovered ? 'hovered' : ''} ${entry.isUndone ? 'undone' : ''}`}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
    >
      <div className="entry-turn">
        Turn {entry.turnNumber}
      </div>

      <div className="entry-content">
        <div className="entry-summary">
          {entry.isUndone && <span className="undone-badge">[UNDONE]</span>}
          {entry.summary}
        </div>

        {!compact && (
          <div className="entry-details">
            <span className="entry-scope">{entry.scope}</span>
            {entry.axis && (
              <>
                <span className="entry-separator">•</span>
                <span className="entry-axis">
                  {entry.direction} {entry.axis}
                </span>
              </>
            )}
            <span className="entry-separator">•</span>
            <span className="entry-stats">
              {entry.layerCount} layer{entry.layerCount !== 1 ? 's' : ''}, {entry.changeCount} change{entry.changeCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {!entry.isUndone && (
        <div className="entry-actions">
          <button
            className="quick-action-btn undo-btn"
            onClick={(e) => handleQuickAction(e, 'undo')}
            title="Undo this edit"
          >
            ↶
          </button>
          <button
            className="quick-action-btn repeat-btn"
            onClick={(e) => handleQuickAction(e, 'repeat')}
            title="Repeat this edit"
          >
            ⟲
          </button>
          <button
            className="quick-action-btn inspect-btn"
            onClick={(e) => handleQuickAction(e, 'inspect')}
            title="Show what changed"
          >
            👁
          </button>
        </div>
      )}

      {entry.isUndone && (
        <div className="entry-actions">
          <button
            className="quick-action-btn redo-btn"
            onClick={(e) => handleQuickAction(e, 'redo')}
            title="Redo this edit"
          >
            ↷
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Props for EditReferenceActionMenu.
 */
interface EditReferenceActionMenuProps {
  readonly editId: string;
  readonly entry: EditHistoryEntry;
  readonly onAction: (refType: EditReferenceType) => void;
  readonly onCancel: () => void;
}

/**
 * Menu for choosing how to reference an edit.
 */
const EditReferenceActionMenu: React.FC<EditReferenceActionMenuProps> = ({
  editId,
  entry,
  onAction,
  onCancel,
}) => {
  return (
    <div className="edit-reference-action-menu">
      <div className="menu-header">
        <h4>Reference This Edit</h4>
        <button className="close-btn" onClick={onCancel}>
          ✕
        </button>
      </div>

      <div className="menu-content">
        <div className="selected-edit-summary">
          {entry.summary}
        </div>

        <div className="action-buttons">
          {!entry.isUndone && (
            <>
              <button
                className="action-btn undo-action"
                onClick={() => onAction('undo')}
              >
                <span className="action-icon">↶</span>
                <span className="action-label">Undo This</span>
                <span className="action-example">"Undo that edit"</span>
              </button>

              <button
                className="action-btn repeat-action"
                onClick={() => onAction('repeat')}
              >
                <span className="action-icon">⟲</span>
                <span className="action-label">Repeat This</span>
                <span className="action-example">"Do that again"</span>
              </button>

              <button
                className="action-btn modify-action"
                onClick={() => onAction('modify')}
              >
                <span className="action-icon">⚙</span>
                <span className="action-label">Modify & Repeat</span>
                <span className="action-example">"Do that but bigger"</span>
              </button>

              <button
                className="action-btn inspect-action"
                onClick={() => onAction('inspect')}
              >
                <span className="action-icon">👁</span>
                <span className="action-label">Show Changes</span>
                <span className="action-example">"What changed?"</span>
              </button>
            </>
          )}

          {entry.isUndone && (
            <button
              className="action-btn redo-action"
              onClick={() => onAction('redo')}
            >
              <span className="action-icon">↷</span>
              <span className="action-label">Redo This</span>
              <span className="action-example">"Redo that edit"</span>
            </button>
          )}

          <button
            className="action-btn reference-action"
            onClick={() => onAction('reference')}
          >
            <span className="action-icon">🔗</span>
            <span className="action-label">Insert Reference</span>
            <span className="action-example">Add to input: "that edit"</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Process edit history entry into display format.
 */
function processEditEntry(
  entry: EditHistoryReferent,
  editPackages: ReadonlyMap<string, EditPackage>
): EditHistoryEntry {
  const pkg = editPackages.get(entry.editPackageId);

  return {
    editId: entry.editPackageId,
    turnNumber: entry.turnNumber,
    summary: entry.summary.replace('[UNDONE] ', ''),
    scope: formatScope(entry),
    axis: entry.axis,
    direction: entry.direction,
    isUndone: entry.summary.startsWith('[UNDONE]'),
    layerCount: entry.layersTouched.length,
    changeCount: pkg?.diff.changes.length || 0,
  };
}

/**
 * Format scope for display.
 */
function formatScope(entry: EditHistoryReferent): string {
  // TODO: Look up scope referent and format properly
  // For now, just show layer count
  if (entry.layersTouched.length === 1) {
    return '1 layer';
  } else if (entry.layersTouched.length > 1) {
    return `${entry.layersTouched.length} layers`;
  } else {
    return 'entire project';
  }
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook for integrating edit history references with natural language input.
 * 
 * This hook manages the state needed to let users click an edit and have it
 * inserted into their natural language command.
 */
export function useEditHistoryReference(
  discourseState: DiscourseState,
  onReferenceCreated: (reference: EditReference) => void
) {
  const [referencedEditId, setReferencedEditId] = useState<string | undefined>();
  const [referenceType, setReferenceType] = useState<EditReferenceType>('reference');

  const handleEditReferenced = useCallback(
    (editId: string, refType: EditReferenceType) => {
      setReferencedEditId(editId);
      setReferenceType(refType);

      // Generate natural language reference
      const reference = generateEditReference(editId, refType, discourseState);
      onReferenceCreated(reference);
    },
    [discourseState, onReferenceCreated]
  );

  const clearReference = useCallback(() => {
    setReferencedEditId(undefined);
  }, []);

  return {
    referencedEditId,
    referenceType,
    handleEditReferenced,
    clearReference,
  };
}

/**
 * An edit reference to insert into natural language.
 */
export interface EditReference {
  readonly editId: string;
  readonly referenceType: EditReferenceType;
  readonly naturalLanguageText: string;
  readonly fullCommand: string | undefined;
}

/**
 * Generate a natural language reference to an edit.
 */
function generateEditReference(
  editId: string,
  refType: EditReferenceType,
  discourseState: DiscourseState
): EditReference {
  const entry = discourseState.editHistory.find(e => e.editPackageId === editId);
  if (!entry) {
    return {
      editId,
      referenceType: refType,
      naturalLanguageText: 'that edit',
      fullCommand: undefined,
    };
  }

  let naturalLanguageText = 'that';
  let fullCommand: string | undefined;

  switch (refType) {
    case 'undo':
      naturalLanguageText = 'that edit';
      fullCommand = 'Undo that edit';
      break;

    case 'redo':
      naturalLanguageText = 'that edit';
      fullCommand = 'Redo that edit';
      break;

    case 'repeat':
      naturalLanguageText = 'that';
      fullCommand = 'Do that again';
      break;

    case 'modify':
      naturalLanguageText = 'that';
      fullCommand = 'Do that but '; // User will complete
      break;

    case 'inspect':
      naturalLanguageText = 'that edit';
      fullCommand = 'What changed in that edit?';
      break;

    case 'reference':
      naturalLanguageText = 'that edit';
      fullCommand = undefined;
      break;
  }

  return {
    editId,
    referenceType: refType,
    naturalLanguageText,
    fullCommand,
  };
}

// ============================================================================
// Styles (would be in separate CSS file)
// ============================================================================

/**
 * CSS for EditHistoryReferenceUI component.
 * 
 * This would typically live in a separate .css file, but is included here
 * as a string for reference.
 */
export const EDIT_HISTORY_REFERENCE_STYLES = `
.edit-history-reference-ui {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--surface-bg);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  max-height: 600px;
}

.edit-history-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.edit-history-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.edit-history-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
}

.edit-history-timeline {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  flex: 1;
}

.edit-history-entry {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--card-bg);
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.edit-history-entry:hover {
  border-color: var(--accent-color);
  background: var(--card-bg-hover);
}

.edit-history-entry.selected {
  border-color: var(--accent-color);
  background: var(--accent-bg-subtle);
}

.edit-history-entry.undone {
  opacity: 0.6;
  background: var(--error-bg-subtle);
}

.entry-turn {
  flex-shrink: 0;
  width: 60px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-align: center;
}

.entry-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.entry-summary {
  font-size: 14px;
  color: var(--text-primary);
}

.undone-badge {
  display: inline-block;
  padding: 2px 6px;
  margin-right: 6px;
  font-size: 10px;
  font-weight: 600;
  color: var(--error-text);
  background: var(--error-bg);
  border-radius: 3px;
}

.entry-details {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.entry-separator {
  color: var(--text-tertiary);
}

.entry-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.quick-action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.15s ease;
}

.quick-action-btn:hover {
  background: var(--button-bg-hover);
  border-color: var(--accent-color);
}

.edit-reference-action-menu {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  background: var(--surface-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.menu-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--text-tertiary);
}

.menu-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.selected-edit-summary {
  padding: 12px;
  background: var(--card-bg);
  border-radius: 4px;
  font-size: 13px;
  color: var(--text-secondary);
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  display: grid;
  grid-template-columns: 32px 1fr auto;
  gap: 12px;
  padding: 12px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.action-btn:hover {
  background: var(--card-bg-hover);
  border-color: var(--accent-color);
}

.action-icon {
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.action-example {
  font-size: 12px;
  color: var(--text-tertiary);
  font-style: italic;
}

.edit-history-reference-ui.compact .entry-details {
  display: none;
}

.edit-history-reference-ui.compact .edit-history-entry {
  padding: 8px;
}
`;
