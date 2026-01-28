/**
 * @fileoverview Tests for pack stats system.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryDownloadStore, FeaturedPacksManager } from './pack-stats';
import type { PackRatingStats } from './pack-ratings';

describe('InMemoryDownloadStore', () => {
  let store: InMemoryDownloadStore;
  
  beforeEach(() => {
    store = new InMemoryDownloadStore();
  });
  
  it('should record a download', async () => {
    const download = await store.recordDownload({
      packName: 'test-pack',
      packVersion: '1.0.0',
      userId: 'user1',
      userAgent: 'Mozilla/5.0',
      installCompleted: false,
    });
    
    expect(download.id).toBeDefined();
    expect(download.packName).toBe('test-pack');
    expect(download.timestamp).toBeDefined();
  });
  
  it('should mark download as installed', async () => {
    const download = await store.recordDownload({
      packName: 'test-pack',
      packVersion: '1.0.0',
      userId: 'user1',
      installCompleted: false,
    });
    
    const marked = await store.markInstalled(download.id);
    expect(marked).toBe(true);
  });
  
  it('should get pack download statistics', async () => {
    const download1 = await store.recordDownload({
      packName: 'test-pack',
      packVersion: '1.0.0',
      userId: 'user1',
      installCompleted: false,
    });
    
    await store.markInstalled(download1.id);
    
    await store.recordDownload({
      packName: 'test-pack',
      packVersion: '1.0.0',
      userId: 'user2',
      installCompleted: false,
    });
    
    const stats = await store.getPackStats('test-pack');
    
    expect(stats.totalDownloads).toBe(2);
    expect(stats.uniqueUsers).toBe(2);
    expect(stats.installCompletionRate).toBe(0.5);
  });
  
  it('should get top downloaded packs', async () => {
    await store.recordDownload({
      packName: 'pack-a',
      packVersion: '1.0.0',
      installCompleted: false,
    });
    
    await store.recordDownload({
      packName: 'pack-a',
      packVersion: '1.0.0',
      installCompleted: false,
    });
    
    await store.recordDownload({
      packName: 'pack-b',
      packVersion: '1.0.0',
      installCompleted: false,
    });
    
    const top = await store.getTopDownloaded({ limit: 2 });
    
    expect(top.length).toBe(2);
    expect(top[0].packName).toBe('pack-a');
    expect(top[0].downloads).toBe(2);
  });
  
  it('should get trending packs', async () => {
    // Simulate recent downloads
    const now = Date.now();
    
    for (let i = 0; i < 10; i++) {
      await store.recordDownload({
        packName: 'trending-pack',
        packVersion: '1.0.0',
        installCompleted: false,
      });
    }
    
    const trending = await store.getTrendingPacks({ period: 'week', limit: 5 });
    
    expect(trending.length).toBeGreaterThan(0);
    expect(trending[0].packName).toBe('trending-pack');
  });
  
  it('should get pack trend data', async () => {
    await store.recordDownload({
      packName: 'test-pack',
      packVersion: '1.0.0',
      installCompleted: false,
    });
    
    const trend = await store.getPackTrend('test-pack', 'day', 7);
    
    expect(trend.packName).toBe('test-pack');
    expect(trend.dataPoints.length).toBeGreaterThan(0);
    expect(trend.direction).toBeDefined();
  });
});

describe('FeaturedPacksManager', () => {
  it('should get featured packs', async () => {
    const downloadStore = new InMemoryDownloadStore();
    
    // Add some downloads
    for (let i = 0; i < 150; i++) {
      await downloadStore.recordDownload({
        packName: 'popular-pack',
        packVersion: '1.0.0',
        installCompleted: true,
      });
    }
    
    const getRatingStats = async (_packName: string): Promise<PackRatingStats> => ({
      packName: 'popular-pack',
      totalRatings: 20,
      averageRating: 4.5,
      distribution: { 5: 15, 4: 5, 3: 0, 2: 0, 1: 0 },
      totalReviews: 10,
      latestRatingAt: Date.now(),
    });
    
    const manager = new FeaturedPacksManager(downloadStore, getRatingStats);
    const featured = await manager.getFeaturedPacks({ limit: 5 });
    
    expect(featured.length).toBeGreaterThan(0);
  });
});
