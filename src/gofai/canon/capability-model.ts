/**
 * GOFAI Capability Model
 *
 * Defines what can be edited (events vs routing vs DSP) depending on board policy.
 * This is the SSOT for determining which operations are allowed in different contexts.
 *
 * Aligned with CardPlay's board system and effect taxonomy.
 *
 * @module gofai/canon/capability-model
 */

// Future imports when these modules are ready:
// import type { BoardId } from '../../canon/board-id';
// For now, use string
type BoardId = string;

// =============================================================================
// Core Capability Types
// =============================================================================

/**
 * Fundamental capability categories.
 *
 * These map to different layers of the CardPlay architecture.
 */
export enum CapabilityCategory {
  /** Event-level edits (notes, timing, velocity) */
  Events = 'events',

  /** Routing graph edits (connections, adapters) */
  Routing = 'routing',

  /** DSP parameter edits (card params) */
  DSP = 'dsp',

  /** Container structure edits (tracks, sections, markers) */
  Structure = 'structure',

  /** Production layer edits (cards, decks) */
  Production = 'production',

  /** AI/automation features */
  AI = 'ai',

  /** Metadata edits (names, colors, tags) */
  Metadata = 'metadata',

  /** Project-level settings */
  Project = 'project',
}

/**
 * Granular capability identifiers.
 *
 * These are stable IDs for specific editing capabilities.
 */
export type CapabilityId =
  // Event editing
  | 'event:create'
  | 'event:delete'
  | 'event:move'
  | 'event:transform-pitch'
  | 'event:transform-time'
  | 'event:transform-velocity'
  | 'event:transform-duration'
  | 'event:quantize'
  | 'event:humanize'
  // Routing editing
  | 'routing:connect'
  | 'routing:disconnect'
  | 'routing:reorder'
  | 'routing:add-adapter'
  | 'routing:remove-adapter'
  // DSP editing
  | 'dsp:set-param'
  | 'dsp:automate-param'
  | 'dsp:clear-automation'
  // Structure editing
  | 'structure:add-track'
  | 'structure:remove-track'
  | 'structure:move-track'
  | 'structure:add-section'
  | 'structure:remove-section'
  | 'structure:move-section'
  | 'structure:add-marker'
  | 'structure:remove-marker'
  // Production editing
  | 'production:add-card'
  | 'production:remove-card'
  | 'production:move-card'
  | 'production:replace-card'
  | 'production:add-deck'
  | 'production:remove-deck'
  | 'production:configure-deck'
  // AI/automation
  | 'ai:suggest'
  | 'ai:analyze'
  | 'ai:generate'
  | 'ai:auto-apply'
  // Metadata
  | 'metadata:rename'
  | 'metadata:recolor'
  | 'metadata:retag'
  | 'metadata:annotate'
  // Project
  | 'project:set-tempo'
  | 'project:set-key'
  | 'project:set-time-signature'
  | 'project:set-arrangement';

/**
 * Capability permission level.
 */
export enum CapabilityPermission {
  /** Not allowed at all */
  Forbidden = 'forbidden',

  /** Allowed but requires explicit confirmation */
  RequiresConfirmation = 'requires-confirmation',

  /** Allowed with preview required */
  RequiresPreview = 'requires-preview',

  /** Fully allowed */
  Allowed = 'allowed',
}

/**
 * Capability definition.
 */
export interface Capability {
  /** Stable capability ID */
  readonly id: CapabilityId;

  /** Category this capability belongs to */
  readonly category: CapabilityCategory;

  /** Human-readable name */
  readonly name: string;

  /** Description of what this capability allows */
  readonly description: string;

  /** Default permission level */
  readonly defaultPermission: CapabilityPermission;

  /** Dependencies (other capabilities that must also be allowed) */
  readonly requires?: readonly CapabilityId[];

  /** Conflicts (capabilities that cannot be allowed simultaneously) */
  readonly conflicts?: readonly CapabilityId[];

  /** Risk level (for UI warnings) */
  readonly riskLevel: 'low' | 'medium' | 'high';

  /**
   * Whether this capability can be destructive (data loss possible).
   * Used to enforce extra confirmation steps.
   */
  readonly canBeDestructive: boolean;

  /**
   * Whether this capability requires undo support.
   * All destructive capabilities must support undo.
   */
  readonly requiresUndo: boolean;
}

// =============================================================================
// Capability Registry
// =============================================================================

/**
 * Complete registry of all GOFAI capabilities.
 *
 * This is the SSOT for what operations exist and their properties.
 */
export const CAPABILITY_REGISTRY: ReadonlyMap<CapabilityId, Capability> =
  new Map([
    // =========================================================================
    // Event Editing Capabilities
    // =========================================================================
    [
      'event:create',
      {
        id: 'event:create',
        category: CapabilityCategory.Events,
        name: 'Create Events',
        description: 'Add new musical events (notes, control changes)',
        defaultPermission: CapabilityPermission.Allowed,
        riskLevel: 'low',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],
    [
      'event:delete',
      {
        id: 'event:delete',
        category: CapabilityCategory.Events,
        name: 'Delete Events',
        description: 'Remove existing musical events',
        defaultPermission: CapabilityPermission.RequiresPreview,
        riskLevel: 'high',
        canBeDestructive: true,
        requiresUndo: true,
      },
    ],
    [
      'event:move',
      {
        id: 'event:move',
        category: CapabilityCategory.Events,
        name: 'Move Events',
        description: 'Change timing of existing events',
        defaultPermission: CapabilityPermission.Allowed,
        riskLevel: 'low',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],
    [
      'event:transform-pitch',
      {
        id: 'event:transform-pitch',
        category: CapabilityCategory.Events,
        name: 'Transform Pitch',
        description: 'Change pitch of existing events',
        defaultPermission: CapabilityPermission.Allowed,
        riskLevel: 'medium',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],
    [
      'event:transform-time',
      {
        id: 'event:transform-time',
        category: CapabilityCategory.Events,
        name: 'Transform Timing',
        description: 'Apply timing transformations (swing, humanize, quantize)',
        defaultPermission: CapabilityPermission.Allowed,
        riskLevel: 'low',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],
    [
      'event:transform-velocity',
      {
        id: 'event:transform-velocity',
        category: CapabilityCategory.Events,
        name: 'Transform Velocity',
        description: 'Change velocity/dynamics of existing events',
        defaultPermission: CapabilityPermission.Allowed,
        riskLevel: 'low',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],
    [
      'event:transform-duration',
      {
        id: 'event:transform-duration',
        category: CapabilityCategory.Events,
        name: 'Transform Duration',
        description: 'Change duration of existing events',
        defaultPermission: CapabilityPermission.Allowed,
        riskLevel: 'low',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],
    [
      'event:quantize',
      {
        id: 'event:quantize',
        category: CapabilityCategory.Events,
        name: 'Quantize',
        description: 'Snap events to grid',
        defaultPermission: CapabilityPermission.Allowed,
        requires: ['event:transform-time'],
        riskLevel: 'low',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],
    [
      'event:humanize',
      {
        id: 'event:humanize',
        category: CapabilityCategory.Events,
        name: 'Humanize',
        description: 'Add natural timing and velocity variations',
        defaultPermission: CapabilityPermission.Allowed,
        requires: ['event:transform-time', 'event:transform-velocity'],
        riskLevel: 'low',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],

    // =========================================================================
    // Routing Editing Capabilities
    // =========================================================================
    [
      'routing:connect',
      {
        id: 'routing:connect',
        category: CapabilityCategory.Routing,
        name: 'Create Connections',
        description: 'Connect cards in the routing graph',
        defaultPermission: CapabilityPermission.RequiresPreview,
        riskLevel: 'medium',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],
    [
      'routing:disconnect',
      {
        id: 'routing:disconnect',
        category: CapabilityCategory.Routing,
        name: 'Remove Connections',
        description: 'Disconnect cards in the routing graph',
        defaultPermission: CapabilityPermission.RequiresConfirmation,
        riskLevel: 'high',
        canBeDestructive: true,
        requiresUndo: true,
      },
    ],
    [
      'routing:reorder',
      {
        id: 'routing:reorder',
        category: CapabilityCategory.Routing,
        name: 'Reorder Routing',
        description: 'Change order of processing in routing graph',
        defaultPermission: CapabilityPermission.RequiresPreview,
        riskLevel: 'medium',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],
    [
      'routing:add-adapter',
      {
        id: 'routing:add-adapter',
        category: CapabilityCategory.Routing,
        name: 'Add Adapters',
        description: 'Insert adapters for port type conversion',
        defaultPermission: CapabilityPermission.RequiresPreview,
        requires: ['routing:connect'],
        riskLevel: 'low',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],
    [
      'routing:remove-adapter',
      {
        id: 'routing:remove-adapter',
        category: CapabilityCategory.Routing,
        name: 'Remove Adapters',
        description: 'Remove adapters from routing graph',
        defaultPermission: CapabilityPermission.RequiresPreview,
        riskLevel: 'medium',
        canBeDestructive: true,
        requiresUndo: true,
      },
    ],

    // =========================================================================
    // DSP Editing Capabilities
    // =========================================================================
    [
      'dsp:set-param',
      {
        id: 'dsp:set-param',
        category: CapabilityCategory.DSP,
        name: 'Set Parameters',
        description: 'Change DSP card parameters',
        defaultPermission: CapabilityPermission.Allowed,
        riskLevel: 'low',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],
    [
      'dsp:automate-param',
      {
        id: 'dsp:automate-param',
        category: CapabilityCategory.DSP,
        name: 'Automate Parameters',
        description: 'Create parameter automation',
        defaultPermission: CapabilityPermission.Allowed,
        requires: ['dsp:set-param'],
        riskLevel: 'low',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],
    [
      'dsp:clear-automation',
      {
        id: 'dsp:clear-automation',
        category: CapabilityCategory.DSP,
        name: 'Clear Automation',
        description: 'Remove parameter automation',
        defaultPermission: CapabilityPermission.RequiresPreview,
        riskLevel: 'medium',
        canBeDestructive: true,
        requiresUndo: true,
      },
    ],

    // =========================================================================
    // Structure Editing Capabilities
    // =========================================================================
    [
      'structure:add-track',
      {
        id: 'structure:add-track',
        category: CapabilityCategory.Structure,
        name: 'Add Tracks',
        description: 'Create new tracks',
        defaultPermission: CapabilityPermission.RequiresPreview,
        riskLevel: 'low',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],
    [
      'structure:remove-track',
      {
        id: 'structure:remove-track',
        category: CapabilityCategory.Structure,
        name: 'Remove Tracks',
        description: 'Delete existing tracks',
        defaultPermission: CapabilityPermission.RequiresConfirmation,
        riskLevel: 'high',
        canBeDestructive: true,
        requiresUndo: true,
      },
    ],
    [
      'structure:move-track',
      {
        id: 'structure:move-track',
        category: CapabilityCategory.Structure,
        name: 'Move Tracks',
        description: 'Reorder tracks',
        defaultPermission: CapabilityPermission.Allowed,
        riskLevel: 'low',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],
    [
      'structure:add-section',
      {
        id: 'structure:add-section',
        category: CapabilityCategory.Structure,
        name: 'Add Sections',
        description: 'Create new section markers',
        defaultPermission: CapabilityPermission.Allowed,
        riskLevel: 'low',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],
    [
      'structure:remove-section',
      {
        id: 'structure:remove-section',
        category: CapabilityCategory.Structure,
        name: 'Remove Sections',
        description: 'Delete section markers',
        defaultPermission: CapabilityPermission.RequiresPreview,
        riskLevel: 'medium',
        canBeDestructive: true,
        requiresUndo: true,
      },
    ],
    [
      'structure:move-section',
      {
        id: 'structure:move-section',
        category: CapabilityCategory.Structure,
        name: 'Move Sections',
        description: 'Reposition section markers',
        defaultPermission: CapabilityPermission.Allowed,
        riskLevel: 'low',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],
    [
      'structure:add-marker',
      {
        id: 'structure:add-marker',
        category: CapabilityCategory.Structure,
        name: 'Add Markers',
        description: 'Create new time markers',
        defaultPermission: CapabilityPermission.Allowed,
        riskLevel: 'low',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],
    [
      'structure:remove-marker',
      {
        id: 'structure:remove-marker',
        category: CapabilityCategory.Structure,
        name: 'Remove Markers',
        description: 'Delete time markers',
        defaultPermission: CapabilityPermission.Allowed,
        riskLevel: 'low',
        canBeDestructive: true,
        requiresUndo: true,
      },
    ],

    // =========================================================================
    // Production Editing Capabilities
    // =========================================================================
    [
      'production:add-card',
      {
        id: 'production:add-card',
        category: CapabilityCategory.Production,
        name: 'Add Cards',
        description: 'Insert new cards into the project',
        defaultPermission: CapabilityPermission.RequiresPreview,
        riskLevel: 'low',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],
    [
      'production:remove-card',
      {
        id: 'production:remove-card',
        category: CapabilityCategory.Production,
        name: 'Remove Cards',
        description: 'Delete cards from the project',
        defaultPermission: CapabilityPermission.RequiresConfirmation,
        riskLevel: 'high',
        canBeDestructive: true,
        requiresUndo: true,
      },
    ],
    [
      'production:move-card',
      {
        id: 'production:move-card',
        category: CapabilityCategory.Production,
        name: 'Move Cards',
        description: 'Reposition cards in routing graph',
        defaultPermission: CapabilityPermission.RequiresPreview,
        riskLevel: 'medium',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],
    [
      'production:replace-card',
      {
        id: 'production:replace-card',
        category: CapabilityCategory.Production,
        name: 'Replace Cards',
        description: 'Swap one card for another',
        defaultPermission: CapabilityPermission.RequiresConfirmation,
        riskLevel: 'high',
        canBeDestructive: true,
        requiresUndo: true,
      },
    ],
    [
      'production:add-deck',
      {
        id: 'production:add-deck',
        category: CapabilityCategory.Production,
        name: 'Add Decks',
        description: 'Create new decks',
        defaultPermission: CapabilityPermission.RequiresPreview,
        riskLevel: 'low',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],
    [
      'production:remove-deck',
      {
        id: 'production:remove-deck',
        category: CapabilityCategory.Production,
        name: 'Remove Decks',
        description: 'Delete existing decks',
        defaultPermission: CapabilityPermission.RequiresConfirmation,
        riskLevel: 'medium',
        canBeDestructive: true,
        requiresUndo: true,
      },
    ],
    [
      'production:configure-deck',
      {
        id: 'production:configure-deck',
        category: CapabilityCategory.Production,
        name: 'Configure Decks',
        description: 'Change deck settings and layout',
        defaultPermission: CapabilityPermission.Allowed,
        riskLevel: 'low',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],

    // =========================================================================
    // AI/Automation Capabilities
    // =========================================================================
    [
      'ai:suggest',
      {
        id: 'ai:suggest',
        category: CapabilityCategory.AI,
        name: 'AI Suggestions',
        description: 'Generate suggestions without applying them',
        defaultPermission: CapabilityPermission.Allowed,
        riskLevel: 'low',
        canBeDestructive: false,
        requiresUndo: false,
      },
    ],
    [
      'ai:analyze',
      {
        id: 'ai:analyze',
        category: CapabilityCategory.AI,
        name: 'AI Analysis',
        description: 'Analyze project state',
        defaultPermission: CapabilityPermission.Allowed,
        riskLevel: 'low',
        canBeDestructive: false,
        requiresUndo: false,
      },
    ],
    [
      'ai:generate',
      {
        id: 'ai:generate',
        category: CapabilityCategory.AI,
        name: 'AI Generation',
        description: 'Generate new musical content',
        defaultPermission: CapabilityPermission.RequiresPreview,
        requires: ['event:create'],
        riskLevel: 'medium',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],
    [
      'ai:auto-apply',
      {
        id: 'ai:auto-apply',
        category: CapabilityCategory.AI,
        name: 'AI Auto-Apply',
        description: 'Apply AI suggestions without explicit confirmation',
        defaultPermission: CapabilityPermission.Forbidden,
        riskLevel: 'high',
        canBeDestructive: true,
        requiresUndo: true,
      },
    ],

    // =========================================================================
    // Metadata Editing Capabilities
    // =========================================================================
    [
      'metadata:rename',
      {
        id: 'metadata:rename',
        category: CapabilityCategory.Metadata,
        name: 'Rename',
        description: 'Change names of tracks, sections, etc.',
        defaultPermission: CapabilityPermission.Allowed,
        riskLevel: 'low',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],
    [
      'metadata:recolor',
      {
        id: 'metadata:recolor',
        category: CapabilityCategory.Metadata,
        name: 'Recolor',
        description: 'Change colors of tracks, sections, etc.',
        defaultPermission: CapabilityPermission.Allowed,
        riskLevel: 'low',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],
    [
      'metadata:retag',
      {
        id: 'metadata:retag',
        category: CapabilityCategory.Metadata,
        name: 'Retag',
        description: 'Change tags on tracks, sections, etc.',
        defaultPermission: CapabilityPermission.Allowed,
        riskLevel: 'low',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],
    [
      'metadata:annotate',
      {
        id: 'metadata:annotate',
        category: CapabilityCategory.Metadata,
        name: 'Annotate',
        description: 'Add notes and comments',
        defaultPermission: CapabilityPermission.Allowed,
        riskLevel: 'low',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],

    // =========================================================================
    // Project-Level Capabilities
    // =========================================================================
    [
      'project:set-tempo',
      {
        id: 'project:set-tempo',
        category: CapabilityCategory.Project,
        name: 'Set Tempo',
        description: 'Change project tempo',
        defaultPermission: CapabilityPermission.RequiresPreview,
        riskLevel: 'medium',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],
    [
      'project:set-key',
      {
        id: 'project:set-key',
        category: CapabilityCategory.Project,
        name: 'Set Key',
        description: 'Change project key signature',
        defaultPermission: CapabilityPermission.RequiresPreview,
        riskLevel: 'medium',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],
    [
      'project:set-time-signature',
      {
        id: 'project:set-time-signature',
        category: CapabilityCategory.Project,
        name: 'Set Time Signature',
        description: 'Change project time signature',
        defaultPermission: CapabilityPermission.RequiresPreview,
        riskLevel: 'medium',
        canBeDestructive: false,
        requiresUndo: true,
      },
    ],
    [
      'project:set-arrangement',
      {
        id: 'project:set-arrangement',
        category: CapabilityCategory.Project,
        name: 'Set Arrangement',
        description: 'Change overall project arrangement',
        defaultPermission: CapabilityPermission.RequiresConfirmation,
        riskLevel: 'high',
        canBeDestructive: true,
        requiresUndo: true,
      },
    ],
  ]);

// =============================================================================
// Capability Profiles
// =============================================================================

/**
 * Capability profile for a board or context.
 *
 * Defines which capabilities are allowed and their permission levels.
 */
export interface CapabilityProfile {
  /** Profile name */
  readonly name: string;

  /** Description */
  readonly description: string;

  /**
   * Permission overrides.
   * Capabilities not listed use their default permission.
   */
  readonly permissions: ReadonlyMap<CapabilityId, CapabilityPermission>;

  /** Categories that are completely disabled */
  readonly disabledCategories?: readonly CapabilityCategory[];
}

/**
 * Predefined capability profiles for different board types.
 */
export const CAPABILITY_PROFILES: ReadonlyMap<string, CapabilityProfile> =
  new Map([
    [
      'full-manual',
      {
        name: 'Full Manual',
        description:
          'Manual board with no AI assistance - all edits require explicit confirmation',
        permissions: new Map([
          // Forbid all AI capabilities
          ['ai:suggest', CapabilityPermission.Forbidden],
          ['ai:analyze', CapabilityPermission.Forbidden],
          ['ai:generate', CapabilityPermission.Forbidden],
          ['ai:auto-apply', CapabilityPermission.Forbidden],
          // Require confirmation for destructive edits
          ['event:delete', CapabilityPermission.RequiresConfirmation],
          ['structure:remove-track', CapabilityPermission.RequiresConfirmation],
          ['production:remove-card', CapabilityPermission.RequiresConfirmation],
          ['routing:disconnect', CapabilityPermission.RequiresConfirmation],
        ]),
        disabledCategories: [CapabilityCategory.AI],
      },
    ],
    [
      'assisted',
      {
        name: 'Assisted',
        description:
          'AI-assisted board with preview and confirmation for major changes',
        permissions: new Map([
          // Allow AI suggestions and analysis
          ['ai:suggest', CapabilityPermission.Allowed],
          ['ai:analyze', CapabilityPermission.Allowed],
          // Require preview for AI generation
          ['ai:generate', CapabilityPermission.RequiresPreview],
          // Forbid auto-apply
          ['ai:auto-apply', CapabilityPermission.Forbidden],
          // Preview for production changes
          ['production:add-card', CapabilityPermission.RequiresPreview],
          ['production:remove-card', CapabilityPermission.RequiresConfirmation],
        ]),
      },
    ],
    [
      'ai-copilot',
      {
        name: 'AI Copilot',
        description:
          'Full AI assistance with safety guardrails - preview by default',
        permissions: new Map([
          // All AI capabilities allowed
          ['ai:suggest', CapabilityPermission.Allowed],
          ['ai:analyze', CapabilityPermission.Allowed],
          ['ai:generate', CapabilityPermission.RequiresPreview],
          // Auto-apply allowed with preview
          ['ai:auto-apply', CapabilityPermission.RequiresPreview],
          // Most edits require preview
          ['event:delete', CapabilityPermission.RequiresPreview],
          ['structure:remove-track', CapabilityPermission.RequiresPreview],
          ['production:remove-card', CapabilityPermission.RequiresPreview],
        ]),
      },
    ],
    [
      'read-only',
      {
        name: 'Read-Only',
        description:
          'No editing allowed - only inspection and analysis capabilities',
        permissions: new Map([
          // Allow only non-destructive AI capabilities
          ['ai:suggest', CapabilityPermission.Allowed],
          ['ai:analyze', CapabilityPermission.Allowed],
          ['ai:generate', CapabilityPermission.Forbidden],
          ['ai:auto-apply', CapabilityPermission.Forbidden],
          // Forbid all editing
          ...Array.from(CAPABILITY_REGISTRY.keys())
            .filter(
              id =>
                !id.startsWith('ai:') ||
                (id !== 'ai:suggest' && id !== 'ai:analyze')
            )
            .map(
              id =>
                [id, CapabilityPermission.Forbidden] as [
                  CapabilityId,
                  CapabilityPermission,
                ]
            ),
        ]),
      },
    ],
  ]);

// =============================================================================
// Capability Checking
// =============================================================================

/**
 * Check if a capability is allowed given a profile and context.
 */
export function isCapabilityAllowed(
  capabilityId: CapabilityId,
  profile: CapabilityProfile
): boolean {
  const capability = CAPABILITY_REGISTRY.get(capabilityId);
  if (!capability) return false;

  // Check if category is disabled
  if (profile.disabledCategories?.includes(capability.category)) {
    return false;
  }

  // Get permission (use override if present, otherwise default)
  const permission =
    profile.permissions.get(capabilityId) ?? capability.defaultPermission;

  return permission !== CapabilityPermission.Forbidden;
}

/**
 * Get the permission level for a capability.
 */
export function getCapabilityPermission(
  capabilityId: CapabilityId,
  profile: CapabilityProfile
): CapabilityPermission {
  const capability = CAPABILITY_REGISTRY.get(capabilityId);
  if (!capability) return CapabilityPermission.Forbidden;

  // Check if category is disabled
  if (profile.disabledCategories?.includes(capability.category)) {
    return CapabilityPermission.Forbidden;
  }

  // Get permission (use override if present, otherwise default)
  return (
    profile.permissions.get(capabilityId) ?? capability.defaultPermission
  );
}

/**
 * Check if all required capabilities are satisfied.
 */
export function checkCapabilityDependencies(
  capabilityId: CapabilityId,
  profile: CapabilityProfile
): { satisfied: boolean; missing: CapabilityId[] } {
  const capability = CAPABILITY_REGISTRY.get(capabilityId);
  if (!capability || !capability.requires) {
    return { satisfied: true, missing: [] };
  }

  const missing: CapabilityId[] = [];
  for (const required of capability.requires) {
    if (!isCapabilityAllowed(required, profile)) {
      missing.push(required);
    }
  }

  return {
    satisfied: missing.length === 0,
    missing,
  };
}

/**
 * Check if capabilities conflict.
 */
export function checkCapabilityConflicts(
  capabilityIds: readonly CapabilityId[]
): { hasConflicts: boolean; conflicts: Array<[CapabilityId, CapabilityId]> } {
  const conflicts: Array<[CapabilityId, CapabilityId]> = [];

  for (const id1 of capabilityIds) {
    const capability1 = CAPABILITY_REGISTRY.get(id1);
    if (!capability1?.conflicts) continue;

    for (const id2 of capabilityIds) {
      if (id1 === id2) continue;
      if (capability1.conflicts.includes(id2)) {
        conflicts.push([id1, id2]);
      }
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
}

/**
 * Get all capabilities for a category.
 */
export function getCapabilitiesByCategory(
  category: CapabilityCategory
): Capability[] {
  return Array.from(CAPABILITY_REGISTRY.values()).filter(
    cap => cap.category === category
  );
}

/**
 * Get capabilities by risk level.
 */
export function getCapabilitiesByRiskLevel(
  riskLevel: 'low' | 'medium' | 'high'
): Capability[] {
  return Array.from(CAPABILITY_REGISTRY.values()).filter(
    cap => cap.riskLevel === riskLevel
  );
}

// =============================================================================
// Board-Specific Capability Resolution
// =============================================================================

/**
 * Resolve capability profile for a board.
 *
 * In the future, this will query the board registry.
 * For now, it returns based on board ID patterns.
 */
export function resolveCapabilityProfile(
  boardId: BoardId | string
): CapabilityProfile {
  const id: string = boardId;

  // Pattern matching on board IDs
  if (id.includes('manual')) {
    return CAPABILITY_PROFILES.get('full-manual')!;
  }
  if (id.includes('ai') || id.includes('copilot')) {
    return CAPABILITY_PROFILES.get('ai-copilot')!;
  }
  if (id.includes('assisted')) {
    return CAPABILITY_PROFILES.get('assisted')!;
  }
  if (id.includes('readonly') || id.includes('read-only')) {
    return CAPABILITY_PROFILES.get('read-only')!;
  }

  // Default to assisted
  return CAPABILITY_PROFILES.get('assisted')!;
}

/**
 * Create a custom capability profile.
 */
export function createCapabilityProfile(
  name: string,
  description: string,
  baseProfile: CapabilityProfile,
  overrides: ReadonlyMap<CapabilityId, CapabilityPermission>
): CapabilityProfile {
  const mergedPermissions = new Map([
    ...baseProfile.permissions,
    ...overrides,
  ]);

  const result: CapabilityProfile = {
    name,
    description,
    permissions: mergedPermissions,
  };
  
  if (baseProfile.disabledCategories) {
    return { ...result, disabledCategories: baseProfile.disabledCategories };
  }
  
  return result;
}

// =============================================================================
// Capability Reporting
// =============================================================================

/**
 * Generate a capability report for a profile.
 */
export interface CapabilityReport {
  readonly profileName: string;
  readonly totalCapabilities: number;
  readonly allowedCapabilities: number;
  readonly forbiddenCapabilities: number;
  readonly requiresConfirmation: number;
  readonly requiresPreview: number;
  readonly byCategory: ReadonlyMap<
    CapabilityCategory,
    {
      readonly total: number;
      readonly allowed: number;
      readonly forbidden: number;
    }
  >;
  readonly highRiskAllowed: number;
  readonly destructiveAllowed: number;
}

/**
 * Generate capability report for a profile.
 */
export function generateCapabilityReport(
  profile: CapabilityProfile
): CapabilityReport {
  const byCategory = new Map<
    CapabilityCategory,
    { total: number; allowed: number; forbidden: number }
  >();

  let allowedCapabilities = 0;
  let forbiddenCapabilities = 0;
  let requiresConfirmation = 0;
  let requiresPreview = 0;
  let highRiskAllowed = 0;
  let destructiveAllowed = 0;

  for (const capability of CAPABILITY_REGISTRY.values()) {
    const permission = getCapabilityPermission(capability.id, profile);

    // Update category stats
    const categoryStats = byCategory.get(capability.category) ?? {
      total: 0,
      allowed: 0,
      forbidden: 0,
    };
    categoryStats.total++;
    if (permission === CapabilityPermission.Forbidden) {
      categoryStats.forbidden++;
    } else {
      categoryStats.allowed++;
    }
    byCategory.set(capability.category, categoryStats);

    // Update overall stats
    switch (permission) {
      case CapabilityPermission.Forbidden:
        forbiddenCapabilities++;
        break;
      case CapabilityPermission.RequiresConfirmation:
        requiresConfirmation++;
        allowedCapabilities++;
        break;
      case CapabilityPermission.RequiresPreview:
        requiresPreview++;
        allowedCapabilities++;
        break;
      case CapabilityPermission.Allowed:
        allowedCapabilities++;
        break;
    }

    // Track risk
    if (
      permission !== CapabilityPermission.Forbidden &&
      capability.riskLevel === 'high'
    ) {
      highRiskAllowed++;
    }

    if (
      permission !== CapabilityPermission.Forbidden &&
      capability.canBeDestructive
    ) {
      destructiveAllowed++;
    }
  }

  return {
    profileName: profile.name,
    totalCapabilities: CAPABILITY_REGISTRY.size,
    allowedCapabilities,
    forbiddenCapabilities,
    requiresConfirmation,
    requiresPreview,
    byCategory,
    highRiskAllowed,
    destructiveAllowed,
  };
}
