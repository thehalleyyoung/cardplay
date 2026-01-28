/**
 * @fileoverview Card Pack Download Statistics & Analytics.
 * 
 * Provides download tracking and statistics for card packs:
 * - Download event tracking
 * - Aggregate download statistics
 * - Download trends over time
 * - Popular packs identification
 * - Category-based analytics
 * 
 * @module @cardplay/user-cards/pack-stats
 */

import type { PackRatingStats } from './pack-ratings';

// ============================================================================
// DOWNLOAD TRACKING TYPES
// ============================================================================

/**
 * Download event record.
 */
export interface DownloadEvent {
  /** Event ID */
  id: string;
  /** Pack name */
  packName: string;
  /** Pack version */
  packVersion: string;
  /** User ID (anonymous if not logged in) */
  userId?: string;
  /** Download timestamp */
  timestamp: number;
  /** User agent */
  userAgent?: string;
  /** Country code */
  countryCode?: string;
  /** Referrer source */
  referrer?: string;
  /** Installation completed */
  installCompleted: boolean;
  /** Installation completed timestamp */
  installCompletedAt?: number;
}

/**
 * Aggregate pack download statistics.
 */
export interface PackDownloadStats {
  /** Pack name */
  packName: string;
  /** Total downloads across all versions */
  totalDownloads: number;
  /** Downloads in last 7 days */
  downloadsLast7Days: number;
  /** Downloads in last 30 days */
  downloadsLast30Days: number;
  /** Downloads by version */
  downloadsByVersion: Record<string, number>;
  /** Unique users (approximate) */
  uniqueUsers: number;
  /** Installation completion rate */
  installCompletionRate: number;
  /** Peak downloads per day */
  peakDailyDownloads: number;
  /** First download timestamp */
  firstDownloadAt: number;
  /** Latest download timestamp */
  latestDownloadAt: number;
  /** Top referrers */
  topReferrers: Array<{ source: string; count: number }>;
  /** Geographic distribution (top countries) */
  topCountries: Array<{ code: string; count: number }>;
}

/**
 * Time-series download data point.
 */
export interface DownloadDataPoint {
  /** Timestamp (day/week/month start) */
  timestamp: number;
  /** Download count */
  downloads: number;
  /** Unique users */
  uniqueUsers: number;
}

/**
 * Download trend analysis.
 */
export interface DownloadTrend {
  /** Pack name */
  packName: string;
  /** Time period */
  period: 'day' | 'week' | 'month';
  /** Data points */
  dataPoints: DownloadDataPoint[];
  /** Trend direction */
  direction: 'up' | 'down' | 'stable';
  /** Percent change from previous period */
  percentChange: number;
  /** Is trending (rapid growth) */
  isTrending: boolean;
}

// ============================================================================
// DOWNLOAD STORE INTERFACE
// ============================================================================

/**
 * Download tracking store interface.
 */
export interface DownloadStore {
  /** Record a download event */
  recordDownload(event: Omit<DownloadEvent, 'id' | 'timestamp'>): Promise<DownloadEvent>;
  
  /** Mark download as installed */
  markInstalled(downloadId: string): Promise<boolean>;
  
  /** Get download statistics for a pack */
  getPackStats(packName: string): Promise<PackDownloadStats>;
  
  /** Get download trend for a pack */
  getPackTrend(packName: string, period: 'day' | 'week' | 'month', days: number): Promise<DownloadTrend>;
  
  /** Get top downloaded packs */
  getTopDownloaded(options: {
    period?: 'all' | 'week' | 'month';
    category?: string;
    limit?: number;
  }): Promise<Array<{ packName: string; downloads: number }>>;
  
  /** Get trending packs */
  getTrendingPacks(options: {
    period?: 'day' | 'week';
    limit?: number;
  }): Promise<Array<{ packName: string; downloads: number; percentChange: number }>>;
  
  /** Get pack downloads by user */
  getUserDownloads(userId: string): Promise<DownloadEvent[]>;
}

/**
 * In-memory download store implementation.
 */
export class InMemoryDownloadStore implements DownloadStore {
  private downloads: Map<string, DownloadEvent> = new Map();
  private nextId = 1;
  
  async recordDownload(event: Omit<DownloadEvent, 'id' | 'timestamp'>): Promise<DownloadEvent> {
    const download: DownloadEvent = {
      ...event,
      id: `dl_${this.nextId++}`,
      timestamp: Date.now(),
      installCompleted: false,
    };
    
    this.downloads.set(download.id, download);
    return download;
  }
  
  async markInstalled(downloadId: string): Promise<boolean> {
    const download = this.downloads.get(downloadId);
    if (!download) return false;
    
    download.installCompleted = true;
    download.installCompletedAt = Date.now();
    return true;
  }
  
  async getPackStats(packName: string): Promise<PackDownloadStats> {
    const packDownloads = Array.from(this.downloads.values())
      .filter(d => d.packName === packName);
    
    if (packDownloads.length === 0) {
      return {
        packName,
        totalDownloads: 0,
        downloadsLast7Days: 0,
        downloadsLast30Days: 0,
        downloadsByVersion: {},
        uniqueUsers: 0,
        installCompletionRate: 0,
        peakDailyDownloads: 0,
        firstDownloadAt: 0,
        latestDownloadAt: 0,
        topReferrers: [],
        topCountries: [],
      };
    }
    
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const last7Days = packDownloads.filter(d => d.timestamp > now - 7 * day).length;
    const last30Days = packDownloads.filter(d => d.timestamp > now - 30 * day).length;
    
    // Downloads by version
    const downloadsByVersion: Record<string, number> = {};
    for (const dl of packDownloads) {
      downloadsByVersion[dl.packVersion] = (downloadsByVersion[dl.packVersion] ?? 0) + 1;
    }
    
    // Unique users
    const uniqueUserIds = new Set(
      packDownloads.filter(d => d.userId).map(d => d.userId!)
    );
    
    // Install completion rate
    const completedInstalls = packDownloads.filter(d => d.installCompleted).length;
    const installCompletionRate = packDownloads.length > 0 
      ? completedInstalls / packDownloads.length 
      : 0;
    
    // Peak daily downloads
    const downloadsByDay = new Map<number, number>();
    for (const dl of packDownloads) {
      const dayStart = Math.floor(dl.timestamp / day) * day;
      downloadsByDay.set(dayStart, (downloadsByDay.get(dayStart) ?? 0) + 1);
    }
    const peakDailyDownloads = Math.max(0, ...downloadsByDay.values());
    
    // Timestamps
    const timestamps = packDownloads.map(d => d.timestamp);
    const firstDownloadAt = Math.min(...timestamps);
    const latestDownloadAt = Math.max(...timestamps);
    
    // Top referrers
    const referrerCounts = new Map<string, number>();
    for (const dl of packDownloads) {
      if (dl.referrer) {
        referrerCounts.set(dl.referrer, (referrerCounts.get(dl.referrer) ?? 0) + 1);
      }
    }
    const topReferrers = Array.from(referrerCounts.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Top countries
    const countryCounts = new Map<string, number>();
    for (const dl of packDownloads) {
      if (dl.countryCode) {
        countryCounts.set(dl.countryCode, (countryCounts.get(dl.countryCode) ?? 0) + 1);
      }
    }
    const topCountries = Array.from(countryCounts.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      packName,
      totalDownloads: packDownloads.length,
      downloadsLast7Days: last7Days,
      downloadsLast30Days: last30Days,
      downloadsByVersion,
      uniqueUsers: uniqueUserIds.size,
      installCompletionRate,
      peakDailyDownloads,
      firstDownloadAt,
      latestDownloadAt,
      topReferrers,
      topCountries,
    };
  }
  
  async getPackTrend(
    packName: string,
    period: 'day' | 'week' | 'month',
    days: number
  ): Promise<DownloadTrend> {
    const packDownloads = Array.from(this.downloads.values())
      .filter(d => d.packName === packName);
    
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    const periodMs = period === 'day' ? msPerDay : 
                     period === 'week' ? 7 * msPerDay : 
                     30 * msPerDay;
    
    // Group downloads by period
    const periodCounts = new Map<number, { downloads: number; users: Set<string> }>();
    
    for (const dl of packDownloads) {
      if (dl.timestamp > now - days * msPerDay) {
        const periodStart = Math.floor(dl.timestamp / periodMs) * periodMs;
        const existing = periodCounts.get(periodStart) ?? { downloads: 0, users: new Set() };
        existing.downloads++;
        if (dl.userId) {
          existing.users.add(dl.userId);
        }
        periodCounts.set(periodStart, existing);
      }
    }
    
    // Convert to data points
    const dataPoints: DownloadDataPoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const periodStart = Math.floor((now - i * msPerDay) / periodMs) * periodMs;
      const data = periodCounts.get(periodStart);
      dataPoints.push({
        timestamp: periodStart,
        downloads: data?.downloads ?? 0,
        uniqueUsers: data?.users.size ?? 0,
      });
    }
    
    // Calculate trend
    const recentDownloads = dataPoints.slice(-7).reduce((sum, d) => sum + d.downloads, 0);
    const previousDownloads = dataPoints.slice(-14, -7).reduce((sum, d) => sum + d.downloads, 0);
    
    let direction: 'up' | 'down' | 'stable' = 'stable';
    let percentChange = 0;
    
    if (previousDownloads > 0) {
      percentChange = ((recentDownloads - previousDownloads) / previousDownloads) * 100;
      if (percentChange > 10) direction = 'up';
      else if (percentChange < -10) direction = 'down';
    }
    
    const isTrending = percentChange > 50; // 50% growth = trending
    
    return {
      packName,
      period,
      dataPoints,
      direction,
      percentChange,
      isTrending,
    };
  }
  
  async getTopDownloaded(options: {
    period?: 'all' | 'week' | 'month';
    category?: string;
    limit?: number;
  } = {}): Promise<Array<{ packName: string; downloads: number }>> {
    const { period = 'all', limit = 10 } = options;
    
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    
    let downloads = Array.from(this.downloads.values());
    
    // Filter by period
    if (period === 'week') {
      downloads = downloads.filter(d => d.timestamp > now - 7 * msPerDay);
    } else if (period === 'month') {
      downloads = downloads.filter(d => d.timestamp > now - 30 * msPerDay);
    }
    
    // Count by pack
    const packCounts = new Map<string, number>();
    for (const dl of downloads) {
      packCounts.set(dl.packName, (packCounts.get(dl.packName) ?? 0) + 1);
    }
    
    // Sort and return top N
    return Array.from(packCounts.entries())
      .map(([packName, downloads]) => ({ packName, downloads }))
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limit);
  }
  
  async getTrendingPacks(options: {
    period?: 'day' | 'week';
    limit?: number;
  } = {}): Promise<Array<{ packName: string; downloads: number; percentChange: number }>> {
    const { period = 'week', limit = 10 } = options;
    
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    const periodDays = period === 'day' ? 1 : 7;
    
    // Get all unique packs
    const packNames = new Set(Array.from(this.downloads.values()).map(d => d.packName));
    
    const trending: Array<{ packName: string; downloads: number; percentChange: number }> = [];
    
    for (const packName of packNames) {
      const packDownloads = Array.from(this.downloads.values())
        .filter(d => d.packName === packName);
      
      const recentDownloads = packDownloads.filter(
        d => d.timestamp > now - periodDays * msPerDay
      ).length;
      
      const previousDownloads = packDownloads.filter(
        d => d.timestamp > now - 2 * periodDays * msPerDay &&
             d.timestamp <= now - periodDays * msPerDay
      ).length;
      
      if (previousDownloads > 0) {
        const percentChange = ((recentDownloads - previousDownloads) / previousDownloads) * 100;
        if (percentChange > 20) { // Only include if growing > 20%
          trending.push({ packName, downloads: recentDownloads, percentChange });
        }
      } else if (recentDownloads >= 5) {
        // New pack with downloads
        trending.push({ packName, downloads: recentDownloads, percentChange: 100 });
      }
    }
    
    return trending
      .sort((a, b) => b.percentChange - a.percentChange)
      .slice(0, limit);
  }
  
  async getUserDownloads(userId: string): Promise<DownloadEvent[]> {
    return Array.from(this.downloads.values())
      .filter(d => d.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }
}

// ============================================================================
// FEATURED PACKS MANAGER
// ============================================================================

/**
 * Featured packs manager.
 */
export class FeaturedPacksManager {
  constructor(
    private downloadStore: DownloadStore,
    private getRatingStats: (packName: string) => Promise<PackRatingStats>
  ) {}
  
  /**
   * Gets featured packs based on various criteria.
   */
  async getFeaturedPacks(options: {
    limit?: number;
    includeNew?: boolean;
    includePopular?: boolean;
    includeHighRated?: boolean;
  } = {}): Promise<Array<{
    packName: string;
    reason: 'high-rated' | 'popular' | 'new' | 'trending';
    downloads: number;
    rating: number;
    score: number;
  }>> {
    const { 
      limit = 10,
      includeNew = true,
      includePopular = true,
      includeHighRated = true,
    } = options;
    
    const allDownloads = await this.downloadStore.getTopDownloaded({ period: 'all', limit: 100 });
    const packNames = allDownloads.map(d => d.packName);
    
    const featured: Array<{
      packName: string;
      reason: 'high-rated' | 'popular' | 'new' | 'trending';
      downloads: number;
      rating: number;
      score: number;
    }> = [];
    
    for (const packName of packNames) {
      const stats = await this.downloadStore.getPackStats(packName);
      const ratingStats = await this.getRatingStats(packName);
      
      let reason: 'high-rated' | 'popular' | 'new' | 'trending' = 'popular';
      let score = 0;
      
      // High rated: 4+ stars, 10+ ratings
      if (includeHighRated && ratingStats.averageRating >= 4 && ratingStats.totalRatings >= 10) {
        reason = 'high-rated';
        score = ratingStats.averageRating * 20 + Math.log10(ratingStats.totalRatings + 1) * 10;
      }
      
      // Popular: 100+ downloads, 3.5+ stars
      if (includePopular && stats.totalDownloads >= 100 && ratingStats.averageRating >= 3.5) {
        reason = 'popular';
        score = Math.log10(stats.totalDownloads + 1) * 30 + ratingStats.averageRating * 10;
      }
      
      // New: First download within last 30 days, 10+ downloads
      const daysSinceFirst = (Date.now() - stats.firstDownloadAt) / (24 * 60 * 60 * 1000);
      if (includeNew && daysSinceFirst <= 30 && stats.totalDownloads >= 10) {
        reason = 'new';
        score = (30 - daysSinceFirst) * 2 + stats.totalDownloads;
      }
      
      // Trending: Recent growth
      const trend = await this.downloadStore.getPackTrend(packName, 'week', 14);
      if (trend.isTrending) {
        reason = 'trending';
        score = trend.percentChange + stats.downloadsLast7Days;
      }
      
      if (score > 0) {
        featured.push({
          packName,
          reason,
          downloads: stats.totalDownloads,
          rating: ratingStats.averageRating,
          score,
        });
      }
    }
    
    return featured
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

// ============================================================================
// SINGLETON STORE
// ============================================================================

let defaultDownloadStore: DownloadStore | null = null;

/**
 * Gets the default download store.
 */
export function getDownloadStore(): DownloadStore {
  if (!defaultDownloadStore) {
    defaultDownloadStore = new InMemoryDownloadStore();
  }
  return defaultDownloadStore;
}

/**
 * Sets the default download store.
 */
export function setDownloadStore(store: DownloadStore): void {
  defaultDownloadStore = store;
}
