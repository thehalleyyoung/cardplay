/**
 * Undo Tokens as Linear Resources (Step 035)
 * 
 * This module implements Step 035 from gofai_goalB.md:
 * "Define 'undo tokens' as linear resources: every `apply` yields a token
 * that can be consumed by `undo` deterministically."
 * 
 * The key insight: treating undo as a linear type system ensures that:
 * 1. Every mutation produces exactly one undo token
 * 2. Each token can be consumed exactly once
 * 3. Token consumption is explicit and tracked
 * 4. Double-undo is impossible by construction
 * 5. Redo produces a new token (not reusing the old one)
 * 
 * This is inspired by linear logic and affine type systems, where
 * resources must be used exactly once. In TypeScript, we enforce this
 * at runtime with strict state management.
 * 
 * @module gofai/trust/undo-tokens
 */

import type { EditPackageId } from './undo';

// =============================================================================
// Undo Token Types
// =============================================================================

/**
 * Branded type for undo token IDs.
 * 
 * Format: `ut:{edit-package-id}:{generation}`
 * Where generation increments on each redo (0 for initial apply).
 */
export type UndoTokenId = string & { readonly __undoTokenId: unique symbol };

/**
 * An undo token - a linear resource that represents the right to undo
 * a specific edit package.
 * 
 * Tokens are:
 * - **Linear**: Can be consumed exactly once
 * - **Transferable**: Can be passed between contexts
 * - **Versioned**: Track generation for redo chains
 * - **Cancellable**: Can be explicitly invalidated
 */
export interface UndoToken {
  /** Unique token ID */
  readonly id: UndoTokenId;
  
  /** The edit package this token undoes */
  readonly editPackageId: EditPackageId;
  
  /** Generation number (0 = original apply, 1+ = redo) */
  readonly generation: number;
  
  /** When this token was created */
  readonly createdAt: number;
  
  /** Current state of the token */
  readonly state: UndoTokenState;
  
  /** Why this token was created */
  readonly reason: 'apply' | 'redo';
  
  /** Optional expiry timestamp (tokens can time out) */
  readonly expiresAt?: number;
  
  /** Metadata about the edit this undoes */
  readonly metadata: UndoTokenMetadata;
}

/**
 * Possible states for an undo token.
 */
export type UndoTokenState =
  | 'valid'        // Token can be consumed
  | 'consumed'     // Token has been used
  | 'expired'      // Token timed out
  | 'cancelled';   // Token was explicitly cancelled

/**
 * Metadata about what the token undoes.
 */
export interface UndoTokenMetadata {
  /** Short description of the edit */
  readonly summary: string;
  
  /** Scope that was affected */
  readonly scope: string;
  
  /** Estimated risk of undoing */
  readonly risk: 'low' | 'medium' | 'high';
  
  /** Whether undo requires user confirmation */
  readonly requiresConfirmation: boolean;
}

// =============================================================================
// Token Registry
// =============================================================================

/**
 * Central registry for undo tokens.
 * 
 * Enforces linearity by tracking token state and preventing
 * double consumption.
 */
export class UndoTokenRegistry {
  private readonly tokens = new Map<UndoTokenId, UndoToken>();
  private readonly tokensByPackage = new Map<EditPackageId, UndoTokenId[]>();
  
  /**
   * Mint a new undo token.
   * 
   * This is called when an edit is applied.
   * 
   * @param editPackageId - The edit package being applied
   * @param metadata - Metadata about the edit
   * @param options - Optional token configuration
   * @returns A new valid undo token
   */
  mint(
    editPackageId: EditPackageId,
    metadata: UndoTokenMetadata,
    options?: {
      readonly generation?: number;
      readonly reason?: UndoToken['reason'];
      readonly ttl?: number; // Time to live in ms
    }
  ): UndoToken {
    const generation = options?.generation ?? 0;
    const reason = options?.reason ?? 'apply';
    const now = Date.now();
    
    const id = this.createTokenId(editPackageId, generation);
    
    const token: UndoToken = {
      id,
      editPackageId,
      generation,
      createdAt: now,
      state: 'valid',
      reason,
      expiresAt: options?.ttl ? now + options.ttl : undefined,
      metadata,
    };
    
    // Store token
    this.tokens.set(id, token);
    
    // Index by package
    const existing = this.tokensByPackage.get(editPackageId) ?? [];
    this.tokensByPackage.set(editPackageId, [...existing, id]);
    
    return token;
  }
  
  /**
   * Consume an undo token.
   * 
   * This marks the token as consumed and returns it for use.
   * Once consumed, the token cannot be used again.
   * 
   * @param tokenId - The token to consume
   * @returns The consumed token
   * @throws Error if token is not valid
   */
  consume(tokenId: UndoTokenId): UndoToken {
    const token = this.tokens.get(tokenId);
    
    if (!token) {
      throw new Error(`Unknown undo token: ${tokenId}`);
    }
    
    // Check if expired
    if (token.expiresAt && Date.now() > token.expiresAt) {
      this.updateTokenState(tokenId, 'expired');
      throw new Error(`Undo token expired: ${tokenId}`);
    }
    
    // Check state
    switch (token.state) {
      case 'valid':
        // OK - consume it
        this.updateTokenState(tokenId, 'consumed');
        return { ...token, state: 'consumed' };
      
      case 'consumed':
        throw new Error(
          `Undo token already consumed: ${tokenId}. ` +
          `Each token can only be used once. ` +
          `If you want to redo, use the new token returned from undo.`
        );
      
      case 'expired':
        throw new Error(`Undo token expired: ${tokenId}`);
      
      case 'cancelled':
        throw new Error(`Undo token cancelled: ${tokenId}`);
    }
  }
  
  /**
   * Cancel an undo token.
   * 
   * Cancelled tokens cannot be consumed. This is useful when
   * an edit is superseded by a newer edit.
   * 
   * @param tokenId - Token to cancel
   */
  cancel(tokenId: UndoTokenId): void {
    const token = this.tokens.get(tokenId);
    
    if (!token) {
      throw new Error(`Unknown undo token: ${tokenId}`);
    }
    
    if (token.state !== 'valid') {
      // Already consumed/expired/cancelled - no-op
      return;
    }
    
    this.updateTokenState(tokenId, 'cancelled');
  }
  
  /**
   * Cancel all tokens for an edit package.
   * 
   * Useful when an edit package is superseded.
   */
  cancelAllForPackage(editPackageId: EditPackageId): void {
    const tokenIds = this.tokensByPackage.get(editPackageId) ?? [];
    
    for (const tokenId of tokenIds) {
      this.cancel(tokenId);
    }
  }
  
  /**
   * Get a token by ID.
   */
  get(tokenId: UndoTokenId): UndoToken | undefined {
    return this.tokens.get(tokenId);
  }
  
  /**
   * Get all tokens for an edit package.
   */
  getForPackage(editPackageId: EditPackageId): readonly UndoToken[] {
    const tokenIds = this.tokensByPackage.get(editPackageId) ?? [];
    return tokenIds
      .map(id => this.tokens.get(id))
      .filter((t): t is UndoToken => t !== undefined);
  }
  
  /**
   * Get all valid tokens.
   */
  getValid(): readonly UndoToken[] {
    return Array.from(this.tokens.values())
      .filter(t => t.state === 'valid');
  }
  
  /**
   * Check if a token is valid (not consumed/expired/cancelled).
   */
  isValid(tokenId: UndoTokenId): boolean {
    const token = this.tokens.get(tokenId);
    if (!token) return false;
    
    // Check expiry
    if (token.expiresAt && Date.now() > token.expiresAt) {
      this.updateTokenState(tokenId, 'expired');
      return false;
    }
    
    return token.state === 'valid';
  }
  
  /**
   * Get the latest valid token for an edit package.
   * 
   * This is the token with the highest generation that's still valid.
   */
  getLatestValid(editPackageId: EditPackageId): UndoToken | undefined {
    const tokens = this.getForPackage(editPackageId);
    
    return tokens
      .filter(t => this.isValid(t.id))
      .sort((a, b) => b.generation - a.generation)[0];
  }
  
  /**
   * Clean up expired tokens.
   * 
   * This should be called periodically to prevent memory leaks.
   * 
   * @returns Number of tokens cleaned up
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [id, token] of this.tokens.entries()) {
      if (token.expiresAt && now > token.expiresAt) {
        this.updateTokenState(id, 'expired');
        cleaned++;
      }
    }
    
    return cleaned;
  }
  
  /**
   * Clear all tokens.
   * 
   * Use with caution - this should only be called on session reset.
   */
  clear(): void {
    this.tokens.clear();
    this.tokensByPackage.clear();
  }
  
  // Private helpers
  
  private createTokenId(
    editPackageId: EditPackageId,
    generation: number
  ): UndoTokenId {
    return `ut:${editPackageId}:${generation}` as UndoTokenId;
  }
  
  private updateTokenState(tokenId: UndoTokenId, newState: UndoTokenState): void {
    const token = this.tokens.get(tokenId);
    if (!token) return;
    
    this.tokens.set(tokenId, {
      ...token,
      state: newState,
    });
  }
}

// =============================================================================
// Linear Resource Pattern
// =============================================================================

/**
 * Result of an undo operation.
 * 
 * Contains:
 * - The new state (after undo)
 * - A new redo token (linear resource for redoing)
 */
export interface UndoResult {
  /** Success/failure */
  readonly success: boolean;
  
  /** The token that was consumed */
  readonly consumedToken: UndoToken;
  
  /** A new token for redoing (if undo succeeded) */
  readonly redoToken?: UndoToken;
  
  /** Error message if failed */
  readonly error?: string;
}

/**
 * Result of a redo operation.
 * 
 * Contains:
 * - The new state (after redo)
 * - A new undo token (linear resource for undoing again)
 */
export interface RedoResult {
  /** Success/failure */
  readonly success: boolean;
  
  /** The token that was consumed */
  readonly consumedToken: UndoToken;
  
  /** A new token for undoing (if redo succeeded) */
  readonly undoToken?: UndoToken;
  
  /** Error message if failed */
  readonly error?: string;
}

/**
 * Apply-Undo-Redo protocol using linear tokens.
 * 
 * This enforces the pattern:
 * 
 * ```
 * apply() → UndoToken
 * undo(token) → RedoToken
 * redo(token) → UndoToken
 * ```
 * 
 * Each operation consumes its input token and produces a new output token.
 */
export interface LinearUndoProtocol {
  /**
   * Apply an edit, returning an undo token.
   * 
   * @param editPackageId - The edit to apply
   * @returns A token that can be used to undo
   */
  apply(editPackageId: EditPackageId): Promise<UndoToken>;
  
  /**
   * Undo an edit by consuming its token.
   * 
   * @param token - The undo token to consume
   * @returns A result with a new redo token
   */
  undo(token: UndoToken): Promise<UndoResult>;
  
  /**
   * Redo an edit by consuming its token.
   * 
   * @param token - The redo token to consume  
   * @returns A result with a new undo token
   */
  redo(token: UndoToken): Promise<RedoResult>;
}

// =============================================================================
// Token Chain
// =============================================================================

/**
 * A chain of undo/redo tokens.
 * 
 * Represents the history of a single edit package through
 * multiple undo/redo cycles.
 * 
 * Example:
 * ```
 * apply → token0
 * undo(token0) → token1 (redo)
 * redo(token1) → token2 (undo)
 * undo(token2) → token3 (redo)
 * ```
 */
export interface TokenChain {
  /** The original edit package */
  readonly editPackageId: EditPackageId;
  
  /** All tokens in chronological order */
  readonly tokens: readonly UndoToken[];
  
  /** Current head (latest valid token) */
  readonly head?: UndoToken;
  
  /** Current generation */
  readonly generation: number;
  
  /** Whether we're currently in undone state */
  readonly isUndone: boolean;
}

/**
 * Build a token chain for an edit package.
 */
export function buildTokenChain(
  registry: UndoTokenRegistry,
  editPackageId: EditPackageId
): TokenChain {
  const tokens = registry.getForPackage(editPackageId);
  const head = registry.getLatestValid(editPackageId);
  
  const generation = tokens.length > 0
    ? Math.max(...tokens.map(t => t.generation))
    : 0;
  
  const isUndone = head?.reason === 'redo';
  
  return {
    editPackageId,
    tokens,
    head,
    generation,
    isUndone,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parse an undo token ID to extract components.
 */
export function parseUndoTokenId(id: UndoTokenId): {
  editPackageId: EditPackageId;
  generation: number;
} | null {
  const match = /^ut:(.+):(\d+)$/.exec(id);
  if (!match) return null;
  
  return {
    editPackageId: match[1] as EditPackageId,
    generation: parseInt(match[2], 10),
  };
}

/**
 * Check if an undo token ID is valid format.
 */
export function isValidUndoTokenId(id: string): id is UndoTokenId {
  return /^ut:.+:\d+$/.test(id);
}

/**
 * Create undo token metadata from edit package info.
 */
export function createUndoTokenMetadata(
  summary: string,
  scope: string,
  options?: {
    readonly risk?: UndoTokenMetadata['risk'];
    readonly requiresConfirmation?: boolean;
  }
): UndoTokenMetadata {
  return {
    summary,
    scope,
    risk: options?.risk ?? 'low',
    requiresConfirmation: options?.requiresConfirmation ?? false,
  };
}

// =============================================================================
// Global Registry
// =============================================================================

/**
 * Global undo token registry.
 */
export const undoTokenRegistry = new UndoTokenRegistry();

// =============================================================================
// Documentation Examples
// =============================================================================

/**
 * Example: Basic linear undo/redo flow
 * 
 * ```typescript
 * // Apply an edit
 * const token1 = undoTokenRegistry.mint(
 *   editPackageId,
 *   { summary: 'Made chorus brighter', scope: 'chorus', risk: 'low', requiresConfirmation: false }
 * );
 * 
 * // Later, undo it (consumes token1)
 * const consumedToken = undoTokenRegistry.consume(token1.id);
 * // ... perform undo ...
 * 
 * // Mint a new redo token (generation 1)
 * const token2 = undoTokenRegistry.mint(
 *   editPackageId,
 *   { summary: 'Made chorus brighter', scope: 'chorus', risk: 'low', requiresConfirmation: false },
 *   { generation: 1, reason: 'redo' }
 * );
 * 
 * // Redo it (consumes token2)
 * const consumedToken2 = undoTokenRegistry.consume(token2.id);
 * // ... perform redo ...
 * 
 * // Mint a new undo token (generation 2)
 * const token3 = undoTokenRegistry.mint(
 *   editPackageId,
 *   { summary: 'Made chorus brighter', scope: 'chorus', risk: 'low', requiresConfirmation: false },
 *   { generation: 2, reason: 'apply' }
 * );
 * ```
 */

/**
 * Example: Token expiry
 * 
 * ```typescript
 * // Mint a token with 5 minute TTL
 * const token = undoTokenRegistry.mint(
 *   editPackageId,
 *   metadata,
 *   { ttl: 5 * 60 * 1000 }
 * );
 * 
 * // ... wait 6 minutes ...
 * 
 * // Token is now expired
 * try {
 *   undoTokenRegistry.consume(token.id);
 * } catch (error) {
 *   console.error('Token expired');
 * }
 * ```
 */

/**
 * Example: Token cancellation
 * 
 * ```typescript
 * const token1 = undoTokenRegistry.mint(editPackage1, metadata1);
 * 
 * // User makes a newer edit that supersedes the first
 * const token2 = undoTokenRegistry.mint(editPackage2, metadata2);
 * 
 * // Cancel the old token since it's no longer relevant
 * undoTokenRegistry.cancel(token1.id);
 * 
 * // Attempting to use it now fails
 * try {
 *   undoTokenRegistry.consume(token1.id);
 * } catch (error) {
 *   console.error('Token cancelled');
 * }
 * ```
 */
