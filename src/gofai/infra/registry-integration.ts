/**
 * @file Registry Integration — Symbol Table Auto-Update
 * @module gofai/infra/registry-integration
 * 
 * Implements Step 081: Integrate symbol table builder with CardRegistry and
 * BoardRegistry listeners to auto-update referents when extensions load.
 * 
 * This module bridges CardPlay's dynamic registry system with GOFAI's symbol
 * table, ensuring that:
 * - New cards become immediately referable by name
 * - New boards become immediately referable by name
 * - Card parameters become queryable
 * - Extension namespaces are properly tracked
 * - Unloaded extensions have their entries removed
 * - Symbol table stays synchronized with runtime state
 * 
 * Design principles:
 * - Event-driven: Reacts to registry events, not polling
 * - Incremental: Updates symbol table incrementally, not rebuilding
 * - Atomic: Registry changes are atomic w.r.t symbol table
 * - Provenance-aware: Track which extension provided each symbol
 * - Performance-conscious: Minimize work on hot paths
 * 
 * @see gofai_goalB.md Step 081
 * @see src/registry/card-registry.ts
 * @see src/registry/board-registry.ts
 */

import type { SymbolTable, Symbol, SymbolScope } from './symbol-table.js';
import type { AutoBindingResult } from '../extensions/auto-binding.js';
import { bindCard, bindBoard, bindDeck } from '../extensions/auto-binding.js';

// ============================================================================
// Registry Event Types
// ============================================================================

/**
 * Events emitted by CardPlay registries.
 */
export type RegistryEvent =
  | CardRegisteredEvent
  | CardUnregisteredEvent
  | BoardRegisteredEvent
  | BoardUnregisteredEvent
  | DeckRegisteredEvent
  | DeckUnregisteredEvent
  | ExtensionLoadedEvent
  | ExtensionUnloadedEvent;

export interface CardRegisteredEvent {
  readonly type: 'card:registered';
  readonly cardId: string;
  readonly cardMetadata: CardMetadata;
  readonly namespace: string;
  readonly timestamp: number;
}

export interface CardUnregisteredEvent {
  readonly type: 'card:unregistered';
  readonly cardId: string;
  readonly namespace: string;
  readonly timestamp: number;
}

export interface BoardRegisteredEvent {
  readonly type: 'board:registered';
  readonly boardId: string;
  readonly boardMetadata: BoardMetadata;
  readonly namespace: string;
  readonly timestamp: number;
}

export interface BoardUnregisteredEvent {
  readonly type: 'board:unregistered';
  readonly boardId: string;
  readonly namespace: string;
  readonly timestamp: number;
}

export interface DeckRegisteredEvent {
  readonly type: 'deck:registered';
  readonly deckId: string;
  readonly deckMetadata: DeckMetadata;
  readonly namespace: string;
  readonly timestamp: number;
}

export interface DeckUnregisteredEvent {
  readonly type: 'deck:unregistered';
  readonly deckId: string;
  readonly namespace: string;
  readonly timestamp: number;
}

export interface ExtensionLoadedEvent {
  readonly type: 'extension:loaded';
  readonly extensionId: string;
  readonly namespace: string;
  readonly version: string;
  readonly timestamp: number;
}

export interface ExtensionUnloadedEvent {
  readonly type: 'extension:unloaded';
  readonly extensionId: string;
  readonly namespace: string;
  readonly timestamp: number;
}

// ============================================================================
// Metadata Types (simplified from CardPlay)
// ============================================================================

export interface CardMetadata {
  readonly id: string;
  readonly name: string;
  readonly displayName?: string;
  readonly description?: string;
  readonly category?: string;
  readonly tags?: readonly string[];
  readonly parameters?: readonly CardParameter[];
  readonly gofaiAnnotations?: any;
}

export interface CardParameter {
  readonly id: string;
  readonly name: string;
  readonly displayName?: string;
  readonly type: 'number' | 'enum' | 'boolean' | 'string';
  readonly min?: number;
  readonly max?: number;
  readonly default?: unknown;
  readonly unit?: string;
  readonly description?: string;
}

export interface BoardMetadata {
  readonly id: string;
  readonly name: string;
  readonly displayName?: string;
  readonly description?: string;
  readonly category?: string;
  readonly capabilities?: readonly string[];
  readonly gofaiAnnotations?: any;
}

export interface DeckMetadata {
  readonly id: string;
  readonly type: string;
  readonly name?: string;
  readonly displayName?: string;
  readonly description?: string;
  readonly category?: string;
  readonly gofaiAnnotations?: any;
}

// ============================================================================
// Registry Integrator
// ============================================================================

/**
 * Manages integration between CardPlay registries and GOFAI symbol table.
 */
export class RegistryIntegrator {
  private readonly symbolTable: SymbolTable;
  private readonly autoBindingContext: AutoBindingContext;
  private readonly eventHandlers: Map<string, EventHandler[]>;
  private readonly namespaceTracker: NamespaceTracker;
  
  constructor(symbolTable: SymbolTable) {
    this.symbolTable = symbolTable;
    this.autoBindingContext = {
      language: 'en-US',
      debug: false,
    };
    this.eventHandlers = new Map();
    this.namespaceTracker = new NamespaceTracker();
  }
  
  /**
   * Start listening to registry events.
   */
  start(): void {
    // In a real implementation, this would attach to actual registry event emitters
    // For now, this is the interface that would be called
  }
  
  /**
   * Stop listening to registry events.
   */
  stop(): void {
    this.eventHandlers.clear();
  }
  
  /**
   * Handle a registry event.
   */
  handleEvent(event: RegistryEvent): void {
    const handlers = this.eventHandlers.get(event.type) || [];
    
    for (const handler of handlers) {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error handling registry event ${event.type}:`, error);
      }
    }
    
    // Dispatch to specific handler
    switch (event.type) {
      case 'card:registered':
        this.handleCardRegistered(event);
        break;
      case 'card:unregistered':
        this.handleCardUnregistered(event);
        break;
      case 'board:registered':
        this.handleBoardRegistered(event);
        break;
      case 'board:unregistered':
        this.handleBoardUnregistered(event);
        break;
      case 'deck:registered':
        this.handleDeckRegistered(event);
        break;
      case 'deck:unregistered':
        this.handleDeckUnregistered(event);
        break;
      case 'extension:loaded':
        this.handleExtensionLoaded(event);
        break;
      case 'extension:unloaded':
        this.handleExtensionUnloaded(event);
        break;
    }
  }
  
  /**
   * Register an event handler.
   */
  on(eventType: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    handlers.push(handler);
    this.eventHandlers.set(eventType, handlers);
  }
  
  /**
   * Unregister an event handler.
   */
  off(eventType: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    const filtered = handlers.filter(h => h !== handler);
    this.eventHandlers.set(eventType, filtered);
  }
  
  // ========================================================================
  // Event Handlers
  // ========================================================================
  
  private handleCardRegistered(event: CardRegisteredEvent): void {
    const context = {
      ...this.autoBindingContext,
      namespace: event.namespace,
      version: '1.0.0', // Should come from extension metadata
      trusted: this.namespaceTracker.isTrusted(event.namespace),
    };
    
    // Generate bindings from card metadata
    const bindings = bindCard(event.cardMetadata, context);
    
    // Add generated symbols to symbol table
    for (const lexeme of bindings.lexemes) {
      const symbol: Symbol = {
        id: lexeme.id as string,
        name: lexeme.lemma,
        type: 'lexeme',
        scope: 'global' as SymbolScope,
        namespace: event.namespace,
        metadata: {
          category: lexeme.category,
          semantics: lexeme.semantics,
          examples: lexeme.examples,
          variants: lexeme.variants,
        },
        referent: {
          type: 'card',
          id: event.cardId,
          name: event.cardMetadata.name,
        },
        provenance: {
          source: 'auto-binding',
          event: 'card:registered',
          timestamp: event.timestamp,
        },
      };
      
      this.symbolTable.addSymbol(symbol);
    }
    
    // Track namespace
    this.namespaceTracker.registerEntity(event.namespace, 'card', event.cardId);
    
    // Log warnings
    if (bindings.warnings.length > 0) {
      console.warn(
        `Auto-binding warnings for card ${event.cardId}:`,
        bindings.warnings
      );
    }
    
    // Log errors
    if (bindings.errors.length > 0) {
      console.error(
        `Auto-binding errors for card ${event.cardId}:`,
        bindings.errors
      );
    }
  }
  
  private handleCardUnregistered(event: CardUnregisteredEvent): void {
    // Remove all symbols associated with this card
    const symbols = this.symbolTable.getSymbolsByReferent('card', event.cardId);
    
    for (const symbol of symbols) {
      this.symbolTable.removeSymbol(symbol.id);
    }
    
    // Update namespace tracker
    this.namespaceTracker.unregisterEntity(event.namespace, 'card', event.cardId);
  }
  
  private handleBoardRegistered(event: BoardRegisteredEvent): void {
    const context = {
      ...this.autoBindingContext,
      namespace: event.namespace,
      version: '1.0.0',
      trusted: this.namespaceTracker.isTrusted(event.namespace),
    };
    
    // Generate bindings from board metadata
    const bindings = bindBoard(event.boardMetadata, context);
    
    // Add generated symbols to symbol table
    for (const lexeme of bindings.lexemes) {
      const symbol: Symbol = {
        id: lexeme.id as string,
        name: lexeme.lemma,
        type: 'lexeme',
        scope: 'global' as SymbolScope,
        namespace: event.namespace,
        metadata: {
          category: lexeme.category,
          semantics: lexeme.semantics,
          examples: lexeme.examples,
          variants: lexeme.variants,
        },
        referent: {
          type: 'board',
          id: event.boardId,
          name: event.boardMetadata.name,
        },
        provenance: {
          source: 'auto-binding',
          event: 'board:registered',
          timestamp: event.timestamp,
        },
      };
      
      this.symbolTable.addSymbol(symbol);
    }
    
    // Track namespace
    this.namespaceTracker.registerEntity(event.namespace, 'board', event.boardId);
    
    // Log warnings/errors
    if (bindings.warnings.length > 0) {
      console.warn(
        `Auto-binding warnings for board ${event.boardId}:`,
        bindings.warnings
      );
    }
    
    if (bindings.errors.length > 0) {
      console.error(
        `Auto-binding errors for board ${event.boardId}:`,
        bindings.errors
      );
    }
  }
  
  private handleBoardUnregistered(event: BoardUnregisteredEvent): void {
    // Remove all symbols associated with this board
    const symbols = this.symbolTable.getSymbolsByReferent('board', event.boardId);
    
    for (const symbol of symbols) {
      this.symbolTable.removeSymbol(symbol.id);
    }
    
    // Update namespace tracker
    this.namespaceTracker.unregisterEntity(event.namespace, 'board', event.boardId);
  }
  
  private handleDeckRegistered(event: DeckRegisteredEvent): void {
    const context = {
      ...this.autoBindingContext,
      namespace: event.namespace,
      version: '1.0.0',
      trusted: this.namespaceTracker.isTrusted(event.namespace),
    };
    
    // Generate bindings from deck metadata
    const bindings = bindDeck(event.deckMetadata, context);
    
    // Add generated symbols to symbol table
    for (const lexeme of bindings.lexemes) {
      const symbol: Symbol = {
        id: lexeme.id as string,
        name: lexeme.lemma,
        type: 'lexeme',
        scope: 'global' as SymbolScope,
        namespace: event.namespace,
        metadata: {
          category: lexeme.category,
          semantics: lexeme.semantics,
          examples: lexeme.examples,
          variants: lexeme.variants,
        },
        referent: {
          type: 'deck',
          id: event.deckId,
          name: event.deckMetadata.name || event.deckMetadata.type,
        },
        provenance: {
          source: 'auto-binding',
          event: 'deck:registered',
          timestamp: event.timestamp,
        },
      };
      
      this.symbolTable.addSymbol(symbol);
    }
    
    // Track namespace
    this.namespaceTracker.registerEntity(event.namespace, 'deck', event.deckId);
    
    // Log warnings/errors
    if (bindings.warnings.length > 0) {
      console.warn(
        `Auto-binding warnings for deck ${event.deckId}:`,
        bindings.warnings
      );
    }
    
    if (bindings.errors.length > 0) {
      console.error(
        `Auto-binding errors for deck ${event.deckId}:`,
        bindings.errors
      );
    }
  }
  
  private handleDeckUnregistered(event: DeckUnregisteredEvent): void {
    // Remove all symbols associated with this deck
    const symbols = this.symbolTable.getSymbolsByReferent('deck', event.deckId);
    
    for (const symbol of symbols) {
      this.symbolTable.removeSymbol(symbol.id);
    }
    
    // Update namespace tracker
    this.namespaceTracker.unregisterEntity(event.namespace, 'deck', event.deckId);
  }
  
  private handleExtensionLoaded(event: ExtensionLoadedEvent): void {
    // Register namespace
    this.namespaceTracker.registerNamespace(
      event.namespace,
      event.extensionId,
      event.version
    );
    
    // Extension-specific initialization could happen here
    // (e.g., loading Prolog modules, registering custom opcodes)
  }
  
  private handleExtensionUnloaded(event: ExtensionUnloadedEvent): void {
    // Remove all symbols from this namespace
    const symbols = this.symbolTable.getSymbolsByNamespace(event.namespace);
    
    for (const symbol of symbols) {
      this.symbolTable.removeSymbol(symbol.id);
    }
    
    // Unregister namespace
    this.namespaceTracker.unregisterNamespace(event.namespace);
  }
  
  // ========================================================================
  // Query Interface
  // ========================================================================
  
  /**
   * Get statistics about registered entities.
   */
  getStats(): RegistryIntegrationStats {
    return {
      totalSymbols: this.symbolTable.getSymbolCount(),
      symbolsByNamespace: this.namespaceTracker.getNamespaceStats(),
      cardCount: this.namespaceTracker.getEntityCount('card'),
      boardCount: this.namespaceTracker.getEntityCount('board'),
      deckCount: this.namespaceTracker.getEntityCount('deck'),
      namespaceCount: this.namespaceTracker.getNamespaceCount(),
    };
  }
  
  /**
   * Get all symbols for a specific card.
   */
  getCardSymbols(cardId: string): readonly Symbol[] {
    return this.symbolTable.getSymbolsByReferent('card', cardId);
  }
  
  /**
   * Get all symbols for a specific board.
   */
  getBoardSymbols(boardId: string): readonly Symbol[] {
    return this.symbolTable.getSymbolsByReferent('board', boardId);
  }
  
  /**
   * Get all symbols for a specific namespace.
   */
  getNamespaceSymbols(namespace: string): readonly Symbol[] {
    return this.symbolTable.getSymbolsByNamespace(namespace);
  }
}

export interface RegistryIntegrationStats {
  readonly totalSymbols: number;
  readonly symbolsByNamespace: Map<string, number>;
  readonly cardCount: number;
  readonly boardCount: number;
  readonly deckCount: number;
  readonly namespaceCount: number;
}

type EventHandler = (event: RegistryEvent) => void;

interface AutoBindingContext {
  readonly language: string;
  readonly debug: boolean;
  namespace?: string;
  version?: string;
  trusted?: boolean;
}

// ============================================================================
// Namespace Tracker
// ============================================================================

/**
 * Tracks which entities belong to which namespaces.
 */
class NamespaceTracker {
  private readonly namespaces = new Map<string, NamespaceInfo>();
  private readonly trustedNamespaces = new Set<string>(['builtin', 'core']);
  
  registerNamespace(
    namespace: string,
    extensionId: string,
    version: string
  ): void {
    this.namespaces.set(namespace, {
      extensionId,
      version,
      entities: {
        cards: new Set(),
        boards: new Set(),
        decks: new Set(),
      },
      registeredAt: Date.now(),
    });
  }
  
  unregisterNamespace(namespace: string): void {
    this.namespaces.delete(namespace);
  }
  
  registerEntity(
    namespace: string,
    entityType: 'card' | 'board' | 'deck',
    entityId: string
  ): void {
    const info = this.namespaces.get(namespace);
    if (!info) {
      // Create namespace on-demand
      this.registerNamespace(namespace, namespace, '1.0.0');
    }
    
    const updated = this.namespaces.get(namespace)!;
    const entitySet = updated.entities[`${entityType}s` as keyof typeof updated.entities] as Set<string>;
    entitySet.add(entityId);
  }
  
  unregisterEntity(
    namespace: string,
    entityType: 'card' | 'board' | 'deck',
    entityId: string
  ): void {
    const info = this.namespaces.get(namespace);
    if (!info) return;
    
    const entitySet = info.entities[`${entityType}s` as keyof typeof info.entities] as Set<string>;
    entitySet.delete(entityId);
  }
  
  isTrusted(namespace: string): boolean {
    return this.trustedNamespaces.has(namespace);
  }
  
  getNamespaceCount(): number {
    return this.namespaces.size;
  }
  
  getEntityCount(entityType: 'card' | 'board' | 'deck'): number {
    let count = 0;
    for (const info of this.namespaces.values()) {
      const entitySet = info.entities[`${entityType}s` as keyof typeof info.entities] as Set<string>;
      count += entitySet.size;
    }
    return count;
  }
  
  getNamespaceStats(): Map<string, number> {
    const stats = new Map<string, number>();
    
    for (const [namespace, info] of this.namespaces) {
      const total = 
        info.entities.cards.size +
        info.entities.boards.size +
        info.entities.decks.size;
      stats.set(namespace, total);
    }
    
    return stats;
  }
}

interface NamespaceInfo {
  readonly extensionId: string;
  readonly version: string;
  readonly entities: {
    readonly cards: Set<string>;
    readonly boards: Set<string>;
    readonly decks: Set<string>;
  };
  readonly registeredAt: number;
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create and initialize a registry integrator.
 */
export function createRegistryIntegrator(
  symbolTable: SymbolTable
): RegistryIntegrator {
  const integrator = new RegistryIntegrator(symbolTable);
  integrator.start();
  return integrator;
}

/**
 * Attach integrator to CardPlay registries (stub for actual integration).
 */
export function attachToRegistries(
  integrator: RegistryIntegrator,
  registries: {
    readonly cardRegistry?: any;
    readonly boardRegistry?: any;
    readonly deckRegistry?: any;
  }
): void {
  // In actual implementation, would attach to real registry event emitters:
  //
  // registries.cardRegistry?.on('registered', (card) => {
  //   integrator.handleEvent({
  //     type: 'card:registered',
  //     cardId: card.id,
  //     cardMetadata: card.metadata,
  //     namespace: card.namespace,
  //     timestamp: Date.now(),
  //   });
  // });
  //
  // etc. for other registries
}
