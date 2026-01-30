/**
 * @fileoverview Tutorial Mode System
 * 
 * Implements M355-M361:
 * - Interactive tutorial system
 * - Context-sensitive hints and guidance
 * - Progressive disclosure of features
 * - Beautiful step-by-step overlays
 * 
 * @module @cardplay/ui/components/tutorial-mode
 */

import { getBoardStateStore } from '../../boards/store/store';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position?: 'top' | 'right' | 'bottom' | 'left' | 'center';
  highlightTarget?: boolean;
  actions?: TutorialAction[];
  condition?: () => boolean;
  onEnter?: () => void;
  onExit?: () => void;
}

export interface TutorialAction {
  label: string;
  type: 'next' | 'skip' | 'custom';
  callback?: () => void;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: 'getting-started' | 'board' | 'feature' | 'workflow';
  estimatedMinutes: number;
  steps: TutorialStep[];
  requiredBoard?: string;
}

interface TutorialState {
  activeTutorial: Tutorial | null;
  currentStepIndex: number;
  completedTutorials: Set<string>;
  dismissed: boolean;
}

// --------------------------------------------------------------------------
// Tutorial Definitions
// --------------------------------------------------------------------------

export const TUTORIALS: Tutorial[] = [
  {
    id: 'first-project',
    title: 'Create Your First Project',
    description: 'Learn the basics of CardPlay by creating a simple musical sketch.',
    category: 'getting-started',
    estimatedMinutes: 5,
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to CardPlay!',
        description: 'CardPlay is a board-centric music creation environment. You can work with as much or as little AI assistance as you want.',
        position: 'center'
      },
      {
        id: 'board-switcher',
        title: 'Choose Your Board',
        description: 'Press Cmd+B or click here to open the board switcher. Different boards provide different levels of control and AI assistance.',
        targetSelector: '.board-switcher-button',
        position: 'bottom',
        highlightTarget: true
      },
      {
        id: 'manual-board',
        title: 'Try a Manual Board',
        description: 'Manual boards give you complete control. Select "Basic Tracker Board" or "Notation Board (Manual)" to start.',
        condition: () => {
          const state = getBoardStateStore().getState();
          return !!(state.currentBoardId?.includes('manual') || state.currentBoardId?.includes('tracker'));
        }
      },
      {
        id: 'add-notes',
        title: 'Add Some Notes',
        description: 'Click in the editor to add notes. In tracker mode, use hex keys (0-9, A-F) for note entry.',
        targetSelector: '.tracker-panel, .notation-score, .piano-roll-panel',
        position: 'left'
      },
      {
        id: 'play',
        title: 'Play Your Music',
        description: 'Press Space or click the play button to hear what you\'ve created.',
        targetSelector: '.transport-play-button',
        position: 'top',
        highlightTarget: true
      },
      {
        id: 'complete',
        title: 'You\'re All Set!',
        description: 'Explore different boards, try AI-assisted features, and make music your way. Press Cmd+? anytime for help.',
        position: 'center'
      }
    ]
  },
  {
    id: 'board-switching',
    title: 'Understanding Boards',
    description: 'Learn about the control spectrum and how to choose the right board for your workflow.',
    category: 'getting-started',
    estimatedMinutes: 3,
    steps: [
      {
        id: 'intro',
        title: 'The Control Spectrum',
        description: 'CardPlay boards range from Manual (full control) to Generative (AI-driven). Choose what works for you.',
        position: 'center'
      },
      {
        id: 'manual',
        title: 'Manual Boards',
        description: 'Full control, no AI. Perfect for traditional composers, tracker users, and those who want complete authority.',
        position: 'center'
      },
      {
        id: 'hints',
        title: 'Manual + Hints',
        description: 'You write music, but get helpful visual cues like chord tones and harmony suggestions.',
        position: 'center'
      },
      {
        id: 'assisted',
        title: 'Assisted Boards',
        description: 'Drag phrases, trigger generators, but edit everything. Perfect for faster workflows with control.',
        position: 'center'
      },
      {
        id: 'directed',
        title: 'Directed Boards',
        description: 'Set direction and constraints, AI fills in the details. Review and edit before committing.',
        position: 'center'
      },
      {
        id: 'generative',
        title: 'Generative Boards',
        description: 'AI continuously generates ideas. You curate, accept, and freeze the parts you like.',
        position: 'center'
      }
    ]
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Essential Keyboard Shortcuts',
    description: 'Master the most useful keyboard shortcuts for efficient music creation.',
    category: 'getting-started',
    estimatedMinutes: 2,
    steps: [
      {
        id: 'board-switch',
        title: 'Board Switching: Cmd+B',
        description: 'Quickly open the board switcher to change your workspace.',
        position: 'center'
      },
      {
        id: 'play-stop',
        title: 'Play/Stop: Space',
        description: 'Toggle playback with the space bar.',
        position: 'center'
      },
      {
        id: 'undo-redo',
        title: 'Undo/Redo: Cmd+Z / Cmd+Shift+Z',
        description: 'All actions are undoable. Edit fearlessly!',
        position: 'center'
      },
      {
        id: 'command-palette',
        title: 'Command Palette: Cmd+K',
        description: 'Access all actions via the command palette (AI boards only).',
        position: 'center'
      },
      {
        id: 'help',
        title: 'Help: Cmd+?',
        description: 'Open the help browser anytime to see all shortcuts and documentation.',
        position: 'center'
      }
    ]
  },
  {
    id: 'tracker-workflow',
    title: 'Mastering the Tracker',
    description: 'Deep dive into tracker-based music creation with patterns and effects.',
    category: 'workflow',
    estimatedMinutes: 10,
    requiredBoard: 'basic-tracker',
    steps: [
      {
        id: 'intro',
        title: 'Tracker Basics',
        description: 'The tracker shows notes in a vertical grid. Each row is a time step, columns are different parameters.',
        position: 'center'
      },
      {
        id: 'hex-entry',
        title: 'Hex Note Entry',
        description: 'Use 0-9 and A-F keys for quick note entry. C-4 is middle C, 60 in MIDI.',
        targetSelector: '.tracker-panel',
        position: 'right'
      },
      {
        id: 'pattern-length',
        title: 'Pattern Length',
        description: 'Adjust pattern length to match your musical phrase. Powers of 2 (16, 32, 64) work well.',
        targetSelector: '.pattern-length-input',
        position: 'bottom'
      },
      {
        id: 'effects',
        title: 'Effect Commands',
        description: 'Add effects in the FX column: slide, vibrato, volume, panning. Try 01xx for pitch slide up.',
        targetSelector: '.tracker-panel',
        position: 'right'
      },
      {
        id: 'clone-pattern',
        title: 'Clone & Modify',
        description: 'Right-click a pattern to clone it, then modify the copy. Great for variations!',
        targetSelector: '.tracker-panel',
        position: 'left'
      },
      {
        id: 'complete',
        title: 'Tracker Mastery',
        description: 'You now know the essentials! Try the Tracker + Harmony board for chord suggestions.',
        position: 'center'
      }
    ]
  },
  {
    id: 'notation-workflow',
    title: 'Notation Composition',
    description: 'Learn to compose with traditional music notation.',
    category: 'workflow',
    estimatedMinutes: 8,
    requiredBoard: 'notation-board-manual',
    steps: [
      {
        id: 'intro',
        title: 'Notation Basics',
        description: 'Write music the traditional way with staff notation. Perfect for orchestral and classical work.',
        position: 'center'
      },
      {
        id: 'add-notes',
        title: 'Adding Notes',
        description: 'Click on the staff to add notes. The pitch depends on where you click vertically.',
        targetSelector: '.notation-score',
        position: 'left'
      },
      {
        id: 'note-duration',
        title: 'Note Durations',
        description: 'Select note duration before placing: whole, half, quarter, eighth notes.',
        targetSelector: '.note-duration-toolbar',
        position: 'bottom'
      },
      {
        id: 'accidentals',
        title: 'Sharps & Flats',
        description: 'Use the toolbar or keyboard shortcuts to add accidentals to notes.',
        targetSelector: '.accidentals-toolbar',
        position: 'bottom'
      },
      {
        id: 'articulation',
        title: 'Articulation',
        description: 'Add dynamics (p, f, mf), slurs, staccato, and other articulations.',
        targetSelector: '.properties-panel',
        position: 'left'
      },
      {
        id: 'chord-symbols',
        title: 'Chord Symbols',
        description: 'Add chord symbols above the staff for lead sheets and jazz charts.',
        targetSelector: '.notation-score',
        position: 'top'
      },
      {
        id: 'complete',
        title: 'Ready to Compose!',
        description: 'Try the Notation + Harmony board for helpful chord suggestions as you write.',
        position: 'center'
      }
    ]
  },
  {
    id: 'session-workflow',
    title: 'Session View & Clip Launching',
    description: 'Learn to create and launch clips in session view for live performance.',
    category: 'workflow',
    estimatedMinutes: 7,
    requiredBoard: 'basic-session',
    steps: [
      {
        id: 'intro',
        title: 'Session View',
        description: 'Session view organizes clips in a grid. Launch clips and scenes for live performance.',
        position: 'center'
      },
      {
        id: 'create-clip',
        title: 'Create a Clip',
        description: 'Double-click an empty slot to create a new clip. Each clip contains a musical loop.',
        targetSelector: '.session-grid',
        position: 'right'
      },
      {
        id: 'launch-clip',
        title: 'Launch Clips',
        description: 'Click a clip to launch it. It will play when the current loop finishes (quantized launch).',
        targetSelector: '.session-grid',
        position: 'right'
      },
      {
        id: 'scenes',
        title: 'Launch Scenes',
        description: 'A scene is a horizontal row of clips. Launch all clips in a scene at once.',
        targetSelector: '.scene-launch-button',
        position: 'left'
      },
      {
        id: 'record',
        title: 'Record Clips',
        description: 'Arm a track and start recording. Play notes to capture them into the clip.',
        targetSelector: '.track-arm-button',
        position: 'bottom'
      },
      {
        id: 'complete',
        title: 'Session Master',
        description: 'Try the Session + Generators board to quickly create clip variations!',
        position: 'center'
      }
    ]
  },
  {
    id: 'ai-workflow',
    title: 'Working with AI',
    description: 'Learn how to use AI assistance effectively while maintaining creative control.',
    category: 'feature',
    estimatedMinutes: 12,
    steps: [
      {
        id: 'intro',
        title: 'AI as Collaborator',
        description: 'CardPlay AI works like a musical assistant. You set direction, AI suggests options.',
        position: 'center'
      },
      {
        id: 'control-spectrum',
        title: 'Choose Your Control Level',
        description: 'Assisted: drag phrases. Directed: set constraints, AI fills in. Generative: curate AI output.',
        position: 'center'
      },
      {
        id: 'assisted-board',
        title: 'Try Assisted Mode',
        description: 'Switch to "Tracker + Phrases" or "Session + Generators" board.',
        targetSelector: '.board-switcher-button',
        position: 'bottom'
      },
      {
        id: 'phrase-library',
        title: 'Browse Phrases',
        description: 'Search the phrase library for musical ideas. Filter by mood, style, instrument.',
        targetSelector: '.phrase-library-deck',
        position: 'right'
      },
      {
        id: 'drag-phrase',
        title: 'Drag & Drop',
        description: 'Drag a phrase onto the tracker or session grid. It adapts to your current key/chord.',
        targetSelector: '.phrase-library-deck',
        position: 'right'
      },
      {
        id: 'edit-result',
        title: 'Edit Freely',
        description: 'Once placed, phrases are just normal notes. Edit them however you want.',
        targetSelector: '.tracker-panel, .piano-roll-panel',
        position: 'left'
      },
      {
        id: 'freeze',
        title: 'Freeze Generated Parts',
        description: 'In generative boards, "freeze" locks AI-generated parts so they won\'t regenerate.',
        position: 'center'
      },
      {
        id: 'undo-anything',
        title: 'Everything is Undoable',
        description: 'All AI actions are undoable. Experiment fearlessly with Cmd+Z!',
        position: 'center'
      },
      {
        id: 'complete',
        title: 'AI Mastery',
        description: 'You control the amount of AI. Mix manual tracks with AI-assisted ones as you like.',
        position: 'center'
      }
    ]
  },
  {
    id: 'routing-modular',
    title: 'Signal Routing & Modular Connections',
    description: 'Learn to create complex signal flows and modulation routing.',
    category: 'feature',
    estimatedMinutes: 15,
    steps: [
      {
        id: 'intro',
        title: 'Routing System',
        description: 'CardPlay uses a flexible routing graph for audio, MIDI, modulation, and control signals.',
        position: 'center'
      },
      {
        id: 'routing-overlay',
        title: 'Show Routing',
        description: 'Toggle the routing overlay to see all connections visually.',
        targetSelector: '.routing-overlay-button',
        position: 'bottom',
        highlightTarget: true
      },
      {
        id: 'connection-types',
        title: 'Connection Types',
        description: 'Audio (blue), MIDI (green), Modulation (purple), Trigger (orange). Each type has different rules.',
        position: 'center'
      },
      {
        id: 'create-connection',
        title: 'Connect Nodes',
        description: 'Drag from an output port to an input port. Valid connections will highlight.',
        targetSelector: '.routing-overlay',
        position: 'right'
      },
      {
        id: 'modulation',
        title: 'Modulation Routing',
        description: 'Route LFOs, envelopes, or audio signals to modulate parameters. Purple connections!',
        position: 'center'
      },
      {
        id: 'validation',
        title: 'Connection Validation',
        description: 'Invalid connections (wrong types, feedback loops) will shake and show an error.',
        position: 'center'
      },
      {
        id: 'complete',
        title: 'Routing Expert',
        description: 'Try the "Sound Design Lab" board for complex modular patching!',
        position: 'center'
      }
    ]
  },
  {
    id: 'mixing-mastering',
    title: 'Mixing & Effects',
    description: 'Learn to balance, process, and polish your music.',
    category: 'workflow',
    estimatedMinutes: 10,
    steps: [
      {
        id: 'intro',
        title: 'Mixing Basics',
        description: 'Mixing is balancing levels, adding effects, and making everything sound great together.',
        position: 'center'
      },
      {
        id: 'mixer-deck',
        title: 'The Mixer',
        description: 'The mixer shows all tracks with faders, panning, mute/solo, and meters.',
        targetSelector: '.mixer-deck',
        position: 'top'
      },
      {
        id: 'levels',
        title: 'Set Levels',
        description: 'Adjust faders so nothing clips (red). Leave 3-6dB headroom for the master.',
        targetSelector: '.mixer-deck',
        position: 'top'
      },
      {
        id: 'panning',
        title: 'Stereo Positioning',
        description: 'Pan tracks left/right to create stereo width. Drums/bass usually center.',
        targetSelector: '.pan-control',
        position: 'bottom'
      },
      {
        id: 'effects-chain',
        title: 'Add Effects',
        description: 'Open the DSP chain to add EQ, compression, reverb, delay.',
        targetSelector: '.dsp-chain-deck',
        position: 'left'
      },
      {
        id: 'eq',
        title: 'Equalization',
        description: 'Use EQ to carve out space for each instrument. Cut mud (200-400Hz), add presence (2-5kHz).',
        position: 'center'
      },
      {
        id: 'compression',
        title: 'Dynamics',
        description: 'Compression evens out loud/quiet parts. Use on vocals, drums, and the master bus.',
        position: 'center'
      },
      {
        id: 'reverb-delay',
        title: 'Space & Depth',
        description: 'Reverb adds room sound. Delay creates echoes. Use send/return for better control.',
        position: 'center'
      },
      {
        id: 'complete',
        title: 'Mixing Skills',
        description: 'Try the "Producer Board" for advanced mixing with automation and buses!',
        position: 'center'
      }
    ]
  }
];

// --------------------------------------------------------------------------
// Tutorial Manager
// --------------------------------------------------------------------------

export class TutorialManager {
  private state: TutorialState;
  private overlay: HTMLDivElement | null = null;
  private listeners: Array<() => void> = [];

  constructor() {
    this.state = {
      activeTutorial: null,
      currentStepIndex: 0,
      completedTutorials: this.loadCompletedTutorials(),
      dismissed: false
    };
  }

  private loadCompletedTutorials(): Set<string> {
    try {
      const stored = localStorage.getItem('cardplay.tutorial.completed');
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (e) {
      // Ignore parse errors
    }
    return new Set();
  }

  private saveCompletedTutorials(): void {
    try {
      localStorage.setItem(
        'cardplay.tutorial.completed',
        JSON.stringify([...this.state.completedTutorials])
      );
    } catch (e) {
      // Ignore storage errors
    }
  }

  public startTutorial(tutorialId: string): void {
    const tutorial = TUTORIALS.find(t => t.id === tutorialId);
    if (!tutorial) {
      console.error(`Tutorial not found: ${tutorialId}`);
      return;
    }

    this.state.activeTutorial = tutorial;
    this.state.currentStepIndex = 0;
    this.state.dismissed = false;
    
    this.showCurrentStep();
  }

  public nextStep(): void {
    if (!this.state.activeTutorial) return;

    const currentStep = this.state.activeTutorial.steps[this.state.currentStepIndex];
    if (currentStep?.onExit) {
      currentStep.onExit();
    }

    this.state.currentStepIndex++;

    if (this.state.currentStepIndex >= this.state.activeTutorial.steps.length) {
      this.completeTutorial();
    } else {
      this.showCurrentStep();
    }
  }

  public previousStep(): void {
    if (!this.state.activeTutorial || this.state.currentStepIndex === 0) return;

    const currentStep = this.state.activeTutorial.steps[this.state.currentStepIndex];
    if (currentStep?.onExit) {
      currentStep.onExit();
    }

    this.state.currentStepIndex--;
    this.showCurrentStep();
  }

  public skipTutorial(): void {
    this.dismissTutorial();
  }

  public dismissTutorial(): void {
    if (this.state.activeTutorial) {
      const currentStep = this.state.activeTutorial.steps[this.state.currentStepIndex];
      if (currentStep?.onExit) {
        currentStep.onExit();
      }
    }

    this.state.activeTutorial = null;
    this.state.dismissed = true;
    this.hideOverlay();
  }

  private completeTutorial(): void {
    if (this.state.activeTutorial) {
      this.state.completedTutorials.add(this.state.activeTutorial.id);
      this.saveCompletedTutorials();
    }

    this.dismissTutorial();
    this.notifyListeners();
  }

  private showCurrentStep(): void {
    if (!this.state.activeTutorial) return;

    const step = this.state.activeTutorial.steps[this.state.currentStepIndex];
    if (!step) return;

    // Check condition if present
    if (step.condition && !step.condition()) {
      // Wait for condition
      const checkInterval = setInterval(() => {
        if (step.condition && step.condition()) {
          clearInterval(checkInterval);
          this.renderStep(step);
        }
      }, 500);
      
      // Render waiting message
      this.renderWaitingForCondition(step);
      return;
    }

    this.renderStep(step);

    if (step.onEnter) {
      step.onEnter();
    }

    this.notifyListeners();
  }

  private renderWaitingForCondition(step: TutorialStep): void {
    this.hideOverlay();
    
    this.overlay = document.createElement('div');
    this.overlay.className = 'tutorial-overlay';
    
    const tooltip = document.createElement('div');
    tooltip.className = 'tutorial-tooltip tutorial-tooltip--center';
    tooltip.innerHTML = `
      <div class="tutorial-tooltip__content">
        <h3 class="tutorial-tooltip__title">${step.title}</h3>
        <p class="tutorial-tooltip__description">${step.description}</p>
        <div class="tutorial-tooltip__waiting">
          <div class="tutorial-spinner"></div>
          <span>Complete this step to continue...</span>
        </div>
      </div>
    `;
    
    this.overlay.appendChild(tooltip);
    document.body.appendChild(this.overlay);
    
    this.injectStyles();
  }

  private renderStep(step: TutorialStep): void {
    this.hideOverlay();
    
    this.overlay = document.createElement('div');
    this.overlay.className = 'tutorial-overlay';
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'tutorial-backdrop';
    backdrop.addEventListener('click', () => this.skipTutorial());
    this.overlay.appendChild(backdrop);
    
    // Highlight target if specified
    if (step.targetSelector && step.highlightTarget) {
      const target = document.querySelector(step.targetSelector) as HTMLElement;
      if (target) {
        const highlight = this.createHighlight(target);
        this.overlay.appendChild(highlight);
      }
    }
    
    // Create tooltip
    const tooltip = this.createTooltip(step);
    this.overlay.appendChild(tooltip);
    
    document.body.appendChild(this.overlay);
    
    // Position tooltip
    if (step.targetSelector) {
      this.positionTooltip(tooltip, step.targetSelector, step.position || 'bottom');
    }
    
    this.injectStyles();
  }

  private createHighlight(target: HTMLElement): HTMLDivElement {
    const rect = target.getBoundingClientRect();
    
    const highlight = document.createElement('div');
    highlight.className = 'tutorial-highlight';
    highlight.style.top = `${rect.top}px`;
    highlight.style.left = `${rect.left}px`;
    highlight.style.width = `${rect.width}px`;
    highlight.style.height = `${rect.height}px`;
    
    return highlight;
  }

  private createTooltip(step: TutorialStep): HTMLDivElement {
    const tooltip = document.createElement('div');
    tooltip.className = `tutorial-tooltip tutorial-tooltip--${step.position || 'center'}`;
    
    const content = document.createElement('div');
    content.className = 'tutorial-tooltip__content';
    
    // Progress indicator
    if (this.state.activeTutorial) {
      const progress = document.createElement('div');
      progress.className = 'tutorial-tooltip__progress';
      progress.textContent = `Step ${this.state.currentStepIndex + 1} of ${this.state.activeTutorial.steps.length}`;
      content.appendChild(progress);
    }
    
    // Title
    const title = document.createElement('h3');
    title.className = 'tutorial-tooltip__title';
    title.textContent = step.title;
    content.appendChild(title);
    
    // Description
    const description = document.createElement('p');
    description.className = 'tutorial-tooltip__description';
    description.textContent = step.description;
    content.appendChild(description);
    
    // Actions
    const actions = document.createElement('div');
    actions.className = 'tutorial-tooltip__actions';
    
    // Skip button
    const skipBtn = document.createElement('button');
    skipBtn.className = 'tutorial-tooltip__button tutorial-tooltip__button--secondary';
    skipBtn.textContent = 'Skip Tutorial';
    skipBtn.addEventListener('click', () => this.skipTutorial());
    actions.appendChild(skipBtn);
    
    // Previous button (if not first step)
    if (this.state.currentStepIndex > 0) {
      const prevBtn = document.createElement('button');
      prevBtn.className = 'tutorial-tooltip__button tutorial-tooltip__button--secondary';
      prevBtn.textContent = 'Previous';
      prevBtn.addEventListener('click', () => this.previousStep());
      actions.appendChild(prevBtn);
    }
    
    // Next/Complete button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'tutorial-tooltip__button tutorial-tooltip__button--primary';
    nextBtn.textContent = this.isLastStep() ? 'Complete' : 'Next';
    nextBtn.addEventListener('click', () => this.nextStep());
    actions.appendChild(nextBtn);
    
    content.appendChild(actions);
    tooltip.appendChild(content);
    
    return tooltip;
  }

  private positionTooltip(tooltip: HTMLDivElement, targetSelector: string, position: string): void {
    const target = document.querySelector(targetSelector) as HTMLElement;
    if (!target) {
      tooltip.style.position = 'fixed';
      tooltip.style.top = '50%';
      tooltip.style.left = '50%';
      tooltip.style.transform = 'translate(-50%, -50%)';
      return;
    }
    
    const rect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const padding = 16;
    
    switch (position) {
      case 'top':
        tooltip.style.top = `${rect.top - tooltipRect.height - padding}px`;
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.transform = 'translateX(-50%)';
        break;
      case 'right':
        tooltip.style.top = `${rect.top + rect.height / 2}px`;
        tooltip.style.left = `${rect.right + padding}px`;
        tooltip.style.transform = 'translateY(-50%)';
        break;
      case 'bottom':
        tooltip.style.top = `${rect.bottom + padding}px`;
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.transform = 'translateX(-50%)';
        break;
      case 'left':
        tooltip.style.top = `${rect.top + rect.height / 2}px`;
        tooltip.style.left = `${rect.left - tooltipRect.width - padding}px`;
        tooltip.style.transform = 'translateY(-50%)';
        break;
      case 'center':
      default:
        tooltip.style.top = '50%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translate(-50%, -50%)';
        break;
    }
  }

  private hideOverlay(): void {
    if (this.overlay && this.overlay.parentElement) {
      this.overlay.parentElement.removeChild(this.overlay);
      this.overlay = null;
    }
  }

  private isLastStep(): boolean {
    if (!this.state.activeTutorial) return true;
    return this.state.currentStepIndex === this.state.activeTutorial.steps.length - 1;
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  public isActive(): boolean {
    return this.state.activeTutorial !== null;
  }

  public getActiveTutorial(): Tutorial | null {
    return this.state.activeTutorial;
  }

  public getCurrentStepIndex(): number {
    return this.state.currentStepIndex;
  }

  public getCompletedTutorials(): string[] {
    return [...this.state.completedTutorials];
  }

  public isTutorialCompleted(tutorialId: string): boolean {
    return this.state.completedTutorials.has(tutorialId);
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // --------------------------------------------------------------------------
  // Styles
  // --------------------------------------------------------------------------

  private injectStyles(): void {
    const styleId = 'tutorial-mode-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .tutorial-overlay {
        position: fixed;
        inset: 0;
        z-index: 100000;
        pointer-events: none;
      }
      
      .tutorial-overlay * {
        pointer-events: auto;
      }
      
      .tutorial-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(2px);
        animation: tutorialBackdropFadeIn 0.3s ease-out;
      }
      
      @keyframes tutorialBackdropFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .tutorial-highlight {
        position: absolute;
        border: 3px solid var(--accent-color, #4a9eff);
        border-radius: 8px;
        box-shadow: 0 0 0 2000px rgba(0, 0, 0, 0.7),
                    0 0 20px var(--accent-color, #4a9eff);
        animation: tutorialHighlightPulse 2s ease-in-out infinite;
        pointer-events: none;
      }
      
      @keyframes tutorialHighlightPulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.02); opacity: 0.9; }
      }
      
      .tutorial-tooltip {
        position: fixed;
        max-width: 400px;
        background: var(--surface-2, #2a2a2a);
        border: 2px solid var(--accent-color, #4a9eff);
        border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
        animation: tutorialTooltipEnter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      
      @keyframes tutorialTooltipEnter {
        from {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.8);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
      }
      
      .tutorial-tooltip__content {
        padding: 24px;
      }
      
      .tutorial-tooltip__progress {
        font-size: 12px;
        color: var(--accent-color, #4a9eff);
        font-weight: 600;
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .tutorial-tooltip__title {
        margin: 0 0 12px 0;
        font-size: 20px;
        font-weight: 600;
        color: var(--text-primary, #ffffff);
      }
      
      .tutorial-tooltip__description {
        margin: 0 0 20px 0;
        font-size: 14px;
        line-height: 1.6;
        color: var(--text-secondary, #999);
      }
      
      .tutorial-tooltip__waiting {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: var(--surface-3, #1a1a1a);
        border-radius: 6px;
        font-size: 13px;
        color: var(--text-secondary, #999);
      }
      
      .tutorial-spinner {
        width: 20px;
        height: 20px;
        border: 3px solid var(--surface-4, #333);
        border-top-color: var(--accent-color, #4a9eff);
        border-radius: 50%;
        animation: tutorialSpinnerSpin 0.8s linear infinite;
      }
      
      @keyframes tutorialSpinnerSpin {
        to { transform: rotate(360deg); }
      }
      
      .tutorial-tooltip__actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
      
      .tutorial-tooltip__button {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .tutorial-tooltip__button--primary {
        background: var(--accent-color, #4a9eff);
        color: white;
      }
      
      .tutorial-tooltip__button--primary:hover {
        background: var(--accent-hover, #3a8eef);
        transform: translateY(-1px);
      }
      
      .tutorial-tooltip__button--secondary {
        background: var(--surface-3, #1a1a1a);
        color: var(--text-secondary, #999);
        border: 1px solid var(--border-color, #3a3a3a);
      }
      
      .tutorial-tooltip__button--secondary:hover {
        color: var(--text-primary, #ffffff);
        border-color: var(--accent-color, #4a9eff);
      }
    `;
    
    document.head.appendChild(style);
  }
}

// --------------------------------------------------------------------------
// Singleton
// --------------------------------------------------------------------------

let tutorialManagerInstance: TutorialManager | null = null;

export function getTutorialManager(): TutorialManager {
  if (!tutorialManagerInstance) {
    tutorialManagerInstance = new TutorialManager();
  }
  return tutorialManagerInstance;
}

// --------------------------------------------------------------------------
// Helper Functions
// --------------------------------------------------------------------------

export function startTutorial(tutorialId: string): void {
  getTutorialManager().startTutorial(tutorialId);
}

export function getTutorialById(tutorialId: string): Tutorial | undefined {
  return TUTORIALS.find(t => t.id === tutorialId);
}

export function getTutorialsByCategory(category: Tutorial['category']): Tutorial[] {
  return TUTORIALS.filter(t => t.category === category);
}
