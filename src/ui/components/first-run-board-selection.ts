/**
 * First-Run Board Selection
 * 
 * New user flow for selecting an initial board based on persona/intent.
 */

import { getBoardStateStore } from '../../boards/store/store';
import { getBoardRegistry } from '../../boards/registry';
import { switchBoard } from '../../boards/switching/switch-board';
import { getRecommendedBoards } from '../../boards/recommendations';
import type { UserType } from '../../boards/recommendations';
import type { Board } from '../../boards/types';

export interface FirstRunSelectionOptions {
  onComplete?: (boardId: string) => void;
  onSkip?: () => void;
  userType?: UserType; // For testing: skip to board selection
}

export function createFirstRunSelection(options: FirstRunSelectionOptions = {}): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'first-run-overlay';
  
  const modal = document.createElement('div');
  modal.className = 'first-run';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-labelledby', 'first-run-title');
  modal.setAttribute('aria-modal', 'true');
  overlay.appendChild(modal);
  
  const store = getBoardStateStore();
  const registry = getBoardRegistry();
  
  let selectedUserType: UserType | null = options.userType ?? null;
  let step: 'intro' | 'select-persona' | 'show-boards' = options.userType ? 'show-boards' : 'intro';
  
  const userTypeLabels: Record<UserType, { title: string; description: string; icon: string }> = {
    'notation-composer': {
      title: 'Traditional Composer',
      description: 'Score-based composition, notation-first workflow',
      icon: '🎼'
    },
    'tracker-user': {
      title: 'Tracker User',
      description: 'Pattern-based sequencing, tracker-style interface',
      icon: '🎹'
    },
    'producer': {
      title: 'Producer / Beatmaker',
      description: 'Session view, arrangement, mixing workflow',
      icon: '🎚️'
    },
    'sound-designer': {
      title: 'Sound Designer',
      description: 'Modular routing, synthesis, effects chains',
      icon: '🔊'
    },
    'beginner': {
      title: 'Learning / Exploring',
      description: 'Guided workflow with hints and helpers',
      icon: '🎓'
    },
    'live-performer': {
      title: 'Live Performer',
      description: 'Performance-optimized, real-time control',
      icon: '🎤'
    },
    'ai-explorer': {
      title: 'AI Explorer',
      description: 'Generative and AI-assisted composition',
      icon: '🤖'
    },
  };
  
  function handleSelectUserType(userType: UserType) {
    selectedUserType = userType;
    step = 'show-boards';
    render();
  }
  
  function handleSelectBoard(boardId: string) {
    switchBoard(boardId, {
      preserveActiveContext: false,
      preserveTransport: true,
    });
    
    store.setFirstRunCompleted();
    
    if (options.onComplete) {
      options.onComplete(boardId);
    }
    
    close();
  }
  
  function handleSkip() {
    store.setFirstRunCompleted();
    
    if (options.onSkip) {
      options.onSkip();
    }
    
    close();
  }
  
  function close() {
    overlay.remove();
  }
  
  function render() {
    if (step === 'intro') {
      modal.innerHTML = `
        <div class="first-run__content">
          <h1 id="first-run-title" class="first-run__title">Welcome to CardPlay</h1>
          
          <p class="first-run__intro">
            CardPlay offers different <strong>boards</strong> for different workflows—from pure manual control 
            to AI-assisted composition. Each board provides the right tools and UI for your style.
          </p>
          
          <div class="first-run__spectrum">
            <div class="first-run__spectrum-label first-run__spectrum-label--start">Full Manual</div>
            <div class="first-run__spectrum-bar">
              <div class="first-run__spectrum-segment" style="background: #4a6fa5;"></div>
              <div class="first-run__spectrum-segment" style="background: #5a8fbb;"></div>
              <div class="first-run__spectrum-segment" style="background: #6aafcc;"></div>
              <div class="first-run__spectrum-segment" style="background: #7acfdd;"></div>
              <div class="first-run__spectrum-segment" style="background: #8aefee;"></div>
            </div>
            <div class="first-run__spectrum-label first-run__spectrum-label--end">Fully Generative</div>
          </div>
          
          <p class="first-run__hint">
            You can switch boards anytime—your music data stays the same.
          </p>
          
          <div class="first-run__actions">
            <button class="first-run__btn first-run__btn--primary" data-action="next">
              Choose Your Workflow
            </button>
            <button class="first-run__btn first-run__btn--secondary" data-action="skip">
              Skip for Now
            </button>
          </div>
        </div>
      `;
    } else if (step === 'select-persona') {
      modal.innerHTML = `
        <div class="first-run__content">
          <h1 id="first-run-title" class="first-run__title">What Brings You Here?</h1>
          
          <p class="first-run__intro">
            Select the workflow that best matches your goals:
          </p>
          
          <div class="first-run__personas">
            ${Object.entries(userTypeLabels).map(([userType, info]) => `
              <button 
                class="first-run__persona" 
                data-action="select-persona"
                data-user-type="${userType}"
              >
                <span class="first-run__persona-icon">${info.icon}</span>
                <div class="first-run__persona-info">
                  <h3 class="first-run__persona-title">${info.title}</h3>
                  <p class="first-run__persona-desc">${info.description}</p>
                </div>
              </button>
            `).join('')}
          </div>
          
          <div class="first-run__actions">
            <button class="first-run__btn first-run__btn--secondary" data-action="back">
              Back
            </button>
            <button class="first-run__btn first-run__btn--secondary" data-action="skip">
              Skip for Now
            </button>
          </div>
        </div>
      `;
    } else if (step === 'show-boards' && selectedUserType) {
      const recommendedBoards = getRecommendedBoards(selectedUserType, registry);
      
      modal.innerHTML = `
        <div class="first-run__content">
          <h1 id="first-run-title" class="first-run__title">Recommended Boards</h1>
          
          <p class="first-run__intro">
            Based on your selection, here are the best boards to start with:
          </p>
          
          <div class="first-run__boards">
            ${recommendedBoards.map((board: Board) => `
              <button 
                class="first-run__board" 
                data-action="select-board"
                data-board-id="${board.id}"
              >
                ${board.icon ? `<span class="first-run__board-icon">${board.icon}</span>` : ''}
                <div class="first-run__board-info">
                  <h3 class="first-run__board-title">${board.name}</h3>
                  <p class="first-run__board-desc">${board.description || ''}</p>
                  <span class="first-run__board-level">${board.controlLevel}</span>
                </div>
              </button>
            `).join('')}
          </div>
          
          ${recommendedBoards.length === 0 ? `
            <p class="first-run__no-boards">
              No boards available for this workflow yet. You can explore all boards from the browser.
            </p>
          ` : ''}
          
          <div class="first-run__actions">
            <button class="first-run__btn first-run__btn--secondary" data-action="back">
              Back
            </button>
            <button class="first-run__btn first-run__btn--secondary" data-action="browse">
              Browse All Boards
            </button>
            <button class="first-run__btn first-run__btn--secondary" data-action="skip">
              Skip for Now
            </button>
          </div>
        </div>
      `;
    }
    
    // Bind events
    modal.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = (btn as HTMLElement).dataset.action;
        
        switch (action) {
          case 'next':
            step = 'select-persona';
            render();
            break;
            
          case 'back':
            step = step === 'show-boards' ? 'select-persona' : 'intro';
            render();
            break;
            
          case 'select-persona': {
            const userType = (btn as HTMLElement).dataset.userType as UserType;
            handleSelectUserType(userType);
            break;
          }
          
          case 'select-board': {
            const boardId = (btn as HTMLElement).dataset.boardId;
            if (boardId) {
              handleSelectBoard(boardId);
            }
            break;
          }
          
          case 'browse':
            // TODO: Open board browser
            handleSkip();
            break;
            
          case 'skip':
            handleSkip();
            break;
        }
      });
    });
  }
  
  // Initial render
  render();
  
  // Add destroy method
  Object.assign(overlay, {
    destroy: () => {
      // Cleanup subscriptions if any
    }
  });
  
  return overlay;
}

// Inject styles
let stylesInjected = false;

export function injectFirstRunStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  
  const style = document.createElement('style');
  style.textContent = `
    .first-run-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    }
    
    .first-run {
      background: var(--surface-color, #2a2a2a);
      border-radius: 0.5rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
      width: 90%;
      max-width: 800px;
      max-height: 90vh;
      overflow: auto;
    }
    
    .first-run__content {
      padding: 3rem 2rem;
    }
    
    .first-run__title {
      margin: 0 0 1.5rem 0;
      font-size: 2rem;
      font-weight: 600;
      text-align: center;
    }
    
    .first-run__intro {
      margin: 0 0 2rem 0;
      font-size: 1.125rem;
      line-height: 1.6;
      text-align: center;
      color: var(--text-muted, #ccc);
    }
    
    .first-run__spectrum {
      margin: 2rem 0;
      padding: 1.5rem;
      background: var(--card-bg, #333);
      border-radius: 0.5rem;
    }
    
    .first-run__spectrum-bar {
      display: flex;
      height: 2rem;
      border-radius: 0.5rem;
      overflow: hidden;
      margin: 1rem 0;
    }
    
    .first-run__spectrum-segment {
      flex: 1;
    }
    
    .first-run__spectrum-label {
      font-size: 0.875rem;
      color: var(--text-muted, #999);
    }
    
    .first-run__spectrum-label--start {
      text-align: left;
    }
    
    .first-run__spectrum-label--end {
      text-align: right;
    }
    
    .first-run__hint {
      margin: 1.5rem 0;
      font-size: 0.875rem;
      text-align: center;
      color: var(--text-muted, #999);
      font-style: italic;
    }
    
    .first-run__personas {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin: 2rem 0;
    }
    
    .first-run__persona {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: var(--card-bg, #333);
      border: 2px solid var(--border-color, #444);
      border-radius: 0.5rem;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .first-run__persona:hover {
      border-color: var(--accent-color, #4a90e2);
      background: var(--card-hover-bg, #3a3a3a);
      transform: translateY(-2px);
    }
    
    .first-run__persona-icon {
      font-size: 3rem;
      flex-shrink: 0;
    }
    
    .first-run__persona-info {
      flex: 1;
    }
    
    .first-run__persona-title {
      margin: 0 0 0.5rem 0;
      font-size: 1.125rem;
      font-weight: 600;
    }
    
    .first-run__persona-desc {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-muted, #ccc);
      line-height: 1.4;
    }
    
    .first-run__boards {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin: 2rem 0;
    }
    
    .first-run__board {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 1.5rem;
      background: var(--card-bg, #333);
      border: 2px solid var(--border-color, #444);
      border-radius: 0.5rem;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .first-run__board:hover {
      border-color: var(--accent-color, #4a90e2);
      background: var(--card-hover-bg, #3a3a3a);
      transform: translateX(4px);
    }
    
    .first-run__board-icon {
      font-size: 3rem;
      flex-shrink: 0;
    }
    
    .first-run__board-info {
      flex: 1;
    }
    
    .first-run__board-title {
      margin: 0 0 0.5rem 0;
      font-size: 1.25rem;
      font-weight: 600;
    }
    
    .first-run__board-desc {
      margin: 0 0 0.75rem 0;
      font-size: 0.875rem;
      color: var(--text-muted, #ccc);
      line-height: 1.4;
    }
    
    .first-run__board-level {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      background: var(--badge-bg, #444);
      font-size: 0.75rem;
    }
    
    .first-run__no-boards {
      text-align: center;
      padding: 2rem;
      color: var(--text-muted, #999);
    }
    
    .first-run__actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 2rem;
    }
    
    .first-run__btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.375rem;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .first-run__btn--primary {
      background: var(--primary-bg, #4a90e2);
      color: #fff;
    }
    
    .first-run__btn--primary:hover {
      background: var(--primary-hover, #3a7bc8);
    }
    
    .first-run__btn--secondary {
      background: var(--button-bg, #444);
      color: var(--text-color, #fff);
      border: 1px solid var(--border-color, #555);
    }
    
    .first-run__btn--secondary:hover {
      background: var(--button-hover-bg, #555);
    }
  `;
  
  document.head.appendChild(style);
}
