/**
 * @fileoverview Tests for pack discovery (categories and authors).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryCategoryStore,
  InMemoryAuthorStore,
  type AuthorProfile,
  type PackCategory,
} from './pack-discovery';

describe('InMemoryCategoryStore', () => {
  let store: InMemoryCategoryStore;
  
  beforeEach(() => {
    store = new InMemoryCategoryStore();
  });
  
  it('should get category info', async () => {
    const info = await store.getCategoryInfo('generators');
    
    expect(info).toBeTruthy();
    expect(info?.name).toBe('Generators');
    expect(info?.icon).toBe('🎼');
  });
  
  it('should list all categories', async () => {
    const categories = await store.listCategories();
    
    expect(categories.length).toBeGreaterThan(0);
    expect(categories.some(c => c.id === 'generators')).toBe(true);
  });
  
  it('should update pack category', async () => {
    const updated = await store.updatePackCategory(
      'test-pack',
      'effects',
      ['delay', 'reverb']
    );
    
    expect(updated).toBe(true);
  });
});

describe('InMemoryAuthorStore', () => {
  let store: InMemoryAuthorStore;
  
  beforeEach(() => {
    store = new InMemoryAuthorStore();
  });
  
  const createProfile = (id: string): AuthorProfile => ({
    id,
    name: `Author ${id}`,
    bio: 'A great pack creator',
    packs: [],
    collaborations: [],
    totalDownloads: 0,
    averageRating: 0,
    totalRatings: 0,
    memberSince: Date.now(),
    lastActiveAt: Date.now(),
    verified: false,
    badges: [],
    followers: 0,
    following: 0,
  });
  
  it('should save and retrieve author profile', async () => {
    const profile = createProfile('author1');
    await store.saveProfile(profile);
    
    const retrieved = await store.getProfile('author1');
    expect(retrieved).toBeTruthy();
    expect(retrieved?.name).toBe('Author author1');
  });
  
  it('should search authors', async () => {
    await store.saveProfile(createProfile('alice'));
    await store.saveProfile(createProfile('bob'));
    
    const results = await store.searchAuthors('alice');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('alice');
  });
  
  it('should get top authors by downloads', async () => {
    const profile1 = createProfile('author1');
    profile1.totalDownloads = 100;
    await store.saveProfile(profile1);
    
    const profile2 = createProfile('author2');
    profile2.totalDownloads = 200;
    await store.saveProfile(profile2);
    
    const top = await store.getTopAuthors('downloads', 1);
    expect(top[0].id).toBe('author2');
  });
  
  it('should follow and unfollow author', async () => {
    await store.saveProfile(createProfile('author1'));
    await store.saveProfile(createProfile('follower1'));
    
    const followed = await store.followAuthor('follower1', 'author1');
    expect(followed).toBe(true);
    
    const followers = await store.getFollowers('author1');
    expect(followers).toContain('follower1');
    
    const unfollowed = await store.unfollowAuthor('follower1', 'author1');
    expect(unfollowed).toBe(true);
  });
  
  it('should send and respond to collaboration invite', async () => {
    const invite = await store.sendCollaborationInvite({
      packName: 'test-pack',
      inviterId: 'author1',
      inviteeId: 'author2',
      role: 'contributor',
      permissions: {
        canEdit: true,
        canPublish: false,
        canManageCollaborators: false,
      },
      message: 'Would you like to contribute?',
    });
    
    expect(invite.id).toBeDefined();
    expect(invite.status).toBe('pending');
    
    const accepted = await store.respondToInvite(invite.id, true);
    expect(accepted).toBe(true);
    
    const retrieved = await store.getInvites('author2', 'accepted');
    expect(retrieved.length).toBe(1);
  });
  
  it('should record and get pack forks', async () => {
    const fork = await store.recordFork({
      originalPack: 'original-pack',
      forkedPack: 'forked-pack',
      forkerId: 'author1',
      changes: 'Added new features',
      isPublic: true,
    });
    
    expect(fork.id).toBeDefined();
    expect(fork.forkedAt).toBeDefined();
    
    const forks = await store.getForks('original-pack');
    expect(forks.length).toBe(1);
    expect(forks[0].forkedPack).toBe('forked-pack');
  });
});
