/**
 * @fileoverview Tests for pack ratings system.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryRatingStore,
  calculateWeightedRating,
  formatRatingSummary,
  formatStarDisplay,
  isHighlyRated,
  isPopular,
  type PackRating,
  type PackRatingStats,
} from './pack-ratings';

describe('InMemoryRatingStore', () => {
  let store: InMemoryRatingStore;
  
  beforeEach(() => {
    store = new InMemoryRatingStore();
  });
  
  it('should add a rating', async () => {
    const rating = await store.addRating({
      packName: 'test-pack',
      packVersion: '1.0.0',
      userId: 'user1',
      username: 'User One',
      rating: 5,
      review: 'Great pack!',
      title: 'Excellent',
      status: 'approved',
      verifiedPurchase: true,
    });
    
    expect(rating.id).toBeDefined();
    expect(rating.rating).toBe(5);
    expect(rating.packName).toBe('test-pack');
  });
  
  it('should get user rating for a pack', async () => {
    await store.addRating({
      packName: 'test-pack',
      packVersion: '1.0.0',
      userId: 'user1',
      username: 'User One',
      rating: 4,
      status: 'approved',
      verifiedPurchase: false,
    });
    
    const userRating = await store.getUserRating('test-pack', 'user1');
    expect(userRating).toBeTruthy();
    expect(userRating?.rating).toBe(4);
  });
  
  it('should calculate pack statistics', async () => {
    await store.addRating({
      packName: 'test-pack',
      packVersion: '1.0.0',
      userId: 'user1',
      username: 'User One',
      rating: 5,
      status: 'approved',
      verifiedPurchase: true,
    });
    
    await store.addRating({
      packName: 'test-pack',
      packVersion: '1.0.0',
      userId: 'user2',
      username: 'User Two',
      rating: 4,
      status: 'approved',
      verifiedPurchase: true,
    });
    
    const stats = await store.getPackStats('test-pack');
    
    expect(stats.totalRatings).toBe(2);
    expect(stats.averageRating).toBe(4.5);
    expect(stats.distribution[5]).toBe(1);
    expect(stats.distribution[4]).toBe(1);
  });
  
  it('should mark rating as helpful', async () => {
    const rating = await store.addRating({
      packName: 'test-pack',
      packVersion: '1.0.0',
      userId: 'user1',
      username: 'User One',
      rating: 5,
      status: 'approved',
      verifiedPurchase: true,
    });
    
    const marked = await store.markHelpful(rating.id, 'user2');
    expect(marked).toBe(true);
    
    const retrieved = await store.getRating(rating.id);
    expect(retrieved?.helpfulCount).toBe(1);
    expect(retrieved?.helpfulVoters).toContain('user2');
  });
  
  it('should flag a rating', async () => {
    const rating = await store.addRating({
      packName: 'test-pack',
      packVersion: '1.0.0',
      userId: 'user1',
      username: 'User One',
      rating: 1,
      review: 'Spam content',
      status: 'approved',
      verifiedPurchase: false,
    });
    
    const flagged = await store.flagRating(rating.id, 'user2', 'inappropriate');
    expect(flagged).toBe(true);
    
    const retrieved = await store.getRating(rating.id);
    expect(retrieved?.status).toBe('flagged');
    expect(retrieved?.flagReason).toBe('inappropriate');
  });
});

describe('Rating utilities', () => {
  it('should calculate weighted rating', () => {
    const stats: PackRatingStats = {
      packName: 'test',
      totalRatings: 10,
      averageRating: 4.5,
      distribution: { 5: 5, 4: 5, 3: 0, 2: 0, 1: 0 },
      totalReviews: 5,
      latestRatingAt: Date.now(),
    };
    
    const weighted = calculateWeightedRating(stats);
    expect(weighted).toBeGreaterThan(0);
    expect(weighted).toBeLessThanOrEqual(5);
  });
  
  it('should format rating summary', () => {
    const stats: PackRatingStats = {
      packName: 'test',
      totalRatings: 10,
      averageRating: 4.3,
      distribution: { 5: 5, 4: 3, 3: 2, 2: 0, 1: 0 },
      totalReviews: 5,
      latestRatingAt: Date.now(),
    };
    
    const summary = formatRatingSummary(stats);
    expect(summary).toContain('4.3');
    expect(summary).toContain('10');
  });
  
  it('should format star display', () => {
    expect(formatStarDisplay(5)).toBe('★★★★★');
    expect(formatStarDisplay(4)).toBe('★★★★☆');
    expect(formatStarDisplay(3.5)).toBe('★★★⯪☆');
    expect(formatStarDisplay(0)).toBe('☆☆☆☆☆');
  });
  
  it('should check if highly rated', () => {
    const highRated: PackRatingStats = {
      packName: 'test',
      totalRatings: 20,
      averageRating: 4.5,
      distribution: { 5: 15, 4: 5, 3: 0, 2: 0, 1: 0 },
      totalReviews: 10,
      latestRatingAt: Date.now(),
    };
    
    expect(isHighlyRated(highRated)).toBe(true);
    
    const lowRated: PackRatingStats = {
      ...highRated,
      averageRating: 3.0,
    };
    
    expect(isHighlyRated(lowRated)).toBe(false);
  });
  
  it('should check if popular', () => {
    const stats: PackRatingStats = {
      packName: 'test',
      totalRatings: 10,
      averageRating: 4.0,
      distribution: { 5: 5, 4: 3, 3: 2, 2: 0, 1: 0 },
      totalReviews: 5,
      latestRatingAt: Date.now(),
    };
    
    expect(isPopular(150, stats)).toBe(true);
    expect(isPopular(50, stats)).toBe(false);
  });
});
