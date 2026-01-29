/**
 * @fileoverview Board Theme Applier
 * 
 * Applies board-specific theme overrides to create beautiful, distinctive
 * visual experiences for each board type.
 * 
 * Uses the centralized theme system from src/boards/theme/
 */

import type { Board } from '../types';
import { getBoardTheme } from '../theme/board-theme-defaults';
import { 
  applyBoardTheme as applyTheme,
  applyControlLevelColors 
} from '../theme/theme-applier';

export function applyBoardTheme(board: Board): void {
  // Get the complete theme for this board
  const theme = board.theme ?? getBoardTheme(board.controlLevel, board.id);
  
  // Apply theme to DOM
  applyTheme(theme);
  
  // Apply control level colors
  applyControlLevelColors(board.controlLevel);
  
  // Set data attributes for CSS targeting
  document.body.setAttribute('data-board-id', board.id);
  document.body.setAttribute('data-control-level', board.controlLevel);
  if (board.category) {
    document.body.setAttribute('data-board-category', board.category);
  }
}

export function clearBoardTheme(): void {
  const root = document.documentElement;
  
  // Remove all board theme properties
  const boardProperties = [
    '--board-primary',
    '--board-secondary',
    '--board-accent',
    '--board-background',
    '--board-font-family',
    '--board-font-size',
    '--board-show-hints',
    '--board-show-suggestions',
    '--board-show-generative',
    '--control-level-primary',
    '--control-level-secondary',
    '--control-level-accent',
    '--control-level-background',
    '--control-level-text',
    '--control-level-badge',
  ];
  
  for (const prop of boardProperties) {
    root.style.removeProperty(prop);
  }
  
  // Remove data attributes
  document.body.removeAttribute('data-board-id');
  document.body.removeAttribute('data-control-level');
  document.body.removeAttribute('data-board-category');
}

export function injectBoardThemeStyles(): void {
  const styleId = 'cardplay-board-theme-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .control-level-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .board-chrome {
      border-bottom: 2px solid var(--board-primary, #ccc);
      padding: 0.75rem 1rem;
    }
  `;
  document.head.appendChild(style);
}
