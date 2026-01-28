/**
 * @fileoverview Achievement System for CardPlay.
 * 
 * Provides gamification features to encourage learning and exploration,
 * including achievement tracking, notifications, and progress visualization.
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Achievement category.
 */
export type AchievementCategory =
  | 'getting-started'
  | 'composition'
  | 'production'
  | 'mastery'
  | 'exploration'
  | 'social'
  | 'special';

/**
 * Achievement tier.
 */
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

/**
 * Achievement definition.
 */
export interface Achievement {
  /** Unique achievement ID */
  readonly id: string;
  /** Achievement name */
  readonly name: string;
  /** Achievement description */
  readonly description: string;
  /** Category */
  readonly category: AchievementCategory;
  /** Tier */
  readonly tier: AchievementTier;
  /** Icon (emoji or icon name) */
  readonly icon: string;
  /** Points awarded */
  readonly points: number;
  /** Whether this is a hidden achievement (revealed on unlock) */
  readonly hidden: boolean;
  /** Requirement description */
  readonly requirement: string;
  /** Hint for unlocking (if not hidden) */
  readonly hint: string;
}

/**
 * Achievement progress state.
 */
export interface AchievementProgress {
  /** Achievement ID */
  readonly id: string;
  /** Whether unlocked */
  readonly unlocked: boolean;
  /** Unlock timestamp (if unlocked) */
  readonly unlockedAt: number | null;
  /** Progress value (0-1) */
  readonly progress: number;
  /** Current count for counting achievements */
  readonly currentCount: number;
  /** Target count for counting achievements */
  readonly targetCount: number;
  /** Whether progress should be shown */
  readonly showProgress: boolean;
}

/**
 * Achievement unlock notification.
 */
export interface AchievementUnlock {
  /** Achievement that was unlocked */
  readonly achievement: Achievement;
  /** Timestamp */
  readonly timestamp: number;
  /** Whether this is a new unlock (not loaded from storage) */
  readonly isNew: boolean;
}

/**
 * Achievement statistics.
 */
export interface AchievementStats {
  /** Total achievements */
  readonly total: number;
  /** Unlocked achievements */
  readonly unlocked: number;
  /** Total points */
  readonly totalPoints: number;
  /** Earned points */
  readonly earnedPoints: number;
  /** Completion percentage */
  readonly completionPercent: number;
  /** Achievements by category */
  readonly byCategory: Record<AchievementCategory, { total: number; unlocked: number }>;
  /** Achievements by tier */
  readonly byTier: Record<AchievementTier, { total: number; unlocked: number }>;
}

// ============================================================================
// ACHIEVEMENT DEFINITIONS
// ============================================================================

/**
 * All available achievements.
 */
export const ACHIEVEMENTS: readonly Achievement[] = [
  // Getting Started
  {
    id: 'first-note',
    name: 'First Note',
    description: 'Play your first note in CardPlay',
    category: 'getting-started',
    tier: 'bronze',
    icon: '🎵',
    points: 10,
    hidden: false,
    requirement: 'Play or record a single note',
    hint: 'Try clicking on the piano roll or playing a MIDI keyboard',
  },
  {
    id: 'first-loop',
    name: 'First Loop',
    description: 'Create and play your first loop',
    category: 'getting-started',
    tier: 'bronze',
    icon: '🔁',
    points: 20,
    hidden: false,
    requirement: 'Create a loop with at least 4 beats',
    hint: 'Use the sequencer or drum machine to create a repeating pattern',
  },
  {
    id: 'first-export',
    name: 'First Export',
    description: 'Export your first audio file',
    category: 'getting-started',
    tier: 'bronze',
    icon: '💾',
    points: 30,
    hidden: false,
    requirement: 'Export a project to WAV or MP3',
    hint: 'Use File > Export or the export button in the transport',
  },
  {
    id: 'card-master',
    name: 'Card Master',
    description: 'Use cards from 10 different categories',
    category: 'exploration',
    tier: 'silver',
    icon: '🃏',
    points: 50,
    hidden: false,
    requirement: 'Add cards from 10 unique categories to your projects',
    hint: 'Explore the card palette and try different types of cards',
  },
  {
    id: 'preset-explorer',
    name: 'Preset Explorer',
    description: 'Try 50 different presets',
    category: 'exploration',
    tier: 'silver',
    icon: '🔍',
    points: 40,
    hidden: false,
    requirement: 'Load 50 different presets across all cards',
    hint: 'Browse presets in various cards to discover new sounds',
  },
  {
    id: 'stack-builder',
    name: 'Stack Builder',
    description: 'Create a stack with 5 or more cards',
    category: 'composition',
    tier: 'bronze',
    icon: '📚',
    points: 30,
    hidden: false,
    requirement: 'Build a processing chain with 5+ cards',
    hint: 'Stack cards together in serial or parallel mode',
  },
  {
    id: 'graph-wizard',
    name: 'Graph Wizard',
    description: 'Create a graph with 10 connections',
    category: 'mastery',
    tier: 'gold',
    icon: '🕸️',
    points: 100,
    hidden: false,
    requirement: 'Build a complex signal routing graph',
    hint: 'Use the graph view to create intricate routing',
  },
  {
    id: 'projects-10',
    name: '10 Projects',
    description: 'Create 10 different projects',
    category: 'composition',
    tier: 'silver',
    icon: '📁',
    points: 60,
    hidden: false,
    requirement: 'Save 10 unique projects',
    hint: 'Keep creating! Each project is a learning opportunity',
  },
  {
    id: 'hours-100',
    name: '100 Hours',
    description: 'Spend 100 hours creating music',
    category: 'mastery',
    tier: 'platinum',
    icon: '⏰',
    points: 200,
    hidden: false,
    requirement: 'Accumulate 100 hours of active usage',
    hint: 'Keep making music and the hours will add up!',
  },
  {
    id: 'genre-explorer',
    name: 'Genre Explorer',
    description: 'Create projects in 5 different genres',
    category: 'exploration',
    tier: 'gold',
    icon: '🎭',
    points: 80,
    hidden: false,
    requirement: 'Use genre templates or styles from 5 genres',
    hint: 'Try pop, electronic, jazz, rock, classical, and more',
  },
  {
    id: 'sound-designer',
    name: 'Sound Designer',
    description: 'Create 20 custom presets',
    category: 'production',
    tier: 'gold',
    icon: '🎚️',
    points: 90,
    hidden: false,
    requirement: 'Save 20 user presets across any cards',
    hint: 'Tweak parameters and save your favorite sounds',
  },
  {
    id: 'mix-engineer',
    name: 'Mix Engineer',
    description: 'Use all mixing cards in one project',
    category: 'production',
    tier: 'gold',
    icon: '🎛️',
    points: 100,
    hidden: false,
    requirement: 'Add EQ, Compressor, Reverb, and Delay to a project',
    hint: 'Build a complete mixing chain',
  },
  {
    id: 'live-performer',
    name: 'Live Performer',
    description: 'Use session view for live performance',
    category: 'mastery',
    tier: 'silver',
    icon: '🎪',
    points: 70,
    hidden: false,
    requirement: 'Launch clips in session view for 5 minutes',
    hint: 'Explore the session view for improvised performances',
  },
  {
    id: 'collaborator',
    name: 'Collaborator',
    description: 'Share a project with another user',
    category: 'social',
    tier: 'silver',
    icon: '🤝',
    points: 50,
    hidden: false,
    requirement: 'Export and share a project file',
    hint: 'Use File > Export Project to share your work',
  },
  {
    id: 'teacher',
    name: 'Teacher',
    description: 'Complete a tutorial and rate it',
    category: 'social',
    tier: 'bronze',
    icon: '👨‍🏫',
    points: 30,
    hidden: false,
    requirement: 'Finish any tutorial and provide feedback',
    hint: 'Check out the tutorials in the Help menu',
  },
  {
    id: 'community',
    name: 'Community Member',
    description: 'Contribute to the CardPlay community',
    category: 'social',
    tier: 'gold',
    icon: '🌟',
    points: 100,
    hidden: false,
    requirement: 'Upload a preset, sample, or tutorial',
    hint: 'Share your knowledge and creations',
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Spend 30 minutes on a single parameter',
    category: 'special',
    tier: 'bronze',
    icon: '🎯',
    points: 20,
    hidden: true,
    requirement: 'Fine-tune one parameter for 30 minutes',
    hint: 'Hidden achievement',
  },
];

// ============================================================================
// ACHIEVEMENT FRAMEWORK
// ============================================================================

/**
 * Achievement manager state.
 */
export interface AchievementManager {
  /** All achievements */
  readonly achievements: readonly Achievement[];
  /** Progress for each achievement */
  readonly progress: ReadonlyMap<string, AchievementProgress>;
  /** Recently unlocked (for notifications) */
  readonly recentUnlocks: readonly AchievementUnlock[];
}

/**
 * Create initial achievement manager.
 */
export function createAchievementManager(): AchievementManager {
  const progress = new Map<string, AchievementProgress>();
  
  for (const achievement of ACHIEVEMENTS) {
    progress.set(achievement.id, {
      id: achievement.id,
      unlocked: false,
      unlockedAt: null,
      progress: 0,
      currentCount: 0,
      targetCount: getTargetCount(achievement),
      showProgress: shouldShowProgress(achievement),
    });
  }
  
  return {
    achievements: ACHIEVEMENTS,
    progress,
    recentUnlocks: [],
  };
}

/**
 * Get target count for an achievement.
 */
function getTargetCount(achievement: Achievement): number {
  // Extract numbers from achievement IDs
  const match = achievement.id.match(/\d+/);
  if (match) {
    return parseInt(match[0], 10);
  }
  
  // Default targets
  if (achievement.id === 'card-master') return 10;
  if (achievement.id === 'preset-explorer') return 50;
  if (achievement.id === 'stack-builder') return 5;
  if (achievement.id === 'graph-wizard') return 10;
  if (achievement.id === 'genre-explorer') return 5;
  if (achievement.id === 'sound-designer') return 20;
  
  return 1; // Default for binary achievements
}

/**
 * Check if progress should be shown for an achievement.
 */
function shouldShowProgress(achievement: Achievement): boolean {
  // Show progress for counting achievements
  return achievement.id.includes('-10') ||
         achievement.id.includes('-20') ||
         achievement.id.includes('-50') ||
         achievement.id.includes('-100') ||
         achievement.id === 'card-master' ||
         achievement.id === 'preset-explorer' ||
         achievement.id === 'stack-builder' ||
         achievement.id === 'graph-wizard' ||
         achievement.id === 'genre-explorer' ||
         achievement.id === 'sound-designer';
}

/**
 * Update achievement progress.
 */
export function updateAchievementProgress(
  manager: AchievementManager,
  achievementId: string,
  increment: number = 1
): AchievementManager {
  const current = manager.progress.get(achievementId);
  if (!current || current.unlocked) {
    return manager;
  }
  
  const newCount = current.currentCount + increment;
  const newProgress = Math.min(1, newCount / current.targetCount);
  const unlocked = newProgress >= 1;
  
  const newProgressEntry: AchievementProgress = {
    ...current,
    currentCount: newCount,
    progress: newProgress,
    unlocked,
    unlockedAt: unlocked ? Date.now() : null,
  };
  
  const newProgressMap = new Map(manager.progress);
  newProgressMap.set(achievementId, newProgressEntry);
  
  let newUnlocks = manager.recentUnlocks;
  if (unlocked) {
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (achievement) {
      const unlock: AchievementUnlock = {
        achievement,
        timestamp: Date.now(),
        isNew: true,
      };
      newUnlocks = [...manager.recentUnlocks, unlock];
    }
  }
  
  return {
    ...manager,
    progress: newProgressMap,
    recentUnlocks: newUnlocks,
  };
}

/**
 * Mark achievement as unlocked.
 */
export function unlockAchievement(
  manager: AchievementManager,
  achievementId: string
): AchievementManager {
  const current = manager.progress.get(achievementId);
  if (!current || current.unlocked) {
    return manager;
  }
  
  const newProgressEntry: AchievementProgress = {
    ...current,
    unlocked: true,
    unlockedAt: Date.now(),
    progress: 1,
    currentCount: current.targetCount,
  };
  
  const newProgressMap = new Map(manager.progress);
  newProgressMap.set(achievementId, newProgressEntry);
  
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  let newUnlocks = manager.recentUnlocks;
  if (achievement) {
    const unlock: AchievementUnlock = {
      achievement,
      timestamp: Date.now(),
      isNew: true,
    };
    newUnlocks = [...manager.recentUnlocks, unlock];
  }
  
  return {
    ...manager,
    progress: newProgressMap,
    recentUnlocks: newUnlocks,
  };
}

/**
 * Clear recent unlocks (after showing notifications).
 */
export function clearRecentUnlocks(manager: AchievementManager): AchievementManager {
  return {
    ...manager,
    recentUnlocks: [],
  };
}

/**
 * Get achievement statistics.
 */
export function getAchievementStats(manager: AchievementManager): AchievementStats {
  let unlocked = 0;
  let earnedPoints = 0;
  let totalPoints = 0;
  
  const byCategory: Record<AchievementCategory, { total: number; unlocked: number }> = {
    'getting-started': { total: 0, unlocked: 0 },
    'composition': { total: 0, unlocked: 0 },
    'production': { total: 0, unlocked: 0 },
    'mastery': { total: 0, unlocked: 0 },
    'exploration': { total: 0, unlocked: 0 },
    'social': { total: 0, unlocked: 0 },
    'special': { total: 0, unlocked: 0 },
  };
  
  const byTier: Record<AchievementTier, { total: number; unlocked: number }> = {
    'bronze': { total: 0, unlocked: 0 },
    'silver': { total: 0, unlocked: 0 },
    'gold': { total: 0, unlocked: 0 },
    'platinum': { total: 0, unlocked: 0 },
  };
  
  for (const achievement of ACHIEVEMENTS) {
    totalPoints += achievement.points;
    byCategory[achievement.category].total++;
    byTier[achievement.tier].total++;
    
    const progress = manager.progress.get(achievement.id);
    if (progress?.unlocked) {
      unlocked++;
      earnedPoints += achievement.points;
      byCategory[achievement.category].unlocked++;
      byTier[achievement.tier].unlocked++;
    }
  }
  
  return {
    total: ACHIEVEMENTS.length,
    unlocked,
    totalPoints,
    earnedPoints,
    completionPercent: (unlocked / ACHIEVEMENTS.length) * 100,
    byCategory,
    byTier,
  };
}

/**
 * Get unlocked achievements.
 */
export function getUnlockedAchievements(
  manager: AchievementManager
): readonly Achievement[] {
  return ACHIEVEMENTS.filter(achievement => {
    const progress = manager.progress.get(achievement.id);
    return progress?.unlocked === true;
  });
}

/**
 * Get locked achievements (excluding hidden ones).
 */
export function getLockedAchievements(
  manager: AchievementManager,
  includeHidden: boolean = false
): readonly Achievement[] {
  return ACHIEVEMENTS.filter(achievement => {
    if (!includeHidden && achievement.hidden) {
      return false;
    }
    const progress = manager.progress.get(achievement.id);
    return progress?.unlocked === false;
  });
}

/**
 * Get achievements by category.
 */
export function getAchievementsByCategory(
  category: AchievementCategory
): readonly Achievement[] {
  return ACHIEVEMENTS.filter(a => a.category === category);
}

/**
 * Get achievements by tier.
 */
export function getAchievementsByTier(
  tier: AchievementTier
): readonly Achievement[] {
  return ACHIEVEMENTS.filter(a => a.tier === tier);
}

// ============================================================================
// ACHIEVEMENT NOTIFICATIONS
// ============================================================================

/**
 * Notification display config.
 */
export interface AchievementNotificationConfig {
  /** Duration in milliseconds */
  readonly duration: number;
  /** Position on screen */
  readonly position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  /** Show points */
  readonly showPoints: boolean;
  /** Play sound */
  readonly playSound: boolean;
  /** Sound URL (if playSound is true) */
  readonly soundUrl?: string;
  /** Animation style */
  readonly animation: 'slide' | 'fade' | 'bounce' | 'scale';
  /** Max visible notifications */
  readonly maxVisible: number;
  /** Stack direction */
  readonly stackDirection: 'up' | 'down';
}

/**
 * Default notification config.
 */
export const DEFAULT_NOTIFICATION_CONFIG: AchievementNotificationConfig = {
  duration: 5000,
  position: 'top-right',
  showPoints: true,
  playSound: true,
  animation: 'slide',
  maxVisible: 3,
  stackDirection: 'down',
};

/**
 * Notification queue state.
 */
export interface NotificationQueue {
  /** Active notifications */
  readonly active: readonly AchievementUnlock[];
  /** Queued notifications (waiting to display) */
  readonly queued: readonly AchievementUnlock[];
  /** Config */
  readonly config: AchievementNotificationConfig;
}

/**
 * Create initial notification queue.
 */
export function createNotificationQueue(
  config: AchievementNotificationConfig = DEFAULT_NOTIFICATION_CONFIG
): NotificationQueue {
  return {
    active: [],
    queued: [],
    config,
  };
}

/**
 * Add notification to queue.
 */
export function enqueueNotification(
  queue: NotificationQueue,
  unlock: AchievementUnlock
): NotificationQueue {
  // If we can show it immediately, add to active
  if (queue.active.length < queue.config.maxVisible) {
    return {
      ...queue,
      active: [...queue.active, unlock],
    };
  }
  
  // Otherwise add to queued
  return {
    ...queue,
    queued: [...queue.queued, unlock],
  };
}

/**
 * Remove notification from active (when dismissed or expired).
 */
export function dequeueNotification(
  queue: NotificationQueue,
  unlockTimestamp: number
): NotificationQueue {
  const newActive = queue.active.filter(u => u.timestamp !== unlockTimestamp);
  
  // Move one from queued to active if space available
  if (queue.queued.length > 0 && newActive.length < queue.config.maxVisible) {
    const [next, ...remainingQueued] = queue.queued;
    if (next) {
      return {
        ...queue,
        active: [...newActive, next],
        queued: remainingQueued,
      };
    }
  }
  
  return {
    ...queue,
    active: newActive,
  };
}

/**
 * Get notification CSS for positioning and animation.
 */
export function getNotificationCSS(config: AchievementNotificationConfig): string {
  const positionStyles: Record<typeof config.position, string> = {
    'top-left': 'top: 20px; left: 20px;',
    'top-right': 'top: 20px; right: 20px;',
    'bottom-left': 'bottom: 20px; left: 20px;',
    'bottom-right': 'bottom: 20px; right: 20px;',
    'top-center': 'top: 20px; left: 50%; transform: translateX(-50%);',
    'bottom-center': 'bottom: 20px; left: 50%; transform: translateX(-50%);',
  };
  
  const animationKeyframes: Record<typeof config.animation, string> = {
    'slide': `
      @keyframes achievement-slide {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes achievement-slide-out {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }
    `,
    'fade': `
      @keyframes achievement-fade {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes achievement-fade-out {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `,
    'bounce': `
      @keyframes achievement-bounce {
        0% { transform: scale(0); opacity: 0; }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes achievement-bounce-out {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(0); opacity: 0; }
      }
    `,
    'scale': `
      @keyframes achievement-scale {
        from { transform: scale(0.5); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      @keyframes achievement-scale-out {
        from { transform: scale(1); opacity: 1; }
        to { transform: scale(0.5); opacity: 0; }
      }
    `,
  };
  
  return `
    .achievement-notification-container {
      position: fixed;
      ${positionStyles[config.position]}
      z-index: 10000;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
    }
    
    ${animationKeyframes[config.animation]}
    
    .achievement-notification {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      gap: 16px;
      align-items: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      pointer-events: auto;
      cursor: pointer;
      animation: achievement-${config.animation} 0.3s ease-out;
      border: 2px solid transparent;
      transition: all 0.2s ease;
    }
    
    .achievement-notification:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
    }
    
    .achievement-notification.removing {
      animation: achievement-${config.animation}-out 0.3s ease-in;
    }
    
    .achievement-notification.achievement-tier-bronze {
      border-color: #cd7f32;
    }
    
    .achievement-notification.achievement-tier-silver {
      border-color: #c0c0c0;
    }
    
    .achievement-notification.achievement-tier-gold {
      border-color: #ffd700;
    }
    
    .achievement-notification.achievement-tier-platinum {
      border-color: #e5e4e2;
      background: linear-gradient(135deg, #2a2a3e 0%, #26324e 100%);
    }
    
    .achievement-icon {
      font-size: 48px;
      flex-shrink: 0;
      animation: pulse 1s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    
    .achievement-content {
      flex: 1;
      min-width: 0;
    }
    
    .achievement-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #888;
      margin-bottom: 4px;
      font-weight: 600;
    }
    
    .achievement-name {
      font-size: 18px;
      font-weight: bold;
      color: #fff;
      margin-bottom: 4px;
    }
    
    .achievement-description {
      font-size: 14px;
      color: #bbb;
      line-height: 1.4;
    }
    
    .achievement-points {
      font-size: 14px;
      color: #ffd700;
      font-weight: 600;
      margin-top: 8px;
    }
  `;
}

/**
 * Create notification data object for UI frameworks.
 */
export interface NotificationData {
  /** Unique ID for this notification instance */
  readonly id: string;
  /** Achievement that was unlocked */
  readonly achievement: Achievement;
  /** Timestamp */
  readonly timestamp: number;
  /** Position configuration */
  readonly position: AchievementNotificationConfig['position'];
  /** Animation style */
  readonly animation: AchievementNotificationConfig['animation'];
  /** Duration in ms */
  readonly duration: number;
  /** Show points */
  readonly showPoints: boolean;
  /** Play sound */
  readonly playSound: boolean;
  /** Sound URL */
  readonly soundUrl?: string;
}

/**
 * Create notification data from unlock.
 */
export function createNotificationData(
  unlock: AchievementUnlock,
  config: AchievementNotificationConfig = DEFAULT_NOTIFICATION_CONFIG
): NotificationData {
  const data: NotificationData = {
    id: `${unlock.achievement.id}-${unlock.timestamp}`,
    achievement: unlock.achievement,
    timestamp: unlock.timestamp,
    position: config.position,
    animation: config.animation,
    duration: config.duration,
    showPoints: config.showPoints,
    playSound: config.playSound,
  };
  
  if (config.soundUrl !== undefined) {
    return { ...data, soundUrl: config.soundUrl };
  }
  
  return data;
}

/**
 * Create notification HTML for an achievement unlock.
 */
export function createAchievementNotificationHTML(
  unlock: AchievementUnlock,
  config: AchievementNotificationConfig = DEFAULT_NOTIFICATION_CONFIG
): string {
  const { achievement } = unlock;
  const pointsText = config.showPoints ? `<div class="achievement-points">+${achievement.points} points</div>` : '';
  
  return `
    <div class="achievement-notification achievement-tier-${achievement.tier}" data-animation="${config.animation}">
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-content">
        <div class="achievement-title">Achievement Unlocked!</div>
        <div class="achievement-name">${achievement.name}</div>
        <div class="achievement-description">${achievement.description}</div>
        ${pointsText}
      </div>
    </div>
  `;
}

// ============================================================================
// ACHIEVEMENT GALLERY
// ============================================================================

/**
 * Gallery display mode.
 */
export type GalleryDisplayMode = 'grid' | 'list' | 'compact';

/**
 * Gallery filter options.
 */
export interface AchievementGalleryFilter {
  /** Filter by category */
  readonly category: AchievementCategory | 'all';
  /** Filter by tier */
  readonly tier: AchievementTier | 'all';
  /** Filter by unlock status */
  readonly status: 'all' | 'unlocked' | 'locked' | 'in-progress';
  /** Search query */
  readonly search: string;
  /** Sort by */
  readonly sortBy: 'name' | 'points' | 'unlock-date' | 'category' | 'tier' | 'progress';
  /** Sort order */
  readonly sortOrder: 'asc' | 'desc';
  /** Display mode */
  readonly displayMode: GalleryDisplayMode;
  /** Show hidden achievements */
  readonly showHidden: boolean;
}

/**
 * Default gallery filter.
 */
export const DEFAULT_GALLERY_FILTER: AchievementGalleryFilter = {
  category: 'all',
  tier: 'all',
  status: 'all',
  search: '',
  sortBy: 'unlock-date',
  sortOrder: 'desc',
  displayMode: 'grid',
  showHidden: false,
};

/**
 * Gallery view data for an achievement.
 */
export interface AchievementGalleryItem {
  /** The achievement */
  readonly achievement: Achievement;
  /** Progress state */
  readonly progress: AchievementProgress;
  /** Whether unlocked */
  readonly unlocked: boolean;
  /** Progress percentage (0-100) */
  readonly progressPercent: number;
  /** Unlock date formatted */
  readonly unlockedDate: string | null;
  /** Whether to show as locked (hidden + locked) */
  readonly showAsLocked: boolean;
}

/**
 * Convert achievement to gallery item.
 */
export function createGalleryItem(
  achievement: Achievement,
  manager: AchievementManager,
  showHidden: boolean
): AchievementGalleryItem {
  const progress = manager.progress.get(achievement.id);
  const unlocked = progress?.unlocked === true;
  const showAsLocked = achievement.hidden && !unlocked && !showHidden;
  
  return {
    achievement: showAsLocked ? {
      ...achievement,
      name: '???',
      description: 'Hidden achievement - unlock to reveal',
      icon: '🔒',
      requirement: 'Complete the requirement to unlock',
      hint: 'This is a secret!',
    } : achievement,
    progress: progress || {
      id: achievement.id,
      unlocked: false,
      unlockedAt: null,
      progress: 0,
      currentCount: 0,
      targetCount: 1,
      showProgress: false,
    },
    unlocked,
    progressPercent: (progress?.progress ?? 0) * 100,
    unlockedDate: progress?.unlockedAt 
      ? new Date(progress.unlockedAt).toLocaleDateString() 
      : null,
    showAsLocked,
  };
}

/**
 * Filter and sort achievements for gallery display.
 */
export function filterAchievements(
  manager: AchievementManager,
  filter: AchievementGalleryFilter
): readonly Achievement[] {
  let results = [...ACHIEVEMENTS];
  
  // Filter by category
  if (filter.category !== 'all') {
    results = results.filter(a => a.category === filter.category);
  }
  
  // Filter by tier
  if (filter.tier !== 'all') {
    results = results.filter(a => a.tier === filter.tier);
  }
  
  // Filter by status
  if (filter.status !== 'all') {
    results = results.filter(a => {
      const progress = manager.progress.get(a.id);
      const unlocked = progress?.unlocked === true;
      const inProgress = !unlocked && (progress?.progress ?? 0) > 0;
      
      switch (filter.status) {
        case 'unlocked':
          return unlocked;
        case 'locked':
          return !unlocked && !inProgress;
        case 'in-progress':
          return inProgress;
        default:
          return true;
      }
    });
  }
  
  // Filter hidden achievements if not showing them
  if (!filter.showHidden) {
    results = results.filter(a => {
      const progress = manager.progress.get(a.id);
      const unlocked = progress?.unlocked === true;
      return !a.hidden || unlocked;
    });
  }
  
  // Filter by search
  if (filter.search) {
    const query = filter.search.toLowerCase();
    results = results.filter(a => {
      // Don't search in hidden locked achievements
      const progress = manager.progress.get(a.id);
      const unlocked = progress?.unlocked === true;
      if (a.hidden && !unlocked) {
        return false;
      }
      
      return a.name.toLowerCase().includes(query) ||
             a.description.toLowerCase().includes(query) ||
             a.category.toLowerCase().includes(query) ||
             a.requirement.toLowerCase().includes(query) ||
             a.hint.toLowerCase().includes(query);
    });
  }
  
  // Sort
  results.sort((a, b) => {
    let comparison = 0;
    
    switch (filter.sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'points':
        comparison = a.points - b.points;
        break;
      case 'unlock-date': {
        const progressA = manager.progress.get(a.id);
        const progressB = manager.progress.get(b.id);
        const dateA = progressA?.unlockedAt ?? 0;
        const dateB = progressB?.unlockedAt ?? 0;
        comparison = dateB - dateA;
        break;
      }
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
      case 'tier': {
        const tierOrder = { bronze: 0, silver: 1, gold: 2, platinum: 3 };
        comparison = tierOrder[a.tier] - tierOrder[b.tier];
        break;
      }
      case 'progress': {
        const progressA = manager.progress.get(a.id);
        const progressB = manager.progress.get(b.id);
        comparison = (progressB?.progress ?? 0) - (progressA?.progress ?? 0);
        break;
      }
    }
    
    return filter.sortOrder === 'asc' ? comparison : -comparison;
  });
  
  return results;
}

/**
 * Get gallery CSS styles.
 */
export function getGalleryCSS(): string {
  return `
    .achievement-gallery {
      padding: 24px;
      background: #0a0a0f;
      min-height: 100vh;
    }
    
    .achievement-gallery-header {
      margin-bottom: 32px;
    }
    
    .achievement-gallery-title {
      font-size: 32px;
      font-weight: bold;
      color: #fff;
      margin-bottom: 8px;
    }
    
    .achievement-gallery-stats {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
      margin-top: 16px;
    }
    
    .achievement-stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .achievement-stat-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #888;
    }
    
    .achievement-stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #fff;
    }
    
    .achievement-gallery-filters {
      background: #16161e;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
    }
    
    .achievement-gallery-search {
      flex: 1;
      min-width: 200px;
      padding: 10px 16px;
      background: #1a1a24;
      border: 1px solid #2a2a36;
      border-radius: 8px;
      color: #fff;
      font-size: 14px;
    }
    
    .achievement-gallery-select {
      padding: 10px 16px;
      background: #1a1a24;
      border: 1px solid #2a2a36;
      border-radius: 8px;
      color: #fff;
      font-size: 14px;
      cursor: pointer;
    }
    
    .achievement-gallery-toggle {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 10px 16px;
      background: #1a1a24;
      border: 1px solid #2a2a36;
      border-radius: 8px;
      color: #fff;
      font-size: 14px;
      cursor: pointer;
      user-select: none;
    }
    
    .achievement-gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
    
    .achievement-gallery-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .achievement-gallery-compact {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 12px;
    }
    
    .achievement-card {
      background: #16161e;
      border-radius: 12px;
      padding: 20px;
      border: 2px solid transparent;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    
    .achievement-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }
    
    .achievement-card.unlocked {
      border-color: #4a9eff;
    }
    
    .achievement-card.locked {
      opacity: 0.6;
    }
    
    .achievement-card.tier-bronze {
      border-color: #cd7f32;
    }
    
    .achievement-card.tier-silver {
      border-color: #c0c0c0;
    }
    
    .achievement-card.tier-gold {
      border-color: #ffd700;
    }
    
    .achievement-card.tier-platinum {
      border-color: #e5e4e2;
      background: linear-gradient(135deg, #1a1a2e 0%, #1e2841 100%);
    }
    
    .achievement-card-icon {
      font-size: 64px;
      text-align: center;
      margin-bottom: 16px;
    }
    
    .achievement-card-name {
      font-size: 18px;
      font-weight: bold;
      color: #fff;
      margin-bottom: 8px;
      text-align: center;
    }
    
    .achievement-card-description {
      font-size: 14px;
      color: #bbb;
      line-height: 1.5;
      margin-bottom: 12px;
      text-align: center;
    }
    
    .achievement-card-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #2a2a36;
    }
    
    .achievement-card-points {
      font-size: 14px;
      color: #ffd700;
      font-weight: 600;
    }
    
    .achievement-card-category {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #888;
    }
    
    .achievement-card-progress {
      margin-top: 12px;
    }
    
    .achievement-card-progress-bar {
      width: 100%;
      height: 8px;
      background: #2a2a36;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 8px;
    }
    
    .achievement-card-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #4a9eff 0%, #66b3ff 100%);
      transition: width 0.3s ease;
    }
    
    .achievement-card-progress-text {
      font-size: 12px;
      color: #888;
      margin-top: 4px;
      text-align: center;
    }
    
    .achievement-card-unlocked-date {
      font-size: 12px;
      color: #4a9eff;
      text-align: center;
      margin-top: 8px;
    }
    
    .achievement-list-item {
      display: flex;
      gap: 20px;
      align-items: center;
      background: #16161e;
      border-radius: 12px;
      padding: 16px;
      border: 2px solid transparent;
      transition: all 0.2s ease;
    }
    
    .achievement-list-item:hover {
      transform: translateX(4px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    }
    
    .achievement-compact-item {
      aspect-ratio: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #16161e;
      border-radius: 12px;
      padding: 12px;
      border: 2px solid transparent;
      transition: all 0.2s ease;
    }
    
    .achievement-compact-item:hover {
      transform: scale(1.05);
    }
    
    .achievement-compact-icon {
      font-size: 48px;
      margin-bottom: 8px;
    }
    
    .achievement-compact-name {
      font-size: 12px;
      color: #fff;
      text-align: center;
      font-weight: 600;
    }
  `;
}

// ============================================================================
// ACHIEVEMENT SHARING
// ============================================================================

/**
 * Share platform type.
 */
export type SharePlatform = 'twitter' | 'facebook' | 'reddit' | 'discord' | 'clipboard' | 'image' | 'email';

/**
 * Share options.
 */
export interface AchievementShareOptions {
  /** Platform to share on */
  readonly platform: SharePlatform;
  /** Include stats */
  readonly includeStats: boolean;
  /** Include progress */
  readonly includeProgress: boolean;
  /** Custom message */
  readonly message?: string;
  /** Include achievement icon */
  readonly includeIcon: boolean;
  /** Include CardPlay branding */
  readonly includeBranding: boolean;
}

/**
 * Default share options.
 */
export const DEFAULT_SHARE_OPTIONS: AchievementShareOptions = {
  platform: 'clipboard',
  includeStats: true,
  includeProgress: false,
  includeIcon: true,
  includeBranding: true,
};

/**
 * Share result.
 */
export interface ShareResult {
  /** Whether share was successful */
  readonly success: boolean;
  /** Error message if failed */
  readonly error?: string;
  /** Generated content (for clipboard/image) */
  readonly content?: string;
  /** Generated URL (for platforms) */
  readonly url?: string;
}

/**
 * Generate share text for an achievement.
 */
export function generateShareText(
  achievement: Achievement,
  options: AchievementShareOptions,
  manager?: AchievementManager
): string {
  const icon = options.includeIcon ? `${achievement.icon} ` : '';
  const baseText = options.message || 
    `${icon}I just unlocked the "${achievement.name}" achievement in CardPlay!`;
  
  let parts: string[] = [baseText];
  
  if (options.includeStats) {
    parts.push(`\n${achievement.description}`);
    parts.push(`\n+${achievement.points} points earned`);
  }
  
  if (options.includeProgress && manager) {
    const stats = getAchievementStats(manager);
    parts.push(`\nTotal progress: ${stats.unlocked}/${stats.total} achievements (${Math.round(stats.completionPercent)}%)`);
    parts.push(`Points: ${stats.earnedPoints}/${stats.totalPoints}`);
  }
  
  if (options.includeBranding) {
    parts.push('\n\n🎵 Made with CardPlay - https://cardplay.app');
  }
  
  return parts.join('');
}

/**
 * Generate share URL for an achievement.
 */
export function generateShareURL(
  achievement: Achievement,
  options: AchievementShareOptions,
  manager?: AchievementManager
): string {
  const text = encodeURIComponent(generateShareText(achievement, options, manager));
  const url = encodeURIComponent('https://cardplay.app');
  const hashtags = encodeURIComponent('CardPlay,MusicProduction,Achievement');
  
  switch (options.platform) {
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=${hashtags}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
    case 'reddit':
      return `https://reddit.com/submit?url=${url}&title=${text}`;
    case 'discord':
      // Discord doesn't have a direct share URL, return text for clipboard
      return `discord://share?text=${text}`;
    case 'email': {
      const subject = encodeURIComponent(`Achievement Unlocked: ${achievement.name}`);
      return `mailto:?subject=${subject}&body=${text}`;
    }
    default:
      return url;
  }
}

/**
 * Share achievement (platform-specific implementation needed).
 */
export async function shareAchievement(
  achievement: Achievement,
  options: AchievementShareOptions,
  manager?: AchievementManager
): Promise<ShareResult> {
  try {
    const text = generateShareText(achievement, options, manager);
    
    switch (options.platform) {
      case 'clipboard':
        // In browser: navigator.clipboard.writeText(text)
        // In Node: just return the text
        return {
          success: true,
          content: text,
        };
      
      case 'image':
        // Generate image (implementation would use canvas/svg)
        return {
          success: true,
          content: text, // Would be image data URL in real implementation
        };
      
      case 'twitter':
      case 'facebook':
      case 'reddit':
      case 'discord':
      case 'email': {
        const url = generateShareURL(achievement, options, manager);
        // In browser: window.open(url)
        return {
          success: true,
          url,
        };
      }
      
      default:
        return {
          success: false,
          error: `Unsupported platform: ${options.platform}`,
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate achievement image data for sharing.
 * Returns SVG string that can be converted to PNG/JPEG.
 */
export function generateAchievementImage(
  achievement: Achievement,
  manager?: AchievementManager,
  options: AchievementShareOptions = DEFAULT_SHARE_OPTIONS
): string {
  const width = 1200;
  const height = 630; // Standard social media image size
  
  const tierColors: Record<AchievementTier, string> = {
    bronze: '#cd7f32',
    silver: '#c0c0c0',
    gold: '#ffd700',
    platinum: '#e5e4e2',
  };
  
  const tierColor = tierColors[achievement.tier];
  const progress = manager ? getAchievementStats(manager) : null;
  
  let progressText = '';
  if (options.includeProgress && progress) {
    progressText = `
      <text x="600" y="500" fill="#ffffff" font-size="24" text-anchor="middle" font-family="Arial, sans-serif">
        ${progress.unlocked}/${progress.total} achievements • ${progress.earnedPoints}/${progress.totalPoints} points
      </text>
    `;
  }
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background gradient -->
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="badge" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${tierColor};stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:${tierColor};stop-opacity:0.1" />
        </linearGradient>
      </defs>
      
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      
      <!-- Border -->
      <rect x="20" y="20" width="${width - 40}" height="${height - 40}" 
            fill="none" stroke="${tierColor}" stroke-width="4" rx="20"/>
      
      <!-- Achievement icon circle background -->
      <circle cx="600" cy="200" r="100" fill="url(#badge)"/>
      <circle cx="600" cy="200" r="100" fill="none" stroke="${tierColor}" stroke-width="3"/>
      
      <!-- Achievement icon (emoji) -->
      <text x="600" y="240" fill="#ffffff" font-size="100" text-anchor="middle">
        ${achievement.icon}
      </text>
      
      <!-- Title -->
      <text x="600" y="350" fill="#888888" font-size="24" text-anchor="middle" 
            font-family="Arial, sans-serif" font-weight="bold" letter-spacing="2">
        ACHIEVEMENT UNLOCKED
      </text>
      
      <!-- Achievement name -->
      <text x="600" y="400" fill="#ffffff" font-size="48" text-anchor="middle" 
            font-family="Arial, sans-serif" font-weight="bold">
        ${achievement.name}
      </text>
      
      <!-- Achievement description -->
      <text x="600" y="450" fill="#bbbbbb" font-size="28" text-anchor="middle" 
            font-family="Arial, sans-serif">
        ${achievement.description}
      </text>
      
      <!-- Progress text (if enabled) -->
      ${progressText}
      
      <!-- Points -->
      <text x="600" y="560" fill="${tierColor}" font-size="32" text-anchor="middle" 
            font-family="Arial, sans-serif" font-weight="bold">
        +${achievement.points} POINTS
      </text>
      
      ${options.includeBranding ? `
        <!-- CardPlay logo/text -->
        <text x="600" y="600" fill="#666666" font-size="20" text-anchor="middle" 
              font-family="Arial, sans-serif">
          CardPlay • Music Creation Reimagined
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Create share menu data.
 */
export interface ShareMenuItem {
  readonly platform: SharePlatform;
  readonly label: string;
  readonly icon: string;
  readonly color: string;
}

/**
 * Get available share menu items.
 */
export function getShareMenuItems(): readonly ShareMenuItem[] {
  return [
    {
      platform: 'twitter',
      label: 'Share on Twitter',
      icon: '🐦',
      color: '#1da1f2',
    },
    {
      platform: 'facebook',
      label: 'Share on Facebook',
      icon: '👥',
      color: '#4267b2',
    },
    {
      platform: 'reddit',
      label: 'Share on Reddit',
      icon: '📱',
      color: '#ff4500',
    },
    {
      platform: 'discord',
      label: 'Share on Discord',
      icon: '💬',
      color: '#5865f2',
    },
    {
      platform: 'clipboard',
      label: 'Copy to Clipboard',
      icon: '📋',
      color: '#888888',
    },
    {
      platform: 'image',
      label: 'Download as Image',
      icon: '🖼️',
      color: '#888888',
    },
    {
      platform: 'email',
      label: 'Share via Email',
      icon: '📧',
      color: '#888888',
    },
  ];
}

/**
 * Get share menu CSS.
 */
export function getShareMenuCSS(): string {
  return `
    .achievement-share-menu {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #1a1a24;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      z-index: 10001;
      min-width: 400px;
      max-width: 500px;
    }
    
    .achievement-share-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid #2a2a36;
    }
    
    .achievement-share-icon {
      font-size: 48px;
    }
    
    .achievement-share-title {
      flex: 1;
    }
    
    .achievement-share-name {
      font-size: 20px;
      font-weight: bold;
      color: #fff;
      margin-bottom: 4px;
    }
    
    .achievement-share-points {
      font-size: 14px;
      color: #ffd700;
      font-weight: 600;
    }
    
    .achievement-share-options {
      margin-bottom: 20px;
    }
    
    .achievement-share-option {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    
    .achievement-share-checkbox {
      width: 20px;
      height: 20px;
    }
    
    .achievement-share-label {
      font-size: 14px;
      color: #bbb;
      cursor: pointer;
      user-select: none;
    }
    
    .achievement-share-buttons {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .achievement-share-button {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      border-radius: 8px;
      border: none;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #fff;
    }
    
    .achievement-share-button:hover {
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    
    .achievement-share-button-icon {
      font-size: 24px;
    }
    
    .achievement-share-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10000;
      backdrop-filter: blur(4px);
    }
  `;
}

// ============================================================================
// PERSISTENCE
// ============================================================================

/**
 * Serialize achievement manager to JSON.
 */
export function serializeAchievementManager(manager: AchievementManager): string {
  const data = {
    progress: Array.from(manager.progress.entries()),
    recentUnlocks: manager.recentUnlocks.map(u => ({
      achievementId: u.achievement.id,
      timestamp: u.timestamp,
      isNew: u.isNew,
    })),
  };
  return JSON.stringify(data);
}

/**
 * Deserialize achievement manager from JSON.
 */
export function deserializeAchievementManager(json: string): AchievementManager {
  const data = JSON.parse(json);
  const progress = new Map<string, AchievementProgress>(data.progress);
  
  const recentUnlocks: AchievementUnlock[] = data.recentUnlocks.map((u: any) => {
    const achievement = ACHIEVEMENTS.find(a => a.id === u.achievementId);
    if (!achievement) {
      throw new Error(`Achievement not found: ${u.achievementId}`);
    }
    return {
      achievement,
      timestamp: u.timestamp,
      isNew: false, // Loaded from storage, not new
    };
  });
  
  return {
    achievements: ACHIEVEMENTS,
    progress,
    recentUnlocks,
  };
}
