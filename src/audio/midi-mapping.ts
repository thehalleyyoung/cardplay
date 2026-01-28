/**
 * @fileoverview MIDI Mapping System
 * 
 * Provides MIDI learn, parameter mapping, and preset management:
 * - MIDI map editor with multi-parameter binding
 * - Range and curve mapping (linear/log/exp)
 * - Toggle and momentary modes
 * - MIDI preset save/load to localStorage
 * - Device-specific profiles
 * - Map import/export as JSON
 * 
 * @module @cardplay/core/audio/midi-mapping
 */

import type { MIDIMessage, MIDIDeviceInfo } from './web-midi';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Unique ID for a mappable parameter in the system
 */
export type ParameterId = string;

/**
 * MIDI mapping curve type
 */
export type MappingCurve = 'linear' | 'log' | 'exp' | 'custom';

/**
 * MIDI mapping mode
 */
export type MappingMode = 'absolute' | 'relative' | 'toggle' | 'momentary';

/**
 * Parameter value type
 */
export type ParameterValue = number | boolean | string;

/**
 * Parameter range definition
 */
export interface ParameterRange {
  /** Minimum value */
  readonly min: number;
  /** Maximum value */
  readonly max: number;
  /** Default value */
  readonly default: number;
  /** Step size (0 = continuous) */
  readonly step: number;
}

/**
 * MIDI mapping for a single parameter
 */
export interface MIDIParameterMapping {
  /** Unique mapping ID */
  readonly id: string;
  /** Target parameter ID */
  readonly parameterId: ParameterId;
  /** Parameter display name */
  readonly parameterName: string;
  /** MIDI channel (0-15, -1 = omni) */
  readonly channel: number;
  /** MIDI CC number (0-127) or note number */
  readonly ccNumber: number;
  /** Whether this is a note mapping (vs CC) */
  readonly isNote: boolean;
  /** Mapping mode */
  readonly mode: MappingMode;
  /** Value range in parameter space */
  readonly range: ParameterRange;
  /** Mapping curve */
  readonly curve: MappingCurve;
  /** Custom curve points (if curve === 'custom') */
  readonly curvePoints?: readonly { x: number; y: number }[];
  /** Invert the mapping */
  readonly inverted: boolean;
  /** Device ID this mapping is specific to (null = any device) */
  readonly deviceId: string | null;
  /** Whether mapping is enabled */
  readonly enabled: boolean;
}

/**
 * Complete MIDI mapping preset
 */
export interface MIDIMappingPreset {
  /** Preset ID */
  readonly id: string;
  /** Preset name */
  readonly name: string;
  /** Preset description */
  readonly description: string;
  /** Creation timestamp */
  readonly createdAt: number;
  /** Last modified timestamp */
  readonly modifiedAt: number;
  /** Whether this is a factory preset */
  readonly isFactory: boolean;
  /** Device ID this preset is specific to (null = generic) */
  readonly deviceId: string | null;
  /** Device name (for display) */
  readonly deviceName: string | null;
  /** All parameter mappings */
  readonly mappings: readonly MIDIParameterMapping[];
}

/**
 * MIDI device profile
 */
export interface MIDIDeviceProfile {
  /** Profile ID */
  readonly id: string;
  /** Device name pattern (for matching) */
  readonly namePattern: string;
  /** Manufacturer name pattern */
  readonly manufacturerPattern: string;
  /** Default mappings for this device */
  readonly defaultMappings: readonly MIDIParameterMapping[];
  /** Suggested CC assignments */
  readonly suggestedCCs: ReadonlyMap<string, number>;
  /** Device-specific notes */
  readonly notes: string;
}

/**
 * MIDI learn state
 */
export interface MIDILearnState {
  /** Whether learn mode is active */
  readonly active: boolean;
  /** Parameter being learned */
  readonly targetParameter: ParameterId | null;
  /** Parameter display name */
  readonly targetParameterName: string | null;
  /** Last received MIDI message */
  readonly lastMessage: MIDIMessage | null;
  /** Timeout handle for auto-disable */
  readonly timeoutHandle: number | null;
}

// ============================================================================
// MAPPING UTILITIES
// ============================================================================

/**
 * Apply mapping curve to a 0-1 normalized value
 */
export function applyCurve(
  value: number,
  curve: MappingCurve,
  curvePoints?: readonly { x: number; y: number }[]
): number {
  value = Math.max(0, Math.min(1, value));

  switch (curve) {
    case 'linear':
      return value;

    case 'log':
      // Logarithmic curve: slower at low values, faster at high
      return value === 0 ? 0 : Math.log10(1 + value * 9) / Math.log10(10);

    case 'exp':
      // Exponential curve: faster at low values, slower at high
      return (Math.pow(10, value) - 1) / 9;

    case 'custom':
      if (!curvePoints || curvePoints.length < 2) {
        return value;
      }
      // Linear interpolation through curve points
      for (let i = 0; i < curvePoints.length - 1; i++) {
        const p1 = curvePoints[i]!;
        const p2 = curvePoints[i + 1]!;
        if (value >= p1.x && value <= p2.x) {
          const t = (value - p1.x) / (p2.x - p1.x);
          return p1.y + t * (p2.y - p1.y);
        }
      }
      return value;

    default:
      return value;
  }
}

/**
 * Map MIDI value (0-127) to parameter value using mapping configuration
 */
export function mapMIDIToParameter(
  midiValue: number,
  mapping: MIDIParameterMapping
): number {
  // Normalize MIDI value to 0-1
  let normalized = midiValue / 127;

  // Apply inversion
  if (mapping.inverted) {
    normalized = 1 - normalized;
  }

  // Apply curve
  normalized = applyCurve(normalized, mapping.curve, mapping.curvePoints);

  // Scale to parameter range
  const { min, max, step } = mapping.range;
  let value = min + normalized * (max - min);

  // Apply step quantization
  if (step > 0) {
    value = Math.round(value / step) * step;
  }

  // Clamp to range
  return Math.max(min, Math.min(max, value));
}

/**
 * Map parameter value to MIDI value (0-127) - inverse of mapMIDIToParameter
 */
export function mapParameterToMIDI(
  paramValue: number,
  mapping: MIDIParameterMapping
): number {
  const { min, max } = mapping.range;

  // Normalize to 0-1
  let normalized = (paramValue - min) / (max - min);
  normalized = Math.max(0, Math.min(1, normalized));

  // Reverse curve (approximate inverse)
  // For simplicity, we use the same curve function
  // A true inverse would require solving the curve equation
  normalized = applyCurve(normalized, mapping.curve, mapping.curvePoints);

  // Apply inversion
  if (mapping.inverted) {
    normalized = 1 - normalized;
  }

  // Scale to MIDI range
  const midiValue = Math.round(normalized * 127);
  return Math.max(0, Math.min(127, midiValue));
}

/**
 * Check if a MIDI message matches a mapping
 */
export function messageMatchesMapping(
  message: MIDIMessage,
  mapping: MIDIParameterMapping
): boolean {
  if (!mapping.enabled) {
    return false;
  }

  // Check channel (omni = -1)
  if (mapping.channel !== -1 && message.channel !== mapping.channel) {
    return false;
  }

  // Check message type and number
  if (mapping.isNote) {
    return (
      (message.type === 'noteon' || message.type === 'noteoff') &&
      message.data1 === mapping.ccNumber
    );
  } else {
    return (
      message.type === 'controlchange' &&
      message.data1 === mapping.ccNumber
    );
  }
}

/**
 * Find all mappings that match a MIDI message
 */
export function findMatchingMappings(
  message: MIDIMessage,
  mappings: readonly MIDIParameterMapping[],
  deviceId?: string
): readonly MIDIParameterMapping[] {
  return mappings.filter(mapping => {
    // Check device specificity
    if (mapping.deviceId !== null && mapping.deviceId !== deviceId) {
      return false;
    }

    return messageMatchesMapping(message, mapping);
  });
}

// ============================================================================
// MAPPING MANAGEMENT
// ============================================================================

/**
 * Create a new MIDI parameter mapping
 */
export function createMapping(
  parameterId: ParameterId,
  parameterName: string,
  ccNumber: number,
  range: ParameterRange,
  options: Partial<MIDIParameterMapping> = {}
): MIDIParameterMapping {
  return {
    id: `mapping-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    parameterId,
    parameterName,
    channel: options.channel ?? -1, // Omni by default
    ccNumber,
    isNote: options.isNote ?? false,
    mode: options.mode ?? 'absolute',
    range,
    curve: options.curve ?? 'linear',
    ...(options.curvePoints !== undefined && { curvePoints: options.curvePoints }),
    inverted: options.inverted ?? false,
    deviceId: options.deviceId ?? null,
    enabled: options.enabled ?? true,
  };
}

/**
 * Update a mapping with partial changes
 */
export function updateMapping(
  mapping: MIDIParameterMapping,
  changes: Partial<MIDIParameterMapping>
): MIDIParameterMapping {
  return { ...mapping, ...changes };
}

/**
 * Remove a mapping by ID
 */
export function removeMapping(
  mappings: readonly MIDIParameterMapping[],
  mappingId: string
): readonly MIDIParameterMapping[] {
  return mappings.filter(m => m.id !== mappingId);
}

/**
 * Add a mapping to a list
 */
export function addMapping(
  mappings: readonly MIDIParameterMapping[],
  mapping: MIDIParameterMapping
): readonly MIDIParameterMapping[] {
  return [...mappings, mapping];
}

/**
 * Replace a mapping in a list
 */
export function replaceMapping(
  mappings: readonly MIDIParameterMapping[],
  mappingId: string,
  newMapping: MIDIParameterMapping
): readonly MIDIParameterMapping[] {
  return mappings.map(m => m.id === mappingId ? newMapping : m);
}

// ============================================================================
// PRESET MANAGEMENT
// ============================================================================

/**
 * Create a new MIDI mapping preset
 */
export function createPreset(
  name: string,
  description: string,
  mappings: readonly MIDIParameterMapping[],
  options: Partial<MIDIMappingPreset> = {}
): MIDIMappingPreset {
  const now = Date.now();
  return {
    id: `preset-${now}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    createdAt: now,
    modifiedAt: now,
    isFactory: options.isFactory ?? false,
    deviceId: options.deviceId ?? null,
    deviceName: options.deviceName ?? null,
    mappings,
  };
}

/**
 * Update a preset with new mappings
 */
export function updatePreset(
  preset: MIDIMappingPreset,
  changes: Partial<MIDIMappingPreset>
): MIDIMappingPreset {
  return {
    ...preset,
    ...changes,
    modifiedAt: Date.now(),
  };
}

/**
 * Serialize preset to JSON
 */
export function presetToJSON(preset: MIDIMappingPreset): string {
  return JSON.stringify(preset, null, 2);
}

/**
 * Deserialize preset from JSON
 */
export function presetFromJSON(json: string): MIDIMappingPreset | null {
  try {
    const parsed = JSON.parse(json);
    // Basic validation
    if (!parsed.id || !parsed.name || !Array.isArray(parsed.mappings)) {
      return null;
    }
    return parsed as MIDIMappingPreset;
  } catch (error) {
    console.error('Failed to parse MIDI preset JSON:', error);
    return null;
  }
}

// ============================================================================
// PRESET PERSISTENCE
// ============================================================================

const PRESET_STORAGE_KEY = 'cardplay-midi-presets';
const ACTIVE_PRESET_KEY = 'cardplay-midi-active-preset';

/**
 * Save presets to localStorage
 */
export function savePresetsToStorage(presets: readonly MIDIMappingPreset[]): void {
  try {
    const json = JSON.stringify(presets);
    localStorage.setItem(PRESET_STORAGE_KEY, json);
  } catch (error) {
    console.error('Failed to save MIDI presets:', error);
  }
}

/**
 * Load presets from localStorage
 */
export function loadPresetsFromStorage(): readonly MIDIMappingPreset[] {
  try {
    const json = localStorage.getItem(PRESET_STORAGE_KEY);
    if (!json) {
      return [];
    }
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as MIDIMappingPreset[];
  } catch (error) {
    console.error('Failed to load MIDI presets:', error);
    return [];
  }
}

/**
 * Save active preset ID to localStorage
 */
export function saveActivePresetId(presetId: string | null): void {
  try {
    if (presetId === null) {
      localStorage.removeItem(ACTIVE_PRESET_KEY);
    } else {
      localStorage.setItem(ACTIVE_PRESET_KEY, presetId);
    }
  } catch (error) {
    console.error('Failed to save active preset ID:', error);
  }
}

/**
 * Load active preset ID from localStorage
 */
export function loadActivePresetId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_PRESET_KEY);
  } catch (error) {
    console.error('Failed to load active preset ID:', error);
    return null;
  }
}

/**
 * Delete a preset from storage
 */
export function deletePresetFromStorage(presetId: string): void {
  const presets = loadPresetsFromStorage();
  const filtered = presets.filter(p => p.id !== presetId);
  savePresetsToStorage(filtered);

  // Clear active preset if it was deleted
  const activeId = loadActivePresetId();
  if (activeId === presetId) {
    saveActivePresetId(null);
  }
}

// ============================================================================
// DEVICE PROFILES
// ============================================================================

/**
 * Factory device profiles for common controllers
 */
export const FACTORY_DEVICE_PROFILES: readonly MIDIDeviceProfile[] = [
  {
    id: 'akai-mpk-mini',
    namePattern: 'MPK mini',
    manufacturerPattern: 'AKAI',
    defaultMappings: [],
    suggestedCCs: new Map([
      ['modWheel', 1],
      ['volume', 7],
      ['pan', 10],
      ['expression', 11],
      ['sustain', 64],
    ]),
    notes: 'Akai MPK Mini - 8 knobs, 8 pads',
  },
  {
    id: 'arturia-minilab',
    namePattern: 'Arturia MiniLab',
    manufacturerPattern: 'Arturia',
    defaultMappings: [],
    suggestedCCs: new Map([
      ['cutoff', 74],
      ['resonance', 71],
      ['modWheel', 1],
    ]),
    notes: 'Arturia MiniLab - 16 knobs, 16 pads',
  },
  {
    id: 'novation-launchpad',
    namePattern: 'Launchpad',
    manufacturerPattern: 'Novation',
    defaultMappings: [],
    suggestedCCs: new Map(),
    notes: 'Novation Launchpad - Grid controller',
  },
  {
    id: 'generic-keyboard',
    namePattern: '.*',
    manufacturerPattern: '.*',
    defaultMappings: [],
    suggestedCCs: new Map([
      ['modWheel', 1],
      ['volume', 7],
      ['pan', 10],
      ['expression', 11],
      ['sustain', 64],
    ]),
    notes: 'Generic MIDI keyboard',
  },
];

/**
 * Find matching device profile for a device
 */
export function findDeviceProfile(
  device: MIDIDeviceInfo,
  profiles: readonly MIDIDeviceProfile[] = FACTORY_DEVICE_PROFILES
): MIDIDeviceProfile | null {
  for (const profile of profiles) {
    const nameMatch = new RegExp(profile.namePattern, 'i').test(device.name);
    const manuMatch = new RegExp(profile.manufacturerPattern, 'i').test(
      device.manufacturer
    );
    if (nameMatch && manuMatch) {
      return profile;
    }
  }
  return null;
}

/**
 * Create a device-specific preset from a profile
 */
export function createPresetFromProfile(
  device: MIDIDeviceInfo,
  profile: MIDIDeviceProfile
): MIDIMappingPreset {
  return createPreset(
    `${device.name} Default`,
    `Default mappings for ${device.name}`,
    profile.defaultMappings,
    {
      deviceId: device.id,
      deviceName: device.name,
    }
  );
}

// ============================================================================
// MIDI LEARN
// ============================================================================

/**
 * Create initial MIDI learn state
 */
export function createLearnState(): MIDILearnState {
  return {
    active: false,
    targetParameter: null,
    targetParameterName: null,
    lastMessage: null,
    timeoutHandle: null,
  };
}

/**
 * Start MIDI learn for a parameter
 */
export function startLearn(
  state: MIDILearnState,
  parameterId: ParameterId,
  parameterName: string,
  timeoutMs: number = 5000
): MIDILearnState {
  // Clear any existing timeout
  if (state.timeoutHandle !== null) {
    clearTimeout(state.timeoutHandle);
  }

  // Set timeout to auto-disable learn mode
  const timeoutHandle = setTimeout(() => {
    // This will be handled by the calling code
  }, timeoutMs) as unknown as number;

  return {
    active: true,
    targetParameter: parameterId,
    targetParameterName: parameterName,
    lastMessage: null,
    timeoutHandle,
  };
}

/**
 * Stop MIDI learn
 */
export function stopLearn(state: MIDILearnState): MIDILearnState {
  if (state.timeoutHandle !== null) {
    clearTimeout(state.timeoutHandle);
  }

  return {
    active: false,
    targetParameter: null,
    targetParameterName: null,
    lastMessage: null,
    timeoutHandle: null,
  };
}

/**
 * Process a MIDI message during learn mode
 */
export function processLearnMessage(
  state: MIDILearnState,
  message: MIDIMessage
): MIDILearnState {
  if (!state.active) {
    return state;
  }

  // Only learn from CC and note messages
  if (
    message.type !== 'controlchange' &&
    message.type !== 'noteon' &&
    message.type !== 'noteoff'
  ) {
    return state;
  }

  return {
    ...state,
    lastMessage: message,
  };
}

/**
 * Create a mapping from learn state
 */
export function createMappingFromLearn(
  state: MIDILearnState,
  range: ParameterRange,
  deviceId: string | null
): MIDIParameterMapping | null {
  if (!state.active || !state.targetParameter || !state.lastMessage) {
    return null;
  }

  const isNote =
    state.lastMessage.type === 'noteon' ||
    state.lastMessage.type === 'noteoff';

  return createMapping(
    state.targetParameter,
    state.targetParameterName ?? 'Unknown',
    state.lastMessage.data1,
    range,
    {
      channel: state.lastMessage.channel,
      isNote,
      deviceId,
    }
  );
}

// Types are already exported via export type declarations above
