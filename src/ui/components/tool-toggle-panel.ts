/**
 * @fileoverview Tool Toggle UI Component
 *
 * D055-D056: UI for toggling board tools dynamically
 * 
 * Allows runtime toggling of tool modes (dev-only initially).
 * Respects board policy to allow/disallow toggles.
 *
 * @module @cardplay/ui/components/tool-toggle-panel
 */

import { getBoardRegistry } from '../../boards/registry';
import type { Board, ToolKind, CompositionToolConfig, ToolConfig } from '../../boards/types';
import { validateToolConfig } from '../../boards/validate-tool-config';

// ============================================================================
// TYPES
// ============================================================================

/** Tool toggle options */
export interface ToolToggleOptions {
  /** Container element */
  container: HTMLElement;
  /** Board ID to show tools for */
  boardId: string;
  /** Callback when tool settings change */
  onChange?: (tool: ToolKind, config: ToolConfig<typeof tool>) => void;
  /** Show validation warnings */
  showValidation?: boolean;
}

/** Tool info for display */
interface ToolInfo {
  tool: ToolKind;
  label: string;
  description: string;
  modes: string[];
}

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

const TOOL_INFOS: Record<ToolKind, ToolInfo> = {
  phraseDatabase: {
    tool: 'phraseDatabase',
    label: 'Phrase Database',
    description: 'Browse and use pre-made musical phrases',
    modes: ['hidden', 'browse-only', 'drag-drop'],
  },
  harmonyExplorer: {
    tool: 'harmonyExplorer',
    label: 'Harmony Explorer',
    description: 'Display chord and scale information',
    modes: ['hidden', 'display-only', 'suggest'],
  },
  phraseGenerators: {
    tool: 'phraseGenerators',
    label: 'Phrase Generators',
    description: 'Generate musical phrases on demand',
    modes: ['hidden', 'on-demand', 'continuous'],
  },
  arrangerCard: {
    tool: 'arrangerCard',
    label: 'Arranger',
    description: 'Arrange sections and parts',
    modes: ['hidden', 'manual-trigger', 'chord-follow', 'autonomous'],
  },
  aiComposer: {
    tool: 'aiComposer',
    label: 'AI Composer',
    description: 'AI-assisted composition',
    modes: ['hidden', 'inline-suggest', 'command-palette'],
  },
};

// ============================================================================
// TOOL TOGGLE PANEL
// ============================================================================

/**
 * Panel for toggling tool modes
 * 
 * D055: UI for tool toggles (dev-only first)
 * D056: Toggles update persisted per-board settings
 */
export class ToolTogglePanel {
  private container: HTMLElement;
  private boardId: string;
  private board: Board | undefined;
  private onChange: ((tool: ToolKind, config: any) => void) | undefined;
  private showValidation: boolean;
  
  // DOM elements
  private toolControls: Map<ToolKind, {
    enabledCheckbox: HTMLInputElement;
    modeSelect: HTMLSelectElement;
  }> = new Map();
  
  private validationDisplay: HTMLElement | null = null;
  
  constructor(options: ToolToggleOptions) {
    this.container = options.container;
    this.boardId = options.boardId;
    this.onChange = options.onChange;
    this.showValidation = options.showValidation ?? true;
    
    this.loadBoard();
    this.render();
  }
  
  // ===========================================================================
  // BOARD LOADING
  // ===========================================================================
  
  private loadBoard(): void {
    this.board = getBoardRegistry().get(this.boardId);
  }
  
  private canToggleTools(): boolean {
    // Check board policy
    const board = this.board;
    if (!board) return false;
    
    // If board has a policy field (future enhancement), check it
    // For now, allow toggles in dev mode
    return true;
  }
  
  // ===========================================================================
  // RENDERING
  // ===========================================================================
  
  private render(): void {
    this.container.innerHTML = '';
    this.container.className = 'tool-toggle-panel';
    
    if (!this.board) {
      this.container.textContent = 'Board not found';
      return;
    }
    
    if (!this.canToggleTools()) {
      this.container.textContent = 'Tool toggles not allowed for this board';
      return;
    }
    
    // Header
    const header = document.createElement('div');
    header.className = 'tool-toggle-header';
    
    const title = document.createElement('h3');
    title.textContent = 'Tool Settings';
    header.appendChild(title);
    
    const boardLabel = document.createElement('div');
    boardLabel.className = 'board-label';
    boardLabel.textContent = `Board: ${this.board.name}`;
    header.appendChild(boardLabel);
    
    this.container.appendChild(header);
    
    // Tool controls
    const toolList = document.createElement('div');
    toolList.className = 'tool-list';
    
    Object.values(TOOL_INFOS).forEach(info => {
      const control = this.createToolControl(info);
      toolList.appendChild(control);
    });
    
    this.container.appendChild(toolList);
    
    // Validation display
    if (this.showValidation) {
      this.validationDisplay = document.createElement('div');
      this.validationDisplay.className = 'tool-validation';
      this.container.appendChild(this.validationDisplay);
      this.updateValidation();
    }
    
    // Apply styles
    this.injectStyles();
  }
  
  private createToolControl(info: ToolInfo): HTMLElement {
    const control = document.createElement('div');
    control.className = 'tool-control';
    control.dataset.tool = info.tool;
    
    const currentConfig = this.board!.compositionTools[info.tool];
    
    // Header with checkbox
    const controlHeader = document.createElement('div');
    controlHeader.className = 'tool-control-header';
    
    const enabledLabel = document.createElement('label');
    enabledLabel.className = 'tool-enabled-label';
    
    const enabledCheckbox = document.createElement('input');
    enabledCheckbox.type = 'checkbox';
    enabledCheckbox.checked = currentConfig.enabled;
    enabledCheckbox.addEventListener('change', () => {
      this.handleEnabledChange(info.tool, enabledCheckbox.checked);
    });
    
    const labelText = document.createElement('span');
    labelText.textContent = info.label;
    labelText.style.marginLeft = '8px';
    labelText.style.fontWeight = '500';
    
    enabledLabel.appendChild(enabledCheckbox);
    enabledLabel.appendChild(labelText);
    controlHeader.appendChild(enabledLabel);
    control.appendChild(controlHeader);
    
    // Description
    const description = document.createElement('div');
    description.className = 'tool-description';
    description.textContent = info.description;
    control.appendChild(description);
    
    // Mode selector
    const modeGroup = document.createElement('div');
    modeGroup.className = 'tool-mode-group';
    
    const modeLabel = document.createElement('label');
    modeLabel.textContent = 'Mode:';
    modeLabel.style.marginRight = '8px';
    modeGroup.appendChild(modeLabel);
    
    const modeSelect = document.createElement('select');
    modeSelect.className = 'tool-mode-select';
    modeSelect.disabled = !currentConfig.enabled;
    
    info.modes.forEach(mode => {
      const option = document.createElement('option');
      option.value = mode;
      option.textContent = mode;
      option.selected = currentConfig.mode === mode;
      modeSelect.appendChild(option);
    });
    
    modeSelect.addEventListener('change', () => {
      this.handleModeChange(info.tool, modeSelect.value as any);
    });
    
    modeGroup.appendChild(modeSelect);
    control.appendChild(modeGroup);
    
    // Store references
    this.toolControls.set(info.tool, { enabledCheckbox, modeSelect });
    
    return control;
  }
  
  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================
  
  private handleEnabledChange(tool: ToolKind, enabled: boolean): void {
    if (!this.board) return;
    
    const controls = this.toolControls.get(tool);
    if (!controls) return;
    
    // Update mode select disabled state
    controls.modeSelect.disabled = !enabled;
    
    // If disabling, set mode to 'hidden'
    const mode = enabled ? controls.modeSelect.value as any : 'hidden';
    
    const newConfig = { enabled, mode };
    
    // Update board with new composition tools (creating a new object)
    const newCompositionTools = {
      ...this.board.compositionTools,
      [tool]: newConfig,
    } as CompositionToolConfig;
    
    // Create updated board (in a real implementation, this would go through the store)
    this.board = { ...this.board, compositionTools: newCompositionTools };
    
    // D056: Persist per-board settings
    this.persistToolSettings();
    
    // Call onChange callback
    this.onChange?.(tool, newConfig);
    
    // Update validation
    this.updateValidation();
  }
  
  private handleModeChange(tool: ToolKind, mode: string): void {
    if (!this.board) return;
    
    const currentConfig = this.board.compositionTools[tool];
    const newConfig = { ...currentConfig, mode: mode as any };
    
    // Update board with new composition tools (creating a new object)
    const newCompositionTools = {
      ...this.board.compositionTools,
      [tool]: newConfig,
    } as CompositionToolConfig;
    
    // Create updated board (in a real implementation, this would go through the store)
    this.board = { ...this.board, compositionTools: newCompositionTools };
    
    // D056: Persist per-board settings
    this.persistToolSettings();
    
    // Call onChange callback
    this.onChange?.(tool, newConfig);
    
    // Update validation
    this.updateValidation();
  }
  
  /**
   * D056: Persist tool settings to board state store
   */
  private persistToolSettings(): void {
    if (!this.board) return;
    
    // In a real implementation, this would update the board state store
    // with the new tool configuration. For now, just log it.
    console.log('[ToolTogglePanel] Tool settings updated:', this.board.compositionTools);
    
    // TODO: Integrate with board state store
    // const store = getBoardStateStore();
    // store.setToolConfig(this.boardId, this.board.compositionTools);
  }
  
  /**
   * Update validation display
   */
  private updateValidation(): void {
    if (!this.validationDisplay || !this.board) return;
    
    try {
      validateToolConfig(this.board);
      this.validationDisplay.innerHTML = '<div class="validation-success">✓ Tool configuration valid</div>';
    } catch (error) {
      this.validationDisplay.innerHTML = `<div class="validation-error">⚠ ${(error as Error).message}</div>`;
    }
  }
  
  private injectStyles(): void {
    const styleId = 'tool-toggle-panel-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .tool-toggle-panel {
        background: #1e1e1e;
        color: #e0e0e0;
        padding: 16px;
        border-radius: 8px;
        max-width: 500px;
      }
      
      .tool-toggle-header {
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid #3e3e3e;
      }
      
      .tool-toggle-header h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 600;
      }
      
      .board-label {
        font-size: 13px;
        color: #a0a0a0;
      }
      
      .tool-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .tool-control {
        background: #2a2a2a;
        border: 1px solid #3e3e3e;
        border-radius: 6px;
        padding: 12px;
      }
      
      .tool-control-header {
        margin-bottom: 8px;
      }
      
      .tool-enabled-label {
        display: flex;
        align-items: center;
        cursor: pointer;
        user-select: none;
      }
      
      .tool-enabled-label input[type="checkbox"] {
        cursor: pointer;
      }
      
      .tool-description {
        font-size: 12px;
        color: #a0a0a0;
        margin-bottom: 12px;
      }
      
      .tool-mode-group {
        display: flex;
        align-items: center;
        font-size: 13px;
      }
      
      .tool-mode-select {
        flex: 1;
        padding: 6px;
        background: #1e1e1e;
        border: 1px solid #3e3e3e;
        border-radius: 4px;
        color: #e0e0e0;
        font-size: 13px;
      }
      
      .tool-mode-select:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .tool-mode-select:focus {
        outline: none;
        border-color: #6366f1;
      }
      
      .tool-validation {
        margin-top: 16px;
        padding: 12px;
        border-radius: 6px;
      }
      
      .validation-success {
        color: #4ade80;
        background: rgba(74, 222, 128, 0.1);
        padding: 8px;
        border-radius: 4px;
        font-size: 13px;
      }
      
      .validation-error {
        color: #f87171;
        background: rgba(248, 113, 113, 0.1);
        padding: 8px;
        border-radius: 4px;
        font-size: 13px;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // ===========================================================================
  // PUBLIC API
  // ===========================================================================
  
  /**
   * Refresh the panel (e.g., after board change)
   */
  public refresh(): void {
    this.loadBoard();
    this.render();
  }
  
  /**
   * Get current tool configuration
   */
  public getToolConfig(): CompositionToolConfig | null {
    return this.board?.compositionTools ?? null;
  }
  
  /**
   * Destroy the panel
   */
  public destroy(): void {
    this.container.innerHTML = '';
    this.toolControls.clear();
  }
}
