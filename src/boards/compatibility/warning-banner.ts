/**
 * @fileoverview Compatibility Warning Banner
 * 
 * Shows a banner when project uses tools/cards disabled in current board,
 * with one-click action to switch to a recommended board.
 */

import type { CompatibilityCheckResult } from './project-compatibility';
import { switchBoard } from '../switching/switch-board';

let stylesInjected = false;

function injectStyles(): void {
  if (stylesInjected) return;
  stylesInjected = true;
  
  const style = document.createElement('style');
  style.textContent = `
.compatibility-warning-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: var(--color-warning-bg, #fff3cd);
  border-bottom: 1px solid var(--color-warning-border, #ffc107);
  color: var(--color-warning-text, #856404);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  z-index: 1000;
  font-size: 14px;
  line-height: 1.5;
}

.compatibility-warning-banner__message {
  flex: 1;
}

.compatibility-warning-banner__actions {
  display: flex;
  gap: 8px;
}

.compatibility-warning-banner__button {
  background: var(--color-warning-button-bg, #ffc107);
  color: var(--color-warning-button-text, #000);
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}

.compatibility-warning-banner__button:hover {
  background: var(--color-warning-button-hover, #e0a800);
}

.compatibility-warning-banner__button--secondary {
  background: transparent;
  color: var(--color-warning-text, #856404);
  border: 1px solid var(--color-warning-border, #ffc107);
}

.compatibility-warning-banner__button--secondary:hover {
  background: var(--color-warning-button-secondary-hover, rgba(255, 193, 7, 0.1));
}
`;
  document.head.appendChild(style);
}

/**
 * Create and show compatibility warning banner
 */
export function showCompatibilityWarning(
  result: CompatibilityCheckResult,
  onDismiss?: () => void
): HTMLElement {
  injectStyles();
  
  const banner = document.createElement('div');
  banner.className = 'compatibility-warning-banner';
  banner.setAttribute('role', 'alert');
  banner.setAttribute('aria-live', 'polite');
  
  const message = document.createElement('div');
  message.className = 'compatibility-warning-banner__message';
  
  const issueCount = result.issues.length;
  const plural = issueCount === 1 ? '' : 's';
  const toolsList = result.issues
    .map(i => i.itemId)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 3)
    .join(', ');
  
  message.textContent = `This project uses ${issueCount} disabled tool${plural} (${toolsList}${
    issueCount > 3 ? ', ...' : ''
  }). Some features may not be available.`;
  
  banner.appendChild(message);
  
  const actions = document.createElement('div');
  actions.className = 'compatibility-warning-banner__actions';
  
  // "Switch Board" button
  if (result.recommendedBoardId) {
    const switchButton = document.createElement('button');
    switchButton.className = 'compatibility-warning-banner__button';
    switchButton.textContent = 'Switch to Recommended Board';
    switchButton.onclick = () => {
      switchBoard(result.recommendedBoardId!, {
        resetLayout: false,
        resetDecks: false,
        preserveActiveContext: true,
        preserveTransport: true,
      });
      banner.remove();
    };
    actions.appendChild(switchButton);
  }
  
  // "Dismiss" button
  const dismissButton = document.createElement('button');
  dismissButton.className = 'compatibility-warning-banner__button compatibility-warning-banner__button--secondary';
  dismissButton.textContent = 'Dismiss';
  dismissButton.onclick = () => {
    banner.remove();
    onDismiss?.();
  };
  actions.appendChild(dismissButton);
  
  banner.appendChild(actions);
  
  return banner;
}

/**
 * Remove compatibility warning banner if shown
 */
export function hideCompatibilityWarning(): void {
  const banner = document.querySelector('.compatibility-warning-banner');
  if (banner) {
    banner.remove();
  }
}
