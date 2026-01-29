/**
 * @fileoverview Control Level Indicator Component
 * 
 * Displays control level badges and color-coded indicators for tracks/decks.
 * J042-J045: Show per-track control level in UI.
 * 
 * @module @cardplay/ui/components/control-level-indicator
 */

import type { ControlLevel } from '../../boards/types';
import { getControlLevelColor } from '../../boards/theme/control-level-colors';

// ============================================================================
// CONTROL LEVEL INDICATOR
// ============================================================================

export interface ControlLevelIndicatorOptions {
  /** Control level to display */
  level: ControlLevel;
  
  /** Display format */
  format?: 'badge' | 'bar' | 'dot' | 'icon';
  
  /** Size */
  size?: 'small' | 'medium' | 'large';
  
  /** Show label text */
  showLabel?: boolean;
  
  /** Interactive (allow clicking to change) */
  interactive?: boolean;
  
  /** Click callback */
  onClick?: (level: ControlLevel) => void;
}

/**
 * Creates a control level indicator element.
 * J042-J045: Visual indicator for per-track control levels.
 */
export function createControlLevelIndicator(
  options: ControlLevelIndicatorOptions
): HTMLElement {
  const {
    level,
    format = 'badge',
    size = 'medium',
    showLabel = true,
    interactive = false,
    onClick,
  } = options;

  const container = document.createElement('div');
  container.className = `control-level-indicator control-level-indicator--${format} control-level-indicator--${size}`;
  container.dataset.level = level;
  
  if (interactive) {
    container.classList.add('control-level-indicator--interactive');
    container.setAttribute('role', 'button');
    container.setAttribute('tabindex', '0');
    container.setAttribute('aria-label', `Control level: ${getLevelLabel(level)}`);
  } else {
    container.setAttribute('aria-label', getLevelLabel(level));
  }

  // Get theme color
  const color = getControlLevelColor(level);
  
  // Render based on format
  switch (format) {
    case 'badge':
      renderBadge(container, level, color, showLabel);
      break;
    case 'bar':
      renderBar(container, level, color);
      break;
    case 'dot':
      renderDot(container, level, color);
      break;
    case 'icon':
      renderIcon(container, level, color, showLabel);
      break;
  }

  // Handle interaction
  if (interactive && onClick) {
    container.addEventListener('click', () => onClick(level));
    container.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick(level);
      }
    });
  }

  return container;
}

/**
 * Renders a badge-style indicator.
 * J042: Compact badge for session headers and mixer strips.
 */
function renderBadge(
  container: HTMLElement,
  level: ControlLevel,
  color: string,
  showLabel: boolean
): void {
  container.style.backgroundColor = color;
  container.style.color = getContrastColor(color);
  container.style.padding = '2px 8px';
  container.style.borderRadius = '12px';
  container.style.fontSize = '11px';
  container.style.fontWeight = '600';
  container.style.display = 'inline-flex';
  container.style.alignItems = 'center';
  container.style.gap = '4px';
  container.style.whiteSpace = 'nowrap';
  
  if (showLabel) {
    container.textContent = getShortLabel(level);
  } else {
    container.textContent = getInitial(level);
    container.style.width = '20px';
    container.style.height = '20px';
    container.style.justifyContent = 'center';
  }
}

/**
 * Renders a color bar indicator.
 * J043-J044: Color bar for tracker and arrangement track headers.
 */
function renderBar(
  container: HTMLElement,
  _level: ControlLevel,
  color: string
): void {
  container.style.backgroundColor = color;
  container.style.width = '4px';
  container.style.height = '100%';
  container.style.flexShrink = '0';
  container.style.borderRadius = '2px';
}

/**
 * Renders a dot indicator.
 * J042: Minimal dot for compact views.
 */
function renderDot(
  container: HTMLElement,
  _level: ControlLevel,
  color: string
): void {
  container.style.backgroundColor = color;
  container.style.width = '8px';
  container.style.height = '8px';
  container.style.borderRadius = '50%';
  container.style.flexShrink = '0';
}

/**
 * Renders an icon-style indicator.
 * J042: Icon + label for properties panels.
 */
function renderIcon(
  container: HTMLElement,
  level: ControlLevel,
  color: string,
  showLabel: boolean
): void {
  container.style.display = 'inline-flex';
  container.style.alignItems = 'center';
  container.style.gap = '6px';
  container.style.fontSize = '13px';
  
  const icon = document.createElement('span');
  icon.textContent = getIcon(level);
  icon.style.color = color;
  icon.style.fontSize = '16px';
  container.appendChild(icon);
  
  if (showLabel) {
    const label = document.createElement('span');
    label.textContent = getLevelLabel(level);
    label.style.color = color;
    container.appendChild(label);
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Gets full label for control level.
 */
function getLevelLabel(level: ControlLevel): string {
  switch (level) {
    case 'full-manual':
      return 'Full Manual';
    case 'manual-with-hints':
      return 'Manual + Hints';
    case 'assisted':
      return 'Assisted';
    case 'collaborative':
      return 'Collaborative';
    case 'directed':
      return 'Directed';
    case 'generative':
      return 'Generative';
  }
}

/**
 * Gets short label for control level.
 */
function getShortLabel(level: ControlLevel): string {
  switch (level) {
    case 'full-manual':
      return 'Manual';
    case 'manual-with-hints':
      return 'Hints';
    case 'assisted':
      return 'Assisted';
    case 'collaborative':
      return 'Collab';
    case 'directed':
      return 'Directed';
    case 'generative':
      return 'Generate';
  }
}

/**
 * Gets initial letter for control level.
 */
function getInitial(level: ControlLevel): string {
  switch (level) {
    case 'full-manual':
      return 'M';
    case 'manual-with-hints':
      return 'H';
    case 'assisted':
      return 'A';
    case 'collaborative':
      return 'C';
    case 'directed':
      return 'D';
    case 'generative':
      return 'G';
  }
}

/**
 * Gets icon character for control level.
 */
function getIcon(level: ControlLevel): string {
  switch (level) {
    case 'full-manual':
      return '✏️';
    case 'manual-with-hints':
      return '💡';
    case 'assisted':
      return '🤝';
    case 'collaborative':
      return '⚖️';
    case 'directed':
      return '🎯';
    case 'generative':
      return '✨';
  }
}

/**
 * Gets contrasting color for text on background.
 */
function getContrastColor(_backgroundColor: string): string {
  // Simple luminance check - in production would use proper contrast calculation
  // For now, assume darker colors need light text
  return '#ffffff';
}

// ============================================================================
// CONTROL LEVEL PICKER
// ============================================================================

export interface ControlLevelPickerOptions {
  /** Current level */
  currentLevel: ControlLevel;
  
  /** Available levels (default: all) */
  availableLevels?: ControlLevel[];
  
  /** Change callback */
  onChange: (level: ControlLevel) => void;
  
  /** Size */
  size?: 'small' | 'medium' | 'large';
}

const ALL_CONTROL_LEVELS: ControlLevel[] = [
  'full-manual',
  'manual-with-hints',
  'assisted',
  'collaborative',
  'directed',
  'generative',
];

/**
 * Creates a control level picker dropdown.
 * J041: Allow changing per-track control level.
 */
export function createControlLevelPicker(
  options: ControlLevelPickerOptions
): HTMLElement {
  const {
    currentLevel,
    availableLevels = ALL_CONTROL_LEVELS,
    onChange,
    size = 'medium',
  } = options;

  const container = document.createElement('div');
  container.className = `control-level-picker control-level-picker--${size}`;
  container.style.position = 'relative';
  container.style.display = 'inline-block';

  // Current level button
  const button = document.createElement('button');
  button.className = 'control-level-picker__button';
  button.type = 'button';
  button.setAttribute('aria-haspopup', 'listbox');
  button.setAttribute('aria-expanded', 'false');
  
  const indicator = createControlLevelIndicator({
    level: currentLevel,
    format: 'badge',
    size,
    showLabel: true,
    interactive: false,
  });
  button.appendChild(indicator);
  
  const arrow = document.createElement('span');
  arrow.textContent = '▼';
  arrow.style.marginLeft = '4px';
  arrow.style.fontSize = '10px';
  button.appendChild(arrow);
  
  container.appendChild(button);

  // Dropdown menu
  const menu = document.createElement('div');
  menu.className = 'control-level-picker__menu';
  menu.setAttribute('role', 'listbox');
  menu.style.display = 'none';
  menu.style.position = 'absolute';
  menu.style.top = '100%';
  menu.style.left = '0';
  menu.style.marginTop = '4px';
  menu.style.backgroundColor = '#ffffff';
  menu.style.border = '1px solid #ddd';
  menu.style.borderRadius = '4px';
  menu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
  menu.style.zIndex = '1000';
  menu.style.minWidth = '180px';

  availableLevels.forEach(level => {
    const option = document.createElement('button');
    option.className = 'control-level-picker__option';
    option.type = 'button';
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', level === currentLevel ? 'true' : 'false');
    option.style.width = '100%';
    option.style.padding = '8px 12px';
    option.style.border = 'none';
    option.style.background = 'none';
    option.style.textAlign = 'left';
    option.style.cursor = 'pointer';
    option.style.display = 'flex';
    option.style.alignItems = 'center';
    option.style.gap = '8px';
    
    if (level === currentLevel) {
      option.style.backgroundColor = '#f0f0f0';
    }
    
    const optionIndicator = createControlLevelIndicator({
      level,
      format: 'badge',
      size: 'small',
      showLabel: true,
      interactive: false,
    });
    option.appendChild(optionIndicator);
    
    option.addEventListener('click', () => {
      onChange(level);
      menu.style.display = 'none';
      button.setAttribute('aria-expanded', 'false');
    });
    
    option.addEventListener('mouseenter', () => {
      option.style.backgroundColor = '#f8f8f8';
    });
    
    option.addEventListener('mouseleave', () => {
      option.style.backgroundColor = level === currentLevel ? '#f0f0f0' : '';
    });
    
    menu.appendChild(option);
  });

  container.appendChild(menu);

  // Toggle menu
  button.addEventListener('click', () => {
    const isOpen = menu.style.display === 'block';
    menu.style.display = isOpen ? 'none' : 'block';
    button.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target as Node)) {
      menu.style.display = 'none';
      button.setAttribute('aria-expanded', 'false');
    }
  });

  return container;
}

/**
 * Updates control level indicator when level changes.
 */
export function updateControlLevelIndicator(
  element: HTMLElement,
  newLevel: ControlLevel
): void {
  element.dataset.level = newLevel;
  const color = getControlLevelColor(newLevel);
  
  if (element.classList.contains('control-level-indicator--badge')) {
    element.style.backgroundColor = color;
    element.textContent = getShortLabel(newLevel);
  } else if (element.classList.contains('control-level-indicator--bar')) {
    element.style.backgroundColor = color;
  } else if (element.classList.contains('control-level-indicator--dot')) {
    element.style.backgroundColor = color;
  }
  
  element.setAttribute('aria-label', getLevelLabel(newLevel));
}
