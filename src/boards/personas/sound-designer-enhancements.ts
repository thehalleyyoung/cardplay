/**
 * @fileoverview Sound Designer Persona Enhancements
 * 
 * Deep workflow enhancements for sound designers including
 * modulation routing, preset management, and randomization tools.
 * 
 * @module @cardplay/boards/personas/sound-designer-enhancements
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Parameter snapshot for presets
 */
export interface ParameterSnapshot {
  parameterId: string;
  parameterName: string;
  currentValue: number;
  minValue: number;
  maxValue: number;
}

/**
 * Modulation source types
 */
export type ModulationSource = 
  | 'lfo1' 
  | 'lfo2' 
  | 'env1' 
  | 'env2' 
  | 'velocity' 
  | 'aftertouch' 
  | 'mod-wheel' 
  | 'expression';

/**
 * Modulation destination
 */
export interface ModulationDestination {
  cardId: string;
  parameterId: string;
  parameterName: string;
  currentValue: number;
  minValue: number;
  maxValue: number;
}

/**
 * Modulation connection
 */
export interface ModulationConnection {
  id: string;
  source: ModulationSource;
  destination: ModulationDestination;
  amount: number; // -100 to 100
  enabled: boolean;
}

/**
 * Preset category
 */
export type PresetCategory = 
  | 'bass' 
  | 'lead' 
  | 'pad' 
  | 'pluck' 
  | 'fx' 
  | 'key' 
  | 'perc' 
  | 'misc';

/**
 * Sound preset
 */
export interface SoundPreset {
  id: string;
  name: string;
  category: PresetCategory;
  tags: string[];
  parameters: ParameterSnapshot[];
  modulations: ModulationConnection[];
  description?: string;
  author?: string;
  favorite?: boolean;
}

/**
 * Randomization constraints
 */
export interface RandomizationConstraints {
  parameters?: string[]; // If undefined, randomize all
  preserveTimbre?: boolean; // Keep oscillator types, etc.
  preserveEnvelope?: boolean; // Keep envelope shapes
  preserveFilter?: boolean; // Keep filter settings
  amount?: number; // 0-100, how much to randomize
}

/**
 * Layering suggestion
 */
export interface LayeringSuggestion {
  presetId: string;
  presetName: string;
  reason: string;
  compatibility: number; // 0-100
  recommendation: 'complement' | 'double' | 'texture' | 'harmony';
}

// ============================================================================
// MODULATION MATRIX
// ============================================================================

/** Active modulation connections (in-memory store) */
const modulationConnections = new Map<string, ModulationConnection>();

/**
 * Creates a modulation connection
 */
export function createModulationConnection(
  source: ModulationSource,
  destination: ModulationDestination,
  amount: number = 50
): ModulationConnection {
  const connection: ModulationConnection = {
    id: `mod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source,
    destination,
    amount,
    enabled: true,
  };

  modulationConnections.set(connection.id, connection);
  return connection;
}

/**
 * Updates modulation amount
 */
export function setModulationAmount(connectionId: string, amount: number): void {
  const connection = modulationConnections.get(connectionId);
  if (!connection) return;

  connection.amount = Math.max(-100, Math.min(100, amount));
}

/**
 * Toggles modulation connection on/off
 */
export function toggleModulation(connectionId: string): void {
  const connection = modulationConnections.get(connectionId);
  if (!connection) return;

  connection.enabled = !connection.enabled;
}

/**
 * Removes modulation connection
 */
export function removeModulation(connectionId: string): void {
  modulationConnections.delete(connectionId);
}

/**
 * Gets all modulation connections
 */
export function getAllModulations(): ModulationConnection[] {
  return Array.from(modulationConnections.values());
}

/**
 * Gets modulations for a specific destination
 */
export function getModulationsForDestination(
  cardId: string,
  parameterId: string
): ModulationConnection[] {
  return getAllModulations().filter(
    (mod) =>
      mod.destination.cardId === cardId &&
      mod.destination.parameterId === parameterId
  );
}

// ============================================================================
// PRESET MANAGEMENT
// ============================================================================

/** Preset library (in-memory store) */
const presetLibrary = new Map<string, SoundPreset>();

/**
 * Saves current sound as preset
 */
export function savePreset(
  name: string,
  category: PresetCategory,
  parameters: ParameterSnapshot[],
  tags: string[] = []
): SoundPreset {
  const preset: SoundPreset = {
    id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    category,
    tags,
    parameters,
    modulations: getAllModulations(),
    favorite: false,
  };

  presetLibrary.set(preset.id, preset);
  return preset;
}

/**
 * Loads preset
 */
export function loadPreset(presetId: string): SoundPreset | null {
  return presetLibrary.get(presetId) ?? null;
}

/**
 * Deletes preset
 */
export function deletePreset(presetId: string): void {
  presetLibrary.delete(presetId);
}

/**
 * Toggles preset favorite
 */
export function togglePresetFavorite(presetId: string): void {
  const preset = presetLibrary.get(presetId);
  if (!preset) return;

  preset.favorite = !preset.favorite;
}

/**
 * Searches presets
 */
export function searchPresets(
  query: string,
  category?: PresetCategory,
  tags?: string[]
): SoundPreset[] {
  const results: SoundPreset[] = [];
  const queryLower = query.toLowerCase();

  for (const preset of presetLibrary.values()) {
    // Filter by category
    if (category && preset.category !== category) continue;

    // Filter by tags
    if (tags && tags.length > 0) {
      const hasAllTags = tags.every((tag) => preset.tags.includes(tag));
      if (!hasAllTags) continue;
    }

    // Filter by query
    if (query) {
      const matchesName = preset.name.toLowerCase().includes(queryLower);
      const matchesTags = preset.tags.some((tag) =>
        tag.toLowerCase().includes(queryLower)
      );
      const matchesDescription =
        preset.description?.toLowerCase().includes(queryLower) ?? false;

      if (!matchesName && !matchesTags && !matchesDescription) continue;
    }

    results.push(preset);
  }

  // Sort by favorite, then name
  results.sort((a, b) => {
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return results;
}

/**
 * Gets presets by category
 */
export function getPresetsByCategory(category: PresetCategory): SoundPreset[] {
  return searchPresets('', category);
}

// ============================================================================
// RANDOMIZATION
// ============================================================================

/**
 * Randomizes parameters with constraints
 */
export function randomizeWithConstraints(
  parameters: ParameterSnapshot[],
  constraints: RandomizationConstraints = {}
): ParameterSnapshot[] {
  const amount = constraints.amount ?? 50;
  const parametersToRandomize = constraints.parameters ?? parameters.map((p) => p.parameterId);

  return parameters.map((param) => {
    // Skip if not in allowed list
    if (!parametersToRandomize.includes(param.parameterId)) {
      return param;
    }

    // Skip if constrained
    const paramName = param.parameterId.toLowerCase();
    if (constraints.preserveTimbre && paramName.includes('oscillator')) {
      return param;
    }
    if (constraints.preserveEnvelope && paramName.includes('envelope')) {
      return param;
    }
    if (constraints.preserveFilter && paramName.includes('filter')) {
      return param;
    }

    // Randomize value
    const range = param.maxValue - param.minValue;
    const randomValue = Math.random() * range + param.minValue;

    // Interpolate between current and random based on amount
    const interpolated =
      param.currentValue + (randomValue - param.currentValue) * (amount / 100);

    return {
      ...param,
      currentValue: Math.max(param.minValue, Math.min(param.maxValue, interpolated)),
    };
  });
}

/**
 * Randomizes all parameters
 */
export function randomizeAll(parameters: ParameterSnapshot[]): ParameterSnapshot[] {
  return randomizeWithConstraints(parameters, { amount: 100 });
}

/**
 * Slightly randomizes for variation
 */
export function slightRandomize(parameters: ParameterSnapshot[]): ParameterSnapshot[] {
  return randomizeWithConstraints(parameters, { amount: 20 });
}

// ============================================================================
// LAYERING SUGGESTIONS
// ============================================================================

/**
 * Analyzes current sound and suggests complementary presets for layering
 */
export function suggestLayers(
  currentParameters: ParameterSnapshot[],
  maxSuggestions: number = 5
): LayeringSuggestion[] {
  const suggestions: LayeringSuggestion[] = [];

  // Analyze current sound characteristics
  const currentCharacteristics = analyzeSoundCharacteristics(currentParameters);

  // Find complementary presets
  for (const preset of presetLibrary.values()) {
    const presetCharacteristics = analyzeSoundCharacteristics(preset.parameters);
    const compatibility = calculateCompatibility(
      currentCharacteristics,
      presetCharacteristics
    );

    if (compatibility > 50) {
      const recommendation = determineRecommendation(
        currentCharacteristics,
        presetCharacteristics
      );
      suggestions.push({
        presetId: preset.id,
        presetName: preset.name,
        reason: generateRecommendationReason(recommendation, compatibility),
        compatibility,
        recommendation,
      });
    }
  }

  // Sort by compatibility and return top suggestions
  suggestions.sort((a, b) => b.compatibility - a.compatibility);
  return suggestions.slice(0, maxSuggestions);
}

/**
 * Analyzes sound characteristics
 */
function analyzeSoundCharacteristics(parameters: ParameterSnapshot[]): {
  brightness: number;
  thickness: number;
  attack: number;
  sustain: number;
  stereoWidth: number;
} {
  // Simplified analysis - would be more sophisticated in production
  const brightness = parameters.find((p) => p.parameterId.includes('cutoff'))?.currentValue ?? 50;
  const thickness = parameters.find((p) => p.parameterId.includes('resonance'))?.currentValue ?? 50;
  const attack = parameters.find((p) => p.parameterId.includes('attack'))?.currentValue ?? 50;
  const sustain = parameters.find((p) => p.parameterId.includes('sustain'))?.currentValue ?? 50;
  const stereoWidth = parameters.find((p) => p.parameterId.includes('width'))?.currentValue ?? 50;

  return { brightness, thickness, attack, sustain, stereoWidth };
}

/**
 * Calculates compatibility score between two sounds
 */
function calculateCompatibility(
  current: ReturnType<typeof analyzeSoundCharacteristics>,
  other: ReturnType<typeof analyzeSoundCharacteristics>
): number {
  // Complementary sounds have opposite characteristics
  const brightnessDiff = Math.abs(current.brightness - (100 - other.brightness));
  const thicknessDiff = Math.abs(current.thickness - other.thickness);
  const attackDiff = Math.abs(current.attack - other.attack);

  // Lower difference = better complement
  const avgDiff = (brightnessDiff + thicknessDiff + attackDiff) / 3;
  return 100 - avgDiff;
}

/**
 * Determines recommendation type
 */
function determineRecommendation(
  current: ReturnType<typeof analyzeSoundCharacteristics>,
  other: ReturnType<typeof analyzeSoundCharacteristics>
): 'complement' | 'double' | 'texture' | 'harmony' {
  if (Math.abs(current.brightness - other.brightness) > 40) {
    return 'complement';
  }
  if (Math.abs(current.attack - other.attack) < 20) {
    return 'double';
  }
  if (other.stereoWidth > 70) {
    return 'texture';
  }
  return 'harmony';
}

/**
 * Generates human-readable recommendation reason
 */
function generateRecommendationReason(
  recommendation: string,
  _compatibility: number
): string {
  const reasons: Record<string, string> = {
    complement: 'Complements with opposite brightness characteristics',
    double: 'Doubles your sound with similar attack envelope',
    texture: 'Adds textural width and space',
    harmony: 'Provides harmonic support',
  };

  return reasons[recommendation] ?? 'Good match';
}

// ============================================================================
// MACRO ASSIGNMENT
// ============================================================================

/**
 * Macro control definition
 */
export interface MacroControl {
  id: string;
  name: string;
  value: number; // 0-100
  assignments: MacroAssignment[];
}

/**
 * Macro assignment
 */
export interface MacroAssignment {
  parameterId: string;
  minValue: number;
  maxValue: number;
  curve: 'linear' | 'exponential' | 'logarithmic';
}

/**
 * Creates macro assignments for common workflows
 */
export function createMacroAssignmentWizard(
  preset: 'cutoff-res' | 'attack-release' | 'depth' | 'movement'
): MacroControl {
  const macros: Record<string, MacroControl> = {
    'cutoff-res': {
      id: 'macro-cutoff-res',
      name: 'Filter',
      value: 50,
      assignments: [
        { parameterId: 'filter-cutoff', minValue: 20, maxValue: 100, curve: 'exponential' },
        { parameterId: 'filter-resonance', minValue: 0, maxValue: 80, curve: 'linear' },
      ],
    },
    'attack-release': {
      id: 'macro-attack-release',
      name: 'Envelope',
      value: 50,
      assignments: [
        { parameterId: 'env1-attack', minValue: 0, maxValue: 1000, curve: 'logarithmic' },
        { parameterId: 'env1-release', minValue: 10, maxValue: 2000, curve: 'logarithmic' },
      ],
    },
    depth: {
      id: 'macro-depth',
      name: 'Modulation Depth',
      value: 50,
      assignments: [
        { parameterId: 'lfo1-amount', minValue: 0, maxValue: 100, curve: 'linear' },
        { parameterId: 'lfo2-amount', minValue: 0, maxValue: 100, curve: 'linear' },
      ],
    },
    movement: {
      id: 'macro-movement',
      name: 'Movement',
      value: 50,
      assignments: [
        { parameterId: 'lfo1-rate', minValue: 0.1, maxValue: 10, curve: 'exponential' },
        { parameterId: 'filter-cutoff', minValue: 30, maxValue: 90, curve: 'linear' },
      ],
    },
  };

  const macro = macros[preset];
  if (!macro) {
    return {
      id: `macro-${preset}`,
      name: preset,
      value: 50,
      assignments: [],
    };
  }
  return macro;
}
