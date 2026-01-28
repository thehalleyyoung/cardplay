/**
 * @fileoverview Surge Wavetable & Preset Downloader
 * 
 * Downloads and catalogs all Surge wavetables and presets:
 * - Factory wavetables from surge-synthesizer/surge repo
 * - 3rd party wavetables (A.Liv, etc.)
 * - Preset parameter extraction
 * - Wavetable metadata cataloging
 * 
 * @module @cardplay/core/audio/surge-assets
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Surge GitHub raw content base URL */
const SURGE_RAW_BASE = 'https://raw.githubusercontent.com/surge-synthesizer/surge/main';

/** Surge wavetable directories */
export const SURGE_WAVETABLE_PATHS = {
  factory: `${SURGE_RAW_BASE}/resources/data/wavetables`,
  thirdParty: `${SURGE_RAW_BASE}/resources/data/wavetables_3rdparty`,
} as const;

/** Surge preset/patch directories */
export const SURGE_PATCH_PATHS = {
  factory: `${SURGE_RAW_BASE}/resources/data/patches_factory`,
  thirdParty: `${SURGE_RAW_BASE}/resources/data/patches_3rdparty`,
} as const;

/** GitHub API base for directory listing */
const GITHUB_API_BASE = 'https://api.github.com/repos/surge-synthesizer/surge/contents';

/** Known factory wavetable categories (from Surge source) */
export const FACTORY_WAVETABLE_CATEGORIES = [
  'basic',
  'sampled',
  'voice',
  'windows',
  'FM',
  'special',
] as const;

/** Known 3rd party wavetable contributors */
export const THIRD_PARTY_CONTRIBUTORS = [
  'A.Liv',
  'Jacky Ligon',
  'Venus Theory',
  // Add more as discovered
] as const;

/** Surge oscillator types */
export const SURGE_OSC_TYPES = {
  ot_classic: 0,
  ot_sine: 1,
  ot_wavetable: 2,
  ot_shnoise: 3,
  ot_audioinput: 4,
  ot_FM3: 5,
  ot_FM2: 6,
  ot_window: 7,
  ot_modern: 8,
  ot_string: 9,
  ot_twist: 10,
  ot_alias: 11,
  ot_phase_mod: 12,
} as const;

/** Surge filter types */
export const SURGE_FILTER_TYPES = {
  fut_none: 0,
  fut_lp12: 1,
  fut_lp24: 2,
  fut_lpmoog: 3,
  fut_hp12: 4,
  fut_hp24: 5,
  fut_bp12: 6,
  fut_bp24: 7,
  fut_notch12: 8,
  fut_notch24: 9,
  fut_comb_pos: 10,
  fut_comb_neg: 11,
  fut_SNH: 12,
  fut_vintageladder: 13,
  fut_obxd_2pole: 14,
  fut_obxd_4pole: 15,
  fut_k35_lp: 16,
  fut_k35_hp: 17,
  fut_diode: 18,
  fut_cutoffwarp_lp: 19,
  fut_cutoffwarp_hp: 20,
  fut_cutoffwarp_n: 21,
  fut_cutoffwarp_bp: 22,
  fut_resonancewarp_lp: 23,
  fut_resonancewarp_hp: 24,
  fut_resonancewarp_n: 25,
  fut_resonancewarp_bp: 26,
  fut_tripole: 27,
} as const;

/** Surge FX types */
export const SURGE_FX_TYPES = {
  fxt_off: 0,
  fxt_delay: 1,
  fxt_reverb: 2,
  fxt_phaser: 3,
  fxt_rotaryspeaker: 4,
  fxt_distortion: 5,
  fxt_eq: 6,
  fxt_freqshift: 7,
  fxt_conditioner: 8,
  fxt_chorus4: 9,
  fxt_vocoder: 10,
  fxt_reverb2: 11,
  fxt_flanger: 12,
  fxt_ringmod: 13,
  fxt_airwindows: 14,
  fxt_neuron: 15,
  fxt_geq11: 16,
  fxt_resonator: 17,
  fxt_chow: 18,
  fxt_exciter: 19,
  fxt_ensemble: 20,
  fxt_combulator: 21,
  fxt_nimbus: 22,
  fxt_tape: 23,
  fxt_treemonster: 24,
  fxt_waveshaper: 25,
  fxt_mstool: 26,
  fxt_spring_reverb: 27,
  fxt_bonsai: 28,
  fxt_audio_input: 29,
  fxt_floaty_delay: 30,
  fxt_convolution: 31,
} as const;

/** Wavetable oscillator parameters (from WavetableOscillator.h) */
export const WT_OSC_PARAMS = {
  wt_morph: 0,       // Morph / Frame position
  wt_skewv: 1,       // Vertical skew / Saturation
  wt_saturate: 2,    // Saturation drive
  wt_formant: 3,     // Formant shift
  wt_skewh: 4,       // Horizontal skew
  wt_unison_detune: 5, // Unison detune
  wt_unison_voices: 6, // Unison voice count
} as const;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Wavetable file metadata.
 */
export interface WavetableMetadata {
  /** File path relative to wavetables directory */
  path: string;
  /** Display name */
  name: string;
  /** Category/folder */
  category: string;
  /** Is third-party content */
  isThirdParty: boolean;
  /** Third-party contributor name (if applicable) */
  contributor?: string;
  /** File size in bytes */
  size?: number;
  /** Frame count (if known) */
  frameCount?: number;
  /** Frame size (if known) */
  frameSize?: number;
  /** SHA hash for caching */
  sha?: string;
  /** Download URL */
  downloadUrl: string;
  /** File extension */
  extension: 'wt' | 'wav';
}

/**
 * Oscillator settings in a preset.
 */
export interface OscillatorSettings {
  /** Oscillator type */
  type: number;
  /** Type name */
  typeName: string;
  /** Wavetable path (if wavetable osc) */
  wavetablePath?: string;
  /** Wavetable name */
  wavetableName?: string;
  /** Pitch offset in semitones */
  pitch: number;
  /** Octave offset */
  octave: number;
  /** Parameters (type-specific) */
  params: Record<string, number>;
  /** Is this oscillator enabled/active */
  enabled: boolean;
}

/**
 * Filter settings in a preset.
 */
export interface FilterSettings {
  /** Filter type */
  type: number;
  /** Type name */
  typeName: string;
  /** Cutoff frequency (0-1 normalized) */
  cutoff: number;
  /** Resonance (0-1 normalized) */
  resonance: number;
  /** Key tracking amount */
  keytrack: number;
  /** Balance (for dual filter) */
  balance?: number;
  /** Subtype/mode */
  subtype: number;
}

/**
 * Envelope settings.
 */
export interface EnvelopeSettings {
  /** Attack time */
  attack: number;
  /** Decay time */
  decay: number;
  /** Sustain level */
  sustain: number;
  /** Release time */
  release: number;
  /** Attack shape */
  attackShape?: number;
  /** Decay shape */
  decayShape?: number;
  /** Release shape */
  releaseShape?: number;
}

/**
 * LFO settings.
 */
export interface LFOSettings {
  /** LFO shape/waveform */
  shape: number;
  /** Rate (Hz or tempo-synced value) */
  rate: number;
  /** Is tempo-synced */
  tempoSync: boolean;
  /** Start phase */
  phase: number;
  /** Magnitude/depth */
  magnitude: number;
  /** Deform amount */
  deform: number;
  /** Trigger mode */
  triggerMode: number;
  /** Unipolar mode */
  unipolar: boolean;
}

/**
 * FX slot settings.
 */
export interface FXSettings {
  /** FX type */
  type: number;
  /** Type name */
  typeName: string;
  /** Parameters (type-specific) */
  params: Record<string, number>;
}

/**
 * Scene (A or B) settings.
 */
export interface SceneSettings {
  /** Scene name */
  name: string;
  /** Oscillators (1-3) */
  oscillators: OscillatorSettings[];
  /** Filters (1-2) */
  filters: FilterSettings[];
  /** Filter routing */
  filterRouting: number;
  /** Amplitude envelope */
  ampEnvelope: EnvelopeSettings;
  /** Filter envelope */
  filterEnvelope: EnvelopeSettings;
  /** Pitch envelope */
  pitchEnvelope?: EnvelopeSettings;
  /** LFOs (up to 6) */
  lfos: LFOSettings[];
  /** Voice mode (poly/mono/etc) */
  polyMode: number;
  /** Portamento time */
  portamento: number;
  /** Pitch bend range */
  pitchBendRange: number;
  /** Oscillator drift amount */
  drift: number;
  /** Noise color */
  noiseColor: number;
  /** Scene output level */
  level: number;
  /** Scene pan */
  pan: number;
  /** Scene width */
  width: number;
}

/**
 * Complete preset/patch data.
 */
export interface SurgePreset {
  /** Preset file path */
  path: string;
  /** Display name */
  name: string;
  /** Category */
  category: string;
  /** Author */
  author?: string;
  /** Comments/description */
  comment?: string;
  /** Scene A settings */
  sceneA: SceneSettings;
  /** Scene B settings */
  sceneB: SceneSettings;
  /** Active scene */
  activeScene: 'A' | 'B';
  /** Scene mode (single, split, dual, etc) */
  sceneMode: number;
  /** Global FX (8 slots) */
  fx: FXSettings[];
  /** Master volume */
  masterVolume: number;
  /** Polyphony limit */
  polyphonyLimit: number;
  /** Split point (if split mode) */
  splitPoint?: number;
  /** Tuning file (if custom) */
  tuningFile?: string;
  /** Mapping file (if custom) */
  mappingFile?: string;
}

/**
 * Wavetable catalog entry.
 */
export interface WavetableCatalogEntry extends WavetableMetadata {
  /** Presets that use this wavetable */
  usedByPresets: string[];
}

/**
 * Complete Surge asset catalog.
 */
export interface SurgeAssetCatalog {
  /** All available wavetables */
  wavetables: WavetableCatalogEntry[];
  /** All available presets */
  presets: SurgePreset[];
  /** Wavetable categories */
  wavetableCategories: string[];
  /** Preset categories */
  presetCategories: string[];
  /** Third-party contributors */
  contributors: string[];
  /** Catalog version */
  version: string;
  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * Download progress callback.
 */
export type DownloadProgressCallback = (
  current: number,
  total: number,
  item: string
) => void;

// ============================================================================
// GITHUB API HELPERS
// ============================================================================

/**
 * GitHub directory listing item.
 */
interface GitHubItem {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  download_url: string | null;
  type: 'file' | 'dir';
}

/**
 * Fetch directory listing from GitHub API.
 */
export async function fetchGitHubDirectory(
  path: string,
  branch: string = 'main'
): Promise<GitHubItem[]> {
  const url = `${GITHUB_API_BASE}/${path}?ref=${branch}`;
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      // Add GitHub token if available for higher rate limits
      // 'Authorization': `token ${process.env.GITHUB_TOKEN}`,
    },
  });
  
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('GitHub API rate limit exceeded');
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Recursively list all files in a GitHub directory.
 */
export async function listAllFiles(
  basePath: string,
  extensions: string[] = ['.wt', '.wav'],
  progress?: DownloadProgressCallback
): Promise<GitHubItem[]> {
  const allFiles: GitHubItem[] = [];
  const queue: string[] = [basePath];
  let processed = 0;
  
  while (queue.length > 0) {
    const currentPath = queue.shift()!;
    
    try {
      const items = await fetchGitHubDirectory(currentPath);
      
      for (const item of items) {
        if (item.type === 'dir') {
          queue.push(item.path);
        } else if (item.type === 'file') {
          const ext = item.name.toLowerCase().slice(item.name.lastIndexOf('.'));
          if (extensions.some(e => e.toLowerCase() === ext)) {
            allFiles.push(item);
          }
        }
      }
      
      processed++;
      if (progress) {
        progress(processed, processed + queue.length, currentPath);
      }
      
      // Rate limiting - GitHub API has limits
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.warn(`Error listing ${currentPath}:`, error);
    }
  }
  
  return allFiles;
}

// ============================================================================
// WAVETABLE CATALOGING
// ============================================================================

/**
 * Parse wavetable metadata from GitHub item.
 */
export function parseWavetableMetadata(
  item: GitHubItem,
  isThirdParty: boolean
): WavetableMetadata {
  const fileName = item.name;
  const nameWithoutExt = fileName.replace(/\.(wt|wav)$/i, '');
  
  // Determine category from path
  let category: string;
  let contributor: string | undefined;
  
  if (isThirdParty) {
    // Third party: wavetables_3rdparty/Contributor/Category/file.wt
    const relativePath = item.path.replace('resources/data/wavetables_3rdparty/', '');
    const parts = relativePath.split('/');
    contributor = parts[0];
    category = parts.length > 2 ? parts.slice(0, -1).join('/') : parts[0] || 'Uncategorized';
  } else {
    // Factory: wavetables/category/file.wt
    const relativePath = item.path.replace('resources/data/wavetables/', '');
    const parts = relativePath.split('/');
    category = parts.length > 1 ? parts.slice(0, -1).join('/') : 'root';
  }
  
  const extension = fileName.toLowerCase().endsWith('.wt') ? 'wt' : 'wav';
  
  return {
    path: item.path,
    name: nameWithoutExt,
    category,
    isThirdParty,
    ...(contributor && { contributor }),
    size: item.size,
    sha: item.sha,
    downloadUrl: item.download_url || `${SURGE_RAW_BASE}/${item.path}`,
    extension,
  };
}

/**
 * Scan all Surge wavetables and build catalog.
 */
export async function scanWavetables(
  progress?: DownloadProgressCallback
): Promise<WavetableMetadata[]> {
  const wavetables: WavetableMetadata[] = [];
  
  // Scan factory wavetables
  if (progress) progress(0, 2, 'Scanning factory wavetables...');
  
  try {
    const factoryFiles = await listAllFiles('resources/data/wavetables', ['.wt', '.wav']);
    for (const file of factoryFiles) {
      wavetables.push(parseWavetableMetadata(file, false));
    }
  } catch (error) {
    console.warn('Error scanning factory wavetables:', error);
  }
  
  // Scan third-party wavetables
  if (progress) progress(1, 2, 'Scanning third-party wavetables...');
  
  try {
    const thirdPartyFiles = await listAllFiles('resources/data/wavetables_3rdparty', ['.wt', '.wav']);
    for (const file of thirdPartyFiles) {
      wavetables.push(parseWavetableMetadata(file, true));
    }
  } catch (error) {
    console.warn('Error scanning third-party wavetables:', error);
  }
  
  return wavetables;
}

// ============================================================================
// PRESET PARSING (XML-based)
// ============================================================================

/**
 * Parse FXP preset file header.
 */
export function parseFXPHeader(buffer: ArrayBuffer): {
  valid: boolean;
  chunkMagic: string;
  byteSize: number;
  fxMagic: string;
  version: number;
  fxID: string;
  fxVersion: number;
  numParams: number;
  prgName: string;
  chunkSize: number;
  dataOffset: number;
} | null {
  if (buffer.byteLength < 60) return null;
  
  const view = new DataView(buffer);
  
  // FXP header is big-endian
  const chunkMagic = String.fromCharCode(
    view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3)
  );
  
  if (chunkMagic !== 'CcnK') return null;
  
  const byteSize = view.getUint32(4, false); // big-endian
  const fxMagic = String.fromCharCode(
    view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11)
  );
  
  // FXP can be 'FxCk' (params) or 'FPCh' (chunk/opaque)
  if (fxMagic !== 'FxCk' && fxMagic !== 'FPCh') return null;
  
  const version = view.getUint32(12, false);
  const fxID = String.fromCharCode(
    view.getUint8(16), view.getUint8(17), view.getUint8(18), view.getUint8(19)
  );
  const fxVersion = view.getUint32(20, false);
  const numParams = view.getUint32(24, false);
  
  // Program name (28 bytes, null-terminated)
  let prgName = '';
  for (let i = 0; i < 28; i++) {
    const c = view.getUint8(28 + i);
    if (c === 0) break;
    prgName += String.fromCharCode(c);
  }
  
  let chunkSize = 0;
  let dataOffset = 56;
  
  if (fxMagic === 'FPCh') {
    chunkSize = view.getUint32(56, false);
    dataOffset = 60;
  }
  
  return {
    valid: true,
    chunkMagic,
    byteSize,
    fxMagic,
    version,
    fxID,
    fxVersion,
    numParams,
    prgName,
    chunkSize,
    dataOffset,
  };
}

/**
 * Extract XML from Surge FXP preset.
 * Surge stores preset data as XML inside the FXP chunk.
 */
export function extractSurgeXML(buffer: ArrayBuffer): string | null {
  const header = parseFXPHeader(buffer);
  if (!header || header.fxMagic !== 'FPCh') return null;
  
  const decoder = new TextDecoder('utf-8');
  
  // Find XML start (look for "<?xml" or "<patch")
  const data = new Uint8Array(buffer, header.dataOffset);
  let xmlStart = -1;
  
  for (let i = 0; i < Math.min(data.length, 1000); i++) {
    if (data[i] === 0x3C) { // '<'
      const preview = decoder.decode(data.slice(i, i + 10));
      if (preview.startsWith('<?xml') || preview.startsWith('<patch')) {
        xmlStart = i;
        break;
      }
    }
  }
  
  if (xmlStart === -1) return null;
  
  // Find XML end (look for closing tag or null byte)
  let xmlEnd = data.length;
  for (let i = data.length - 1; i > xmlStart; i--) {
    if (data[i] === 0x3E) { // '>'
      xmlEnd = i + 1;
      break;
    }
    if (data[i] !== 0) {
      xmlEnd = i + 1;
      break;
    }
  }
  
  return decoder.decode(data.slice(xmlStart, xmlEnd));
}

/**
 * Parse Surge preset XML into structured data.
 */
export function parseSurgePresetXML(xml: string, filePath: string): SurgePreset | null {
  // Simple XML parsing - in production would use proper XML parser
  const getAttr = (element: string, attr: string): string | null => {
    const regex = new RegExp(`${attr}="([^"]*)"`, 'i');
    const match = element.match(regex);
    return match && match[1] !== undefined ? match[1] : null;
  };
  
  const getFloatAttr = (element: string, attr: string, def: number = 0): number => {
    const val = getAttr(element, attr);
    return val !== null ? parseFloat(val) : def;
  };
  
  const getIntAttr = (element: string, attr: string, def: number = 0): number => {
    const val = getAttr(element, attr);
    return val !== null ? parseInt(val, 10) : def;
  };
  
  // Extract patch element
  const patchMatch = xml.match(/<patch[^>]*>([\s\S]*?)<\/patch>/i);
  if (!patchMatch) return null;
  
  const patchContent = patchMatch[1]!;
  const patchElement = xml.match(/<patch[^>]*>/i)?.[0] || '';
  
  const name = getAttr(patchElement, 'name') || filePath.split('/').pop()?.replace('.fxp', '') || 'Unknown';
  const category = getAttr(patchElement, 'category') || 'Uncategorized';
  const authorVal = getAttr(patchElement, 'author');
  const author = authorVal !== null ? authorVal : undefined;
  const commentVal = getAttr(patchElement, 'comment');
  const comment = commentVal !== null ? commentVal : undefined;
  
  // Parse scenes
  const parseScene = (sceneXml: string, sceneName: string): SceneSettings => {
    const oscillators: OscillatorSettings[] = [];
    
    // Parse oscillators
    const oscMatches = sceneXml.matchAll(/<osc[^>]*>/gi);
    for (const oscMatch of oscMatches) {
      const oscElement = oscMatch[0];
      const oscType = getIntAttr(oscElement, 'type', 0);
      
      const osc: OscillatorSettings = {
        type: oscType,
        typeName: Object.entries(SURGE_OSC_TYPES).find(([_, v]) => v === oscType)?.[0] || 'unknown',
        pitch: getFloatAttr(oscElement, 'pitch', 0),
        octave: getIntAttr(oscElement, 'octave', 0),
        params: {},
        enabled: true,
      };
      
      // Extract wavetable info if present
      const wtName = getAttr(oscElement, 'wavetable_display_name');
      if (wtName) osc.wavetableName = wtName;
      
      oscillators.push(osc);
    }
    
    // Ensure we have 3 oscillators
    while (oscillators.length < 3) {
      oscillators.push({
        type: 0,
        typeName: 'ot_classic',
        pitch: 0,
        octave: 0,
        params: {},
        enabled: false,
      });
    }
    
    // Parse filters
    const filters: FilterSettings[] = [];
    const filterMatches = sceneXml.matchAll(/<filter[^>]*>/gi);
    for (const filterMatch of filterMatches) {
      const filterElement = filterMatch[0];
      const filterType = getIntAttr(filterElement, 'type', 0);
      
      filters.push({
        type: filterType,
        typeName: Object.entries(SURGE_FILTER_TYPES).find(([_, v]) => v === filterType)?.[0] || 'unknown',
        cutoff: getFloatAttr(filterElement, 'cutoff', 0.5),
        resonance: getFloatAttr(filterElement, 'resonance', 0),
        keytrack: getFloatAttr(filterElement, 'keytrack', 0),
        subtype: getIntAttr(filterElement, 'subtype', 0),
      });
    }
    
    // Ensure we have 2 filters
    while (filters.length < 2) {
      filters.push({
        type: 0,
        typeName: 'fut_none',
        cutoff: 0.5,
        resonance: 0,
        keytrack: 0,
        subtype: 0,
      });
    }
    
    return {
      name: sceneName,
      oscillators,
      filters,
      filterRouting: 0,
      ampEnvelope: { attack: 0, decay: 0.5, sustain: 1, release: 0.3 },
      filterEnvelope: { attack: 0, decay: 0.5, sustain: 0.5, release: 0.3 },
      lfos: [],
      polyMode: 0,
      portamento: 0,
      pitchBendRange: 2,
      drift: 0,
      noiseColor: 0,
      level: 1,
      pan: 0,
      width: 1,
    };
  };
  
  // Extract scene A
  const sceneAMatch = patchContent.match(/<scene[^>]*id="0"[^>]*>([\s\S]*?)<\/scene>/i) ||
                       patchContent.match(/<scene[^>]*>([\s\S]*?)<\/scene>/i);
  const sceneA = sceneAMatch ? parseScene(sceneAMatch[1]!, 'Scene A') : {
    name: 'Scene A',
    oscillators: [],
    filters: [],
    filterRouting: 0,
    ampEnvelope: { attack: 0, decay: 0.5, sustain: 1, release: 0.3 },
    filterEnvelope: { attack: 0, decay: 0.5, sustain: 0.5, release: 0.3 },
    lfos: [],
    polyMode: 0,
    portamento: 0,
    pitchBendRange: 2,
    drift: 0,
    noiseColor: 0,
    level: 1,
    pan: 0,
    width: 1,
  };
  
  // Scene B (similar parsing)
  const sceneBMatch = patchContent.match(/<scene[^>]*id="1"[^>]*>([\s\S]*?)<\/scene>/i);
  const sceneB = sceneBMatch ? parseScene(sceneBMatch[1]!, 'Scene B') : { ...sceneA, name: 'Scene B' };
  
  return {
    path: filePath,
    name,
    category,
    ...(author && { author }),
    ...(comment && { comment }),
    sceneA,
    sceneB,
    activeScene: 'A',
    sceneMode: 0,
    fx: [],
    masterVolume: 1,
    polyphonyLimit: 16,
  };
}

// ============================================================================
// ASSET DOWNLOAD
// ============================================================================

/**
 * Download a single wavetable file.
 */
export async function downloadWavetable(
  metadata: WavetableMetadata
): Promise<ArrayBuffer> {
  const response = await fetch(metadata.downloadUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to download ${metadata.name}: ${response.status}`);
  }
  
  return response.arrayBuffer();
}

/**
 * Download multiple wavetables with progress tracking.
 */
export async function downloadWavetables(
  wavetables: WavetableMetadata[],
  progress?: DownloadProgressCallback,
  concurrency: number = 3
): Promise<Map<string, ArrayBuffer>> {
  const results = new Map<string, ArrayBuffer>();
  const queue = [...wavetables];
  let completed = 0;
  
  const worker = async () => {
    while (queue.length > 0) {
      const wt = queue.shift();
      if (!wt) break;
      
      try {
        const data = await downloadWavetable(wt);
        results.set(wt.path, data);
      } catch (error) {
        console.warn(`Failed to download ${wt.name}:`, error);
      }
      
      completed++;
      if (progress) {
        progress(completed, wavetables.length, wt.name);
      }
    }
  };
  
  // Run concurrent workers
  const workers = Array(concurrency).fill(null).map(() => worker());
  await Promise.all(workers);
  
  return results;
}

// ============================================================================
// PRESET SCANNING
// ============================================================================

/**
 * Scan all Surge presets and build catalog.
 */
export async function scanPresets(
  progress?: DownloadProgressCallback
): Promise<Array<{ path: string; downloadUrl: string }>> {
  const presets: Array<{ path: string; downloadUrl: string }> = [];
  
  // Scan factory presets
  if (progress) progress(0, 2, 'Scanning factory presets...');
  
  try {
    const factoryFiles = await listAllFiles('resources/data/patches_factory', ['.fxp']);
    for (const file of factoryFiles) {
      presets.push({
        path: file.path,
        downloadUrl: file.download_url || `${SURGE_RAW_BASE}/${file.path}`,
      });
    }
  } catch (error) {
    console.warn('Error scanning factory presets:', error);
  }
  
  // Scan third-party presets
  if (progress) progress(1, 2, 'Scanning third-party presets...');
  
  try {
    const thirdPartyFiles = await listAllFiles('resources/data/patches_3rdparty', ['.fxp']);
    for (const file of thirdPartyFiles) {
      presets.push({
        path: file.path,
        downloadUrl: file.download_url || `${SURGE_RAW_BASE}/${file.path}`,
      });
    }
  } catch (error) {
    console.warn('Error scanning third-party presets:', error);
  }
  
  return presets;
}

// ============================================================================
// CATALOG GENERATION
// ============================================================================

/**
 * Build complete Surge asset catalog.
 * Note: preset parsing requires downloading FXP files, which is done separately.
 */
export async function buildSurgeAssetCatalog(
  progress?: DownloadProgressCallback
): Promise<SurgeAssetCatalog> {
  const wavetables = await scanWavetables(progress);
  // Note: scanPresets returns file listing only; actual preset parsing
  // requires downloading individual FXP files
  await scanPresets(progress);
  
  // Extract unique categories
  const wavetableCategories = [...new Set(wavetables.map(wt => wt.category))].sort();
  const contributors = [...new Set(wavetables.filter(wt => wt.contributor).map(wt => wt.contributor!))].sort();
  
  // Create catalog entries
  const catalogEntries: WavetableCatalogEntry[] = wavetables.map(wt => ({
    ...wt,
    usedByPresets: [], // Would be populated by parsing presets
  }));
  
  return {
    wavetables: catalogEntries,
    presets: [], // Would be populated by downloading and parsing presets
    wavetableCategories,
    presetCategories: [],
    contributors,
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
  };
}

// ============================================================================
// KNOWN WAVETABLES (Static list for offline use)
// ============================================================================

/**
 * Known factory wavetables (partial list for offline reference).
 * This can be used when GitHub API is unavailable.
 */
export const KNOWN_FACTORY_WAVETABLES: Partial<WavetableMetadata>[] = [
  // Basic
  { name: 'Sine', category: 'basic', path: 'resources/data/wavetables/basic/Sine.wt' },
  { name: 'Saw', category: 'basic', path: 'resources/data/wavetables/basic/Saw.wt' },
  { name: 'Square', category: 'basic', path: 'resources/data/wavetables/basic/Square.wt' },
  { name: 'Triangle', category: 'basic', path: 'resources/data/wavetables/basic/Triangle.wt' },
  
  // Sampled
  { name: 'Cello', category: 'sampled', path: 'resources/data/wavetables/sampled/cello.wt' },
  { name: 'Choir', category: 'sampled', path: 'resources/data/wavetables/sampled/choir.wt' },
  { name: 'Flute', category: 'sampled', path: 'resources/data/wavetables/sampled/flute.wt' },
  { name: 'Oboe', category: 'sampled', path: 'resources/data/wavetables/sampled/oboe.wt' },
  { name: 'Piano', category: 'sampled', path: 'resources/data/wavetables/sampled/piano.wt' },
  { name: 'Violin', category: 'sampled', path: 'resources/data/wavetables/sampled/violin.wt' },
  
  // Voice
  { name: 'Ahh', category: 'voice', path: 'resources/data/wavetables/voice/ahh.wt' },
  { name: 'Eeh', category: 'voice', path: 'resources/data/wavetables/voice/eeh.wt' },
  { name: 'Ohh', category: 'voice', path: 'resources/data/wavetables/voice/ohh.wt' },
  
  // FM
  { name: 'FM1', category: 'FM', path: 'resources/data/wavetables/FM/FM1.wt' },
  { name: 'FM2', category: 'FM', path: 'resources/data/wavetables/FM/FM2.wt' },
  { name: 'FM3', category: 'FM', path: 'resources/data/wavetables/FM/FM3.wt' },
  
  // Windows
  { name: 'Hanning', category: 'windows', path: 'resources/data/wavetables/windows/hanning.wt' },
  { name: 'Hamming', category: 'windows', path: 'resources/data/wavetables/windows/hamming.wt' },
  { name: 'Blackman', category: 'windows', path: 'resources/data/wavetables/windows/blackman.wt' },
];

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Constants
  SURGE_WAVETABLE_PATHS,
  SURGE_PATCH_PATHS,
  FACTORY_WAVETABLE_CATEGORIES,
  THIRD_PARTY_CONTRIBUTORS,
  SURGE_OSC_TYPES,
  SURGE_FILTER_TYPES,
  SURGE_FX_TYPES,
  WT_OSC_PARAMS,
  KNOWN_FACTORY_WAVETABLES,
  
  // GitHub helpers
  fetchGitHubDirectory,
  listAllFiles,
  
  // Wavetable cataloging
  parseWavetableMetadata,
  scanWavetables,
  
  // Preset parsing
  parseFXPHeader,
  extractSurgeXML,
  parseSurgePresetXML,
  
  // Download
  downloadWavetable,
  downloadWavetables,
  
  // Catalog
  scanPresets,
  buildSurgeAssetCatalog,
};
