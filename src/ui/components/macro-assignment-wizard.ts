/**
 * Macro Assignment Wizard
 * 
 * Interactive wizard for assigning parameters to macro controls.
 * Supports:
 * - Parameter browsing and selection
 * - Range mapping (min/max)
 * - Curve shaping (linear/exponential/logarithmic)
 * - Multiple parameter assignments per macro
 * - Visual preview of parameter response
 */

// Use string type for parameter IDs (branded type can be added to primitives.ts later)
export type ParameterId = string & { readonly __brand: 'ParameterId' };

export interface MacroAssignment {
  /** Unique ID for this assignment */
  id: string;
  /** Target parameter ID */
  parameterId: ParameterId;
  /** Parameter display name */
  parameterName: string;
  /** Minimum value (at macro = 0%) */
  minValue: number;
  /** Maximum value (at macro = 100%) */
  maxValue: number;
  /** Response curve type */
  curve: 'linear' | 'exponential' | 'logarithmic' | 'inverse-exponential';
  /** Optional curve strength (1.0 = default, >1 = more extreme) */
  curveStrength?: number;
}

export interface MacroConfig {
  /** Macro slot number (1-8) */
  slotNumber: number;
  /** Macro display name */
  name: string;
  /** Assigned parameters */
  assignments: MacroAssignment[];
  /** Current macro value (0-1) */
  value: number;
}

export interface MacroAssignmentWizardConfig {
  /** Available parameters to assign */
  availableParameters: Array<{
    id: ParameterId;
    name: string;
    category: string;
    minValue: number;
    maxValue: number;
    defaultValue: number;
    unit?: string;
  }>;
  /** Existing macro config (for editing) */
  existingConfig?: MacroConfig;
  /** Callback when wizard completes */
  onComplete: (config: MacroConfig) => void;
  /** Callback when wizard is cancelled */
  onCancel: () => void;
}

export class MacroAssignmentWizard {
  private container: HTMLElement;
  private config: MacroAssignmentWizardConfig;
  private workingConfig: MacroConfig;
  private selectedAssignmentId: string | null = null;

  constructor(config: MacroAssignmentWizardConfig) {
    this.config = config;
    this.workingConfig = config.existingConfig ?? {
      slotNumber: 1,
      name: 'Macro 1',
      assignments: [],
      value: 0
    };

    this.container = this.createUI();
  }

  /**
   * Get the wizard container element
   */
  getElement(): HTMLElement {
    return this.container;
  }

  /**
   * Create wizard UI
   */
  private createUI(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'macro-assignment-wizard';
    container.style.cssText = `
      width: 600px;
      max-height: 80vh;
      background: var(--panel-background, #2a2a2a);
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px;
      border-bottom: 1px solid var(--border-color, #444444);
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const title = document.createElement('h2');
    title.textContent = `Configure Macro ${this.workingConfig.slotNumber}`;
    title.style.cssText = `
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary, #ffffff);
    `;

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = this.workingConfig.name;
    nameInput.placeholder = 'Macro Name';
    nameInput.style.cssText = `
      padding: 6px 12px;
      border: 1px solid var(--border-color, #444444);
      border-radius: 4px;
      background: var(--input-background, #1a1a1a);
      color: var(--text-primary, #ffffff);
      font-size: 14px;
      width: 200px;
    `;
    nameInput.addEventListener('input', () => {
      this.workingConfig.name = nameInput.value;
    });

    header.appendChild(title);
    header.appendChild(nameInput);

    // Body
    const body = document.createElement('div');
    body.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      gap: 16px;
    `;

    // Left column: Parameter browser
    const leftColumn = this.createParameterBrowser();
    leftColumn.style.cssText = `
      flex: 1;
      border-right: 1px solid var(--border-color, #444444);
      padding-right: 16px;
    `;

    // Right column: Assignment list and editor
    const rightColumn = this.createAssignmentEditor();
    rightColumn.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
    `;

    body.appendChild(leftColumn);
    body.appendChild(rightColumn);

    // Footer
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 16px;
      border-top: 1px solid var(--border-color, #444444);
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    `;

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.cssText = `
      padding: 8px 16px;
      border: 1px solid var(--border-color, #444444);
      border-radius: 4px;
      background: transparent;
      color: var(--text-primary, #ffffff);
      cursor: pointer;
      font-size: 14px;
    `;
    cancelButton.addEventListener('click', () => {
      this.config.onCancel();
    });

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.style.cssText = `
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      background: var(--accent-color, #3399ff);
      color: white;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    `;
    saveButton.addEventListener('click', () => {
      this.config.onComplete(this.workingConfig);
    });

    footer.appendChild(cancelButton);
    footer.appendChild(saveButton);

    container.appendChild(header);
    container.appendChild(body);
    container.appendChild(footer);

    return container;
  }

  /**
   * Create parameter browser panel
   */
  private createParameterBrowser(): HTMLElement {
    const container = document.createElement('div');

    const heading = document.createElement('h3');
    heading.textContent = 'Available Parameters';
    heading.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-secondary, #cccccc);
    `;

    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Search parameters...';
    searchInput.style.cssText = `
      width: 100%;
      padding: 8px;
      margin-bottom: 12px;
      border: 1px solid var(--border-color, #444444);
      border-radius: 4px;
      background: var(--input-background, #1a1a1a);
      color: var(--text-primary, #ffffff);
      font-size: 13px;
    `;

    const paramList = document.createElement('div');
    paramList.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
    `;

    const renderParameters = (filter: string = '') => {
      paramList.innerHTML = '';
      const filtered = this.config.availableParameters.filter(
        (p) =>
          p.name.toLowerCase().includes(filter.toLowerCase()) ||
          p.category.toLowerCase().includes(filter.toLowerCase())
      );

      filtered.forEach((param) => {
        const item = document.createElement('div');
        item.style.cssText = `
          padding: 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.15s;
          display: flex;
          justify-content: space-between;
          align-items: center;
        `;
        item.addEventListener('mouseenter', () => {
          item.style.background = 'var(--hover-background, #333333)';
        });
        item.addEventListener('mouseleave', () => {
          item.style.background = 'transparent';
        });
        item.addEventListener('click', () => {
          this.addParameterAssignment(param);
        });

        const nameSpan = document.createElement('span');
        nameSpan.textContent = param.name;
        nameSpan.style.cssText = `
          color: var(--text-primary, #ffffff);
          font-size: 13px;
        `;

        const categorySpan = document.createElement('span');
        categorySpan.textContent = param.category;
        categorySpan.style.cssText = `
          color: var(--text-tertiary, #888888);
          font-size: 11px;
        `;

        item.appendChild(nameSpan);
        item.appendChild(categorySpan);
        paramList.appendChild(item);
      });
    };

    searchInput.addEventListener('input', () => {
      renderParameters(searchInput.value);
    });

    renderParameters();

    container.appendChild(heading);
    container.appendChild(searchInput);
    container.appendChild(paramList);

    return container;
  }

  /**
   * Create assignment editor panel
   */
  private createAssignmentEditor(): HTMLElement {
    const container = document.createElement('div');

    const heading = document.createElement('h3');
    heading.textContent = 'Assigned Parameters';
    heading.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-secondary, #cccccc);
    `;

    const assignmentsList = document.createElement('div');
    assignmentsList.id = 'assignments-list';
    assignmentsList.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
      overflow-y: auto;
    `;

    const renderAssignments = () => {
      assignmentsList.innerHTML = '';
      
      if (this.workingConfig.assignments.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.textContent = 'No parameters assigned yet. Click a parameter on the left to add it.';
        emptyState.style.cssText = `
          padding: 16px;
          text-align: center;
          color: var(--text-tertiary, #888888);
          font-size: 13px;
        `;
        assignmentsList.appendChild(emptyState);
        return;
      }

      this.workingConfig.assignments.forEach((assignment) => {
        const item = this.createAssignmentItem(assignment, renderAssignments);
        assignmentsList.appendChild(item);
      });
    };

    renderAssignments();

    container.appendChild(heading);
    container.appendChild(assignmentsList);

    return container;
  }

  /**
   * Create assignment item UI
   */
  private createAssignmentItem(
    assignment: MacroAssignment,
    onUpdate: () => void
  ): HTMLElement {
    const item = document.createElement('div');
    item.style.cssText = `
      padding: 12px;
      background: var(--card-background, #333333);
      border-radius: 4px;
      border: 2px solid ${
        this.selectedAssignmentId === assignment.id
          ? 'var(--accent-color, #3399ff)'
          : 'transparent'
      };
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    `;

    const name = document.createElement('strong');
    name.textContent = assignment.parameterName;
    name.style.color = 'var(--text-primary, #ffffff)';

    const removeButton = document.createElement('button');
    removeButton.textContent = '✕';
    removeButton.style.cssText = `
      padding: 2px 6px;
      border: none;
      background: var(--danger-color, #ff4444);
      color: white;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
    `;
    removeButton.addEventListener('click', () => {
      this.removeAssignment(assignment.id);
      onUpdate();
    });

    header.appendChild(name);
    header.appendChild(removeButton);

    // Range controls
    const rangeControls = document.createElement('div');
    rangeControls.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 8px;
    `;

    const minLabel = document.createElement('label');
    minLabel.textContent = 'Min:';
    minLabel.style.cssText = `
      font-size: 11px;
      color: var(--text-secondary, #cccccc);
    `;

    const minInput = document.createElement('input');
    minInput.type = 'number';
    minInput.value = assignment.minValue.toString();
    minInput.step = '0.01';
    minInput.style.cssText = `
      padding: 4px 8px;
      border: 1px solid var(--border-color, #444444);
      border-radius: 3px;
      background: var(--input-background, #1a1a1a);
      color: var(--text-primary, #ffffff);
      font-size: 12px;
    `;
    minInput.addEventListener('input', () => {
      assignment.minValue = parseFloat(minInput.value) || 0;
    });

    const maxLabel = document.createElement('label');
    maxLabel.textContent = 'Max:';
    maxLabel.style.cssText = `
      font-size: 11px;
      color: var(--text-secondary, #cccccc);
    `;

    const maxInput = document.createElement('input');
    maxInput.type = 'number';
    maxInput.value = assignment.maxValue.toString();
    maxInput.step = '0.01';
    maxInput.style.cssText = `
      padding: 4px 8px;
      border: 1px solid var(--border-color, #444444);
      border-radius: 3px;
      background: var(--input-background, #1a1a1a);
      color: var(--text-primary, #ffffff);
      font-size: 12px;
    `;
    maxInput.addEventListener('input', () => {
      assignment.maxValue = parseFloat(maxInput.value) || 1;
    });

    const minGroup = document.createElement('div');
    minGroup.appendChild(minLabel);
    minGroup.appendChild(minInput);

    const maxGroup = document.createElement('div');
    maxGroup.appendChild(maxLabel);
    maxGroup.appendChild(maxInput);

    rangeControls.appendChild(minGroup);
    rangeControls.appendChild(maxGroup);

    // Curve selector
    const curveLabel = document.createElement('label');
    curveLabel.textContent = 'Curve:';
    curveLabel.style.cssText = `
      font-size: 11px;
      color: var(--text-secondary, #cccccc);
      display: block;
      margin-bottom: 4px;
    `;

    const curveSelect = document.createElement('select');
    curveSelect.style.cssText = `
      width: 100%;
      padding: 4px 8px;
      border: 1px solid var(--border-color, #444444);
      border-radius: 3px;
      background: var(--input-background, #1a1a1a);
      color: var(--text-primary, #ffffff);
      font-size: 12px;
    `;
    
    const curves: Array<MacroAssignment['curve']> = [
      'linear',
      'exponential',
      'logarithmic',
      'inverse-exponential'
    ];
    curves.forEach((curve) => {
      const option = document.createElement('option');
      option.value = curve;
      option.textContent = curve.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      option.selected = assignment.curve === curve;
      curveSelect.appendChild(option);
    });

    curveSelect.addEventListener('change', () => {
      assignment.curve = curveSelect.value as MacroAssignment['curve'];
    });

    item.appendChild(header);
    item.appendChild(rangeControls);
    item.appendChild(curveLabel);
    item.appendChild(curveSelect);

    return item;
  }

  /**
   * Add parameter assignment
   */
  private addParameterAssignment(param: MacroAssignmentWizardConfig['availableParameters'][0]): void {
    const assignment: MacroAssignment = {
      id: `${Date.now()}-${Math.random()}`,
      parameterId: param.id,
      parameterName: param.name,
      minValue: param.minValue,
      maxValue: param.maxValue,
      curve: 'linear'
    };

    this.workingConfig.assignments.push(assignment);

    // Re-render assignment list
    const list = this.container.querySelector('#assignments-list');
    if (list) {
      const parent = list.parentElement;
      if (parent && parent.children[1]) {
        const newEditor = this.createAssignmentEditor();
        parent.replaceChild(newEditor, parent.children[1]);
      }
    }
  }

  /**
   * Remove assignment
   */
  private removeAssignment(id: string): void {
    this.workingConfig.assignments = this.workingConfig.assignments.filter(
      (a) => a.id !== id
    );
  }
}

/**
 * Show macro assignment wizard in a modal
 */
export function showMacroAssignmentWizard(
  config: MacroAssignmentWizardConfig
): void {
  // Create modal backdrop
  const backdrop = document.createElement('div');
  backdrop.style.cssText = `
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
    animation: fadeIn 0.2s;
  `;

  const wizard = new MacroAssignmentWizard({
    ...config,
    onComplete: (macroConfig) => {
      backdrop.remove();
      config.onComplete(macroConfig);
    },
    onCancel: () => {
      backdrop.remove();
      config.onCancel();
    }
  });

  backdrop.appendChild(wizard.getElement());
  document.body.appendChild(backdrop);

  // Close on backdrop click
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      backdrop.remove();
      config.onCancel();
    }
  });

  // Close on Escape key
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      backdrop.remove();
      config.onCancel();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}
