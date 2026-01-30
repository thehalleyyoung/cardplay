/**
 * @fileoverview Protocol System Implementation.
 * 
 * Protocols define standard interfaces that types can implement.
 * 
 * @module @cardplay/core/cards/protocol
 */

// ============================================================================
// PROTOCOL TYPES
// ============================================================================

/**
 * Base protocol interface.
 */
export interface Protocol<T> {
  /** Protocol identifier */
  readonly id: string;
  /** Protocol name */
  readonly name: string;
  /** Protocol version */
  readonly version: string;
  /** Methods this protocol requires */
  readonly methods: readonly ProtocolMethod[];
  /** Check if a type implements this protocol */
  check(value: unknown): value is T;
}

/**
 * Protocol method definition.
 */
export interface ProtocolMethod {
  /** Method name */
  readonly name: string;
  /** Method signature description */
  readonly signature: string;
  /** Whether method is optional */
  readonly optional?: boolean;
}

/**
 * Protocol registry entry.
 */
export interface ProtocolRegistryEntry<T = unknown> {
  readonly protocol: Protocol<T>;
  readonly implementations: readonly string[];
  readonly parents: readonly string[];
}

// ============================================================================
// PROTOCOL REGISTRY
// ============================================================================

/**
 * Protocol registry interface.
 */
export interface ProtocolRegistry {
  /** Register a protocol */
  register<T>(protocol: Protocol<T>): void;
  /** Get protocol by ID */
  get<T>(id: string): Protocol<T> | undefined;
  /** List all protocols */
  list(): readonly Protocol<unknown>[];
  /** Register implementation */
  registerImplementation(typeId: string, protocolId: string): void;
  /** Check if type implements protocol */
  implements(typeId: string, protocolId: string): boolean;
  /** Get protocols implemented by type */
  getProtocolsFor(typeId: string): readonly Protocol<unknown>[];
  /** Set protocol inheritance */
  setParent(childId: string, parentId: string): void;
  /** Clear registry */
  clear(): void;
}

/**
 * Protocol registry implementation.
 */
class ProtocolRegistryImpl implements ProtocolRegistry {
  private readonly protocols = new Map<string, ProtocolRegistryEntry>();
  private readonly typeImplementations = new Map<string, Set<string>>();
  
  register<T>(protocol: Protocol<T>): void {
    const entry: ProtocolRegistryEntry<T> = {
      protocol,
      implementations: [],
      parents: [],
    };
    this.protocols.set(protocol.id, entry as ProtocolRegistryEntry);
  }
  
  get<T>(id: string): Protocol<T> | undefined {
    return this.protocols.get(id)?.protocol as Protocol<T> | undefined;
  }
  
  list(): readonly Protocol<unknown>[] {
    return Array.from(this.protocols.values()).map(e => e.protocol);
  }
  
  registerImplementation(typeId: string, protocolId: string): void {
    if (!this.typeImplementations.has(typeId)) {
      this.typeImplementations.set(typeId, new Set());
    }
    this.typeImplementations.get(typeId)!.add(protocolId);
    
    // Update entry
    const entry = this.protocols.get(protocolId);
    if (entry) {
      const mutableEntry = entry as unknown as { implementations: string[] };
      mutableEntry.implementations = [
        ...entry.implementations,
        typeId,
      ];
    }
  }
  
  implements(typeId: string, protocolId: string): boolean {
    const direct = this.typeImplementations.get(typeId)?.has(protocolId) ?? false;
    if (direct) return true;
    
    // Check inherited protocols
    const entry = this.protocols.get(protocolId);
    if (entry) {
      for (const parentId of entry.parents) {
        if (this.implements(typeId, parentId)) return true;
      }
    }
    
    return false;
  }
  
  getProtocolsFor(typeId: string): readonly Protocol<unknown>[] {
    const protocolIds = this.typeImplementations.get(typeId);
    if (!protocolIds) return [];
    
    return Array.from(protocolIds)
      .map(id => this.protocols.get(id)?.protocol)
      .filter((p): p is Protocol<unknown> => p !== undefined);
  }
  
  setParent(childId: string, parentId: string): void {
    const childEntry = this.protocols.get(childId);
    if (childEntry) {
      const mutableEntry = childEntry as unknown as { parents: string[] };
      mutableEntry.parents = [
        ...childEntry.parents,
        parentId,
      ];
    }
  }
  
  clear(): void {
    this.protocols.clear();
    this.typeImplementations.clear();
  }
}

// Singleton instance
let protocolRegistryInstance: ProtocolRegistry | null = null;

/**
 * Gets the protocol registry singleton.
 */
export function getProtocolRegistry(): ProtocolRegistry {
  if (!protocolRegistryInstance) {
    protocolRegistryInstance = new ProtocolRegistryImpl();
  }
  return protocolRegistryInstance;
}

/**
 * Resets the protocol registry.
 */
export function resetProtocolRegistry(): void {
  protocolRegistryInstance = null;
}

// ============================================================================
// PROTOCOL FACTORY
// ============================================================================

/**
 * Options for creating a protocol.
 */
export interface CreateProtocolOptions<T> {
  id: string;
  name: string;
  version?: string;
  methods: readonly ProtocolMethod[];
  check: (value: unknown) => value is T;
}

/**
 * Creates a protocol.
 */
export function createProtocol<T>(
  options: CreateProtocolOptions<T>
): Protocol<T> {
  return Object.freeze({
    id: options.id,
    name: options.name,
    version: options.version ?? '1.0.0',
    methods: Object.freeze([...options.methods]),
    check: options.check,
  });
}

// ============================================================================
// STANDARD PROTOCOLS
// ============================================================================

import type { Tick } from '../types/primitives';

/**
 * Schedulable protocol - can be scheduled for execution.
 */
export interface Schedulable<E> {
  schedule(event: E, at: Tick): void;
  unschedule(eventId: string): void;
  getScheduled(): readonly E[];
}

export const SchedulableProtocol = createProtocol<Schedulable<unknown>>({
  id: 'schedulable',
  name: 'Schedulable',
  version: '1.0.0',
  methods: [
    { name: 'schedule', signature: '(event: E, at: Tick) => void' },
    { name: 'unschedule', signature: '(eventId: string) => void' },
    { name: 'getScheduled', signature: '() => readonly E[]' },
  ],
  check: (value): value is Schedulable<unknown> => {
    return (
      typeof value === 'object' &&
      value !== null &&
      'schedule' in value &&
      'unschedule' in value &&
      'getScheduled' in value
    );
  },
});

/**
 * Renderable protocol - can render to output.
 */
export interface Renderable<E> {
  render(events: readonly E[]): unknown;
  clear(): void;
}

export const RenderableProtocol = createProtocol<Renderable<unknown>>({
  id: 'renderable',
  name: 'Renderable',
  version: '1.0.0',
  methods: [
    { name: 'render', signature: '(events: readonly E[]) => unknown' },
    { name: 'clear', signature: '() => void' },
  ],
  check: (value): value is Renderable<unknown> => {
    return (
      typeof value === 'object' &&
      value !== null &&
      'render' in value &&
      'clear' in value
    );
  },
});

/**
 * Automatable protocol - supports automation.
 */
export interface Automatable<T> {
  getAutomationValue(param: string, at: Tick): T;
  setAutomationPoint(param: string, value: T, at: Tick): void;
  getAutomationParams(): readonly string[];
}

export const AutomatableProtocol = createProtocol<Automatable<unknown>>({
  id: 'automatable',
  name: 'Automatable',
  version: '1.0.0',
  methods: [
    { name: 'getAutomationValue', signature: '(param: string, at: Tick) => T' },
    { name: 'setAutomationPoint', signature: '(param: string, value: T, at: Tick) => void' },
    { name: 'getAutomationParams', signature: '() => readonly string[]' },
  ],
  check: (value): value is Automatable<unknown> => {
    return (
      typeof value === 'object' &&
      value !== null &&
      'getAutomationValue' in value &&
      'setAutomationPoint' in value &&
      'getAutomationParams' in value
    );
  },
});

/**
 * Notatable protocol - has musical notation.
 */
export interface Notatable<P> {
  toNotation(): string;
  fromNotation(notation: string): P;
  getNotationHints(): readonly string[];
}

export const NotatableProtocol = createProtocol<Notatable<unknown>>({
  id: 'notatable',
  name: 'Notatable',
  version: '1.0.0',
  methods: [
    { name: 'toNotation', signature: '() => string' },
    { name: 'fromNotation', signature: '(notation: string) => P' },
    { name: 'getNotationHints', signature: '() => readonly string[]' },
  ],
  check: (value): value is Notatable<unknown> => {
    return (
      typeof value === 'object' &&
      value !== null &&
      'toNotation' in value &&
      'fromNotation' in value
    );
  },
});

/**
 * Constrainable protocol - supports constraints.
 */
export interface Constrainable<E, C> {
  validate(event: E, context: C): boolean;
  suggest(context: C): readonly E[];
  transform(event: E, context: C): E;
}

export const ConstrainableProtocol = createProtocol<Constrainable<unknown, unknown>>({
  id: 'constrainable',
  name: 'Constrainable',
  version: '1.0.0',
  methods: [
    { name: 'validate', signature: '(event: E, context: C) => boolean' },
    { name: 'suggest', signature: '(context: C) => readonly E[]' },
    { name: 'transform', signature: '(event: E, context: C) => E' },
  ],
  check: (value): value is Constrainable<unknown, unknown> => {
    return (
      typeof value === 'object' &&
      value !== null &&
      'validate' in value &&
      'suggest' in value &&
      'transform' in value
    );
  },
});

/**
 * Transformable protocol - can be transformed.
 */
export interface Transformable<E> {
  map<F>(fn: (event: E) => F): Transformable<F>;
  filter(predicate: (event: E) => boolean): Transformable<E>;
  flatMap<F>(fn: (event: E) => readonly F[]): Transformable<F>;
}

export const TransformableProtocol = createProtocol<Transformable<unknown>>({
  id: 'transformable',
  name: 'Transformable',
  version: '1.0.0',
  methods: [
    { name: 'map', signature: '<F>(fn: (event: E) => F) => Transformable<F>' },
    { name: 'filter', signature: '(predicate: (event: E) => boolean) => Transformable<E>' },
    { name: 'flatMap', signature: '<F>(fn: (event: E) => readonly F[]) => Transformable<F>' },
  ],
  check: (value): value is Transformable<unknown> => {
    return (
      typeof value === 'object' &&
      value !== null &&
      'map' in value &&
      'filter' in value &&
      'flatMap' in value
    );
  },
});

/**
 * Serializable protocol - can be serialized.
 */
export interface Serializable<T> {
  toJSON(): unknown;
  fromJSON(json: unknown): T;
}

export const SerializableProtocol = createProtocol<Serializable<unknown>>({
  id: 'serializable',
  name: 'Serializable',
  version: '1.0.0',
  methods: [
    { name: 'toJSON', signature: '() => unknown' },
    { name: 'fromJSON', signature: '(json: unknown) => T' },
  ],
  check: (value): value is Serializable<unknown> => {
    return (
      typeof value === 'object' &&
      value !== null &&
      'toJSON' in value &&
      'fromJSON' in value
    );
  },
});

/**
 * Diffable protocol - can compute differences.
 */
export interface Diffable<T> {
  diff(other: T): unknown;
  patch(diff: unknown): T;
}

export const DiffableProtocol = createProtocol<Diffable<unknown>>({
  id: 'diffable',
  name: 'Diffable',
  version: '1.0.0',
  methods: [
    { name: 'diff', signature: '(other: T) => unknown' },
    { name: 'patch', signature: '(diff: unknown) => T' },
  ],
  check: (value): value is Diffable<unknown> => {
    return (
      typeof value === 'object' &&
      value !== null &&
      'diff' in value &&
      'patch' in value
    );
  },
});

/**
 * Patchable protocol - supports edits.
 */
export interface Patchable<S> {
  applyPatch(patch: Partial<S>): S;
  getPatch(): Partial<S>;
}

export const PatchableProtocol = createProtocol<Patchable<unknown>>({
  id: 'patchable',
  name: 'Patchable',
  version: '1.0.0',
  methods: [
    { name: 'applyPatch', signature: '(patch: Partial<S>) => S' },
    { name: 'getPatch', signature: '() => Partial<S>' },
  ],
  check: (value): value is Patchable<unknown> => {
    return (
      typeof value === 'object' &&
      value !== null &&
      'applyPatch' in value &&
      'getPatch' in value
    );
  },
});

/**
 * Contractable protocol - has behavior contracts.
 */
export interface Contractable {
  getContracts(): readonly Contract[];
  checkContract(name: string): boolean;
}

export interface Contract {
  readonly name: string;
  readonly description: string;
  readonly check: () => boolean;
}

export const ContractableProtocol = createProtocol<Contractable>({
  id: 'contractable',
  name: 'Contractable',
  version: '1.0.0',
  methods: [
    { name: 'getContracts', signature: '() => readonly Contract[]' },
    { name: 'checkContract', signature: '(name: string) => boolean' },
  ],
  check: (value): value is Contractable => {
    return (
      typeof value === 'object' &&
      value !== null &&
      'getContracts' in value &&
      'checkContract' in value
    );
  },
});

/**
 * Auditable protocol - supports logging.
 */
export interface Auditable<A> {
  getAuditLog(): readonly AuditEntry<A>[];
  clearAuditLog(): void;
  onAudit(callback: (entry: AuditEntry<A>) => void): () => void;
}

export interface AuditEntry<A> {
  readonly timestamp: number;
  readonly action: string;
  readonly data: A;
}

export const AuditableProtocol = createProtocol<Auditable<unknown>>({
  id: 'auditable',
  name: 'Auditable',
  version: '1.0.0',
  methods: [
    { name: 'getAuditLog', signature: '() => readonly AuditEntry<A>[]' },
    { name: 'clearAuditLog', signature: '() => void' },
    { name: 'onAudit', signature: '(callback: (entry: AuditEntry<A>) => void) => () => void' },
  ],
  check: (value): value is Auditable<unknown> => {
    return (
      typeof value === 'object' &&
      value !== null &&
      'getAuditLog' in value &&
      'clearAuditLog' in value &&
      'onAudit' in value
    );
  },
});

// ============================================================================
// PORT COMPATIBILITY PROTOCOL (Change 212)
// ============================================================================

/**
 * Change 212: Port compatibility/protocol negotiation.
 *
 * Cards that implement this protocol declare which port types they
 * support and can negotiate compatible connections at runtime.
 */
export interface PortCompatible {
  /** Get supported port types for inputs */
  getSupportedInputTypes(): readonly string[];
  /** Get supported port types for outputs */
  getSupportedOutputTypes(): readonly string[];
  /** Check if this card can connect to another via ports */
  canConnectTo(targetPortType: string, sourcePortType: string): boolean;
}

export const PortCompatibleProtocol = createProtocol<PortCompatible>({
  id: 'port-compatible',
  name: 'PortCompatible',
  version: '1.0.0',
  methods: [
    { name: 'getSupportedInputTypes', signature: '() => readonly string[]' },
    { name: 'getSupportedOutputTypes', signature: '() => readonly string[]' },
    { name: 'canConnectTo', signature: '(targetPortType: string, sourcePortType: string) => boolean' },
  ],
  check: (value): value is PortCompatible => {
    return (
      typeof value === 'object' &&
      value !== null &&
      'getSupportedInputTypes' in value &&
      'getSupportedOutputTypes' in value &&
      'canConnectTo' in value
    );
  },
});

// ============================================================================
// PROTOCOL UTILITIES
// ============================================================================

/**
 * Checks if a type implements a protocol.
 */
export function implementsProtocol<T>(
  value: unknown,
  protocol: Protocol<T>
): value is T {
  return protocol.check(value);
}

/**
 * Gets protocol methods from a type.
 */
export function getProtocolMethods(
  protocol: Protocol<unknown>
): readonly ProtocolMethod[] {
  return protocol.methods;
}

/**
 * Creates a wrapper that adds protocol methods.
 */
export function protocolAdapter<T, P>(
  value: T,
  _protocol: Protocol<P>,
  adapter: Partial<P>
): T & Partial<P> {
  return Object.assign({}, value, adapter);
}

/**
 * Composes two protocols.
 */
export function composeProtocols<A, B>(
  p1: Protocol<A>,
  p2: Protocol<B>
): Protocol<A & B> {
  return createProtocol<A & B>({
    id: `${p1.id}+${p2.id}`,
    name: `${p1.name} & ${p2.name}`,
    version: '1.0.0',
    methods: [...p1.methods, ...p2.methods],
    check: (value): value is A & B => p1.check(value) && p2.check(value),
  });
}

/**
 * Protocol version info.
 */
export interface ProtocolVersionInfo {
  readonly current: string;
  readonly compatible: readonly string[];
}

/**
 * Checks protocol version compatibility.
 */
export function isProtocolVersionCompatible(
  protocol: Protocol<unknown>,
  requiredVersion: string
): boolean {
  const [major1, minor1] = protocol.version.split('.').map(Number);
  const [major2, minor2] = requiredVersion.split('.').map(Number);
  
  // Same major version, current minor >= required
  return major1 === major2 && (minor1 ?? 0) >= (minor2 ?? 0);
}

/**
 * Generates documentation for a protocol.
 */
export function generateProtocolDocs(protocol: Protocol<unknown>): string {
  const lines: string[] = [];
  
  lines.push(`# ${protocol.name} Protocol`);
  lines.push('');
  lines.push(`**ID:** \`${protocol.id}\``);
  lines.push(`**Version:** ${protocol.version}`);
  lines.push('');
  lines.push('## Methods');
  lines.push('');
  
  for (const method of protocol.methods) {
    const optional = method.optional ? ' (optional)' : '';
    lines.push(`### \`${method.name}\`${optional}`);
    lines.push('');
    lines.push('```typescript');
    lines.push(method.signature);
    lines.push('```');
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Registers all built-in protocols.
 */
export function registerBuiltInProtocols(): void {
  const registry = getProtocolRegistry();
  registry.register(SchedulableProtocol);
  registry.register(RenderableProtocol);
  registry.register(AutomatableProtocol);
  registry.register(NotatableProtocol);
  registry.register(ConstrainableProtocol);
  registry.register(TransformableProtocol);
  registry.register(SerializableProtocol);
  registry.register(DiffableProtocol);
  registry.register(PatchableProtocol);
  registry.register(ContractableProtocol);
  registry.register(AuditableProtocol);
  registry.register(PortCompatibleProtocol);
}
