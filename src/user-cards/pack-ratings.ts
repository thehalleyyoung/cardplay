/**
 * @fileoverview Card Pack Ratings & Reviews System.
 * 
 * Provides rating and review functionality for card packs:
 * - Pack ratings (1-5 stars)
 * - Written reviews with moderation
 * - Aggregate statistics
 * - Featured packs based on ratings
 * - Category browsing with rating filters
 * 
 * @module @cardplay/user-cards/pack-ratings
 */

import type { CardManifest } from './manifest';

// ============================================================================
// RATING TYPES
// ============================================================================

/**
 * Star rating (1-5).
 */
export type StarRating = 1 | 2 | 3 | 4 | 5;

/**
 * Review status for moderation.
 */
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

/**
 * User rating for a pack.
 */
export interface PackRating {
  /** Rating ID */
  id: string;
  /** Pack name */
  packName: string;
  /** Pack version */
  packVersion: string;
  /** User ID */
  userId: string;
  /** Username for display */
  username: string;
  /** Star rating */
  rating: StarRating;
  /** Review text (optional) */
  review?: string;
  /** Review title (optional) */
  title?: string;
  /** Rating timestamp */
  createdAt: number;
  /** Last update timestamp */
  updatedAt: number;
  /** Review status */
  status: ReviewStatus;
  /** Helpful votes count */
  helpfulCount: number;
  /** User's helpful vote IDs (who found this helpful) */
  helpfulVoters: string[];
  /** Flag reason if flagged */
  flagReason?: string;
  /** Verified purchase */
  verifiedPurchase: boolean;
}

/**
 * Aggregate pack statistics.
 */
export interface PackRatingStats {
  /** Pack name */
  packName: string;
  /** Total number of ratings */
  totalRatings: number;
  /** Average rating */
  averageRating: number;
  /** Rating distribution */
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  /** Number of reviews (with text) */
  totalReviews: number;
  /** Most recent rating timestamp */
  latestRatingAt: number;
}

/**
 * Featured pack criteria.
 */
export interface FeaturedPack {
  /** Pack name */
  packName: string;
  /** Pack manifest */
  manifest: CardManifest;
  /** Rating stats */
  stats: PackRatingStats;
  /** Featured reason */
  reason: 'high-rated' | 'popular' | 'new' | 'editor-choice';
  /** Featured since timestamp */
  featuredSince: number;
  /** Featured until timestamp */
  featuredUntil?: number;
  /** Download count */
  downloads: number;
}

/**
 * Pack author profile.
 */
export interface PackAuthorProfile {
  /** Author ID */
  authorId: string;
  /** Author name */
  name: string;
  /** Bio */
  bio?: string;
  /** Website */
  website?: string;
  /** Avatar URL */
  avatarUrl?: string;
  /** Published packs */
  packs: string[];
  /** Total downloads across all packs */
  totalDownloads: number;
  /** Average rating across all packs */
  averageRating: number;
  /** Member since timestamp */
  memberSince: number;
  /** Verified author */
  verified: boolean;
}

// ============================================================================
// RATING STORE
// ============================================================================

/**
 * Rating store interface.
 */
export interface RatingStore {
  /** Add a rating */
  addRating(rating: Omit<PackRating, 'id' | 'createdAt' | 'updatedAt' | 'helpfulCount' | 'helpfulVoters'>): Promise<PackRating>;
  
  /** Update a rating */
  updateRating(id: string, updates: Partial<Pick<PackRating, 'rating' | 'review' | 'title'>>): Promise<PackRating>;
  
  /** Delete a rating */
  deleteRating(id: string, userId: string): Promise<boolean>;
  
  /** Get rating by ID */
  getRating(id: string): Promise<PackRating | null>;
  
  /** Get user's rating for a pack */
  getUserRating(packName: string, userId: string): Promise<PackRating | null>;
  
  /** Get all ratings for a pack */
  getPackRatings(packName: string, options?: {
    status?: ReviewStatus;
    limit?: number;
    offset?: number;
    sortBy?: 'recent' | 'helpful' | 'highest' | 'lowest';
  }): Promise<PackRating[]>;
  
  /** Get rating statistics for a pack */
  getPackStats(packName: string): Promise<PackRatingStats>;
  
  /** Mark rating as helpful */
  markHelpful(ratingId: string, userId: string): Promise<boolean>;
  
  /** Unmark rating as helpful */
  unmarkHelpful(ratingId: string, userId: string): Promise<boolean>;
  
  /** Flag a rating */
  flagRating(ratingId: string, userId: string, reason: string): Promise<boolean>;
  
  /** Moderate a rating */
  moderateRating(ratingId: string, status: ReviewStatus, moderatorId: string): Promise<boolean>;
}

/**
 * In-memory rating store implementation.
 */
export class InMemoryRatingStore implements RatingStore {
  private ratings: Map<string, PackRating> = new Map();
  private nextId = 1;
  
  async addRating(rating: Omit<PackRating, 'id' | 'createdAt' | 'updatedAt' | 'helpfulCount' | 'helpfulVoters'>): Promise<PackRating> {
    const now = Date.now();
    const newRating: PackRating = {
      ...rating,
      id: `rating_${this.nextId++}`,
      createdAt: now,
      updatedAt: now,
      helpfulCount: 0,
      helpfulVoters: [],
      status: rating.status || 'approved',
    };
    
    this.ratings.set(newRating.id, newRating);
    return newRating;
  }
  
  async updateRating(id: string, updates: Partial<Pick<PackRating, 'rating' | 'review' | 'title'>>): Promise<PackRating> {
    const rating = this.ratings.get(id);
    if (!rating) {
      throw new Error(`Rating ${id} not found`);
    }
    
    const updated: PackRating = {
      ...rating,
      ...updates,
      updatedAt: Date.now(),
    };
    
    this.ratings.set(id, updated);
    return updated;
  }
  
  async deleteRating(id: string, userId: string): Promise<boolean> {
    const rating = this.ratings.get(id);
    if (!rating || rating.userId !== userId) {
      return false;
    }
    
    return this.ratings.delete(id);
  }
  
  async getRating(id: string): Promise<PackRating | null> {
    return this.ratings.get(id) ?? null;
  }
  
  async getUserRating(packName: string, userId: string): Promise<PackRating | null> {
    for (const rating of this.ratings.values()) {
      if (rating.packName === packName && rating.userId === userId) {
        return rating;
      }
    }
    return null;
  }
  
  async getPackRatings(
    packName: string,
    options: {
      status?: ReviewStatus;
      limit?: number;
      offset?: number;
      sortBy?: 'recent' | 'helpful' | 'highest' | 'lowest';
    } = {}
  ): Promise<PackRating[]> {
    let results = Array.from(this.ratings.values())
      .filter(r => r.packName === packName);
    
    // Filter by status
    if (options.status) {
      results = results.filter(r => r.status === options.status);
    }
    
    // Sort
    switch (options.sortBy) {
      case 'recent':
        results.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'helpful':
        results.sort((a, b) => b.helpfulCount - a.helpfulCount);
        break;
      case 'highest':
        results.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        results.sort((a, b) => a.rating - b.rating);
        break;
      default:
        results.sort((a, b) => b.createdAt - a.createdAt);
    }
    
    // Paginate
    const offset = options.offset ?? 0;
    const limit = options.limit ?? results.length;
    return results.slice(offset, offset + limit);
  }
  
  async getPackStats(packName: string): Promise<PackRatingStats> {
    const ratings = Array.from(this.ratings.values())
      .filter(r => r.packName === packName && r.status === 'approved');
    
    const totalRatings = ratings.length;
    const totalReviews = ratings.filter(r => r.review).length;
    
    if (totalRatings === 0) {
      return {
        packName,
        totalRatings: 0,
        averageRating: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        totalReviews: 0,
        latestRatingAt: 0,
      };
    }
    
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = sum / totalRatings;
    
    const distribution = ratings.reduce(
      (acc, r) => {
        acc[r.rating]++;
        return acc;
      },
      { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as PackRatingStats['distribution']
    );
    
    const latestRatingAt = Math.max(...ratings.map(r => r.createdAt));
    
    return {
      packName,
      totalRatings,
      averageRating,
      distribution,
      totalReviews,
      latestRatingAt,
    };
  }
  
  async markHelpful(ratingId: string, userId: string): Promise<boolean> {
    const rating = this.ratings.get(ratingId);
    if (!rating) return false;
    
    if (rating.helpfulVoters.includes(userId)) {
      return false; // Already marked
    }
    
    rating.helpfulVoters.push(userId);
    rating.helpfulCount++;
    return true;
  }
  
  async unmarkHelpful(ratingId: string, userId: string): Promise<boolean> {
    const rating = this.ratings.get(ratingId);
    if (!rating) return false;
    
    const index = rating.helpfulVoters.indexOf(userId);
    if (index === -1) {
      return false; // Not marked
    }
    
    rating.helpfulVoters.splice(index, 1);
    rating.helpfulCount--;
    return true;
  }
  
  async flagRating(ratingId: string, _userId: string, reason: string): Promise<boolean> {
    const rating = this.ratings.get(ratingId);
    if (!rating) return false;
    
    rating.status = 'flagged';
    rating.flagReason = reason;
    return true;
  }
  
  async moderateRating(ratingId: string, status: ReviewStatus, _moderatorId: string): Promise<boolean> {
    const rating = this.ratings.get(ratingId);
    if (!rating) return false;
    
    rating.status = status;
    if (status !== 'flagged') {
      delete rating.flagReason;
    }
    return true;
  }
}

// ============================================================================
// RATING UTILITIES
// ============================================================================

/**
 * Calculates weighted rating (Bayesian average).
 * Useful for sorting packs by quality with confidence.
 */
export function calculateWeightedRating(
  stats: PackRatingStats,
  options: {
    minimumVotes?: number;
    globalAverage?: number;
  } = {}
): number {
  const m = options.minimumVotes ?? 5; // Minimum votes required
  const C = options.globalAverage ?? 3.5; // Global average rating
  const R = stats.averageRating; // This pack's average rating
  const v = stats.totalRatings; // Number of votes
  
  // Bayesian average formula
  // WR = (v ÷ (v+m)) × R + (m ÷ (v+m)) × C
  return (v / (v + m)) * R + (m / (v + m)) * C;
}

/**
 * Generates a rating summary string.
 */
export function formatRatingSummary(stats: PackRatingStats): string {
  if (stats.totalRatings === 0) {
    return 'No ratings yet';
  }
  
  const avg = stats.averageRating.toFixed(1);
  const count = stats.totalRatings;
  const reviews = stats.totalReviews;
  
  let summary = `${avg} stars (${count} rating${count !== 1 ? 's' : ''})`;
  if (reviews > 0) {
    summary += `, ${reviews} review${reviews !== 1 ? 's' : ''}`;
  }
  
  return summary;
}

/**
 * Generates a star display string (★★★★☆).
 */
export function formatStarDisplay(rating: number): string {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return '★'.repeat(fullStars) +
         (hasHalfStar ? '⯪' : '') +
         '☆'.repeat(emptyStars);
}

/**
 * Checks if a pack qualifies as "highly rated".
 */
export function isHighlyRated(stats: PackRatingStats, options: {
  minRating?: number;
  minVotes?: number;
} = {}): boolean {
  const minRating = options.minRating ?? 4.0;
  const minVotes = options.minVotes ?? 10;
  
  return stats.averageRating >= minRating && stats.totalRatings >= minVotes;
}

/**
 * Checks if a pack is "popular" based on downloads and ratings.
 */
export function isPopular(
  downloads: number,
  stats: PackRatingStats,
  options: {
    minDownloads?: number;
    minRating?: number;
  } = {}
): boolean {
  const minDownloads = options.minDownloads ?? 100;
  const minRating = options.minRating ?? 3.5;
  
  return downloads >= minDownloads && 
         stats.averageRating >= minRating &&
         stats.totalRatings >= 5;
}

// ============================================================================
// SINGLETON STORE
// ============================================================================

let defaultStore: RatingStore | null = null;

/**
 * Gets the default rating store.
 */
export function getRatingStore(): RatingStore {
  if (!defaultStore) {
    defaultStore = new InMemoryRatingStore();
  }
  return defaultStore;
}

/**
 * Sets the default rating store.
 */
export function setRatingStore(store: RatingStore): void {
  defaultStore = store;
}
