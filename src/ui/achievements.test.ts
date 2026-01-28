/**
 * @fileoverview Tests for Achievement System.
 */

import { describe, it, expect } from 'vitest';
import type {
  AchievementManager,
  AchievementProgress,
  AchievementStats,
  AchievementGalleryFilter,
  NotificationQueue,
  AchievementUnlock,
} from './achievements';
import {
  ACHIEVEMENTS,
  createAchievementManager,
  updateAchievementProgress,
  unlockAchievement,
  clearRecentUnlocks,
  getAchievementStats,
  getUnlockedAchievements,
  getLockedAchievements,
  getAchievementsByCategory,
  getAchievementsByTier,
  filterAchievements,
  generateShareText,
  generateShareURL,
  serializeAchievementManager,
  deserializeAchievementManager,
  DEFAULT_GALLERY_FILTER,
  DEFAULT_NOTIFICATION_CONFIG,
  DEFAULT_SHARE_OPTIONS,
  createNotificationQueue,
  enqueueNotification,
  dequeueNotification,
  getNotificationCSS,
  createNotificationData,
  createGalleryItem,
  getGalleryCSS,
  shareAchievement,
  generateAchievementImage,
  getShareMenuItems,
  getShareMenuCSS,
} from './achievements';

describe('Achievement System', () => {
  describe('createAchievementManager', () => {
    it('should create manager with all achievements', () => {
      const manager = createAchievementManager();
      expect(manager.achievements).toHaveLength(ACHIEVEMENTS.length);
      expect(manager.progress.size).toBe(ACHIEVEMENTS.length);
      expect(manager.recentUnlocks).toHaveLength(0);
    });

    it('should initialize all achievements as locked', () => {
      const manager = createAchievementManager();
      for (const [_, progress] of manager.progress) {
        expect(progress.unlocked).toBe(false);
        expect(progress.unlockedAt).toBeNull();
        expect(progress.progress).toBe(0);
        expect(progress.currentCount).toBe(0);
      }
    });

    it('should set target counts correctly', () => {
      const manager = createAchievementManager();
      
      const cardMasterProgress = manager.progress.get('card-master');
      expect(cardMasterProgress?.targetCount).toBe(10);
      
      const presetExplorerProgress = manager.progress.get('preset-explorer');
      expect(presetExplorerProgress?.targetCount).toBe(50);
      
      const projects10Progress = manager.progress.get('projects-10');
      expect(projects10Progress?.targetCount).toBe(10);
      
      const hours100Progress = manager.progress.get('hours-100');
      expect(hours100Progress?.targetCount).toBe(100);
    });
  });

  describe('updateAchievementProgress', () => {
    it('should increment progress', () => {
      let manager = createAchievementManager();
      manager = updateAchievementProgress(manager, 'card-master', 3);
      
      const progress = manager.progress.get('card-master');
      expect(progress?.currentCount).toBe(3);
      expect(progress?.progress).toBe(0.3);
      expect(progress?.unlocked).toBe(false);
    });

    it('should unlock achievement when target reached', () => {
      let manager = createAchievementManager();
      manager = updateAchievementProgress(manager, 'card-master', 10);
      
      const progress = manager.progress.get('card-master');
      expect(progress?.currentCount).toBe(10);
      expect(progress?.progress).toBe(1);
      expect(progress?.unlocked).toBe(true);
      expect(progress?.unlockedAt).toBeGreaterThan(0);
    });

    it('should add to recent unlocks when unlocked', () => {
      let manager = createAchievementManager();
      manager = updateAchievementProgress(manager, 'first-note');
      
      expect(manager.recentUnlocks).toHaveLength(1);
      expect(manager.recentUnlocks[0].achievement.id).toBe('first-note');
      expect(manager.recentUnlocks[0].isNew).toBe(true);
    });

    it('should not increment if already unlocked', () => {
      let manager = createAchievementManager();
      manager = updateAchievementProgress(manager, 'first-note');
      manager = updateAchievementProgress(manager, 'first-note');
      
      const progress = manager.progress.get('first-note');
      expect(progress?.currentCount).toBe(1);
      expect(manager.recentUnlocks).toHaveLength(1);
    });

    it('should cap progress at 1.0', () => {
      let manager = createAchievementManager();
      manager = updateAchievementProgress(manager, 'card-master', 20);
      
      const progress = manager.progress.get('card-master');
      expect(progress?.progress).toBe(1);
    });

    it('should support increments greater than 1', () => {
      let manager = createAchievementManager();
      manager = updateAchievementProgress(manager, 'preset-explorer', 25);
      
      const progress = manager.progress.get('preset-explorer');
      expect(progress?.currentCount).toBe(25);
      expect(progress?.progress).toBe(0.5);
    });
  });

  describe('unlockAchievement', () => {
    it('should unlock achievement immediately', () => {
      let manager = createAchievementManager();
      manager = unlockAchievement(manager, 'first-note');
      
      const progress = manager.progress.get('first-note');
      expect(progress?.unlocked).toBe(true);
      expect(progress?.progress).toBe(1);
      expect(progress?.unlockedAt).toBeGreaterThan(0);
    });

    it('should add to recent unlocks', () => {
      let manager = createAchievementManager();
      manager = unlockAchievement(manager, 'first-note');
      
      expect(manager.recentUnlocks).toHaveLength(1);
      expect(manager.recentUnlocks[0].achievement.id).toBe('first-note');
    });

    it('should not duplicate if already unlocked', () => {
      let manager = createAchievementManager();
      manager = unlockAchievement(manager, 'first-note');
      manager = unlockAchievement(manager, 'first-note');
      
      expect(manager.recentUnlocks).toHaveLength(1);
    });

    it('should set count to target', () => {
      let manager = createAchievementManager();
      manager = unlockAchievement(manager, 'card-master');
      
      const progress = manager.progress.get('card-master');
      expect(progress?.currentCount).toBe(10);
    });
  });

  describe('clearRecentUnlocks', () => {
    it('should clear recent unlocks', () => {
      let manager = createAchievementManager();
      manager = unlockAchievement(manager, 'first-note');
      manager = unlockAchievement(manager, 'first-loop');
      
      expect(manager.recentUnlocks).toHaveLength(2);
      
      manager = clearRecentUnlocks(manager);
      expect(manager.recentUnlocks).toHaveLength(0);
    });

    it('should preserve unlocked state', () => {
      let manager = createAchievementManager();
      manager = unlockAchievement(manager, 'first-note');
      manager = clearRecentUnlocks(manager);
      
      const progress = manager.progress.get('first-note');
      expect(progress?.unlocked).toBe(true);
    });
  });

  describe('getAchievementStats', () => {
    it('should calculate correct stats for empty manager', () => {
      const manager = createAchievementManager();
      const stats = getAchievementStats(manager);
      
      expect(stats.total).toBe(ACHIEVEMENTS.length);
      expect(stats.unlocked).toBe(0);
      expect(stats.earnedPoints).toBe(0);
      expect(stats.completionPercent).toBe(0);
    });

    it('should calculate correct stats with unlocks', () => {
      let manager = createAchievementManager();
      manager = unlockAchievement(manager, 'first-note'); // 10 points
      manager = unlockAchievement(manager, 'first-loop'); // 20 points
      
      const stats = getAchievementStats(manager);
      expect(stats.unlocked).toBe(2);
      expect(stats.earnedPoints).toBe(30);
      expect(stats.completionPercent).toBeGreaterThan(0);
    });

    it('should calculate by category correctly', () => {
      let manager = createAchievementManager();
      manager = unlockAchievement(manager, 'first-note'); // getting-started
      manager = unlockAchievement(manager, 'stack-builder'); // composition
      
      const stats = getAchievementStats(manager);
      expect(stats.byCategory['getting-started'].unlocked).toBe(1);
      expect(stats.byCategory['composition'].unlocked).toBe(1);
      expect(stats.byCategory['production'].unlocked).toBe(0);
    });

    it('should calculate by tier correctly', () => {
      let manager = createAchievementManager();
      manager = unlockAchievement(manager, 'first-note'); // bronze
      manager = unlockAchievement(manager, 'card-master'); // silver
      manager = unlockAchievement(manager, 'graph-wizard'); // gold
      
      const stats = getAchievementStats(manager);
      expect(stats.byTier['bronze'].unlocked).toBe(1);
      expect(stats.byTier['silver'].unlocked).toBe(1);
      expect(stats.byTier['gold'].unlocked).toBe(1);
      expect(stats.byTier['platinum'].unlocked).toBe(0);
    });

    it('should calculate total points correctly', () => {
      const manager = createAchievementManager();
      const stats = getAchievementStats(manager);
      
      const expectedTotal = ACHIEVEMENTS.reduce((sum, a) => sum + a.points, 0);
      expect(stats.totalPoints).toBe(expectedTotal);
    });
  });

  describe('getUnlockedAchievements', () => {
    it('should return empty array for new manager', () => {
      const manager = createAchievementManager();
      const unlocked = getUnlockedAchievements(manager);
      expect(unlocked).toHaveLength(0);
    });

    it('should return unlocked achievements', () => {
      let manager = createAchievementManager();
      manager = unlockAchievement(manager, 'first-note');
      manager = unlockAchievement(manager, 'first-loop');
      
      const unlocked = getUnlockedAchievements(manager);
      expect(unlocked).toHaveLength(2);
      expect(unlocked[0].id).toBe('first-note');
      expect(unlocked[1].id).toBe('first-loop');
    });
  });

  describe('getLockedAchievements', () => {
    it('should return all non-hidden achievements for new manager', () => {
      const manager = createAchievementManager();
      const locked = getLockedAchievements(manager, false);
      
      const nonHiddenCount = ACHIEVEMENTS.filter(a => !a.hidden).length;
      expect(locked).toHaveLength(nonHiddenCount);
    });

    it('should exclude unlocked achievements', () => {
      let manager = createAchievementManager();
      manager = unlockAchievement(manager, 'first-note');
      
      const locked = getLockedAchievements(manager, false);
      expect(locked.find(a => a.id === 'first-note')).toBeUndefined();
    });

    it('should include hidden when requested', () => {
      const manager = createAchievementManager();
      const lockedWithHidden = getLockedAchievements(manager, true);
      const lockedWithoutHidden = getLockedAchievements(manager, false);
      
      expect(lockedWithHidden.length).toBeGreaterThan(lockedWithoutHidden.length);
    });
  });

  describe('getAchievementsByCategory', () => {
    it('should filter by category', () => {
      const gettingStarted = getAchievementsByCategory('getting-started');
      
      expect(gettingStarted.every(a => a.category === 'getting-started')).toBe(true);
    });

    it('should return correct categories', () => {
      expect(getAchievementsByCategory('getting-started').length).toBeGreaterThan(0);
      expect(getAchievementsByCategory('composition').length).toBeGreaterThan(0);
      expect(getAchievementsByCategory('production').length).toBeGreaterThan(0);
      expect(getAchievementsByCategory('mastery').length).toBeGreaterThan(0);
      expect(getAchievementsByCategory('exploration').length).toBeGreaterThan(0);
      expect(getAchievementsByCategory('social').length).toBeGreaterThan(0);
    });
  });

  describe('getAchievementsByTier', () => {
    it('should filter by tier', () => {
      const bronze = getAchievementsByTier('bronze');
      
      expect(bronze.every(a => a.tier === 'bronze')).toBe(true);
    });

    it('should return correct tiers', () => {
      expect(getAchievementsByTier('bronze').length).toBeGreaterThan(0);
      expect(getAchievementsByTier('silver').length).toBeGreaterThan(0);
      expect(getAchievementsByTier('gold').length).toBeGreaterThan(0);
      expect(getAchievementsByTier('platinum').length).toBeGreaterThan(0);
    });
  });

  describe('filterAchievements', () => {
    it('should filter by category', () => {
      const manager = createAchievementManager();
      const filter: AchievementGalleryFilter = {
        ...DEFAULT_GALLERY_FILTER,
        category: 'getting-started',
      };
      
      const results = filterAchievements(manager, filter);
      expect(results.every(a => a.category === 'getting-started')).toBe(true);
    });

    it('should filter by tier', () => {
      const manager = createAchievementManager();
      const filter: AchievementGalleryFilter = {
        ...DEFAULT_GALLERY_FILTER,
        tier: 'gold',
      };
      
      const results = filterAchievements(manager, filter);
      expect(results.every(a => a.tier === 'gold')).toBe(true);
    });

    it('should filter by unlock status', () => {
      let manager = createAchievementManager();
      manager = unlockAchievement(manager, 'first-note');
      
      const unlockedFilter: AchievementGalleryFilter = {
        ...DEFAULT_GALLERY_FILTER,
        status: 'unlocked',
      };
      
      const results = filterAchievements(manager, unlockedFilter);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('first-note');
    });

    it('should filter by search query', () => {
      const manager = createAchievementManager();
      const filter: AchievementGalleryFilter = {
        ...DEFAULT_GALLERY_FILTER,
        search: 'first',
      };
      
      const results = filterAchievements(manager, filter);
      expect(results.every(a => 
        a.name.toLowerCase().includes('first') ||
        a.description.toLowerCase().includes('first')
      )).toBe(true);
    });

    it('should sort by name', () => {
      const manager = createAchievementManager();
      const filter: AchievementGalleryFilter = {
        ...DEFAULT_GALLERY_FILTER,
        sortBy: 'name',
        sortOrder: 'asc',
      };
      
      const results = filterAchievements(manager, filter);
      for (let i = 1; i < results.length; i++) {
        expect(results[i].name >= results[i - 1].name).toBe(true);
      }
    });

    it('should sort by points', () => {
      const manager = createAchievementManager();
      const filter: AchievementGalleryFilter = {
        ...DEFAULT_GALLERY_FILTER,
        sortBy: 'points',
        sortOrder: 'desc',
      };
      
      const results = filterAchievements(manager, filter);
      for (let i = 1; i < results.length; i++) {
        expect(results[i].points <= results[i - 1].points).toBe(true);
      }
    });

    it('should combine multiple filters', () => {
      const manager = createAchievementManager();
      const filter: AchievementGalleryFilter = {
        ...DEFAULT_GALLERY_FILTER,
        category: 'getting-started',
        tier: 'bronze',
        sortBy: 'points',
        sortOrder: 'asc',
      };
      
      const results = filterAchievements(manager, filter);
      expect(results.every(a => 
        a.category === 'getting-started' && a.tier === 'bronze'
      )).toBe(true);
    });
  });

  describe('generateShareText', () => {
    it('should generate basic share text', () => {
      const achievement = ACHIEVEMENTS[0];
      const text = generateShareText(achievement, {
        platform: 'twitter',
        includeStats: false,
        includeIcon: true,
        includeProgress: false,
        includeBranding: true,
      });
      
      expect(text).toContain(achievement.name);
      expect(text).toContain('CardPlay');
      expect(text).toContain(achievement.icon);
    });

    it('should include stats when requested', () => {
      const achievement = ACHIEVEMENTS[0];
      const text = generateShareText(achievement, {
        platform: 'twitter',
        includeStats: true,
        includeIcon: true,
        includeProgress: false,
        includeBranding: true,
      });
      
      expect(text).toContain(achievement.description);
    });

    it('should use custom message', () => {
      const achievement = ACHIEVEMENTS[0];
      const customMessage = 'Custom achievement message!';
      const text = generateShareText(achievement, {
        platform: 'twitter',
        includeStats: false,
        includeIcon: true,
        includeProgress: false,
        includeBranding: false,
        message: customMessage,
      });
      
      expect(text).toContain(customMessage);
    });
  });

  describe('generateShareURL', () => {
    it('should generate Twitter share URL', () => {
      const achievement = ACHIEVEMENTS[0];
      const url = generateShareURL(achievement, {
        platform: 'twitter',
        includeStats: false,
        includeIcon: true,
        includeProgress: false,
        includeBranding: true,
      });
      
      expect(url).toContain('twitter.com/intent/tweet');
      expect(url).toContain('text=');
    });

    it('should generate Facebook share URL', () => {
      const achievement = ACHIEVEMENTS[0];
      const url = generateShareURL(achievement, {
        platform: 'facebook',
        includeStats: false,
      });
      
      expect(url).toContain('facebook.com/sharer');
    });

    it('should generate Discord share URL', () => {
      const achievement = ACHIEVEMENTS[0];
      const url = generateShareURL(achievement, {
        platform: 'discord',
        includeStats: false,
      });
      
      expect(url).toContain('discord://share');
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize manager', () => {
      let manager = createAchievementManager();
      manager = unlockAchievement(manager, 'first-note');
      manager = updateAchievementProgress(manager, 'card-master', 5);
      
      const json = serializeAchievementManager(manager);
      const restored = deserializeAchievementManager(json);
      
      expect(restored.progress.size).toBe(manager.progress.size);
      
      const firstNoteProgress = restored.progress.get('first-note');
      expect(firstNoteProgress?.unlocked).toBe(true);
      
      const cardMasterProgress = restored.progress.get('card-master');
      expect(cardMasterProgress?.currentCount).toBe(5);
    });

    it('should mark restored unlocks as not new', () => {
      let manager = createAchievementManager();
      manager = unlockAchievement(manager, 'first-note');
      
      const json = serializeAchievementManager(manager);
      const restored = deserializeAchievementManager(json);
      
      expect(restored.recentUnlocks.every(u => u.isNew === false)).toBe(true);
    });
  });

  describe('Achievement Definitions', () => {
    it('should have unique IDs', () => {
      const ids = new Set(ACHIEVEMENTS.map(a => a.id));
      expect(ids.size).toBe(ACHIEVEMENTS.length);
    });

    it('should have valid categories', () => {
      const validCategories = [
        'getting-started',
        'composition',
        'production',
        'mastery',
        'exploration',
        'social',
        'special',
      ];
      
      for (const achievement of ACHIEVEMENTS) {
        expect(validCategories).toContain(achievement.category);
      }
    });

    it('should have valid tiers', () => {
      const validTiers = ['bronze', 'silver', 'gold', 'platinum'];
      
      for (const achievement of ACHIEVEMENTS) {
        expect(validTiers).toContain(achievement.tier);
      }
    });

    it('should have positive points', () => {
      for (const achievement of ACHIEVEMENTS) {
        expect(achievement.points).toBeGreaterThan(0);
      }
    });

    it('should have all required fields', () => {
      for (const achievement of ACHIEVEMENTS) {
        expect(achievement.id).toBeTruthy();
        expect(achievement.name).toBeTruthy();
        expect(achievement.description).toBeTruthy();
        expect(achievement.icon).toBeTruthy();
        expect(achievement.requirement).toBeTruthy();
        expect(achievement.hint).toBeTruthy();
      }
    });
  });

  describe('Notifications', () => {
    it('should create notification queue', () => {
      const queue = createNotificationQueue();
      expect(queue.active).toHaveLength(0);
      expect(queue.queued).toHaveLength(0);
      expect(queue.config).toBeDefined();
    });

    it('should enqueue notification to active when space available', () => {
      let queue = createNotificationQueue();
      
      const unlock: AchievementUnlock = {
        achievement: ACHIEVEMENTS[0],
        timestamp: Date.now(),
        isNew: true,
      };
      
      queue = enqueueNotification(queue, unlock);
      expect(queue.active).toHaveLength(1);
      expect(queue.queued).toHaveLength(0);
    });

    it('should enqueue notification to queued when max reached', () => {
      let queue = createNotificationQueue({ ...DEFAULT_NOTIFICATION_CONFIG, maxVisible: 1 });
      
      const unlock1: AchievementUnlock = {
        achievement: ACHIEVEMENTS[0],
        timestamp: Date.now(),
        isNew: true,
      };
      
      const unlock2: AchievementUnlock = {
        achievement: ACHIEVEMENTS[1],
        timestamp: Date.now() + 1,
        isNew: true,
      };
      
      queue = enqueueNotification(queue, unlock1);
      queue = enqueueNotification(queue, unlock2);
      
      expect(queue.active).toHaveLength(1);
      expect(queue.queued).toHaveLength(1);
    });

    it('should dequeue notification and move from queued', () => {
      let queue = createNotificationQueue({ ...DEFAULT_NOTIFICATION_CONFIG, maxVisible: 1 });
      
      const unlock1: AchievementUnlock = {
        achievement: ACHIEVEMENTS[0],
        timestamp: 1000,
        isNew: true,
      };
      
      const unlock2: AchievementUnlock = {
        achievement: ACHIEVEMENTS[1],
        timestamp: 2000,
        isNew: true,
      };
      
      queue = enqueueNotification(queue, unlock1);
      queue = enqueueNotification(queue, unlock2);
      queue = dequeueNotification(queue, 1000);
      
      expect(queue.active).toHaveLength(1);
      expect(queue.active[0].timestamp).toBe(2000);
      expect(queue.queued).toHaveLength(0);
    });

    it('should generate notification CSS', () => {
      const css = getNotificationCSS(DEFAULT_NOTIFICATION_CONFIG);
      expect(css).toContain('.achievement-notification');
      expect(css).toContain('animation');
      expect(css).toContain('@keyframes');
    });

    it('should create notification data', () => {
      const unlock: AchievementUnlock = {
        achievement: ACHIEVEMENTS[0],
        timestamp: Date.now(),
        isNew: true,
      };
      const data = createNotificationData(unlock);
      expect(data.id).toBeTruthy();
      expect(data.achievement).toEqual(ACHIEVEMENTS[0]);
      expect(data.showPoints).toBe(true);
    });
  });

  describe('Gallery', () => {
    it('should filter by status', () => {
      let manager = createAchievementManager();
      manager = unlockAchievement(manager, 'first-note');
      
      const unlockedFilter = { ...DEFAULT_GALLERY_FILTER, status: 'unlocked' as const };
      const lockedFilter = { ...DEFAULT_GALLERY_FILTER, status: 'locked' as const };
      
      const unlocked = filterAchievements(manager, unlockedFilter);
      const locked = filterAchievements(manager, lockedFilter);
      
      expect(unlocked.length).toBeGreaterThan(0);
      expect(locked.length).toBeGreaterThan(0);
      expect(unlocked.length + locked.length).toBeLessThanOrEqual(ACHIEVEMENTS.length);
    });

    it('should filter by category', () => {
      const manager = createAchievementManager();
      const filter = { ...DEFAULT_GALLERY_FILTER, category: 'getting-started' as const };
      const results = filterAchievements(manager, filter);
      
      expect(results.length).toBeGreaterThan(0);
      for (const achievement of results) {
        expect(achievement.category).toBe('getting-started');
      }
    });

    it('should filter by tier', () => {
      const manager = createAchievementManager();
      const filter = { ...DEFAULT_GALLERY_FILTER, tier: 'gold' as const };
      const results = filterAchievements(manager, filter);
      
      expect(results.length).toBeGreaterThan(0);
      for (const achievement of results) {
        expect(achievement.tier).toBe('gold');
      }
    });

    it('should filter by search', () => {
      const manager = createAchievementManager();
      const filter = { ...DEFAULT_GALLERY_FILTER, search: 'first' };
      const results = filterAchievements(manager, filter);
      
      expect(results.length).toBeGreaterThan(0);
      for (const achievement of results) {
        const text = `${achievement.name} ${achievement.description} ${achievement.requirement} ${achievement.hint}`.toLowerCase();
        expect(text).toContain('first');
      }
    });

    it('should sort by points', () => {
      const manager = createAchievementManager();
      const filter = { ...DEFAULT_GALLERY_FILTER, sortBy: 'points' as const, sortOrder: 'asc' as const };
      const results = filterAchievements(manager, filter);
      
      for (let i = 1; i < results.length; i++) {
        expect(results[i].points).toBeGreaterThanOrEqual(results[i - 1].points);
      }
    });

    it('should create gallery item', () => {
      const manager = createAchievementManager();
      const item = createGalleryItem(ACHIEVEMENTS[0], manager, false);
      
      expect(item.achievement).toEqual(ACHIEVEMENTS[0]);
      expect(item.unlocked).toBe(false);
      expect(item.progressPercent).toBe(0);
      expect(item.unlockedDate).toBeNull();
    });

    it('should hide hidden achievements in gallery', () => {
      const manager = createAchievementManager();
      const hiddenAchievement = ACHIEVEMENTS.find(a => a.hidden);
      
      if (hiddenAchievement) {
        const item = createGalleryItem(hiddenAchievement, manager, false);
        expect(item.showAsLocked).toBe(true);
        expect(item.achievement.name).toBe('???');
      }
    });

    it('should generate gallery CSS', () => {
      const css = getGalleryCSS();
      expect(css).toContain('.achievement-gallery');
      expect(css).toContain('.achievement-card');
      expect(css).toContain('grid');
    });
  });

  describe('Sharing', () => {
    it('should generate share text', () => {
      const text = generateShareText(ACHIEVEMENTS[0], DEFAULT_SHARE_OPTIONS);
      
      expect(text).toContain(ACHIEVEMENTS[0].name);
      expect(text).toContain(ACHIEVEMENTS[0].description);
      expect(text).toContain(ACHIEVEMENTS[0].points.toString());
    });

    it('should generate share text with custom message', () => {
      const customMessage = 'Custom achievement message';
      const options = { ...DEFAULT_SHARE_OPTIONS, message: customMessage };
      const text = generateShareText(ACHIEVEMENTS[0], options);
      
      expect(text).toContain(customMessage);
    });

    it('should generate share URL for twitter', () => {
      const options = { ...DEFAULT_SHARE_OPTIONS, platform: 'twitter' as const };
      const url = generateShareURL(ACHIEVEMENTS[0], options);
      
      expect(url).toContain('twitter.com');
      expect(url).toContain('intent/tweet');
    });

    it('should generate share URL for facebook', () => {
      const options = { ...DEFAULT_SHARE_OPTIONS, platform: 'facebook' as const };
      const url = generateShareURL(ACHIEVEMENTS[0], options);
      
      expect(url).toContain('facebook.com');
      expect(url).toContain('sharer');
    });

    it('should share to clipboard', async () => {
      const options = { ...DEFAULT_SHARE_OPTIONS, platform: 'clipboard' as const };
      const result = await shareAchievement(ACHIEVEMENTS[0], options);
      
      expect(result.success).toBe(true);
      expect(result.content).toBeTruthy();
    });

    it('should generate achievement image SVG', () => {
      const svg = generateAchievementImage(ACHIEVEMENTS[0]);
      
      expect(svg).toContain('<svg');
      expect(svg).toContain(ACHIEVEMENTS[0].icon);
      expect(svg).toContain(ACHIEVEMENTS[0].name);
    });

    it('should get share menu items', () => {
      const items = getShareMenuItems();
      
      expect(items.length).toBeGreaterThan(0);
      expect(items[0]).toHaveProperty('platform');
      expect(items[0]).toHaveProperty('label');
      expect(items[0]).toHaveProperty('icon');
      expect(items[0]).toHaveProperty('color');
    });

    it('should generate share menu CSS', () => {
      const css = getShareMenuCSS();
      
      expect(css).toContain('.achievement-share-menu');
      expect(css).toContain('.achievement-share-button');
    });
  });
});
