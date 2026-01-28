/**
 * @fileoverview "What brings you here?" Selector Component
 * 
 * Initial onboarding step to understand user intent and customize their experience.
 * Offers multiple paths based on background, goals, and experience level.
 * 
 * @module @cardplay/core/ui/components/what-brings-you-selector
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * User intent/reason for using CardPlay
 */
export type UserIntent =
  | 'create-music'        // Want to make music
  | 'learn-production'    // Want to learn production
  | 'jam-ideas'           // Just want to jam and explore
  | 'professional-work'   // Professional music production
  | 'sound-design'        // Sound design and audio creation
  | 'education'           // Teaching or learning music
  | 'live-performance'    // Live performance and improvisation
  | 'collaboration'       // Collaborate with others
  | 'experimentation'     // Experimental and avant-garde music
  | 'just-curious';       // Just checking it out

/**
 * User intent option with metadata
 */
export interface IntentOption {
  readonly id: UserIntent;
  readonly label: string;
  readonly description: string;
  readonly icon: string;  // Emoji icon
  readonly color: string; // Hex color for theming
  readonly keywords: readonly string[];
}

/**
 * Selector state
 */
export interface WhatBringsYouState {
  /** Selected intent */
  readonly selectedIntent: UserIntent | null;
  /** Hovered intent */
  readonly hoveredIntent: UserIntent | null;
  /** Animation progress (0-1) */
  readonly animationProgress: number;
  /** Completed selection */
  readonly completed: boolean;
}

/**
 * Selector configuration
 */
export interface WhatBringsYouConfig {
  /** Title text */
  readonly title?: string;
  /** Subtitle text */
  readonly subtitle?: string;
  /** Show descriptions */
  readonly showDescriptions?: boolean;
  /** Allow multiple selections */
  readonly allowMultiple?: boolean;
  /** Callback when selection changes */
  readonly onSelect?: (intent: UserIntent) => void;
  /** Callback when completed */
  readonly onComplete?: (intent: UserIntent) => void;
}

// ============================================================================
// INTENT OPTIONS
// ============================================================================

/**
 * Available intent options
 */
export const INTENT_OPTIONS: readonly IntentOption[] = [
  {
    id: 'create-music',
    label: 'Create Music',
    description: 'I want to make original tracks and songs',
    icon: '🎵',
    color: '#3B82F6',
    keywords: ['compose', 'produce', 'write', 'song', 'track'],
  },
  {
    id: 'learn-production',
    label: 'Learn Production',
    description: 'I want to learn music production skills',
    icon: '📚',
    color: '#10B981',
    keywords: ['learn', 'tutorial', 'beginner', 'guide', 'teach'],
  },
  {
    id: 'jam-ideas',
    label: 'Jam & Explore',
    description: 'I want to jam and explore musical ideas',
    icon: '🎹',
    color: '#F59E0B',
    keywords: ['jam', 'improvise', 'explore', 'sketch', 'ideas'],
  },
  {
    id: 'professional-work',
    label: 'Professional Work',
    description: 'I need a tool for professional music production',
    icon: '💼',
    color: '#8B5CF6',
    keywords: ['professional', 'work', 'client', 'commercial', 'serious'],
  },
  {
    id: 'sound-design',
    label: 'Sound Design',
    description: 'I want to create and design unique sounds',
    icon: '🔊',
    color: '#EC4899',
    keywords: ['sound', 'design', 'synthesis', 'audio', 'fx'],
  },
  {
    id: 'education',
    label: 'Education',
    description: 'I\'m teaching or learning music theory',
    icon: '🎓',
    color: '#14B8A6',
    keywords: ['teach', 'education', 'theory', 'student', 'class'],
  },
  {
    id: 'live-performance',
    label: 'Live Performance',
    description: 'I want to perform live with this tool',
    icon: '🎤',
    color: '#EF4444',
    keywords: ['live', 'perform', 'stage', 'concert', 'gig'],
  },
  {
    id: 'collaboration',
    label: 'Collaboration',
    description: 'I want to collaborate with other musicians',
    icon: '👥',
    color: '#6366F1',
    keywords: ['collaborate', 'team', 'together', 'share', 'group'],
  },
  {
    id: 'experimentation',
    label: 'Experimentation',
    description: 'I want to experiment with avant-garde music',
    icon: '🔬',
    color: '#A855F7',
    keywords: ['experiment', 'avant-garde', 'weird', 'unusual', 'new'],
  },
  {
    id: 'just-curious',
    label: 'Just Curious',
    description: 'I\'m just checking out what this is',
    icon: '👀',
    color: '#64748B',
    keywords: ['curious', 'explore', 'check', 'browse', 'look'],
  },
];

/**
 * Get intent option by id
 */
export function getIntentOption(id: UserIntent): IntentOption | undefined {
  return INTENT_OPTIONS.find(opt => opt.id === id);
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Create initial selector state
 */
export function createInitialWhatBringsYouState(): WhatBringsYouState {
  return {
    selectedIntent: null,
    hoveredIntent: null,
    animationProgress: 0,
    completed: false,
  };
}

/**
 * Select intent
 */
export function selectIntent(
  state: WhatBringsYouState,
  intent: UserIntent
): WhatBringsYouState {
  return {
    ...state,
    selectedIntent: intent,
  };
}

/**
 * Hover intent
 */
export function hoverIntent(
  state: WhatBringsYouState,
  intent: UserIntent | null
): WhatBringsYouState {
  return {
    ...state,
    hoveredIntent: intent,
  };
}

/**
 * Update animation progress
 */
export function updateAnimationProgress(
  state: WhatBringsYouState,
  progress: number
): WhatBringsYouState {
  return {
    ...state,
    animationProgress: Math.max(0, Math.min(1, progress)),
  };
}

/**
 * Complete selection
 */
export function completeSelection(state: WhatBringsYouState): WhatBringsYouState {
  return {
    ...state,
    completed: true,
  };
}

// ============================================================================
// RENDERING
// ============================================================================

/**
 * Render "What brings you here?" selector
 */
export function renderWhatBringsYouSelector(
  ctx: CanvasRenderingContext2D,
  state: WhatBringsYouState,
  x: number,
  y: number,
  width: number,
  height: number,
  config: WhatBringsYouConfig = {}
): void {
  const {
    title = 'What brings you here?',
    subtitle = 'Tell us a bit about what you want to do, so we can personalize your experience.',
    showDescriptions = true,
  } = config;
  
  ctx.save();
  
  // Background
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(x, y, width, height);
  
  let currentY = y + 60;
  
  // Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, x + width / 2, currentY);
  currentY += 50;
  
  // Subtitle
  ctx.fillStyle = '#94A3B8';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  const subtitleLines = wrapText(ctx, subtitle, width - 100);
  subtitleLines.forEach(line => {
    ctx.fillText(line, x + width / 2, currentY);
    currentY += 25;
  });
  currentY += 30;
  
  // Options grid
  const cols = 2;
  const rows = Math.ceil(INTENT_OPTIONS.length / cols);
  const cardWidth = (width - 120) / cols;
  const cardHeight = showDescriptions ? 120 : 80;
  const spacing = 20;
  
  INTENT_OPTIONS.forEach((option, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    
    const cardX = x + 60 + col * (cardWidth + spacing);
    const cardY = currentY + row * (cardHeight + spacing);
    
    const isSelected = state.selectedIntent === option.id;
    const isHovered = state.hoveredIntent === option.id;
    
    renderIntentCard(
      ctx,
      option,
      cardX,
      cardY,
      cardWidth,
      cardHeight,
      isSelected,
      isHovered,
      showDescriptions,
      state.animationProgress
    );
  });
  
  // Continue button (if selected)
  if (state.selectedIntent) {
    const buttonY = currentY + rows * (cardHeight + spacing) + 40;
    renderContinueButton(
      ctx,
      x + width / 2,
      buttonY,
      state.animationProgress
    );
  }
  
  ctx.restore();
}

/**
 * Render intent card
 */
function renderIntentCard(
  ctx: CanvasRenderingContext2D,
  option: IntentOption,
  x: number,
  y: number,
  width: number,
  height: number,
  isSelected: boolean,
  isHovered: boolean,
  showDescription: boolean,
  _animationProgress: number
): void {
  ctx.save();
  
  // Card scale animation
  const scale = isHovered ? 1.02 : 1.0;
  ctx.translate(x + width / 2, y + height / 2);
  ctx.scale(scale, scale);
  ctx.translate(-width / 2, -height / 2);
  
  // Shadow
  if (isHovered || isSelected) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(2, 2, width, height);
  }
  
  // Card background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  if (isSelected) {
    gradient.addColorStop(0, option.color);
    gradient.addColorStop(1, adjustBrightness(option.color, -20));
  } else {
    gradient.addColorStop(0, '#1E293B');
    gradient.addColorStop(1, '#0F172A');
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Border
  ctx.strokeStyle = isSelected ? option.color : (isHovered ? '#475569' : '#334155');
  ctx.lineWidth = isSelected ? 3 : 2;
  ctx.strokeRect(0, 0, width, height);
  
  // Icon
  ctx.font = '40px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(option.icon, width / 2, 45);
  
  // Label
  ctx.fillStyle = isSelected ? '#FFFFFF' : '#E2E8F0';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(option.label, width / 2, 70);
  
  // Description
  if (showDescription) {
    ctx.fillStyle = isSelected ? '#E2E8F0' : '#94A3B8';
    ctx.font = '12px sans-serif';
    const descLines = wrapText(ctx, option.description, width - 20);
    descLines.forEach((line, idx) => {
      ctx.fillText(line, width / 2, 90 + idx * 16);
    });
  }
  
  // Selection checkmark
  if (isSelected) {
    ctx.fillStyle = option.color;
    ctx.beginPath();
    ctx.arc(width - 15, 15, 12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width - 19, 15);
    ctx.lineTo(width - 15, 19);
    ctx.lineTo(width - 11, 11);
    ctx.stroke();
  }
  
  ctx.restore();
}

/**
 * Render continue button
 */
function renderContinueButton(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  animationProgress: number
): void {
  const buttonWidth = 200;
  const buttonHeight = 50;
  
  // Button background
  const gradient = ctx.createLinearGradient(
    x - buttonWidth / 2,
    y,
    x + buttonWidth / 2,
    y
  );
  gradient.addColorStop(0, '#3B82F6');
  gradient.addColorStop(1, '#2563EB');
  ctx.fillStyle = gradient;
  ctx.fillRect(x - buttonWidth / 2, y, buttonWidth, buttonHeight);
  
  // Button text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Continue →', x, y + buttonHeight / 2 + 6);
  
  // Pulse effect
  const pulse = Math.sin(animationProgress * Math.PI * 4) * 0.1 + 0.9;
  ctx.strokeStyle = `rgba(59, 130, 246, ${pulse})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(x - buttonWidth / 2, y, buttonWidth, buttonHeight);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Wrap text to fit within width
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

/**
 * Adjust color brightness
 */
function adjustBrightness(color: string, amount: number): string {
  // Simple brightness adjustment (works for hex colors)
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Check if point is inside card
 */
export function isPointInIntentCard(
  x: number,
  y: number,
  cardIndex: number,
  selectorX: number,
  selectorY: number,
  selectorWidth: number,
  showDescriptions: boolean
): boolean {
  const cols = 2;
  const cardWidth = (selectorWidth - 120) / cols;
  const cardHeight = showDescriptions ? 120 : 80;
  const spacing = 20;
  const startY = selectorY + 165; // After title and subtitle
  
  const col = cardIndex % cols;
  const row = Math.floor(cardIndex / cols);
  
  const cardX = selectorX + 60 + col * (cardWidth + spacing);
  const cardY = startY + row * (cardHeight + spacing);
  
  return (
    x >= cardX &&
    x <= cardX + cardWidth &&
    y >= cardY &&
    y <= cardY + cardHeight
  );
}

/**
 * Get intent at point
 */
export function getIntentAtPoint(
  x: number,
  y: number,
  selectorX: number,
  selectorY: number,
  selectorWidth: number,
  showDescriptions: boolean = true
): UserIntent | null {
  for (let i = 0; i < INTENT_OPTIONS.length; i++) {
    if (isPointInIntentCard(x, y, i, selectorX, selectorY, selectorWidth, showDescriptions)) {
      const option = INTENT_OPTIONS[i];
      return option ? option.id : null;
    }
  }
  return null;
}

// ============================================================================
// CONTROLLER
// ============================================================================

/**
 * What brings you selector controller
 */
export class WhatBringsYouController {
  private state: WhatBringsYouState;
  private config: WhatBringsYouConfig;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  
  constructor(config: WhatBringsYouConfig = {}) {
    this.state = createInitialWhatBringsYouState();
    this.config = config;
  }
  
  /**
   * Start animation
   */
  start(canvas: HTMLCanvasElement): void {
    this.lastTime = performance.now();
    
    const animate = (time: number) => {
      const deltaTime = time - this.lastTime;
      this.lastTime = time;
      
      // Update animation
      this.state = updateAnimationProgress(
        this.state,
        this.state.animationProgress + deltaTime / 1000
      );
      
      // Render
      const ctx = canvas.getContext('2d');
      if (ctx) {
        renderWhatBringsYouSelector(
          ctx,
          this.state,
          0,
          0,
          canvas.width,
          canvas.height,
          this.config
        );
      }
      
      // Continue animation
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    this.animationFrameId = requestAnimationFrame(animate);
  }
  
  /**
   * Stop animation
   */
  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  /**
   * Handle click
   */
  handleClick(x: number, y: number, canvas: HTMLCanvasElement): void {
    const intent = getIntentAtPoint(
      x,
      y,
      0,
      0,
      canvas.width,
      this.config.showDescriptions ?? true
    );
    
    if (intent) {
      this.state = selectIntent(this.state, intent);
      if (this.config.onSelect) {
        this.config.onSelect(intent);
      }
    }
    
    // Check if continue button clicked (if selected)
    if (this.state.selectedIntent) {
      const buttonY = 165 + Math.ceil(INTENT_OPTIONS.length / 2) * 140 + 40;
      if (
        x >= canvas.width / 2 - 100 &&
        x <= canvas.width / 2 + 100 &&
        y >= buttonY &&
        y <= buttonY + 50
      ) {
        this.state = completeSelection(this.state);
        if (this.config.onComplete && this.state.selectedIntent) {
          this.config.onComplete(this.state.selectedIntent);
        }
      }
    }
  }
  
  /**
   * Handle hover
   */
  handleHover(x: number, y: number, canvas: HTMLCanvasElement): void {
    const intent = getIntentAtPoint(
      x,
      y,
      0,
      0,
      canvas.width,
      this.config.showDescriptions ?? true
    );
    
    this.state = hoverIntent(this.state, intent);
  }
  
  /**
   * Get current state
   */
  getState(): WhatBringsYouState {
    return this.state;
  }
}
