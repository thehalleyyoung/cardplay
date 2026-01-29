/**
 * CardPlay Demo Application
 * 
 * Beautiful browser-based entry point showcasing the board system.
 */

import { initializeBoardSystem } from '../boards/init';
import { getBoardStateStore } from '../boards/store/store';
import { createBoardHost } from '../ui/components/board-host';
import { createFirstRunSelection, injectFirstRunStyles } from '../ui/components/first-run-board-selection';
import { injectBoardHostStyles } from '../ui/components/board-host';
import { injectBoardSwitcherStyles } from '../ui/components/board-switcher';
import { injectBoardThemeStyles } from '../boards/ui/theme-applier';
import { createNewProject } from '../boards/project/create';
import { createTestPanel } from '../ui/components/test-panel';

/**
 * Main application initialization
 */
async function main() {
  console.log('[CardPlay] Starting application...');
  
  // Step 1: Initialize the board system (registers factories and boards)
  initializeBoardSystem();
  
  // Step 2: Inject global styles
  injectFirstRunStyles();
  injectBoardHostStyles();
  injectBoardSwitcherStyles();
  injectBoardThemeStyles();  // Phase J: Beautiful board theme styling
  
  // Step 3: Get the app container
  const app = document.getElementById('app');
  if (!app) {
    throw new Error('App container not found');
  }
  
  // Step 4: Check if this is first run
  const store = getBoardStateStore();
  const state = store.getState();
  
  if (!state.firstRunCompleted) {
    // Show first-run selection
    console.log('[CardPlay] First run detected - showing board selection');
    
    const firstRun = createFirstRunSelection({
      onComplete: (boardId) => {
        console.log('[CardPlay] Board selected:', boardId);
        initializeProject();
        mountBoardHost(app);
      },
      onSkip: () => {
        console.log('[CardPlay] First run skipped');
        initializeProject();
        mountBoardHost(app);
      }
    });
    
    app.innerHTML = '';
    app.appendChild(firstRun);
  } else {
    // Normal startup
    console.log('[CardPlay] Resuming previous session');
    
    // Ensure we have a project
    if (!state.currentBoardId) {
      initializeProject();
    }
    
    mountBoardHost(app);
  }
}

/**
 * Initialize a new project with default content
 */
function initializeProject() {
  console.log('[CardPlay] Initializing project...');
  createNewProject();
}

/**
 * Mount the board host (main application UI)
 */
function mountBoardHost(container: HTMLElement) {
  console.log('[CardPlay] Mounting board host...');
  
  const boardHost = createBoardHost();
  
  container.innerHTML = '';
  container.appendChild(boardHost);
  
  // Add test panel for manual testing (A068-A075)
  const testPanel = createTestPanel();
  document.body.appendChild(testPanel);
  
  console.log('[CardPlay] Application ready!');
}

// Start the application
main().catch(error => {
  console.error('[CardPlay] Fatal error during initialization:', error);
  
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = `
      <div class="loading">
        <div style="color: #f44; font-size: 3rem;">⚠️</div>
        <div class="loading__text" style="color: #f44;">
          Failed to initialize CardPlay
        </div>
        <div style="color: rgba(255,255,255,0.4); font-size: 0.875rem; max-width: 500px; text-align: center; padding: 1rem;">
          ${error.message}
        </div>
      </div>
    `;
  }
});
