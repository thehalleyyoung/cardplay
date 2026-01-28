/**
 * @fileoverview Card Pack Category Browsing & Author Profiles.
 * 
 * Provides category-based navigation and author management:
 * - Pack categorization system
 * - Category browsing with filters
 * - Author profile management
 * - Pack collaboration features
 * - Licensing options
 * 
 * @module @cardplay/user-cards/pack-discovery
 */

import type { CardManifest } from './manifest';
import type { PackRatingStats } from './pack-ratings';
import type { PackDownloadStats } from './pack-stats';

// ============================================================================
// CATEGORY TYPES
// ============================================================================

/**
 * Pack category.
 */
export type PackCategory =
  | 'generators'
  | 'effects'
  | 'midi'
  | 'automation'
  | 'visualization'
  | 'utility'
  | 'instruments'
  | 'samples'
  | 'templates'
  | 'themes'
  | 'complete-systems'
  | 'educational'
  | 'experimental';

/**
 * Category metadata.
 */
export interface CategoryInfo {
  /** Category ID */
  id: PackCategory;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Icon emoji */
  icon: string;
  /** Pack count */
  packCount: number;
  /** Sub-categories */
  subcategories?: string[];
  /** Featured packs in category */
  featured: string[];
}

/**
 * Category filter options.
 */
export interface CategoryFilter {
  /** Category */
  category?: PackCategory;
  /** Subcategory */
  subcategory?: string;
  /** Minimum rating */
  minRating?: number;
  /** Minimum downloads */
  minDownloads?: number;
  /** Tags (any match) */
  tags?: string[];
  /** Sort by */
  sortBy?: 'downloads' | 'rating' | 'recent' | 'name';
  /** Limit */
  limit?: number;
  /** Offset */
  offset?: number;
}

// ============================================================================
// AUTHOR PROFILE TYPES
// ============================================================================

/**
 * Author profile.
 */
export interface AuthorProfile {
  /** Author ID */
  id: string;
  /** Display name */
  name: string;
  /** Email (private) */
  email?: string;
  /** Bio */
  bio?: string;
  /** Website */
  website?: string;
  /** Avatar URL */
  avatarUrl?: string;
  /** Social links */
  social?: {
    github?: string;
    twitter?: string;
    discord?: string;
    youtube?: string;
  };
  /** Published packs */
  packs: string[];
  /** Collaborations */
  collaborations: Array<{
    packName: string;
    role: 'author' | 'contributor' | 'tester';
  }>;
  /** Total downloads across all packs */
  totalDownloads: number;
  /** Average rating across all packs */
  averageRating: number;
  /** Total ratings received */
  totalRatings: number;
  /** Member since timestamp */
  memberSince: number;
  /** Last active timestamp */
  lastActiveAt: number;
  /** Verified author */
  verified: boolean;
  /** Badges */
  badges: AuthorBadge[];
  /** Follower count */
  followers: number;
  /** Following count */
  following: number;
}

/**
 * Author badge.
 */
export type AuthorBadge =
  | 'verified'
  | 'early-adopter'
  | 'prolific' // 10+ packs
  | 'popular' // 1000+ downloads
  | 'highly-rated' // 4.5+ average
  | 'contributor' // Contributed to others' packs
  | 'educator' // Educational content
  | 'innovator'; // Experimental/novel packs

/**
 * Pack collaboration invitation.
 */
export interface CollaborationInvite {
  /** Invite ID */
  id: string;
  /** Pack name */
  packName: string;
  /** Inviter ID */
  inviterId: string;
  /** Invitee ID */
  inviteeId: string;
  /** Role offered */
  role: 'co-author' | 'contributor' | 'tester';
  /** Permissions */
  permissions: {
    canEdit: boolean;
    canPublish: boolean;
    canManageCollaborators: boolean;
  };
  /** Message */
  message?: string;
  /** Status */
  status: 'pending' | 'accepted' | 'declined' | 'revoked';
  /** Created timestamp */
  createdAt: number;
  /** Responded timestamp */
  respondedAt?: number;
}

/**
 * Pack licensing options.
 */
export interface PackLicense {
  /** License type */
  type: 'MIT' | 'Apache-2.0' | 'GPL-3.0' | 'CC-BY-4.0' | 'CC-BY-SA-4.0' | 'CC0' | 'Proprietary' | 'Custom';
  /** Custom license text */
  customText?: string;
  /** Commercial use allowed */
  commercialUse: boolean;
  /** Modification allowed */
  modification: boolean;
  /** Distribution allowed */
  distribution: boolean;
  /** Attribution required */
  attribution: boolean;
  /** Share-alike required */
  shareAlike: boolean;
  /** Patent grant */
  patentGrant: boolean;
}

/**
 * Pack fork/remix tracking.
 */
export interface PackFork {
  /** Fork ID */
  id: string;
  /** Original pack name */
  originalPack: string;
  /** Forked pack name */
  forkedPack: string;
  /** Forker author ID */
  forkerId: string;
  /** Fork timestamp */
  forkedAt: number;
  /** Changes description */
  changes?: string;
  /** Is public fork */
  isPublic: boolean;
}

// ============================================================================
// CATEGORY STORE
// ============================================================================

/**
 * Category store interface.
 */
export interface CategoryStore {
  /** Get category information */
  getCategoryInfo(category: PackCategory): Promise<CategoryInfo | null>;
  
  /** List all categories */
  listCategories(): Promise<CategoryInfo[]>;
  
  /** Browse packs in category */
  browsePacks(filter: CategoryFilter): Promise<Array<{
    packName: string;
    manifest: CardManifest;
    stats: PackDownloadStats;
    ratings: PackRatingStats;
  }>>;
  
  /** Get featured packs in category */
  getFeaturedInCategory(category: PackCategory, limit?: number): Promise<string[]>;
  
  /** Update pack category */
  updatePackCategory(packName: string, category: PackCategory, subcategories?: string[]): Promise<boolean>;
}

/**
 * In-memory category store.
 */
export class InMemoryCategoryStore implements CategoryStore {
  private packCategories: Map<string, { category: PackCategory; subcategories: string[] }> = new Map();
  
  private categoryMetadata: Map<PackCategory, CategoryInfo> = new Map([
    ['generators', {
      id: 'generators',
      name: 'Generators',
      description: 'Cards that generate musical content',
      icon: '🎼',
      packCount: 0,
      featured: [],
    }],
    ['effects', {
      id: 'effects',
      name: 'Effects',
      description: 'Audio processing and effects',
      icon: '🎛️',
      packCount: 0,
      featured: [],
    }],
    ['midi', {
      id: 'midi',
      name: 'MIDI Tools',
      description: 'MIDI processing and routing',
      icon: '🎹',
      packCount: 0,
      featured: [],
    }],
    ['automation', {
      id: 'automation',
      name: 'Automation',
      description: 'Parameter automation and modulation',
      icon: '📊',
      packCount: 0,
      featured: [],
    }],
    ['visualization', {
      id: 'visualization',
      name: 'Visualization',
      description: 'Visual feedback and analysis',
      icon: '📈',
      packCount: 0,
      featured: [],
    }],
    ['utility', {
      id: 'utility',
      name: 'Utilities',
      description: 'Helper cards and tools',
      icon: '🔧',
      packCount: 0,
      featured: [],
    }],
    ['instruments', {
      id: 'instruments',
      name: 'Instruments',
      description: 'Virtual instruments and synthesizers',
      icon: '🎸',
      packCount: 0,
      featured: [],
    }],
    ['samples', {
      id: 'samples',
      name: 'Sample Packs',
      description: 'Audio samples and loops',
      icon: '🎵',
      packCount: 0,
      featured: [],
    }],
    ['templates', {
      id: 'templates',
      name: 'Templates',
      description: 'Deck templates and presets',
      icon: '📋',
      packCount: 0,
      featured: [],
    }],
    ['themes', {
      id: 'themes',
      name: 'Themes',
      description: 'UI themes and visual styles',
      icon: '🎨',
      packCount: 0,
      featured: [],
    }],
    ['complete-systems', {
      id: 'complete-systems',
      name: 'Complete Systems',
      description: 'Full production environments',
      icon: '🏢',
      packCount: 0,
      featured: [],
    }],
    ['educational', {
      id: 'educational',
      name: 'Educational',
      description: 'Learning resources and tutorials',
      icon: '📚',
      packCount: 0,
      featured: [],
    }],
    ['experimental', {
      id: 'experimental',
      name: 'Experimental',
      description: 'Cutting-edge and experimental',
      icon: '🧪',
      packCount: 0,
      featured: [],
    }],
  ]);
  
  async getCategoryInfo(category: PackCategory): Promise<CategoryInfo | null> {
    const info = this.categoryMetadata.get(category);
    if (!info) return null;
    
    // Count packs in category
    let count = 0;
    for (const { category: cat } of this.packCategories.values()) {
      if (cat === category) count++;
    }
    
    return { ...info, packCount: count };
  }
  
  async listCategories(): Promise<CategoryInfo[]> {
    const categories: CategoryInfo[] = [];
    for (const category of this.categoryMetadata.keys()) {
      const info = await this.getCategoryInfo(category);
      if (info) categories.push(info);
    }
    return categories.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  async browsePacks(_filter: CategoryFilter): Promise<Array<{
    packName: string;
    manifest: CardManifest;
    stats: PackDownloadStats;
    ratings: PackRatingStats;
  }>> {
    // This would integrate with actual pack registry, download store, and rating store
    // For now, return empty array
    return [];
  }
  
  async getFeaturedInCategory(category: PackCategory, limit = 5): Promise<string[]> {
    const info = this.categoryMetadata.get(category);
    return info?.featured.slice(0, limit) ?? [];
  }
  
  async updatePackCategory(packName: string, category: PackCategory, subcategories: string[] = []): Promise<boolean> {
    this.packCategories.set(packName, { category, subcategories });
    return true;
  }
}

// ============================================================================
// AUTHOR STORE
// ============================================================================

/**
 * Author store interface.
 */
export interface AuthorStore {
  /** Create/update author profile */
  saveProfile(profile: AuthorProfile): Promise<AuthorProfile>;
  
  /** Get author profile */
  getProfile(authorId: string): Promise<AuthorProfile | null>;
  
  /** Search authors */
  searchAuthors(query: string, limit?: number): Promise<AuthorProfile[]>;
  
  /** Get top authors */
  getTopAuthors(sortBy: 'downloads' | 'rating' | 'packs', limit?: number): Promise<AuthorProfile[]>;
  
  /** Follow author */
  followAuthor(followerId: string, authorId: string): Promise<boolean>;
  
  /** Unfollow author */
  unfollowAuthor(followerId: string, authorId: string): Promise<boolean>;
  
  /** Get author followers */
  getFollowers(authorId: string): Promise<string[]>;
  
  /** Send collaboration invite */
  sendCollaborationInvite(invite: Omit<CollaborationInvite, 'id' | 'createdAt' | 'status'>): Promise<CollaborationInvite>;
  
  /** Respond to collaboration invite */
  respondToInvite(inviteId: string, accept: boolean): Promise<boolean>;
  
  /** Get collaboration invites */
  getInvites(userId: string, status?: CollaborationInvite['status']): Promise<CollaborationInvite[]>;
  
  /** Record pack fork */
  recordFork(fork: Omit<PackFork, 'id' | 'forkedAt'>): Promise<PackFork>;
  
  /** Get pack forks */
  getForks(packName: string): Promise<PackFork[]>;
}

/**
 * In-memory author store.
 */
export class InMemoryAuthorStore implements AuthorStore {
  private profiles: Map<string, AuthorProfile> = new Map();
  private followers: Map<string, Set<string>> = new Map();
  private invites: Map<string, CollaborationInvite> = new Map();
  private forks: Map<string, PackFork> = new Map();
  private nextInviteId = 1;
  private nextForkId = 1;
  
  async saveProfile(profile: AuthorProfile): Promise<AuthorProfile> {
    this.profiles.set(profile.id, profile);
    return profile;
  }
  
  async getProfile(authorId: string): Promise<AuthorProfile | null> {
    return this.profiles.get(authorId) ?? null;
  }
  
  async searchAuthors(query: string, limit = 20): Promise<AuthorProfile[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.profiles.values())
      .filter(p => 
        p.name.toLowerCase().includes(lowerQuery) ||
        p.bio?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, limit);
  }
  
  async getTopAuthors(sortBy: 'downloads' | 'rating' | 'packs', limit = 10): Promise<AuthorProfile[]> {
    const profiles = Array.from(this.profiles.values());
    
    switch (sortBy) {
      case 'downloads':
        return profiles.sort((a, b) => b.totalDownloads - a.totalDownloads).slice(0, limit);
      case 'rating':
        return profiles.sort((a, b) => b.averageRating - a.averageRating).slice(0, limit);
      case 'packs':
        return profiles.sort((a, b) => b.packs.length - a.packs.length).slice(0, limit);
    }
  }
  
  async followAuthor(followerId: string, authorId: string): Promise<boolean> {
    if (followerId === authorId) return false;
    
    const followerSet = this.followers.get(authorId) ?? new Set();
    followerSet.add(followerId);
    this.followers.set(authorId, followerSet);
    
    // Update counts
    const author = this.profiles.get(authorId);
    if (author) {
      author.followers = followerSet.size;
    }
    
    return true;
  }
  
  async unfollowAuthor(followerId: string, authorId: string): Promise<boolean> {
    const followerSet = this.followers.get(authorId);
    if (!followerSet || !followerSet.has(followerId)) return false;
    
    followerSet.delete(followerId);
    
    const author = this.profiles.get(authorId);
    if (author) {
      author.followers = followerSet.size;
    }
    
    return true;
  }
  
  async getFollowers(authorId: string): Promise<string[]> {
    return Array.from(this.followers.get(authorId) ?? []);
  }
  
  async sendCollaborationInvite(
    invite: Omit<CollaborationInvite, 'id' | 'createdAt' | 'status'>
  ): Promise<CollaborationInvite> {
    const newInvite: CollaborationInvite = {
      ...invite,
      id: `invite_${this.nextInviteId++}`,
      createdAt: Date.now(),
      status: 'pending',
    };
    
    this.invites.set(newInvite.id, newInvite);
    return newInvite;
  }
  
  async respondToInvite(inviteId: string, accept: boolean): Promise<boolean> {
    const invite = this.invites.get(inviteId);
    if (!invite || invite.status !== 'pending') return false;
    
    invite.status = accept ? 'accepted' : 'declined';
    invite.respondedAt = Date.now();
    
    return true;
  }
  
  async getInvites(userId: string, status?: CollaborationInvite['status']): Promise<CollaborationInvite[]> {
    return Array.from(this.invites.values())
      .filter(i => 
        (i.inviterId === userId || i.inviteeId === userId) &&
        (!status || i.status === status)
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }
  
  async recordFork(fork: Omit<PackFork, 'id' | 'forkedAt'>): Promise<PackFork> {
    const newFork: PackFork = {
      ...fork,
      id: `fork_${this.nextForkId++}`,
      forkedAt: Date.now(),
    };
    
    this.forks.set(newFork.id, newFork);
    return newFork;
  }
  
  async getForks(packName: string): Promise<PackFork[]> {
    return Array.from(this.forks.values())
      .filter(f => f.originalPack === packName)
      .sort((a, b) => b.forkedAt - a.forkedAt);
  }
}

// ============================================================================
// SINGLETON STORES
// ============================================================================

let defaultCategoryStore: CategoryStore | null = null;
let defaultAuthorStore: AuthorStore | null = null;

export function getCategoryStore(): CategoryStore {
  if (!defaultCategoryStore) {
    defaultCategoryStore = new InMemoryCategoryStore();
  }
  return defaultCategoryStore;
}

export function setCategoryStore(store: CategoryStore): void {
  defaultCategoryStore = store;
}

export function getAuthorStore(): AuthorStore {
  if (!defaultAuthorStore) {
    defaultAuthorStore = new InMemoryAuthorStore();
  }
  return defaultAuthorStore;
}

export function setAuthorStore(store: AuthorStore): void {
  defaultAuthorStore = store;
}
