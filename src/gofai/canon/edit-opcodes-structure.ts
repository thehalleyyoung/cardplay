/**
 * GOFAI Edit Opcodes — Structure and Form Manipulation
 *
 * Step 276: Define plan opcodes for musical structure edits:
 * - Duplicate section
 * - Shorten/extend
 * - Insert pickup
 * - Add break/build/drop
 * - Form rearrangement
 * - Section transitions
 *
 * These opcodes manipulate the high-level form and structure of a composition,
 * enabling operations like "add a four-bar intro", "extend the chorus",
 * "insert a breakdown before the final chorus", etc.
 *
 * Design principles:
 * - All structure edits preserve timing integrity (no orphaned events)
 * - Section markers are updated automatically
 * - Automation lanes are handled correctly across splits/joins
 * - Undo is fully supported via EditPackage tokens
 *
 * @module gofai/canon/edit-opcodes-structure
 */

import type { EditOpcode, OpcodeId, AxisId } from './types';
import { createOpcodeId, createAxisId } from './types';

// =============================================================================
// Section Duplication and Repetition
// =============================================================================

/**
 * OP_DUPLICATE_SECTION — Copy a section and insert it at a specified location
 *
 * Creates an exact copy of a section (all tracks, events, markers, automation)
 * and inserts it at the target position. Useful for:
 * - Doubling a chorus
 * - Creating verse variations
 * - Building extended arrangements
 *
 * Preserves: All musical content, relative timing, layer relationships
 * Affects: Song length, section count, marker positions after insertion
 */
export const OP_DUPLICATE_SECTION: EditOpcode = {
  id: createOpcodeId('duplicate_section'),
  name: 'Duplicate Section',
  description:
    'Create an exact copy of a section and insert it at a specified location. ' +
    'All tracks, events, markers, and automation are duplicated with timing preserved.',
  params: [
    {
      name: 'source_section',
      type: 'scope',
      required: true,
      description: 'The section to duplicate',
    },
    {
      name: 'insert_position',
      type: 'string',
      required: true,
      description: 'Where to insert the duplicate (before/after a section, or at a bar)',
      enumValues: ['before', 'after', 'at_bar'],
    },
    {
      name: 'target_location',
      type: 'entity_ref',
      required: true,
      description: 'Target section or bar number for insertion',
    },
    {
      name: 'new_section_name',
      type: 'string',
      required: false,
      description: 'Optional name for the duplicated section',
    },
  ],
  affects: ['section', 'marker', 'event', 'automation'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('structure'), createAxisId('duration')],
  preconditions: [
    'source_section must exist',
    'target_location must be valid',
    'insert_position must not create timing conflicts',
  ],
  postconditions: [
    'new section created with all content copied',
    'markers updated to reflect new section boundaries',
    'total song length increased by section duration',
  ],
};

/**
 * OP_REPEAT_SECTION — Repeat a section N times in place
 *
 * Similar to duplicate but creates multiple consecutive copies.
 * Useful for loop-based music and extended jams.
 *
 * Preserves: Musical content
 * Affects: Song length, structure
 */
export const OP_REPEAT_SECTION: EditOpcode = {
  id: createOpcodeId('repeat_section'),
  name: 'Repeat Section',
  description:
    'Repeat a section a specified number of times in sequence. ' +
    'Creates N-1 additional copies immediately following the original.',
  params: [
    {
      name: 'section',
      type: 'scope',
      required: true,
      description: 'The section to repeat',
    },
    {
      name: 'repetitions',
      type: 'number',
      required: true,
      description: 'Total number of times to play the section (including original)',
      validation: { min: 2, max: 16 },
      defaultValue: 2,
    },
    {
      name: 'vary_repetitions',
      type: 'boolean',
      required: false,
      description: 'Apply subtle variations to each repetition',
      defaultValue: false,
    },
  ],
  affects: ['section', 'marker', 'event', 'automation'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('structure'), createAxisId('duration'), createAxisId('repetition')],
  preconditions: ['section must exist', 'repetitions must be >= 2'],
  postconditions: [
    'section repeated specified number of times',
    'markers added for each repetition',
    'total length increased by (repetitions - 1) * section_length',
  ],
};

// =============================================================================
// Section Length Manipulation
// =============================================================================

/**
 * OP_EXTEND_SECTION — Lengthen a section by adding bars
 *
 * Adds empty or filled bars to a section, useful for:
 * - Creating space for solos
 * - Extending intros/outros
 * - Making room for transitions
 *
 * Preserves: Existing content
 * Affects: Section length, timing of following sections
 */
export const OP_EXTEND_SECTION: EditOpcode = {
  id: createOpcodeId('extend_section'),
  name: 'Extend Section',
  description:
    'Lengthen a section by adding bars at the beginning, end, or middle. ' +
    'Can add empty bars or intelligently fill with repeated material.',
  params: [
    {
      name: 'section',
      type: 'scope',
      required: true,
      description: 'The section to extend',
    },
    {
      name: 'bars',
      type: 'number',
      required: true,
      description: 'Number of bars to add',
      validation: { min: 1, max: 64 },
    },
    {
      name: 'position',
      type: 'string',
      required: true,
      description: 'Where to add the bars',
      enumValues: ['start', 'end', 'before_bar'],
      defaultValue: 'end',
    },
    {
      name: 'fill_mode',
      type: 'string',
      required: false,
      description: 'How to fill the new bars',
      enumValues: ['empty', 'repeat_last', 'repeat_first', 'extend_pattern'],
      defaultValue: 'empty',
    },
  ],
  affects: ['section', 'marker', 'event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('duration'), createAxisId('space')],
  preconditions: ['section must exist', 'bars must be > 0'],
  postconditions: [
    'section length increased by specified bars',
    'following sections shifted in time',
    'new bars added according to fill_mode',
  ],
};

/**
 * OP_SHORTEN_SECTION — Reduce section length by removing bars
 *
 * Removes bars from a section, either from edges or by cutting out a range.
 *
 * Preserves: Kept content unchanged
 * Affects: Section length, removed events
 */
export const OP_SHORTEN_SECTION: EditOpcode = {
  id: createOpcodeId('shorten_section'),
  name: 'Shorten Section',
  description:
    'Reduce section length by removing bars. Can remove from start, end, or cut out a range. ' +
    'Events within removed bars are deleted.',
  params: [
    {
      name: 'section',
      type: 'scope',
      required: true,
      description: 'The section to shorten',
    },
    {
      name: 'bars',
      type: 'number',
      required: true,
      description: 'Number of bars to remove',
      validation: { min: 1 },
    },
    {
      name: 'remove_from',
      type: 'string',
      required: true,
      description: 'Where to remove bars from',
      enumValues: ['start', 'end', 'bar_range'],
      defaultValue: 'end',
    },
    {
      name: 'start_bar',
      type: 'number',
      required: false,
      description: 'Starting bar for range removal (if remove_from = bar_range)',
    },
  ],
  affects: ['section', 'marker', 'event', 'automation'],
  effectType: 'mutate',
  cost: 'medium',
  requiresCapabilities: ['structure_editing'],
  affectsAxes: [createAxisId('duration'), createAxisId('density')],
  preconditions: [
    'section must exist',
    'bars to remove must be <= section length',
    'removal must not leave section with length 0',
  ],
  postconditions: [
    'section length decreased by specified bars',
    'events in removed range deleted',
    'following sections shifted earlier',
  ],
};

/**
 * OP_TRIM_SECTION — Remove silence or empty space from section edges
 *
 * Automatically removes bars with no (or minimal) content from the start
 * and/or end of a section.
 *
 * Preserves: All musical content
 * Affects: Section length (removal of empty bars)
 */
export const OP_TRIM_SECTION: EditOpcode = {
  id: createOpcodeId('trim_section'),
  name: 'Trim Section',
  description:
    'Remove empty or near-empty bars from the start and/or end of a section. ' +
    'Automatically detects and removes bars with no musical content.',
  params: [
    {
      name: 'section',
      type: 'scope',
      required: true,
      description: 'The section to trim',
    },
    {
      name: 'trim_start',
      type: 'boolean',
      required: false,
      description: 'Remove empty bars from section start',
      defaultValue: true,
    },
    {
      name: 'trim_end',
      type: 'boolean',
      required: false,
      description: 'Remove empty bars from section end',
      defaultValue: true,
    },
    {
      name: 'threshold',
      type: 'number',
      required: false,
      description: 'Minimum event density to consider a bar non-empty (events per bar)',
      validation: { min: 0, max: 100 },
      defaultValue: 1,
    },
  ],
  affects: ['section', 'marker'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('duration'), createAxisId('space')],
  preconditions: ['section must exist'],
  postconditions: ['empty bars removed from specified edges', 'musical content unchanged'],
};

// =============================================================================
// Structural Insertions (Pickup, Break, Build, Drop)
// =============================================================================

/**
 * OP_INSERT_PICKUP — Add a pickup measure before a section
 *
 * Inserts a short phrase (typically 1-2 bars) before a section to create
 * anacrusis or lead-in. Common in many musical styles.
 *
 * Preserves: Existing content
 * Affects: Timing of target section and all following content
 */
export const OP_INSERT_PICKUP: EditOpcode = {
  id: createOpcodeId('insert_pickup'),
  name: 'Insert Pickup',
  description:
    'Add a pickup measure (anacrusis) before a section. Creates a lead-in phrase, ' +
    'typically 1-2 bars, that anticipates the target section.',
  params: [
    {
      name: 'before_section',
      type: 'scope',
      required: true,
      description: 'The section to add a pickup before',
    },
    {
      name: 'duration',
      type: 'number',
      required: false,
      description: 'Pickup duration in bars',
      validation: { min: 0.25, max: 4 },
      defaultValue: 1,
    },
    {
      name: 'source_material',
      type: 'string',
      required: false,
      description: 'What to use for pickup content',
      enumValues: ['empty', 'from_target', 'from_previous', 'drum_fill'],
      defaultValue: 'from_target',
    },
    {
      name: 'layers',
      type: 'entity_ref',
      required: false,
      description: 'Which layers to include in pickup (default: rhythm section)',
    },
  ],
  affects: ['section', 'marker', 'event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('structure'), createAxisId('anticipation')],
  preconditions: ['target section must exist'],
  postconditions: [
    'pickup section created before target',
    'target section and followers shifted later in time',
    'pickup content generated according to source_material',
  ],
};

/**
 * OP_INSERT_BREAK — Add a break (pause or sparse section)
 *
 * Inserts a contrasting section with reduced density, creating dramatic
 * tension or providing breathing room. Common in electronic music and
 * pop arrangements.
 *
 * Preserves: Surrounding sections
 * Affects: Song structure, energy flow
 */
export const OP_INSERT_BREAK: EditOpcode = {
  id: createOpcodeId('insert_break'),
  name: 'Insert Break',
  description:
    'Insert a break section: a moment of reduced density and energy. ' +
    'Creates contrast and builds anticipation for what follows.',
  params: [
    {
      name: 'position',
      type: 'entity_ref',
      required: true,
      description: 'Where to insert the break (before/after a section, or at a bar)',
    },
    {
      name: 'duration',
      type: 'number',
      required: false,
      description: 'Break duration in bars',
      validation: { min: 1, max: 16 },
      defaultValue: 4,
    },
    {
      name: 'break_type',
      type: 'string',
      required: false,
      description: 'Style of break',
      enumValues: ['silent', 'minimal', 'filter_sweep', 'vocal_only', 'percussion_only'],
      defaultValue: 'minimal',
    },
    {
      name: 'transition_in',
      type: 'number',
      required: false,
      description: 'Transition length in bars before break',
      validation: { min: 0, max: 4 },
      defaultValue: 0.5,
    },
    {
      name: 'transition_out',
      type: 'number',
      required: false,
      description: 'Transition length in bars after break',
      validation: { min: 0, max: 4 },
      defaultValue: 0.5,
    },
  ],
  affects: ['section', 'marker', 'event', 'layer', 'automation'],
  effectType: 'mutate',
  cost: 'high',
  requiresCapabilities: ['structure_editing', 'arrangement_editing'],
  affectsAxes: [
    createAxisId('structure'),
    createAxisId('energy'),
    createAxisId('density'),
    createAxisId('tension'),
  ],
  preconditions: ['insertion position must be valid', 'duration must be positive'],
  postconditions: [
    'break section created at specified position',
    'break content matches specified type',
    'transitions applied if specified',
    'following sections shifted in time',
  ],
};

/**
 * OP_INSERT_BUILD — Add a build-up section
 *
 * Inserts a section with progressively increasing energy, density, and tension.
 * Prepares listeners for a drop or climactic moment.
 *
 * Preserves: Surrounding sections
 * Affects: Song structure, energy trajectory
 */
export const OP_INSERT_BUILD: EditOpcode = {
  id: createOpcodeId('insert_build'),
  name: 'Insert Build',
  description:
    'Insert a build-up section: progressively increasing energy, density, and tension. ' +
    'Creates anticipation for a drop or climactic moment.',
  params: [
    {
      name: 'position',
      type: 'entity_ref',
      required: true,
      description: 'Where to insert the build',
    },
    {
      name: 'duration',
      type: 'number',
      required: false,
      description: 'Build duration in bars',
      validation: { min: 2, max: 32 },
      defaultValue: 8,
    },
    {
      name: 'intensity',
      type: 'string',
      required: false,
      description: 'How aggressive the build is',
      enumValues: ['subtle', 'moderate', 'intense', 'explosive'],
      defaultValue: 'moderate',
    },
    {
      name: 'techniques',
      type: 'string',
      required: false,
      description: 'Build techniques to apply (comma-separated)',
      defaultValue: 'add_layers,increase_density,rise_filter,add_fills',
    },
    {
      name: 'peak_at',
      type: 'number',
      required: false,
      description: 'Where in the build to reach peak intensity (0-1)',
      validation: { min: 0.5, max: 1.0 },
      defaultValue: 1.0,
    },
  ],
  affects: ['section', 'marker', 'event', 'layer', 'automation', 'param'],
  effectType: 'mutate',
  cost: 'high',
  requiresCapabilities: ['structure_editing', 'arrangement_editing', 'automation_editing'],
  affectsAxes: [
    createAxisId('structure'),
    createAxisId('energy'),
    createAxisId('density'),
    createAxisId('tension'),
    createAxisId('brightness'),
  ],
  preconditions: ['insertion position must be valid', 'duration must be >= 2 bars'],
  postconditions: [
    'build section created at specified position',
    'progressive increase in energy/density',
    'automation curves applied for smooth build',
    'following sections shifted in time',
  ],
};

/**
 * OP_INSERT_DROP — Add a drop section
 *
 * Inserts a moment of release or impact, typically following a build.
 * Can be high-energy (EDM drop) or low-energy (trap drop).
 *
 * Preserves: Surrounding sections
 * Affects: Song structure, energy release
 */
export const OP_INSERT_DROP: EditOpcode = {
  id: createOpcodeId('insert_drop'),
  name: 'Insert Drop',
  description:
    'Insert a drop section: a moment of release or impact, typically following a build. ' +
    'Can be high-energy (EDM drop) or sparse (trap drop).',
  params: [
    {
      name: 'position',
      type: 'entity_ref',
      required: true,
      description: 'Where to insert the drop',
    },
    {
      name: 'duration',
      type: 'number',
      required: false,
      description: 'Drop duration in bars',
      validation: { min: 4, max: 32 },
      defaultValue: 16,
    },
    {
      name: 'drop_style',
      type: 'string',
      required: false,
      description: 'Style of drop',
      enumValues: ['edm_full', 'trap_sparse', 'dubstep_heavy', 'progressive_smooth', 'hybrid'],
      defaultValue: 'edm_full',
    },
    {
      name: 'impact_strength',
      type: 'string',
      required: false,
      description: 'How impactful the drop moment is',
      enumValues: ['subtle', 'moderate', 'powerful', 'massive'],
      defaultValue: 'powerful',
    },
    {
      name: 'include_riser',
      type: 'boolean',
      required: false,
      description: 'Add a short riser effect in the last bar before drop',
      defaultValue: true,
    },
  ],
  affects: ['section', 'marker', 'event', 'layer', 'automation'],
  effectType: 'mutate',
  cost: 'high',
  requiresCapabilities: ['structure_editing', 'arrangement_editing'],
  affectsAxes: [
    createAxisId('structure'),
    createAxisId('energy'),
    createAxisId('impact'),
    createAxisId('density'),
  ],
  preconditions: ['insertion position must be valid', 'duration must be >= 4 bars'],
  postconditions: [
    'drop section created at specified position',
    'drop content matches specified style',
    'impact moment clearly defined',
    'following sections shifted in time',
  ],
};

// =============================================================================
// Form Rearrangement
// =============================================================================

/**
 * OP_MOVE_SECTION — Relocate a section to a different position
 *
 * Cuts a section from its current position and pastes it elsewhere,
 * updating all markers and timing accordingly.
 *
 * Preserves: Section content
 * Affects: Overall form, section ordering
 */
export const OP_MOVE_SECTION: EditOpcode = {
  id: createOpcodeId('move_section'),
  name: 'Move Section',
  description:
    'Move a section to a different position in the song. ' +
    'Cuts the section from its current location and inserts it at the target position.',
  params: [
    {
      name: 'section',
      type: 'scope',
      required: true,
      description: 'The section to move',
    },
    {
      name: 'target_position',
      type: 'entity_ref',
      required: true,
      description: 'Where to move the section (before/after another section)',
    },
    {
      name: 'position_relation',
      type: 'string',
      required: true,
      description: 'Relation to target',
      enumValues: ['before', 'after', 'replace'],
      defaultValue: 'after',
    },
    {
      name: 'adjust_transitions',
      type: 'boolean',
      required: false,
      description: 'Automatically adjust transitions to new neighbors',
      defaultValue: true,
    },
  ],
  affects: ['section', 'marker'],
  effectType: 'mutate',
  cost: 'medium',
  requiresCapabilities: ['structure_editing'],
  affectsAxes: [createAxisId('structure'), createAxisId('form')],
  preconditions: [
    'section must exist',
    'target_position must be valid',
    'move must not create circular references',
  ],
  postconditions: [
    'section moved to new position',
    'all markers updated',
    'transitions adjusted if requested',
  ],
};

/**
 * OP_SWAP_SECTIONS — Exchange positions of two sections
 *
 * Swaps the positions of two sections, preserving their content but
 * changing the song form.
 *
 * Preserves: Section content
 * Affects: Overall form
 */
export const OP_SWAP_SECTIONS: EditOpcode = {
  id: createOpcodeId('swap_sections'),
  name: 'Swap Sections',
  description:
    'Exchange the positions of two sections. Both sections maintain their content ' +
    'but swap positions in the song structure.',
  params: [
    {
      name: 'section_a',
      type: 'scope',
      required: true,
      description: 'First section to swap',
    },
    {
      name: 'section_b',
      type: 'scope',
      required: true,
      description: 'Second section to swap',
    },
    {
      name: 'adjust_transitions',
      type: 'boolean',
      required: false,
      description: 'Automatically adjust transitions to new neighbors',
      defaultValue: true,
    },
  ],
  affects: ['section', 'marker'],
  effectType: 'mutate',
  cost: 'low',
  requiresCapabilities: ['structure_editing'],
  affectsAxes: [createAxisId('structure'), createAxisId('form')],
  preconditions: [
    'both sections must exist',
    'sections must be different',
    'sections must not overlap',
  ],
  postconditions: [
    'sections swapped in song order',
    'all markers updated',
    'transitions adjusted if requested',
  ],
};

/**
 * OP_DELETE_SECTION — Remove a section from the song
 *
 * Completely removes a section and all its content, closing the gap
 * by shifting following sections earlier.
 *
 * Preserves: Other sections
 * Affects: Song length, form
 */
export const OP_DELETE_SECTION: EditOpcode = {
  id: createOpcodeId('delete_section'),
  name: 'Delete Section',
  description:
    'Remove a section and all its content from the song. Following sections ' +
    'are shifted earlier to close the gap.',
  params: [
    {
      name: 'section',
      type: 'scope',
      required: true,
      description: 'The section to delete',
    },
    {
      name: 'adjust_transitions',
      type: 'boolean',
      required: false,
      description: 'Smooth transition between new neighboring sections',
      defaultValue: true,
    },
    {
      name: 'confirm_if_not_empty',
      type: 'boolean',
      required: false,
      description: 'Require confirmation if section contains events',
      defaultValue: true,
    },
  ],
  affects: ['section', 'marker', 'event', 'automation'],
  effectType: 'mutate',
  cost: 'high',
  requiresCapabilities: ['structure_editing'],
  affectsAxes: [createAxisId('structure'), createAxisId('duration')],
  preconditions: ['section must exist'],
  postconditions: [
    'section and all content removed',
    'following sections shifted earlier',
    'markers updated',
  ],
};

// =============================================================================
// Section Splitting and Merging
// =============================================================================

/**
 * OP_SPLIT_SECTION — Divide a section into two sections at a bar
 *
 * Cuts a section at a specified bar, creating two separate sections.
 * Useful for creating subsections or separating different musical ideas.
 *
 * Preserves: All content
 * Affects: Section count, marker structure
 */
export const OP_SPLIT_SECTION: EditOpcode = {
  id: createOpcodeId('split_section'),
  name: 'Split Section',
  description:
    'Divide a section into two sections at a specified bar. ' +
    'All content is preserved; section markers are added at the split point.',
  params: [
    {
      name: 'section',
      type: 'scope',
      required: true,
      description: 'The section to split',
    },
    {
      name: 'split_at_bar',
      type: 'number',
      required: true,
      description: 'Bar number (relative to section start) where to split',
      validation: { min: 1 },
    },
    {
      name: 'first_section_name',
      type: 'string',
      required: false,
      description: 'Name for the first part (defaults to original name + " A")',
    },
    {
      name: 'second_section_name',
      type: 'string',
      required: false,
      description: 'Name for the second part (defaults to original name + " B")',
    },
  ],
  affects: ['section', 'marker'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('structure')],
  preconditions: [
    'section must exist',
    'split_at_bar must be within section bounds',
    'split_at_bar must not be first or last bar of section',
  ],
  postconditions: [
    'original section replaced by two sections',
    'all content preserved in correct section',
    'markers added at split point',
  ],
};

/**
 * OP_MERGE_SECTIONS — Combine two adjacent sections into one
 *
 * Joins two consecutive sections into a single section, removing the
 * boundary marker between them.
 *
 * Preserves: All content
 * Affects: Section count, marker structure
 */
export const OP_MERGE_SECTIONS: EditOpcode = {
  id: createOpcodeId('merge_sections'),
  name: 'Merge Sections',
  description:
    'Combine two adjacent sections into a single section. ' +
    'The boundary marker is removed and all content from both sections is preserved.',
  params: [
    {
      name: 'first_section',
      type: 'scope',
      required: true,
      description: 'The first section (earlier in time)',
    },
    {
      name: 'second_section',
      type: 'scope',
      required: true,
      description: 'The second section (immediately following first)',
    },
    {
      name: 'merged_section_name',
      type: 'string',
      required: false,
      description: 'Name for the merged section (defaults to first section name)',
    },
  ],
  affects: ['section', 'marker'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('structure')],
  preconditions: [
    'both sections must exist',
    'sections must be adjacent (second immediately follows first)',
  ],
  postconditions: [
    'two sections replaced by one merged section',
    'all content preserved',
    'boundary marker removed',
  ],
};

// =============================================================================
// Transition Manipulation
// =============================================================================

/**
 * OP_ADD_TRANSITION — Create a smooth transition between sections
 *
 * Adds a transition zone at the boundary between sections, with
 * cross-fades, fills, or other bridging elements.
 *
 * Preserves: Section content (may add transition events)
 * Affects: Section boundaries, smoothness of form
 */
export const OP_ADD_TRANSITION: EditOpcode = {
  id: createOpcodeId('add_transition'),
  name: 'Add Transition',
  description:
    'Create a smooth transition between two sections. Adds cross-fades, fills, ' +
    'or other bridging elements to connect sections seamlessly.',
  params: [
    {
      name: 'from_section',
      type: 'scope',
      required: true,
      description: 'The section transitioning out',
    },
    {
      name: 'to_section',
      type: 'scope',
      required: true,
      description: 'The section transitioning in',
    },
    {
      name: 'transition_type',
      type: 'string',
      required: false,
      description: 'Type of transition',
      enumValues: ['crossfade', 'drum_fill', 'riser', 'filter_sweep', 'silence', 'auto'],
      defaultValue: 'auto',
    },
    {
      name: 'transition_length',
      type: 'number',
      required: false,
      description: 'Transition duration in bars',
      validation: { min: 0.25, max: 8 },
      defaultValue: 1,
    },
    {
      name: 'intensity',
      type: 'string',
      required: false,
      description: 'How dramatic the transition is',
      enumValues: ['subtle', 'moderate', 'dramatic'],
      defaultValue: 'moderate',
    },
  ],
  affects: ['section', 'event', 'automation', 'param'],
  effectType: 'mutate',
  cost: 'medium',
  requiresCapabilities: ['structure_editing', 'automation_editing'],
  affectsAxes: [createAxisId('smoothness'), createAxisId('flow'), createAxisId('structure')],
  preconditions: [
    'both sections must exist',
    'sections must be adjacent or specify where to apply transition',
  ],
  postconditions: [
    'transition created between sections',
    'transition content matches specified type',
    'smooth flow established',
  ],
};

/**
 * OP_REMOVE_TRANSITION — Remove or simplify transition between sections
 *
 * Removes added transition elements or makes section boundaries more abrupt.
 *
 * Preserves: Main section content
 * Affects: Section boundaries
 */
export const OP_REMOVE_TRANSITION: EditOpcode = {
  id: createOpcodeId('remove_transition'),
  name: 'Remove Transition',
  description:
    'Remove or simplify a transition between sections. Makes the boundary more abrupt ' +
    'by removing fills, risers, or cross-fades.',
  params: [
    {
      name: 'from_section',
      type: 'scope',
      required: true,
      description: 'The first section',
    },
    {
      name: 'to_section',
      type: 'scope',
      required: true,
      description: 'The second section',
    },
    {
      name: 'hard_cut',
      type: 'boolean',
      required: false,
      description: 'Make boundary completely abrupt with no overlap',
      defaultValue: false,
    },
  ],
  affects: ['section', 'event', 'automation'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('structure'), createAxisId('impact')],
  preconditions: ['both sections must exist', 'sections must be adjacent'],
  postconditions: [
    'transition elements removed',
    'boundary is more abrupt',
    'section content preserved',
  ],
};

// =============================================================================
// Intro/Outro Creation
// =============================================================================

/**
 * OP_ADD_INTRO — Create an introduction section
 *
 * Adds an intro section at the beginning of the song, with options
 * for length and style.
 *
 * Preserves: Existing song content
 * Affects: Song start time, total length
 */
export const OP_ADD_INTRO: EditOpcode = {
  id: createOpcodeId('add_intro'),
  name: 'Add Intro',
  description:
    'Create an introduction section at the beginning of the song. ' +
    'Can be generated from song material or created as a fade-in.',
  params: [
    {
      name: 'duration',
      type: 'number',
      required: false,
      description: 'Intro duration in bars',
      validation: { min: 2, max: 32 },
      defaultValue: 8,
    },
    {
      name: 'intro_style',
      type: 'string',
      required: false,
      description: 'Style of intro',
      enumValues: ['sparse', 'build', 'full_arrangement', 'ambient', 'from_chorus', 'from_verse'],
      defaultValue: 'sparse',
    },
    {
      name: 'fade_in',
      type: 'boolean',
      required: false,
      description: 'Apply fade-in automation to intro',
      defaultValue: false,
    },
  ],
  affects: ['section', 'marker', 'event', 'automation'],
  effectType: 'mutate',
  cost: 'medium',
  requiresCapabilities: ['structure_editing', 'arrangement_editing'],
  affectsAxes: [createAxisId('structure'), createAxisId('duration')],
  preconditions: ['song must not already start with an intro section'],
  postconditions: [
    'intro section added at song start',
    'all existing content shifted later',
    'intro content matches specified style',
  ],
};

/**
 * OP_ADD_OUTRO — Create an ending section
 *
 * Adds an outro/ending section at the end of the song.
 *
 * Preserves: Existing song content
 * Affects: Song end time, total length
 */
export const OP_ADD_OUTRO: EditOpcode = {
  id: createOpcodeId('add_outro'),
  name: 'Add Outro',
  description:
    'Create an ending section at the end of the song. ' +
    'Can fade out, resolve, or create a definitive ending.',
  params: [
    {
      name: 'duration',
      type: 'number',
      required: false,
      description: 'Outro duration in bars',
      validation: { min: 2, max: 32 },
      defaultValue: 8,
    },
    {
      name: 'outro_style',
      type: 'string',
      required: false,
      description: 'Style of outro',
      enumValues: ['fade_out', 'resolution', 'tag_ending', 'cold_ending', 'repeat_fade'],
      defaultValue: 'fade_out',
    },
    {
      name: 'fade_duration',
      type: 'number',
      required: false,
      description: 'Fade duration in bars (if applicable)',
      validation: { min: 1, max: 16 },
      defaultValue: 4,
    },
  ],
  affects: ['section', 'marker', 'event', 'automation'],
  effectType: 'mutate',
  cost: 'medium',
  requiresCapabilities: ['structure_editing', 'arrangement_editing'],
  affectsAxes: [createAxisId('structure'), createAxisId('duration'), createAxisId('closure')],
  preconditions: ['song must have at least one section'],
  postconditions: [
    'outro section added at song end',
    'outro content matches specified style',
    'fade applied if requested',
  ],
};

// =============================================================================
// Form Templates and Rearrangement
// =============================================================================

/**
 * OP_APPLY_FORM_TEMPLATE — Rearrange sections to match a template
 *
 * Reorganizes existing sections to follow a standard form template
 * (e.g., verse-chorus-verse-chorus-bridge-chorus).
 *
 * Preserves: Section content
 * Affects: Section order and possibly duplication
 */
export const OP_APPLY_FORM_TEMPLATE: EditOpcode = {
  id: createOpcodeId('apply_form_template'),
  name: 'Apply Form Template',
  description:
    'Rearrange existing sections to match a standard song form template. ' +
    'Can duplicate sections as needed to complete the form.',
  params: [
    {
      name: 'template',
      type: 'string',
      required: true,
      description: 'Form template to apply',
      enumValues: [
        'verse-chorus',
        'verse-chorus-verse-chorus-bridge-chorus',
        'aaba',
        'abab',
        'intro-verse-chorus-verse-chorus-outro',
        'custom',
      ],
    },
    {
      name: 'section_mapping',
      type: 'string',
      required: false,
      description: 'JSON mapping of template slots to existing sections',
    },
    {
      name: 'allow_duplication',
      type: 'boolean',
      required: false,
      description: 'Allow duplicating sections to fill template',
      defaultValue: true,
    },
  ],
  affects: ['section', 'marker'],
  effectType: 'mutate',
  cost: 'high',
  requiresCapabilities: ['structure_editing'],
  affectsAxes: [createAxisId('structure'), createAxisId('form')],
  preconditions: [
    'template must be valid',
    'sufficient sections must exist to fill template',
  ],
  postconditions: [
    'sections rearranged to match template',
    'sections duplicated if needed and allowed',
    'form matches target template',
  ],
};

// =============================================================================
// Export
// =============================================================================

/**
 * All structure editing opcodes.
 */
export const STRUCTURE_OPCODES: readonly EditOpcode[] = [
  OP_DUPLICATE_SECTION,
  OP_REPEAT_SECTION,
  OP_EXTEND_SECTION,
  OP_SHORTEN_SECTION,
  OP_TRIM_SECTION,
  OP_INSERT_PICKUP,
  OP_INSERT_BREAK,
  OP_INSERT_BUILD,
  OP_INSERT_DROP,
  OP_MOVE_SECTION,
  OP_SWAP_SECTIONS,
  OP_DELETE_SECTION,
  OP_SPLIT_SECTION,
  OP_MERGE_SECTIONS,
  OP_ADD_TRANSITION,
  OP_REMOVE_TRANSITION,
  OP_ADD_INTRO,
  OP_ADD_OUTRO,
  OP_APPLY_FORM_TEMPLATE,
] as const;

/**
 * Structure opcode count: 19 comprehensive opcodes for manipulating song form.
 */
export const STRUCTURE_OPCODE_COUNT = STRUCTURE_OPCODES.length;
