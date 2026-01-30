/**
 * New Project Wizard - Guides users through creating projects with persona selection and templates
 */

import { getBoardRegistry } from '../../boards/registry';
import { getBoardStateStore } from '../../boards/store/store';
import { getTemplateRegistry, type ProjectTemplate } from '../../boards/project/template-registry';
import type { UserType } from '../../boards/recommendations';
import { createNewProject } from '../../boards/project/create';

export interface NewProjectWizardOptions {
  onComplete?: (projectId: string) => void;
  onCancel?: () => void;
}

export interface WizardState {
  step: 'persona' | 'template' | 'tutorial';
  selectedPersona?: UserType;
  selectedTemplate?: ProjectTemplate | null;
  wantsTutorial: boolean;
}

export class NewProjectWizard {
  private root: HTMLElement;
  private state: WizardState = {
    step: 'persona',
    wantsTutorial: false
  };

  constructor(private options: NewProjectWizardOptions = {}) {
    this.root = document.createElement('div');
    this.root.className = 'new-project-wizard';
    this.render();
  }

  mount(container: HTMLElement): void {
    container.appendChild(this.root);
  }

  destroy(): void {
    this.root.remove();
  }

  private render(): void {
    this.root.innerHTML = '';
    
    // Header
    const header = document.createElement('div');
    header.className = 'wizard-header';
    header.innerHTML = `
      <h1>Create New Project</h1>
      <p>Let's set up your workspace</p>
    `;
    this.root.appendChild(header);

    // Content area
    const content = document.createElement('div');
    content.className = 'wizard-content';
    
    switch (this.state.step) {
      case 'persona':
        this.renderPersonaSelection(content);
        break;
      case 'template':
        this.renderTemplateSelection(content);
        break;
      case 'tutorial':
        this.renderTutorialOption(content);
        break;
    }
    
    this.root.appendChild(content);

    // Navigation
    const nav = document.createElement('div');
    nav.className = 'wizard-nav';
    
    if (this.state.step !== 'persona') {
      const backBtn = document.createElement('button');
      backBtn.textContent = 'Back';
      backBtn.onclick = () => this.goBack();
      nav.appendChild(backBtn);
    }
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => this.cancel();
    nav.appendChild(cancelBtn);
    
    if (this.state.step === 'tutorial') {
      const createBtn = document.createElement('button');
      createBtn.textContent = 'Create Project';
      createBtn.className = 'primary';
      createBtn.onclick = () => this.createProject();
      nav.appendChild(createBtn);
    }
    
    this.root.appendChild(nav);

    this.injectStyles();
  }

  private renderPersonaSelection(container: HTMLElement): void {
    const personas: { type: UserType; label: string; description: string; icon: string }[] = [
      {
        type: 'notation-composer',
        label: 'Notation Composer',
        description: 'Write music with traditional notation and score editing',
        icon: '🎼'
      },
      {
        type: 'tracker-user',
        label: 'Tracker User',
        description: 'Pattern-based composition with tracker interface',
        icon: '🎹'
      },
      {
        type: 'sound-designer',
        label: 'Sound Designer',
        description: 'Synthesize and sculpt sounds with modular routing',
        icon: '🎛️'
      },
      {
        type: 'producer',
        label: 'Producer/Beatmaker',
        description: 'Arrange, mix, and produce complete tracks',
        icon: '🎚️'
      },
      {
        type: 'live-performer',
        label: 'Live Performer',
        description: 'Performance-oriented workflow with clip launching',
        icon: '🎤'
      },
      {
        type: 'ai-explorer',
        label: 'AI Explorer',
        description: 'Experiment with AI-assisted composition',
        icon: '🤖'
      }
    ];

    const grid = document.createElement('div');
    grid.className = 'persona-grid';

    personas.forEach(persona => {
      const card = document.createElement('button');
      card.className = 'persona-card';
      if (this.state.selectedPersona === persona.type) {
        card.classList.add('selected');
      }
      
      card.innerHTML = `
        <div class="persona-icon">${persona.icon}</div>
        <h3>${persona.label}</h3>
        <p>${persona.description}</p>
      `;
      
      card.onclick = () => {
        this.state.selectedPersona = persona.type;
        this.state.step = 'template';
        this.render();
      };
      
      grid.appendChild(card);
    });

    container.appendChild(grid);
  }

  private renderTemplateSelection(container: HTMLElement): void {
    const templateRegistry = getTemplateRegistry();
    const templates = templateRegistry.list();
    
    // Filter by persona if selected
    const filteredTemplates = this.state.selectedPersona
      ? templates.filter(t => t.recommendedFor?.includes(this.state.selectedPersona!))
      : templates;

    const title = document.createElement('h2');
    title.textContent = 'Choose a Starting Template';
    container.appendChild(title);

    const blankOption = document.createElement('button');
    blankOption.className = 'template-card blank';
    blankOption.innerHTML = `
      <div class="template-icon">📄</div>
      <h3>Blank Project</h3>
      <p>Start from scratch with an empty project</p>
    `;
    blankOption.onclick = () => {
      this.state.selectedTemplate = null;
      this.state.step = 'tutorial';
      this.render();
    };
    container.appendChild(blankOption);

    const grid = document.createElement('div');
    grid.className = 'template-grid';

    filteredTemplates.slice(0, 6).forEach(template => {
      const card = document.createElement('button');
      card.className = 'template-card';
      if (this.state.selectedTemplate?.id === template.id) {
        card.classList.add('selected');
      }
      
      const difficultyBadge = `<span class="difficulty ${template.difficulty}">${template.difficulty}</span>`;
      const timeBadge = template.estimatedTime ? `<span class="time">~${template.estimatedTime}</span>` : '';
      
      card.innerHTML = `
        <div class="template-icon">${template.icon || '🎵'}</div>
        <h3>${template.name}</h3>
        <p>${template.description}</p>
        <div class="template-meta">
          ${difficultyBadge}
          ${timeBadge}
        </div>
      `;
      
      
      card.onclick = () => {
        this.state.selectedTemplate = template;
        this.state.step = 'tutorial';
        this.render();
      };
      
      grid.appendChild(card);
    });

    container.appendChild(grid);
  }

  private renderTutorialOption(container: HTMLElement): void {
    const summary = document.createElement('div');
    summary.className = 'wizard-summary';
    
    const personaName = this.getPersonaName(this.state.selectedPersona);
    const templateName = this.state.selectedTemplate?.name || 'Blank Project';
    
    summary.innerHTML = `
      <h2>Ready to Create</h2>
      <div class="summary-item">
        <strong>Workflow:</strong> ${personaName}
      </div>
      <div class="summary-item">
        <strong>Template:</strong> ${templateName}
      </div>
    `;
    container.appendChild(summary);

    const tutorialToggle = document.createElement('label');
    tutorialToggle.className = 'tutorial-toggle';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = this.state.wantsTutorial;
    checkbox.onchange = () => {
      this.state.wantsTutorial = checkbox.checked;
    };
    
    tutorialToggle.appendChild(checkbox);
    tutorialToggle.appendChild(document.createTextNode(' Show me an interactive tutorial'));
    container.appendChild(tutorialToggle);

    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.textContent = 'You can always access tutorials later from the Help menu';
    container.appendChild(hint);
  }

  private getPersonaName(type?: UserType): string {
    const names: Record<UserType, string> = {
      'notation-composer': 'Notation Composer',
      'tracker-user': 'Tracker User',
      'sound-designer': 'Sound Designer',
      'producer': 'Producer/Beatmaker',
      'live-performer': 'Live Performer',
      'ai-explorer': 'AI Explorer',
      'beginner': 'Beginner'
    };
    return type ? names[type] : 'General';
  }

  private goBack(): void {
    if (this.state.step === 'template') {
      this.state.step = 'persona';
    } else if (this.state.step === 'tutorial') {
      this.state.step = 'template';
    }
    this.render();
  }

  private cancel(): void {
    this.options.onCancel?.();
    this.destroy();
  }

  private createProject(): void {
    const boardRegistry = getBoardRegistry();
    const boardStateStore = getBoardStateStore();
    
    // Create the project
    const project = createNewProject();
    
    // Load template if selected
    if (this.state.selectedTemplate) {
      const templateRegistry = getTemplateRegistry();
      templateRegistry.loadTemplate(this.state.selectedTemplate.id);
    }
    
    // Set appropriate board based on persona
    if (this.state.selectedPersona) {
      const recommendedBoards = boardRegistry.getByUserType(this.state.selectedPersona);
      if (recommendedBoards && recommendedBoards.length > 0 && recommendedBoards[0]) {
        boardStateStore.setCurrentBoard(recommendedBoards[0].id);
      }
    }
    
    // TODO: Launch tutorial if requested
    if (this.state.wantsTutorial) {
      console.log('Tutorial mode would start here');
    }
    
    this.options.onComplete?.(project.id);
    this.destroy();
  }

  private injectStyles(): void {
    const styleId = 'new-project-wizard-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .new-project-wizard {
        background: var(--bg-primary, #1a1a1a);
        color: var(--text-primary, #ffffff);
        border-radius: 8px;
        padding: 32px;
        max-width: 800px;
        margin: 0 auto;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
      }

      .wizard-header h1 {
        margin: 0 0 8px 0;
        font-size: 28px;
        font-weight: 600;
      }

      .wizard-header p {
        margin: 0;
        color: var(--text-secondary, #999);
        font-size: 16px;
      }

      .wizard-content {
        margin: 32px 0;
        min-height: 400px;
      }

      .persona-grid,
      .template-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 16px;
        margin-top: 24px;
      }

      .persona-card,
      .template-card {
        background: var(--bg-secondary, #2a2a2a);
        border: 2px solid var(--border-color, #3a3a3a);
        border-radius: 8px;
        padding: 24px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
      }

      .persona-card:hover,
      .template-card:hover {
        border-color: var(--accent-color, #3b82f6);
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
      }

      .persona-card.selected,
      .template-card.selected {
        border-color: var(--accent-color, #3b82f6);
        background: var(--accent-bg, rgba(59, 130, 246, 0.1));
      }

      .persona-icon,
      .template-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      .persona-card h3,
      .template-card h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary, #fff);
      }

      .persona-card p,
      .template-card p {
        margin: 0;
        font-size: 14px;
        color: var(--text-secondary, #999);
      }

      .template-card.blank {
        grid-column: 1 / -1;
        border-style: dashed;
      }

      .template-meta {
        margin-top: 12px;
        display: flex;
        gap: 8px;
        justify-content: center;
        font-size: 12px;
      }

      .template-meta .difficulty {
        padding: 2px 8px;
        border-radius: 4px;
        text-transform: capitalize;
      }

      .template-meta .difficulty.beginner {
        background: var(--success-bg, rgba(34, 197, 94, 0.2));
        color: var(--success-color, #22c55e);
      }

      .template-meta .difficulty.intermediate {
        background: var(--warning-bg, rgba(251, 146, 60, 0.2));
        color: var(--warning-color, #fb923c);
      }

      .template-meta .difficulty.advanced,
      .template-meta .difficulty.expert {
        background: var(--danger-bg, rgba(239, 68, 68, 0.2));
        color: var(--danger-color, #ef4444);
      }

      .wizard-summary {
        background: var(--bg-secondary, #2a2a2a);
        border-radius: 8px;
        padding: 24px;
        margin-bottom: 24px;
      }

      .wizard-summary h2 {
        margin: 0 0 16px 0;
        font-size: 20px;
      }

      .summary-item {
        margin: 8px 0;
        font-size: 14px;
      }

      .summary-item strong {
        color: var(--text-primary, #fff);
        margin-right: 8px;
      }

      .tutorial-toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        cursor: pointer;
        padding: 16px;
        background: var(--bg-secondary, #2a2a2a);
        border-radius: 8px;
        margin: 16px 0;
      }

      .tutorial-toggle input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
      }

      .hint {
        font-size: 14px;
        color: var(--text-secondary, #999);
        font-style: italic;
        margin: 8px 0;
      }

      .wizard-nav {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        padding-top: 24px;
        border-top: 1px solid var(--border-color, #3a3a3a);
      }

      .wizard-nav button {
        padding: 10px 24px;
        border-radius: 6px;
        border: 1px solid var(--border-color, #3a3a3a);
        background: var(--bg-secondary, #2a2a2a);
        color: var(--text-primary, #fff);
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
      }

      .wizard-nav button:hover {
        background: var(--bg-tertiary, #3a3a3a);
      }

      .wizard-nav button.primary {
        background: var(--accent-color, #3b82f6);
        border-color: var(--accent-color, #3b82f6);
        color: white;
      }

      .wizard-nav button.primary:hover {
        background: var(--accent-hover, #2563eb);
        border-color: var(--accent-hover, #2563eb);
      }
    `;
    document.head.appendChild(style);
  }
}

export function openNewProjectWizard(options?: NewProjectWizardOptions): NewProjectWizard {
  const wizard = new NewProjectWizard(options);
  const overlay = document.createElement('div');
  overlay.className = 'wizard-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 24px;
    overflow: auto;
  `;
  
  document.body.appendChild(overlay);
  wizard.mount(overlay);
  
  const originalOnCancel = options?.onCancel;
  const originalOnComplete = options?.onComplete;
  
  wizard['options'].onCancel = () => {
    overlay.remove();
    originalOnCancel?.();
  };
  
  wizard['options'].onComplete = (projectId: string) => {
    overlay.remove();
    originalOnComplete?.(projectId);
  };
  
  return wizard;
}
