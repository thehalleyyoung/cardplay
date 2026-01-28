/**
 * @fileoverview Tooltip & Help System - Contextual help and guidance.
 * 
 * Provides comprehensive tooltip system with contextual help, keyboard hints,
 * progress-aware tips, and error recovery suggestions. Makes CardPlay accessible
 * to beginners while providing power users with advanced tips.
 * 
 * @see currentsteps.md Phase 7.5: Tooltip & Help System (lines 2122-2142)
 */

// ============================================================================
// TOOLTIP TYPES
// ============================================================================

/**
 * Tooltip type - determines styling and behavior.
 */
export type TooltipType =
  | 'default'        // Standard parameter/control tooltip
  | 'keyboard'       // Keyboard shortcut hint
  | 'error'          // Error explanation and recovery
  | 'suggestion'     // Action suggestion chip
  | 'did-you-know'   // Interesting tip
  | 'progress'       // Progress-aware hint
  | 'glossary'       // Term definition
  | 'comparison'     // Before/after or A/B comparison
  | 'video';         // Video tutorial embed

/**
 * Tooltip position relative to target.
 */
export type TooltipPosition =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'auto'; // Automatically choose best position

/**
 * Tooltip content with optional rich features.
 */
export interface TooltipContent {
  /** Main tooltip text */
  readonly text: string;
  /** Optional longer description */
  readonly description?: string;
  /** Optional keyboard shortcut */
  readonly shortcut?: string;
  /** Optional link to learn more */
  readonly learnMoreUrl?: string;
  /** Optional video URL */
  readonly videoUrl?: string;
  /** Optional related features */
  readonly relatedFeatures?: readonly string[];
  /** Optional example value or usage */
  readonly example?: string;
  /** Optional unit explanation (Hz, dB, ms, etc.) */
  readonly unit?: string;
  /** Optional parameter range explanation */
  readonly range?: string;
  /** Optional "why" explanation */
  readonly why?: string;
  /** Optional "how" explanation */
  readonly how?: string;
}

/**
 * Complete tooltip configuration.
 */
export interface Tooltip {
  readonly id: string;
  readonly targetId: string; // ID of element this tooltip describes
  readonly type: TooltipType;
  readonly position: TooltipPosition;
  readonly content: TooltipContent;
  readonly showDelay?: number; // ms before showing (default 500)
  readonly hideDelay?: number; // ms before hiding (default 0)
  readonly persistent?: boolean; // Stays visible until dismissed
}

// ============================================================================
// CONTEXTUAL TOOLTIP SYSTEM
// ============================================================================

/**
 * Contextual tooltip that adapts based on user state.
 */
export interface ContextualTooltip {
  readonly id: string;
  readonly targetId: string;
  /** Function to generate content based on context */
  readonly getContent: (context: TooltipContext) => TooltipContent;
  readonly type: TooltipType;
  readonly position: TooltipPosition;
}

/**
 * Context information for generating dynamic tooltips.
 */
export interface TooltipContext {
  /** User's experience level */
  readonly experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  /** Completed tutorials */
  readonly completedTutorials: readonly string[];
  /** Current parameter value */
  readonly currentValue?: unknown;
  /** Recent user actions */
  readonly recentActions: readonly string[];
  /** User's preferences */
  readonly preferences: Record<string, unknown>;
}

/**
 * Create a contextual tooltip that adapts to user.
 */
export function createContextualTooltip(
  id: string,
  targetId: string,
  getContent: (context: TooltipContext) => TooltipContent,
  type: TooltipType = 'default',
  position: TooltipPosition = 'auto'
): ContextualTooltip {
  return { id, targetId, getContent, type, position };
}

// ============================================================================
// WHAT'S THIS MODE
// ============================================================================

/**
 * "What's This?" mode state.
 */
export interface WhatsThisMode {
  readonly enabled: boolean;
  /** Cursor changes to question mark */
  readonly cursorStyle: 'help';
  /** Click any UI element to see detailed explanation */
  readonly onElementClick: (elementId: string) => void;
}

/**
 * Detailed element explanation for "What's This?" mode.
 */
export interface ElementExplanation {
  readonly elementId: string;
  readonly name: string;
  readonly description: string;
  readonly purpose: string; // Why does this exist?
  readonly usage: string; // How to use it?
  readonly tips: readonly string[]; // Pro tips
  readonly relatedElements: readonly string[]; // Related UI elements
  readonly tutorialLink?: string; // Link to relevant tutorial
}

/**
 * Enable "What's This?" mode.
 */
export function enableWhatsThisMode(
  onElementClick: (elementId: string) => void
): WhatsThisMode {
  return {
    enabled: true,
    cursorStyle: 'help',
    onElementClick,
  };
}

// ============================================================================
// KEYBOARD SHORTCUT HINTS
// ============================================================================

/**
 * Keyboard shortcut hint.
 */
export interface KeyboardShortcutHint {
  readonly id: string;
  readonly action: string;
  readonly shortcut: string; // e.g., "Cmd+S" or "Ctrl+Z"
  readonly shortcutMac?: string; // Mac-specific if different
  readonly shortcutWin?: string; // Windows-specific if different
  readonly category: 'editing' | 'navigation' | 'transport' | 'view' | 'tools' | 'help';
  readonly description: string;
}

/**
 * Show keyboard shortcut hint overlay on target element.
 */
export function showKeyboardHint(targetId: string, shortcut: KeyboardShortcutHint): void {
  const element = document.getElementById(targetId);
  if (!element) return;

  // Create shortcut badge
  const badge = document.createElement('div');
  badge.className = 'keyboard-shortcut-hint';
  badge.setAttribute('data-hint-id', shortcut.id);
  
  // Platform-specific shortcut
  const platform = navigator.platform.toLowerCase();
  const isMac = platform.includes('mac');
  const shortcutText = isMac && shortcut.shortcutMac ? shortcut.shortcutMac :
                       !isMac && shortcut.shortcutWin ? shortcut.shortcutWin :
                       shortcut.shortcut;
  
  badge.innerHTML = `
    <span class="shortcut-key">${shortcutText}</span>
    <span class="shortcut-description">${shortcut.action}</span>
  `;
  
  // Position badge near target element
  const rect = element.getBoundingClientRect();
  badge.style.position = 'absolute';
  badge.style.top = `${rect.bottom + 4}px`;
  badge.style.left = `${rect.left}px`;
  badge.style.zIndex = '10000';
  badge.style.pointerEvents = 'none';
  
  // Add to document
  document.body.appendChild(badge);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    badge.remove();
  }, 3000);
}

// ============================================================================
// ACTION SUGGESTION CHIPS
// ============================================================================

/**
 * Suggested action chip - contextual action user might want to take.
 */
export interface ActionSuggestion {
  readonly id: string;
  readonly text: string;
  readonly icon: string; // Emoji or icon name
  readonly action: () => void;
  readonly reason: string; // Why is this suggested?
  readonly priority: 'low' | 'medium' | 'high';
}

/**
 * Get action suggestions based on current context.
 */
export function getActionSuggestions(context: TooltipContext): readonly ActionSuggestion[] {
  const suggestions: ActionSuggestion[] = [];

  // Beginner suggestions
  if (context.experienceLevel === 'beginner') {
    if (!context.completedTutorials.includes('your-first-note')) {
      suggestions.push({
        id: 'start-tutorial',
        text: 'Start with "Your First Note" tutorial',
        icon: '🎹',
        action: () => {
          /* Open tutorial */
        },
        reason: 'Learn the basics step-by-step',
        priority: 'high',
      });
    }
  }

  // If no cards added yet
  if (
    context.recentActions.length === 0 ||
    !context.recentActions.some((a) => a.includes('add-card'))
  ) {
    suggestions.push({
      id: 'add-first-card',
      text: 'Add your first card',
      icon: '🎛️',
      action: () => {
        /* Open card palette */
      },
      reason: 'Start making music by adding an instrument',
      priority: 'high',
    });
  }

  return suggestions;
}

// ============================================================================
// "DID YOU KNOW?" TIPS
// ============================================================================

/**
 * "Did You Know?" tip - interesting facts and features.
 */
export interface DidYouKnowTip {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly icon: string;
  readonly category: 'feature' | 'shortcut' | 'trick' | 'history';
  /** Only show to users at this level or below */
  readonly maxExperienceLevel?: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Library of "Did You Know?" tips.
 */
export const DID_YOU_KNOW_TIPS: readonly DidYouKnowTip[] = [
  {
    id: 'quick-add-slash',
    title: 'Quick Add with /',
    content: 'Press "/" to instantly search and add any card without touching the mouse.',
    icon: '⚡',
    category: 'shortcut',
    maxExperienceLevel: 'intermediate',
  },
  {
    id: 'parameter-linking',
    title: 'Link Parameters Together',
    content:
      'Right-click any knob → "Link to..." to make two parameters move in sync. Perfect for consistent control.',
    icon: '🔗',
    category: 'feature',
    maxExperienceLevel: 'advanced',
  },
  {
    id: 'preset-morph',
    title: 'Morph Between Presets',
    content:
      'Load two presets and use "Morph" to smoothly blend between them. Great for creating hybrid sounds.',
    icon: '🎨',
    category: 'feature',
    maxExperienceLevel: 'advanced',
  },
  {
    id: 'freeze-tracks',
    title: 'Freeze Heavy Tracks',
    content:
      'CPU maxed out? Click "Freeze" on heavy synth tracks to render them to audio. Instant CPU relief!',
    icon: '🧊',
    category: 'trick',
  },
  {
    id: 'cmd-d-duplicate',
    title: 'Cmd+D Duplicates with Settings',
    content: 'Cmd+D (Ctrl+D) duplicates a card WITH all your custom tweaks. Way faster than reconfiguring.',
    icon: '📋',
    category: 'shortcut',
    maxExperienceLevel: 'intermediate',
  },
  {
    id: 'midi-learn-everything',
    title: 'MIDI Learn Everything',
    content:
      'Right-click any control → "MIDI Learn", then move a knob on your controller. Hardware control for anything!',
    icon: '🎛️',
    category: 'feature',
  },
  {
    id: 'reference-tracks',
    title: 'Use Reference Tracks',
    content:
      'Import a track in your genre to A/B compare. Pros do this constantly to nail their mix and arrangement.',
    icon: '🎵',
    category: 'trick',
  },
  {
    id: 'version-saves',
    title: 'Save Versions at Milestones',
    content:
      'Before major changes, save a version. It\'s like time travel for your project. Future you will thank you!',
    icon: '⏰',
    category: 'trick',
  },
];

/**
 * Get appropriate "Did You Know?" tips for user.
 */
export function getDidYouKnowTips(context: TooltipContext): readonly DidYouKnowTip[] {
  return DID_YOU_KNOW_TIPS.filter((tip) => {
    // Filter by experience level
    if (tip.maxExperienceLevel) {
      const levels = ['beginner', 'intermediate', 'advanced'];
      const userLevel = levels.indexOf(context.experienceLevel);
      const maxLevel = levels.indexOf(tip.maxExperienceLevel);
      if (userLevel > maxLevel) return false;
    }
    return true;
  });
}

// ============================================================================
// PROGRESS-AWARE HINTS
// ============================================================================

/**
 * Progress-aware hint - changes based on user's progress.
 */
export interface ProgressHint {
  readonly id: string;
  /** Check if this hint should be shown */
  readonly shouldShow: (context: TooltipContext) => boolean;
  /** Generate hint content based on progress */
  readonly getContent: (context: TooltipContext) => string;
  readonly type: 'next-step' | 'milestone' | 'feature-unlock';
}

/**
 * Common progress-aware hints.
 */
export const PROGRESS_HINTS: readonly ProgressHint[] = [
  {
    id: 'first-card-added',
    shouldShow: (ctx) => ctx.recentActions.includes('add-card') && ctx.recentActions.length === 1,
    getContent: () => 'Great! Now connect it to audio output to hear sound.',
    type: 'next-step',
  },
  {
    id: 'first-connection',
    shouldShow: (ctx) => ctx.recentActions.includes('connect-cards') && ctx.recentActions.length === 2,
    getContent: () => 'Perfect! Press Space to play and hear your first sound.',
    type: 'next-step',
  },
  {
    id: 'tutorial-complete',
    shouldShow: (ctx) => ctx.completedTutorials.length > 0 && ctx.completedTutorials.length < 3,
    getContent: (ctx) =>
      `${ctx.completedTutorials.length} tutorial${ctx.completedTutorials.length > 1 ? 's' : ''} completed! Keep learning!`,
    type: 'milestone',
  },
  {
    id: 'graph-mode-unlock',
    shouldShow: (ctx) => ctx.completedTutorials.includes('card-stacking') && ctx.experienceLevel === 'beginner',
    getContent: () => 'You\'ve unlocked Graph Mode! Try complex routing with graph view.',
    type: 'feature-unlock',
  },
];

/**
 * Get progress hints for current context.
 */
export function getProgressHints(context: TooltipContext): readonly string[] {
  return PROGRESS_HINTS.filter((hint) => hint.shouldShow(context)).map((hint) => hint.getContent(context));
}

// ============================================================================
// ERROR RECOVERY SUGGESTIONS
// ============================================================================

/**
 * Error with recovery suggestions.
 */
export interface ErrorWithRecovery {
  readonly errorCode: string;
  readonly message: string;
  readonly explanation: string; // Why did this happen?
  readonly solutions: readonly RecoverySolution[];
}

/**
 * Suggested solution to an error.
 */
export interface RecoverySolution {
  readonly title: string;
  readonly description: string;
  readonly action?: () => void; // Auto-fix action
  readonly manual?: string; // Manual steps if no auto-fix
  readonly preventionTip?: string; // How to avoid this in future
}

/**
 * Common errors with recovery suggestions.
 */
export const ERROR_RECOVERY: Record<string, ErrorWithRecovery> = {
  'audio-output-disconnected': {
    errorCode: 'audio-output-disconnected',
    message: 'No audio output',
    explanation: 'Your audio device isn\'t connected or accessible.',
    solutions: [
      {
        title: 'Check Audio Settings',
        description: 'Open Settings → Audio and select a working output device.',
        manual: 'Settings → Audio → Output Device',
      },
      {
        title: 'Reconnect Audio Device',
        description: 'Unplug and replug your audio interface or headphones.',
        preventionTip: 'Connect audio devices before starting CardPlay.',
      },
      {
        title: 'Restart Audio Engine',
        description: 'Sometimes a restart fixes audio issues.',
        action: () => {
          /* Restart audio engine */
        },
      },
    ],
  },
  'card-connection-invalid': {
    errorCode: 'card-connection-invalid',
    message: 'Cannot connect these cards',
    explanation: 'The output type doesn\'t match the input type.',
    solutions: [
      {
        title: 'Insert Adapter',
        description: 'Add an adapter card to convert between types.',
        action: () => {
          /* Insert adapter */
        },
      },
      {
        title: 'Use Different Card',
        description: 'Choose a card with compatible inputs/outputs.',
        manual: 'Check card ports: audio needs audio, MIDI needs MIDI.',
        preventionTip: 'Hover over ports to see their type before connecting.',
      },
    ],
  },
  'preset-load-failed': {
    errorCode: 'preset-load-failed',
    message: 'Cannot load preset',
    explanation: 'The preset file is corrupted or from a newer version.',
    solutions: [
      {
        title: 'Use Different Preset',
        description: 'Try loading a different preset from the browser.',
      },
      {
        title: 'Re-download Preset',
        description: 'If from the cloud, re-download the preset file.',
      },
      {
        title: 'Update CardPlay',
        description: 'This preset may require a newer version of CardPlay.',
        manual: 'Check Help → Check for Updates',
      },
    ],
  },
};

/**
 * Get error recovery suggestions.
 */
export function getErrorRecovery(errorCode: string): ErrorWithRecovery | null {
  return ERROR_RECOVERY[errorCode] || null;
}

// ============================================================================
// GLOSSARY POPUPS
// ============================================================================

/**
 * Glossary term definition.
 */
export interface GlossaryTerm {
  readonly term: string;
  readonly definition: string;
  readonly example?: string;
  readonly relatedTerms?: readonly string[];
  readonly category: 'audio' | 'music-theory' | 'production' | 'technical';
}

/**
 * Glossary of music production terms.
 */
export const GLOSSARY: Record<string, GlossaryTerm> = {
  'attack': {
    term: 'Attack',
    definition: 'The time it takes for a sound to reach full volume after being triggered.',
    example: 'Fast attack (0-10ms) = punchy. Slow attack (100ms+) = soft, gradual.',
    relatedTerms: ['decay', 'sustain', 'release', 'envelope'],
    category: 'audio',
  },
  'sustain': {
    term: 'Sustain',
    definition: 'The volume level a sound holds while a note is held down.',
    example: 'High sustain = long notes (strings). Low sustain = short notes (pluck).',
    relatedTerms: ['attack', 'decay', 'release', 'envelope'],
    category: 'audio',
  },
  'cutoff': {
    term: 'Filter Cutoff',
    definition: 'The frequency where a filter starts attenuating (removing) audio.',
    example: 'Low cutoff = darker, muffled. High cutoff = brighter, sharper.',
    relatedTerms: ['resonance', 'filter', 'lowpass', 'highpass'],
    category: 'audio',
  },
  'resonance': {
    term: 'Resonance',
    definition: 'Emphasis of frequencies around the filter cutoff point.',
    example: 'Low resonance = subtle. High resonance = "wah" effect, can self-oscillate.',
    relatedTerms: ['cutoff', 'filter', 'emphasis'],
    category: 'audio',
  },
  'sidechain': {
    term: 'Sidechain',
    definition: 'Using one signal to control the processing of another signal.',
    example: 'Kick drum triggers compressor to "duck" (lower) bass = EDM pumping effect.',
    relatedTerms: ['compressor', 'gate', 'ducking'],
    category: 'production',
  },
  'lufs': {
    term: 'LUFS',
    definition: 'Loudness Units relative to Full Scale. Modern loudness measurement.',
    example: 'Spotify targets -14 LUFS. Too loud? Normalize down. Too quiet? Compress/limit up.',
    relatedTerms: ['loudness', 'normalization', 'mastering'],
    category: 'technical',
  },
};

/**
 * Get glossary term definition.
 */
export function getGlossaryTerm(term: string): GlossaryTerm | null {
  return GLOSSARY[term.toLowerCase()] || null;
}

// ============================================================================
// UNIT EXPLANATIONS
// ============================================================================

/**
 * Unit explanation for parameters.
 */
export interface UnitExplanation {
  readonly unit: string;
  readonly fullName: string;
  readonly description: string;
  readonly ranges: {
    readonly typical: string;
    readonly low: string;
    readonly high: string;
  };
}

/**
 * Common unit explanations.
 */
export const UNIT_EXPLANATIONS: Record<string, UnitExplanation> = {
  'Hz': {
    unit: 'Hz',
    fullName: 'Hertz (cycles per second)',
    description: 'Frequency - how many times per second a wave repeats.',
    ranges: {
      typical: '20-20,000 Hz (human hearing range)',
      low: '20-250 Hz (bass, sub-bass)',
      high: '2,000-20,000 Hz (treble, sparkle)',
    },
  },
  'dB': {
    unit: 'dB',
    fullName: 'Decibels',
    description: 'Loudness or gain. Logarithmic scale.',
    ranges: {
      typical: '-60 to 0 dB (quietest to loudest)',
      low: 'Below -40 dB (very quiet)',
      high: 'Above -6 dB (loud, risk of clipping)',
    },
  },
  'ms': {
    unit: 'ms',
    fullName: 'Milliseconds',
    description: 'Time duration. 1000ms = 1 second.',
    ranges: {
      typical: '0-1000 ms',
      low: '0-50 ms (fast attack/decay)',
      high: '500-2000 ms (slow attack/decay)',
    },
  },
  '%': {
    unit: '%',
    fullName: 'Percentage',
    description: 'Amount or mix level from 0% (none) to 100% (full).',
    ranges: {
      typical: '0-100%',
      low: '0-30% (subtle)',
      high: '70-100% (strong)',
    },
  },
};

/**
 * Get unit explanation.
 */
export function getUnitExplanation(unit: string): UnitExplanation | null {
  return UNIT_EXPLANATIONS[unit] || null;
}

// ============================================================================
// PARAMETER RANGE HINTS
// ============================================================================

/**
 * Parameter range hint - explains what low/mid/high values do.
 */
export interface ParameterRangeHint {
  readonly parameterId: string;
  readonly low: { value: string; description: string };
  readonly mid: { value: string; description: string };
  readonly high: { value: string; description: string };
  readonly sweetSpot?: { value: string; description: string };
}

/**
 * Common parameter range hints.
 */
export const PARAMETER_RANGE_HINTS: Record<string, ParameterRangeHint> = {
  'filter-cutoff': {
    parameterId: 'filter-cutoff',
    low: { value: '20-500 Hz', description: 'Dark, muffled, bassy' },
    mid: { value: '500-2000 Hz', description: 'Balanced, natural' },
    high: { value: '2000-20000 Hz', description: 'Bright, sharp, airy' },
    sweetSpot: { value: '800-1200 Hz', description: 'Musical sweet spot for many sounds' },
  },
  'attack': {
    parameterId: 'attack',
    low: { value: '0-10 ms', description: 'Instant, punchy, percussive' },
    mid: { value: '10-100 ms', description: 'Soft onset, smooth' },
    high: { value: '100-2000 ms', description: 'Very slow, gradual fade-in' },
    sweetSpot: { value: '5-30 ms', description: 'Natural acoustic instruments' },
  },
  'reverb-size': {
    parameterId: 'reverb-size',
    low: { value: '0-30%', description: 'Small room, tight, intimate' },
    mid: { value: '30-70%', description: 'Medium hall, natural space' },
    high: { value: '70-100%', description: 'Cathedral, huge, washy' },
  },
  'compression-ratio': {
    parameterId: 'compression-ratio',
    low: { value: '1.5:1 - 3:1', description: 'Gentle, transparent, glue' },
    mid: { value: '4:1 - 8:1', description: 'Obvious, controlled' },
    high: { value: '10:1+', description: 'Heavy, limiting, squashed' },
    sweetSpot: { value: '3:1 - 4:1', description: 'Musical compression for most tracks' },
  },
};

/**
 * Get parameter range hint.
 */
export function getParameterRangeHint(parameterId: string): ParameterRangeHint | null {
  return PARAMETER_RANGE_HINTS[parameterId] || null;
}

// ============================================================================
// TOOLTIP MANAGER
// ============================================================================

/**
 * Tooltip manager - handles showing/hiding tooltips.
 */
export class TooltipManager {
  private activeTooltip: Tooltip | null = null;
  private showTimer: number | null = null;
  private hideTimer: number | null = null;

  /**
   * Show tooltip for target element.
   */
  public show(tooltip: Tooltip): void {
    // Clear any pending timers
    this.clearTimers();

    // If already showing this tooltip, do nothing
    if (this.activeTooltip?.id === tooltip.id) {
      return;
    }

    // Hide current tooltip immediately
    if (this.activeTooltip) {
      this.hide();
    }

    // Show new tooltip after delay
    const showDelay = tooltip.showDelay ?? 500;
    this.showTimer = window.setTimeout(() => {
      this.activeTooltip = tooltip;
      this.renderTooltip(tooltip);
    }, showDelay);
  }

  /**
   * Hide active tooltip.
   */
  public hide(): void {
    if (!this.activeTooltip) return;

    const hideDelay = this.activeTooltip.hideDelay ?? 0;
    this.hideTimer = window.setTimeout(() => {
      this.removeTooltip();
      this.activeTooltip = null;
    }, hideDelay);
  }

  /**
   * Hide immediately without delay.
   */
  public hideImmediate(): void {
    this.clearTimers();
    this.removeTooltip();
    this.activeTooltip = null;
  }

  /**
   * Update tooltip content dynamically.
   */
  public update(tooltipId: string, content: Partial<TooltipContent>): void {
    if (this.activeTooltip?.id === tooltipId) {
      this.activeTooltip = {
        ...this.activeTooltip,
        content: { ...this.activeTooltip.content, ...content },
      };
      this.renderTooltip(this.activeTooltip);
    }
  }

  private clearTimers(): void {
    if (this.showTimer !== null) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
    if (this.hideTimer !== null) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  private renderTooltip(tooltip: Tooltip): void {
    // Implementation would render tooltip to DOM
    // This is a simplified placeholder
    console.log('Render tooltip:', tooltip);
  }

  private removeTooltip(): void {
    // Implementation would remove tooltip from DOM
    // This is a simplified placeholder
    console.log('Remove tooltip');
  }
}

/**
 * Global tooltip manager instance.
 */
export const tooltipManager = new TooltipManager();

// ============================================================================
// RELATED FEATURES LINKS
// ============================================================================

/**
 * Related feature link - connects features together.
 */
export interface RelatedFeature {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly action: () => void;
}

/**
 * Get related features for a given feature.
 */
export function getRelatedFeatures(featureId: string): readonly RelatedFeature[] {
  const relatedMap: Record<string, readonly RelatedFeature[]> = {
    'card-palette': [
      {
        id: 'preset-browser',
        name: 'Preset Browser',
        description: 'Browse presets for the selected card',
        icon: '🎛️',
        action: () => { /* Open preset browser */ },
      },
      {
        id: 'card-editor',
        name: 'Card Editor',
        description: 'Edit card parameters and routing',
        icon: '✏️',
        action: () => { /* Open card editor */ },
      },
    ],
    'mixer': [
      {
        id: 'automation',
        name: 'Automation',
        description: 'Automate mixer parameters over time',
        icon: '📈',
        action: () => { /* Open automation view */ },
      },
      {
        id: 'effects-chain',
        name: 'Effects Chain',
        description: 'Add effects to mixer channels',
        icon: '🎚️',
        action: () => { /* Open effects panel */ },
      },
    ],
  };
  
  return relatedMap[featureId] || [];
}

// ============================================================================
// VIDEO TIP EMBEDS
// ============================================================================

/**
 * Video tip - embedded tutorial video.
 */
export interface VideoTip {
  readonly id: string;
  readonly title: string;
  readonly videoUrl: string;
  readonly duration: number; // seconds
  readonly thumbnail: string;
  readonly category: 'getting-started' | 'intermediate' | 'advanced' | 'tricks';
  readonly relatedFeatures: readonly string[];
}

/**
 * Library of video tips.
 */
export const VIDEO_TIPS: readonly VideoTip[] = [
  {
    id: 'your-first-note',
    title: 'Your First Note in CardPlay',
    videoUrl: '/tutorials/first-note.mp4',
    duration: 120,
    thumbnail: '/thumbnails/first-note.jpg',
    category: 'getting-started',
    relatedFeatures: ['card-palette', 'midi-input'],
  },
  {
    id: 'card-stacking',
    title: 'Understanding Card Stacks',
    videoUrl: '/tutorials/card-stacking.mp4',
    duration: 180,
    thumbnail: '/thumbnails/stacking.jpg',
    category: 'intermediate',
    relatedFeatures: ['card-palette', 'graph-view'],
  },
  {
    id: 'automation-tips',
    title: 'Automation Tricks',
    videoUrl: '/tutorials/automation.mp4',
    duration: 240,
    thumbnail: '/thumbnails/automation.jpg',
    category: 'advanced',
    relatedFeatures: ['automation', 'modulation'],
  },
];

/**
 * Get video tips for context.
 */
export function getVideoTips(context: TooltipContext): readonly VideoTip[] {
  const levelMap: Record<string, VideoTip['category'][]> = {
    'beginner': ['getting-started'],
    'intermediate': ['getting-started', 'intermediate'],
    'advanced': ['getting-started', 'intermediate', 'advanced', 'tricks'],
  };
  
  const allowedCategories = levelMap[context.experienceLevel] || ['getting-started'];
  return VIDEO_TIPS.filter(tip => allowedCategories.includes(tip.category));
}

// ============================================================================
// UNDO SUGGESTION
// ============================================================================

/**
 * Undo suggestion - suggest undoing a recent action.
 */
export interface UndoSuggestion {
  readonly actionId: string;
  readonly actionName: string;
  readonly reason: string;
  readonly undoAction: () => void;
  readonly priority: 'low' | 'medium' | 'high';
}

/**
 * Generate undo suggestions based on recent actions.
 */
export function getUndoSuggestions(context: TooltipContext): readonly UndoSuggestion[] {
  const suggestions: UndoSuggestion[] = [];
  
  // Check if user deleted a card recently
  if (context.recentActions.includes('delete-card')) {
    suggestions.push({
      actionId: 'undo-delete-card',
      actionName: 'Undo Delete Card',
      reason: 'Card was deleted recently',
      undoAction: () => { /* Undo delete */ },
      priority: 'high',
    });
  }
  
  // Check if user changed a parameter that worsened audio
  if (context.recentActions.includes('parameter-change') && 
      context.recentActions.includes('audio-clipping')) {
    suggestions.push({
      actionId: 'undo-parameter-change',
      actionName: 'Undo Parameter Change',
      reason: 'Parameter change may have caused audio clipping',
      undoAction: () => { /* Undo parameter change */ },
      priority: 'high',
    });
  }
  
  return suggestions;
}

// ============================================================================
// COMPARISON EXPLANATIONS
// ============================================================================

/**
 * Comparison explanation - explain difference between two things.
 */
export interface ComparisonExplanation {
  readonly id: string;
  readonly itemA: string;
  readonly itemB: string;
  readonly differences: readonly {
    readonly aspect: string;
    readonly itemAValue: string;
    readonly itemBValue: string;
  }[];
  readonly recommendation?: string;
}

/**
 * Common comparison explanations.
 */
export const COMPARISON_EXPLANATIONS: Record<string, ComparisonExplanation> = {
  'lowpass-vs-highpass': {
    id: 'lowpass-vs-highpass',
    itemA: 'Lowpass Filter',
    itemB: 'Highpass Filter',
    differences: [
      {
        aspect: 'What it removes',
        itemAValue: 'High frequencies (treble)',
        itemBValue: 'Low frequencies (bass)',
      },
      {
        aspect: 'Sound character',
        itemAValue: 'Darker, warmer, muffled',
        itemBValue: 'Brighter, thinner, cleaner',
      },
      {
        aspect: 'Common use',
        itemAValue: 'Tone shaping, warmth',
        itemBValue: 'Remove rumble, clarity',
      },
    ],
    recommendation: 'Use lowpass for synth bass, highpass for vocals/guitars to remove mud.',
  },
  'serial-vs-parallel': {
    id: 'serial-vs-parallel',
    itemA: 'Serial Stack',
    itemB: 'Parallel Stack',
    differences: [
      {
        aspect: 'Signal flow',
        itemAValue: 'One card → next card (chain)',
        itemBValue: 'All cards process same input',
      },
      {
        aspect: 'Use case',
        itemAValue: 'Effects chain, transforms',
        itemBValue: 'Layering instruments, split processing',
      },
      {
        aspect: 'Output',
        itemAValue: 'Single modified signal',
        itemBValue: 'Multiple signals mixed together',
      },
    ],
    recommendation: 'Serial for effects (reverb → delay), parallel for layers (bass + pad).',
  },
};

/**
 * Get comparison explanation.
 */
export function getComparisonExplanation(comparisonId: string): ComparisonExplanation | null {
  return COMPARISON_EXPLANATIONS[comparisonId] || null;
}

// ============================================================================
// "WHY?" EXPLANATIONS
// ============================================================================

/**
 * "Why?" explanation - explains the reason behind a feature/behavior.
 */
export interface WhyExplanation {
  readonly id: string;
  readonly question: string;
  readonly shortAnswer: string;
  readonly detailedAnswer: string;
  readonly example?: string;
}

/**
 * Library of "Why?" explanations.
 */
export const WHY_EXPLANATIONS: Record<string, WhyExplanation> = {
  'why-cards': {
    id: 'why-cards',
    question: 'Why does CardPlay use cards?',
    shortAnswer: 'Cards make music modular and visual.',
    detailedAnswer: 
      'Cards represent musical functions (instruments, effects, transforms). ' +
      'By making everything a card, you can see your entire signal flow, ' +
      'rearrange processing easily, and understand what each part does. ' +
      'It\'s like having physical gear in software.',
    example: 'Like guitar pedals: each pedal (card) does one thing, chain them for your sound.',
  },
  'why-normalization': {
    id: 'why-normalization',
    question: 'Why normalize audio?',
    shortAnswer: 'Makes all audio the same loudness for fair comparison.',
    detailedAnswer:
      'Normalization adjusts the overall volume of audio so the loudest peak hits 0 dB. ' +
      'This lets you compare sounds fairly without one being louder tricking your ears. ' +
      'Important: normalization doesn\'t compress or change dynamics, just overall level.',
    example: 'Like turning up a quiet song so it matches other songs\' volume.',
  },
  'why-sidechain': {
    id: 'why-sidechain',
    question: 'Why use sidechain compression?',
    shortAnswer: 'Makes space for important sounds by ducking others.',
    detailedAnswer:
      'Sidechain compression lowers one sound when another plays. Classic use: kick drum ' +
      'triggers compressor on bass, making bass "duck" out of the way. This creates the ' +
      '"pumping" EDM effect and prevents bass/kick from fighting for low-end space.',
    example: 'Like turning down background music when someone speaks in a movie.',
  },
};

/**
 * Get "Why?" explanation.
 */
export function getWhyExplanation(explanationId: string): WhyExplanation | null {
  return WHY_EXPLANATIONS[explanationId] || null;
}

// ============================================================================
// "HOW?" TUTORIALS
// ============================================================================

/**
 * "How?" tutorial - step-by-step instructions.
 */
export interface HowTutorial {
  readonly id: string;
  readonly question: string;
  readonly steps: readonly {
    readonly stepNumber: number;
    readonly instruction: string;
    readonly tip?: string;
  }[];
  readonly difficulty: 'easy' | 'medium' | 'hard';
  readonly estimatedTime: number; // minutes
}

/**
 * Library of "How?" tutorials.
 */
export const HOW_TUTORIALS: Record<string, HowTutorial> = {
  'how-add-card': {
    id: 'how-add-card',
    question: 'How do I add a card?',
    steps: [
      {
        stepNumber: 1,
        instruction: 'Press "/" or click the "+" button',
        tip: 'The "/" shortcut is fastest!',
      },
      {
        stepNumber: 2,
        instruction: 'Search or browse card categories',
        tip: 'Start typing to filter cards instantly',
      },
      {
        stepNumber: 3,
        instruction: 'Click a card to add it to the deck',
        tip: 'Preview cards with hover before adding',
      },
    ],
    difficulty: 'easy',
    estimatedTime: 1,
  },
  'how-automate-parameter': {
    id: 'how-automate-parameter',
    question: 'How do I automate a parameter?',
    steps: [
      {
        stepNumber: 1,
        instruction: 'Right-click the parameter knob/slider',
      },
      {
        stepNumber: 2,
        instruction: 'Select "Show Automation"',
        tip: 'Or press "A" while hovering',
      },
      {
        stepNumber: 3,
        instruction: 'Draw automation points in the timeline',
        tip: 'Double-click to add points, drag to adjust',
      },
      {
        stepNumber: 4,
        instruction: 'Press Space to hear the automation',
      },
    ],
    difficulty: 'medium',
    estimatedTime: 3,
  },
  'how-sidechain': {
    id: 'how-sidechain',
    question: 'How do I set up sidechain compression?',
    steps: [
      {
        stepNumber: 1,
        instruction: 'Add Compressor card to the track you want ducked',
      },
      {
        stepNumber: 2,
        instruction: 'Enable "Sidechain" in compressor settings',
      },
      {
        stepNumber: 3,
        instruction: 'Connect trigger source (e.g., kick drum) to sidechain input',
        tip: 'Drag from kick output to compressor sidechain port',
      },
      {
        stepNumber: 4,
        instruction: 'Adjust threshold and ratio to taste',
        tip: 'Start with 4:1 ratio and -20dB threshold',
      },
    ],
    difficulty: 'medium',
    estimatedTime: 5,
  },
};

/**
 * Get "How?" tutorial.
 */
export function getHowTutorial(tutorialId: string): HowTutorial | null {
  return HOW_TUTORIALS[tutorialId] || null;
}

// ============================================================================
// "WHAT NEXT?" SUGGESTIONS
// ============================================================================

/**
 * "What Next?" suggestion - guides user to next logical step.
 */
export interface WhatNextSuggestion {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly action: () => void;
  readonly reason: string;
  readonly icon: string;
}

/**
 * Get "What Next?" suggestions based on context.
 */
export function getWhatNextSuggestions(context: TooltipContext): readonly WhatNextSuggestion[] {
  const suggestions: WhatNextSuggestion[] = [];
  
  // If added first card but not connected
  if (context.recentActions.includes('add-card') && 
      !context.recentActions.includes('connect-cards')) {
    suggestions.push({
      id: 'connect-first-card',
      title: 'Connect Your Card',
      description: 'Connect the card to audio output to hear sound',
      action: () => { /* Auto-connect */ },
      reason: 'Cards need to be connected to make sound',
      icon: '🔌',
    });
  }
  
  // If connected but not played
  if (context.recentActions.includes('connect-cards') && 
      !context.recentActions.includes('transport-play')) {
    suggestions.push({
      id: 'play-music',
      title: 'Press Space to Play',
      description: 'Hear your creation by starting playback',
      action: () => { /* Start playback */ },
      reason: 'Time to hear what you made!',
      icon: '▶️',
    });
  }
  
  // If played but not saved
  if (context.recentActions.includes('transport-play') && 
      !context.recentActions.includes('save-project')) {
    suggestions.push({
      id: 'save-project',
      title: 'Save Your Project',
      description: 'Don\'t lose your work - save it now',
      action: () => { /* Save project */ },
      reason: 'Protect your creative work',
      icon: '💾',
    });
  }
  
  // If beginner with basic knowledge, suggest intermediate features
  if (context.experienceLevel === 'beginner' && 
      context.completedTutorials.length >= 3) {
    suggestions.push({
      id: 'explore-stacks',
      title: 'Try Card Stacks',
      description: 'Chain multiple cards together for complex sounds',
      action: () => { /* Open stacks tutorial */ },
      reason: 'You\'re ready for more advanced features',
      icon: '📚',
    });
  }
  
  return suggestions;
}

// ============================================================================
// FEATURE DISCOVERY
// ============================================================================

/**
 * Feature discovery - highlights undiscovered features.
 */
export interface FeatureDiscovery {
  readonly featureId: string;
  readonly featureName: string;
  readonly description: string;
  readonly benefit: string;
  readonly howToAccess: string;
  readonly priority: 'low' | 'medium' | 'high';
  readonly prerequisitesCompleted: (context: TooltipContext) => boolean;
}

/**
 * Undiscovered features to highlight.
 */
export const FEATURE_DISCOVERIES: readonly FeatureDiscovery[] = [
  {
    featureId: 'graph-view',
    featureName: 'Graph View',
    description: 'See your entire signal flow as a visual graph',
    benefit: 'Understand complex routing at a glance',
    howToAccess: 'Click "Graph" button in top-right toolbar',
    priority: 'high',
    prerequisitesCompleted: (ctx) => ctx.recentActions.includes('add-card'),
  },
  {
    featureId: 'preset-browser',
    featureName: 'Preset Browser',
    description: 'Browse hundreds of ready-made sounds',
    benefit: 'Instant professional sounds without tweaking',
    howToAccess: 'Click "Presets" button on any card',
    priority: 'high',
    prerequisitesCompleted: (ctx) => ctx.recentActions.includes('add-card'),
  },
  {
    featureId: 'automation',
    featureName: 'Automation',
    description: 'Make parameters change over time',
    benefit: 'Add movement and evolution to your music',
    howToAccess: 'Right-click any knob → "Show Automation"',
    priority: 'medium',
    prerequisitesCompleted: (ctx) => ctx.completedTutorials.includes('your-first-note'),
  },
];

/**
 * Get undiscovered features for user.
 */
export function getUndiscoveredFeatures(
  context: TooltipContext,
  usedFeatures: readonly string[]
): readonly FeatureDiscovery[] {
  return FEATURE_DISCOVERIES.filter(
    (feature) => 
      !usedFeatures.includes(feature.featureId) &&
      feature.prerequisitesCompleted(context)
  ).sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ============================================================================
// MASTERY TRACKING
// ============================================================================

/**
 * Mastery level for a feature.
 */
export type MasteryLevel = 'novice' | 'learning' | 'competent' | 'proficient' | 'expert';

/**
 * Feature mastery tracking.
 */
export interface FeatureMastery {
  readonly featureId: string;
  readonly featureName: string;
  readonly masteryLevel: MasteryLevel;
  readonly usageCount: number;
  readonly lastUsed: Date;
  readonly tipsSeen: readonly string[];
  readonly advancedTechniquesUnlocked: readonly string[];
}

/**
 * Calculate mastery level based on usage.
 */
export function calculateMasteryLevel(usageCount: number): MasteryLevel {
  if (usageCount === 0) return 'novice';
  if (usageCount < 5) return 'learning';
  if (usageCount < 20) return 'competent';
  if (usageCount < 50) return 'proficient';
  return 'expert';
}

/**
 * Get mastery progress as percentage.
 */
export function getMasteryProgress(masteryLevel: MasteryLevel): number {
  const levelToProgress: Record<MasteryLevel, number> = {
    'novice': 0,
    'learning': 20,
    'competent': 40,
    'proficient': 70,
    'expert': 100,
  };
  return levelToProgress[masteryLevel];
}

/**
 * Get tips appropriate for mastery level.
 */
export function getTipsForMastery(
  featureId: string,
  masteryLevel: MasteryLevel
): readonly string[] {
  const tipsByFeatureAndLevel: Record<string, Record<MasteryLevel, readonly string[]>> = {
    'card-palette': {
      'novice': ['Use "/" to quickly open card palette'],
      'learning': ['Browse categories to discover new cards'],
      'competent': ['Use search to find specific card types'],
      'proficient': ['Create custom cards with CardScript'],
      'expert': ['Share your custom cards with the community'],
    },
    'mixer': {
      'novice': ['Adjust track volumes with faders'],
      'learning': ['Use pan knobs to position sounds in stereo field'],
      'competent': ['Set up send effects for reverb/delay'],
      'proficient': ['Use sidechain compression for pumping effect'],
      'expert': ['Create complex parallel compression chains'],
    },
  };
  
  return tipsByFeatureAndLevel[featureId]?.[masteryLevel] || [];
}
