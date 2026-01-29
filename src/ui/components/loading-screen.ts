/**
 * @fileoverview Beautiful loading screen for CardPlay
 * 
 * Shows an elegant loading animation while the application initializes.
 */

import { fadeIn, fadeOut, duration } from '../animations';

export interface LoadingScreenOptions {
  message?: string;
  showProgress?: boolean;
}

export function createLoadingScreen(options: LoadingScreenOptions = {}): HTMLElement {
  const {
    message = 'Loading CardPlay...',
    showProgress = false
  } = options;
  
  const container = document.createElement('div');
  container.className = 'loading-screen';
  
  // Animated logo/icon
  const logo = document.createElement('div');
  logo.className = 'loading-screen__logo';
  logo.textContent = '🎵';
  container.appendChild(logo);
  
  // Loading message
  const messageEl = document.createElement('div');
  messageEl.className = 'loading-screen__message';
  messageEl.textContent = message;
  container.appendChild(messageEl);
  
  // Animated spinner
  const spinner = document.createElement('div');
  spinner.className = 'loading-screen__spinner';
  
  // Create spinner dots
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('div');
    dot.className = 'loading-screen__dot';
    dot.style.animationDelay = `${i * 0.15}s`;
    spinner.appendChild(dot);
  }
  
  container.appendChild(spinner);
  
  // Optional progress bar
  if (showProgress) {
    const progressContainer = document.createElement('div');
    progressContainer.className = 'loading-screen__progress';
    
    const progressBar = document.createElement('div');
    progressBar.className = 'loading-screen__progress-bar';
    progressContainer.appendChild(progressBar);
    
    container.appendChild(progressContainer);
  }
  
  // Inject styles
  injectLoadingScreenStyles();
  
  // Animate entrance
  fadeIn(container, duration.normal);
  
  return container;
}

/**
 * Remove loading screen with fade out animation
 */
export function removeLoadingScreen(container: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const animation = fadeOut(container, duration.normal);
    animation.onfinish = () => {
      container.remove();
      resolve();
    };
  });
}

/**
 * Update loading message
 */
export function updateLoadingMessage(container: HTMLElement, message: string): void {
  const messageEl = container.querySelector('.loading-screen__message');
  if (messageEl) {
    messageEl.textContent = message;
  }
}

/**
 * Update loading progress (0-100)
 */
export function updateLoadingProgress(container: HTMLElement, progress: number): void {
  const progressBar = container.querySelector('.loading-screen__progress-bar') as HTMLElement;
  if (progressBar) {
    progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  }
}

let stylesInjected = false;

function injectLoadingScreenStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  
  const style = document.createElement('style');
  style.textContent = `
    .loading-screen {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      z-index: 10000;
      color: white;
    }
    
    .loading-screen__logo {
      font-size: 4rem;
      animation: loading-pulse 2s ease-in-out infinite;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
    }
    
    @keyframes loading-pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.1);
        opacity: 0.8;
      }
    }
    
    .loading-screen__message {
      font-size: 1.25rem;
      font-weight: 500;
      text-align: center;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      animation: loading-fade 2s ease-in-out infinite;
    }
    
    @keyframes loading-fade {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.6;
      }
    }
    
    .loading-screen__spinner {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    
    .loading-screen__dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: white;
      animation: loading-bounce 1.4s ease-in-out infinite;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    @keyframes loading-bounce {
      0%, 80%, 100% {
        transform: scale(0);
        opacity: 0.5;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }
    
    .loading-screen__progress {
      width: 300px;
      height: 4px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 2px;
      overflow: hidden;
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
    }
    
    .loading-screen__progress-bar {
      height: 100%;
      background: linear-gradient(90deg, 
        rgba(255, 255, 255, 0.8) 0%,
        rgba(255, 255, 255, 1) 50%,
        rgba(255, 255, 255, 0.8) 100%
      );
      background-size: 200% 100%;
      animation: loading-progress-shimmer 1.5s ease-in-out infinite;
      border-radius: 2px;
      transition: width 0.3s ease;
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
    }
    
    @keyframes loading-progress-shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
    
    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .loading-screen__logo,
      .loading-screen__message,
      .loading-screen__dot,
      .loading-screen__progress-bar {
        animation: none !important;
      }
      
      .loading-screen__dot {
        opacity: 1;
        transform: scale(1);
      }
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Show loading screen during async operation
 */
export async function withLoadingScreen<T>(
  operation: () => Promise<T>,
  options: LoadingScreenOptions = {}
): Promise<T> {
  const loadingScreen = createLoadingScreen(options);
  document.body.appendChild(loadingScreen);
  
  try {
    const result = await operation();
    await removeLoadingScreen(loadingScreen);
    return result;
  } catch (error) {
    await removeLoadingScreen(loadingScreen);
    throw error;
  }
}
