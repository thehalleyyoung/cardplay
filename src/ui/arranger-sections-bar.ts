/**
 * @fileoverview Arranger Sections Bar - Song Structure Display
 * 
 * Displays song sections (Intro, Verse, Chorus, etc.) as colored blocks
 * aligned with the bar grid. Supports:
 * - Visual section markers with icons
 * - Drag to resize section length
 * - Click to select/edit section
 * - Integration with arranger card
 * 
 * @module @cardplay/ui/arranger-sections-bar
 */

import type { SongPart, SongPartType } from '../cards/arranger';
import { SONG_PART_THEMES, createSongPart } from '../cards/arranger';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Section display object for rendering.
 */
export interface SectionDisplay {
  /** Original section data */
  readonly section: SongPart;
  /** Start bar position */
  readonly startBar: number;
  /** End bar position */
  readonly endBar: number;
  /** X position in pixels */
  readonly x: number;
  /** Width in pixels */
  readonly width: number;
  /** Display color */
  readonly color: string;
  /** Display icon */
  readonly icon: string;
  /** Short name for display */
  readonly shortName: string;
  /** Whether section is selected */
  readonly selected: boolean;
  /** Whether section is highlighted (playback position) */
  readonly highlighted: boolean;
  /** Whether resize handle is active */
  readonly resizeActive: boolean;
}

/**
 * Arranger sections bar state.
 */
export interface ArrangerSectionsState {
  /** Song sections */
  readonly sections: readonly SongPart[];
  /** Selected section ID */
  readonly selectedSectionId: string | null;
  /** Section being edited */
  readonly editingSectionId: string | null;
  /** Edit name value */
  readonly editNameValue: string;
  /** Drag state */
  readonly dragState: SectionDragState | null;
  /** Whether section menu is open */
  readonly menuOpen: boolean;
  /** Menu position */
  readonly menuPosition: { x: number; y: number } | null;
  /** Menu target section ID */
  readonly menuTargetId: string | null;
}

/**
 * Drag state for section resizing/reordering.
 */
export interface SectionDragState {
  readonly sectionId: string;
  readonly dragType: 'resize-end' | 'reorder';
  readonly startX: number;
  readonly startBar: number;
  readonly currentX: number;
  readonly dropTargetIndex: number | null;
}

/**
 * Arranger sections bar configuration.
 */
export interface ArrangerSectionsConfig {
  /** Height in pixels */
  readonly height: number;
  /** Minimum section length in bars */
  readonly minSectionBars: number;
  /** Show section icons */
  readonly showIcons: boolean;
  /** Show section names */
  readonly showNames: boolean;
  /** Show repeat indicators */
  readonly showRepeats: boolean;
  /** Colors */
  readonly colors: ArrangerSectionsColors;
}

/**
 * Color configuration.
 */
export interface ArrangerSectionsColors {
  readonly background: string;
  readonly gridLine: string;
  readonly selectedBorder: string;
  readonly highlightedBorder: string;
  readonly textColor: string;
  readonly repeatBadge: string;
}

// ============================================================================
// DEFAULTS
// ============================================================================

/**
 * Default colors.
 */
export const DEFAULT_ARRANGER_SECTIONS_COLORS: ArrangerSectionsColors = {
  background: '#1a1a2e',
  gridLine: '#374151',
  selectedBorder: '#3b82f6',
  highlightedBorder: '#f59e0b',
  textColor: '#ffffff',
  repeatBadge: '#ef4444',
};

/**
 * Default configuration.
 */
export const DEFAULT_ARRANGER_SECTIONS_CONFIG: ArrangerSectionsConfig = {
  height: 48,
  minSectionBars: 1,
  showIcons: true,
  showNames: true,
  showRepeats: true,
  colors: DEFAULT_ARRANGER_SECTIONS_COLORS,
};

/**
 * Default state.
 */
export const DEFAULT_ARRANGER_SECTIONS_STATE: ArrangerSectionsState = {
  sections: [],
  selectedSectionId: null,
  editingSectionId: null,
  editNameValue: '',
  dragState: null,
  menuOpen: false,
  menuPosition: null,
  menuTargetId: null,
};

// ============================================================================
// SECTION TEMPLATES
// ============================================================================

/**
 * Common song structure templates.
 */
export const SONG_STRUCTURE_TEMPLATES: Record<string, readonly SongPartType[]> = {
  'Pop Standard': ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
  'Verse-Chorus': ['intro', 'verse', 'chorus', 'verse', 'chorus', 'chorus', 'outro'],
  'AABA': ['verse', 'verse', 'bridge', 'verse'],
  'EDM Build': ['intro', 'breakdown', 'drop', 'breakdown', 'drop', 'outro'],
  'Simple Loop': ['verse', 'verse', 'verse', 'verse'],
  'Blues 12-Bar': ['verse', 'verse', 'verse'],
  'Ballad': ['intro', 'verse', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
};

/**
 * Create sections from a template.
 */
export function createSectionsFromTemplate(
  templateName: string
): SongPart[] {
  const template = SONG_STRUCTURE_TEMPLATES[templateName];
  if (!template) return [];
  
  const typeCounts: Record<string, number> = {};
  
  return template.map(type => {
    typeCounts[type] = (typeCounts[type] ?? 0) + 1;
    return createSongPart(type, typeCounts[type]);
  });
}

// ============================================================================
// STATE OPERATIONS
// ============================================================================

/**
 * Select a section.
 */
export function selectSection(
  state: ArrangerSectionsState,
  sectionId: string | null
): ArrangerSectionsState {
  return {
    ...state,
    selectedSectionId: sectionId,
    editingSectionId: null,
    editNameValue: '',
    menuOpen: false,
    menuPosition: null,
    menuTargetId: null,
  };
}

/**
 * Start editing section name.
 */
export function startEditingName(
  state: ArrangerSectionsState,
  sectionId: string
): ArrangerSectionsState {
  const section = state.sections.find(s => s.id === sectionId);
  return {
    ...state,
    selectedSectionId: sectionId,
    editingSectionId: sectionId,
    editNameValue: section?.name ?? '',
  };
}

/**
 * Update edit name value.
 */
export function updateEditNameValue(
  state: ArrangerSectionsState,
  value: string
): ArrangerSectionsState {
  return {
    ...state,
    editNameValue: value,
  };
}

/**
 * Commit name edit.
 */
export function commitNameEdit(state: ArrangerSectionsState): ArrangerSectionsState {
  if (!state.editingSectionId) return state;
  
  const newSections = state.sections.map(s =>
    s.id === state.editingSectionId
      ? { ...s, name: state.editNameValue || s.name }
      : s
  );
  
  return {
    ...state,
    sections: newSections,
    editingSectionId: null,
    editNameValue: '',
  };
}

/**
 * Cancel name edit.
 */
export function cancelNameEdit(state: ArrangerSectionsState): ArrangerSectionsState {
  return {
    ...state,
    editingSectionId: null,
    editNameValue: '',
  };
}

/**
 * Start dragging a section.
 */
export function startDrag(
  state: ArrangerSectionsState,
  sectionId: string,
  dragType: 'resize-end' | 'reorder',
  x: number,
  currentBar: number
): ArrangerSectionsState {
  return {
    ...state,
    selectedSectionId: sectionId,
    dragState: {
      sectionId,
      dragType,
      startX: x,
      startBar: currentBar,
      currentX: x,
      dropTargetIndex: null,
    },
  };
}

/**
 * Update drag position.
 */
export function updateDrag(
  state: ArrangerSectionsState,
  x: number,
  dropTargetIndex: number | null = null
): ArrangerSectionsState {
  if (!state.dragState) return state;
  
  return {
    ...state,
    dragState: {
      ...state.dragState,
      currentX: x,
      dropTargetIndex,
    },
  };
}

/**
 * End drag and apply changes.
 */
export function endDrag(
  state: ArrangerSectionsState,
  pixelsPerBar: number,
  minSectionBars: number
): ArrangerSectionsState {
  if (!state.dragState) return state;
  
  const { sectionId, dragType, startX, currentX, dropTargetIndex } = state.dragState;
  
  if (dragType === 'resize-end') {
    // Calculate new length
    const pixelDelta = currentX - startX;
    const barDelta = Math.round(pixelDelta / pixelsPerBar);
    
    const newSections = state.sections.map(s => {
      if (s.id !== sectionId) return s;
      const newLength = Math.max(minSectionBars, s.lengthBars + barDelta);
      return { ...s, lengthBars: newLength };
    });
    
    return {
      ...state,
      sections: newSections,
      dragState: null,
    };
  }
  
  if (dragType === 'reorder' && dropTargetIndex !== null) {
    const fromIndex = state.sections.findIndex(s => s.id === sectionId);
    if (fromIndex === -1) return { ...state, dragState: null };
    
    const newSections = [...state.sections];
    const [moved] = newSections.splice(fromIndex, 1);
    if (moved) {
      const toIndex = dropTargetIndex > fromIndex ? dropTargetIndex - 1 : dropTargetIndex;
      newSections.splice(toIndex, 0, moved);
    }
    
    return {
      ...state,
      sections: newSections,
      dragState: null,
    };
  }
  
  return {
    ...state,
    dragState: null,
  };
}

/**
 * Cancel drag.
 */
export function cancelDrag(state: ArrangerSectionsState): ArrangerSectionsState {
  return {
    ...state,
    dragState: null,
  };
}

/**
 * Open context menu.
 */
export function openMenu(
  state: ArrangerSectionsState,
  sectionId: string,
  x: number,
  y: number
): ArrangerSectionsState {
  return {
    ...state,
    menuOpen: true,
    menuPosition: { x, y },
    menuTargetId: sectionId,
  };
}

/**
 * Close context menu.
 */
export function closeMenu(state: ArrangerSectionsState): ArrangerSectionsState {
  return {
    ...state,
    menuOpen: false,
    menuPosition: null,
    menuTargetId: null,
  };
}

/**
 * Add a section.
 */
export function addSection(
  state: ArrangerSectionsState,
  type: SongPartType,
  afterSectionId?: string
): ArrangerSectionsState {
  // Count existing sections of this type
  const typeCount = state.sections.filter(s => s.type === type).length + 1;
  const newSection = createSongPart(type, typeCount);
  
  let newSections: SongPart[];
  
  if (afterSectionId) {
    const index = state.sections.findIndex(s => s.id === afterSectionId);
    newSections = [...state.sections];
    newSections.splice(index + 1, 0, newSection);
  } else {
    newSections = [...state.sections, newSection];
  }
  
  return {
    ...state,
    sections: newSections,
    selectedSectionId: newSection.id,
    menuOpen: false,
    menuPosition: null,
    menuTargetId: null,
  };
}

/**
 * Remove a section.
 */
export function removeSection(
  state: ArrangerSectionsState,
  sectionId: string
): ArrangerSectionsState {
  const newSections = state.sections.filter(s => s.id !== sectionId);
  
  return {
    ...state,
    sections: newSections,
    selectedSectionId: state.selectedSectionId === sectionId ? null : state.selectedSectionId,
    menuOpen: false,
    menuPosition: null,
    menuTargetId: null,
  };
}

/**
 * Duplicate a section.
 */
export function duplicateSection(
  state: ArrangerSectionsState,
  sectionId: string
): ArrangerSectionsState {
  const section = state.sections.find(s => s.id === sectionId);
  if (!section) return state;
  
  const index = state.sections.findIndex(s => s.id === sectionId);
  const typeCount = state.sections.filter(s => s.type === section.type).length + 1;
  
  const duplicated = createSongPart(section.type, typeCount, {
    ...section,
    name: `${section.name} (copy)`,
  });
  
  const newSections = [...state.sections];
  newSections.splice(index + 1, 0, duplicated);
  
  return {
    ...state,
    sections: newSections,
    selectedSectionId: duplicated.id,
    menuOpen: false,
    menuPosition: null,
    menuTargetId: null,
  };
}

/**
 * Change section type.
 */
export function changeSectionType(
  state: ArrangerSectionsState,
  sectionId: string,
  newType: SongPartType
): ArrangerSectionsState {
  const theme = SONG_PART_THEMES[newType];
  const typeCount = state.sections.filter(s => s.type === newType).length + 1;
  
  const newSections = state.sections.map(s => {
    if (s.id !== sectionId) return s;
    return {
      ...s,
      type: newType,
      name: `${newType.charAt(0).toUpperCase() + newType.slice(1).replace('-', ' ')} ${typeCount}`,
      color: theme.color,
      icon: theme.icon,
    };
  });
  
  return {
    ...state,
    sections: newSections,
    menuOpen: false,
    menuPosition: null,
    menuTargetId: null,
  };
}

/**
 * Set section length.
 */
export function setSectionLength(
  state: ArrangerSectionsState,
  sectionId: string,
  lengthBars: number,
  minSectionBars: number = 1
): ArrangerSectionsState {
  const newSections = state.sections.map(s =>
    s.id === sectionId
      ? { ...s, lengthBars: Math.max(minSectionBars, lengthBars) }
      : s
  );
  
  return {
    ...state,
    sections: newSections,
  };
}

/**
 * Set section repeat count.
 */
export function setSectionRepeat(
  state: ArrangerSectionsState,
  sectionId: string,
  repeat: number
): ArrangerSectionsState {
  const newSections = state.sections.map(s =>
    s.id === sectionId
      ? { ...s, repeat: Math.max(1, repeat) }
      : s
  );
  
  return {
    ...state,
    sections: newSections,
  };
}

/**
 * Set section energy level.
 */
export function setSectionEnergy(
  state: ArrangerSectionsState,
  sectionId: string,
  energy: number
): ArrangerSectionsState {
  const newSections = state.sections.map(s =>
    s.id === sectionId
      ? { ...s, energy: Math.max(1, Math.min(5, energy)) }
      : s
  );
  
  return {
    ...state,
    sections: newSections,
  };
}

// ============================================================================
// CALCULATION HELPERS
// ============================================================================

/**
 * Calculate total bars from sections.
 */
export function calculateTotalBars(sections: readonly SongPart[]): number {
  return sections.reduce((total, s) => total + s.lengthBars * s.repeat, 0);
}

/**
 * Get section at bar position.
 */
export function getSectionAtBar(
  sections: readonly SongPart[],
  bar: number
): { section: SongPart; barInSection: number } | null {
  let currentBar = 0;
  
  for (const section of sections) {
    const sectionLength = section.lengthBars * section.repeat;
    if (bar >= currentBar && bar < currentBar + sectionLength) {
      return {
        section,
        barInSection: bar - currentBar,
      };
    }
    currentBar += sectionLength;
  }
  
  return null;
}

/**
 * Get start bar for a section.
 */
export function getSectionStartBar(
  sections: readonly SongPart[],
  sectionId: string
): number {
  let currentBar = 0;
  
  for (const section of sections) {
    if (section.id === sectionId) {
      return currentBar;
    }
    currentBar += section.lengthBars * section.repeat;
  }
  
  return -1;
}

/**
 * Get section bar range.
 */
export function getSectionBarRange(
  sections: readonly SongPart[],
  sectionId: string
): { start: number; end: number } | null {
  let currentBar = 0;
  
  for (const section of sections) {
    const sectionLength = section.lengthBars * section.repeat;
    if (section.id === sectionId) {
      return {
        start: currentBar,
        end: currentBar + sectionLength,
      };
    }
    currentBar += sectionLength;
  }
  
  return null;
}

// ============================================================================
// RENDER HELPERS
// ============================================================================

/**
 * Calculate section display objects for rendering.
 */
export function calculateSectionDisplays(
  sections: readonly SongPart[],
  state: ArrangerSectionsState,
  scrollBar: number,
  pixelsPerBar: number,
  currentBar: number,
  containerWidth: number
): SectionDisplay[] {
  const displays: SectionDisplay[] = [];
  let currentStartBar = 0;
  
  for (const section of sections) {
    const sectionLength = section.lengthBars * section.repeat;
    const endBar = currentStartBar + sectionLength;
    
    // Calculate pixel position
    const x = (currentStartBar - scrollBar) * pixelsPerBar;
    const width = sectionLength * pixelsPerBar;
    
    // Skip if not visible
    if (x + width < 0 || x > containerWidth) {
      currentStartBar = endBar;
      continue;
    }
    
    // Get theme
    const theme = SONG_PART_THEMES[section.type];
    
    // Check states
    const selected = state.selectedSectionId === section.id;
    const highlighted = currentBar >= currentStartBar && currentBar < endBar;
    const resizeActive = state.dragState?.sectionId === section.id && 
                         state.dragState?.dragType === 'resize-end';
    
    displays.push({
      section,
      startBar: currentStartBar,
      endBar,
      x,
      width,
      color: section.color || theme.color,
      icon: section.icon || theme.icon,
      shortName: theme.shortName,
      selected,
      highlighted,
      resizeActive,
    });
    
    currentStartBar = endBar;
  }
  
  return displays;
}

/**
 * Get drop target index from mouse position.
 */
export function getDropTargetIndex(
  sections: readonly SongPart[],
  mouseX: number,
  scrollBar: number,
  pixelsPerBar: number
): number {
  let currentBar = 0;
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]!;
    const sectionLength = section.lengthBars * section.repeat;
    const sectionEndBar = currentBar + sectionLength;
    
    const sectionStartX = (currentBar - scrollBar) * pixelsPerBar;
    const sectionEndX = (sectionEndBar - scrollBar) * pixelsPerBar;
    const sectionMidX = (sectionStartX + sectionEndX) / 2;
    
    if (mouseX < sectionMidX) {
      return i;
    }
    
    currentBar = sectionEndBar;
  }
  
  return sections.length;
}

// ============================================================================
// MENU ITEMS
// ============================================================================

/**
 * Section type menu items.
 */
export const SECTION_TYPE_MENU_ITEMS: Array<{
  type: SongPartType;
  label: string;
  icon: string;
  color: string;
}> = [
  { type: 'intro', label: 'Intro', icon: '🚀', color: SONG_PART_THEMES.intro.color },
  { type: 'verse', label: 'Verse', icon: '📝', color: SONG_PART_THEMES.verse.color },
  { type: 'pre-chorus', label: 'Pre-Chorus', icon: '⬆️', color: SONG_PART_THEMES['pre-chorus'].color },
  { type: 'chorus', label: 'Chorus', icon: '🎤', color: SONG_PART_THEMES.chorus.color },
  { type: 'post-chorus', label: 'Post-Chorus', icon: '⬇️', color: SONG_PART_THEMES['post-chorus'].color },
  { type: 'bridge', label: 'Bridge', icon: '🌉', color: SONG_PART_THEMES.bridge.color },
  { type: 'breakdown', label: 'Breakdown', icon: '💥', color: SONG_PART_THEMES.breakdown.color },
  { type: 'drop', label: 'Drop', icon: '🔥', color: SONG_PART_THEMES.drop.color },
  { type: 'solo', label: 'Solo', icon: '🎸', color: SONG_PART_THEMES.solo.color },
  { type: 'instrumental', label: 'Instrumental', icon: '🎹', color: SONG_PART_THEMES.instrumental.color },
  { type: 'outro', label: 'Outro', icon: '🏁', color: SONG_PART_THEMES.outro.color },
  { type: 'interlude', label: 'Interlude', icon: '🔄', color: SONG_PART_THEMES.interlude.color },
  { type: 'custom', label: 'Custom', icon: '✨', color: SONG_PART_THEMES.custom.color },
];

/**
 * Section length options.
 */
export const SECTION_LENGTH_OPTIONS = [1, 2, 4, 8, 12, 16, 24, 32];

/**
 * Section repeat options.
 */
export const SECTION_REPEAT_OPTIONS = [1, 2, 3, 4];

/**
 * Section energy options.
 */
export const SECTION_ENERGY_OPTIONS = [
  { value: 1, label: 'Very Low', icon: '🔇' },
  { value: 2, label: 'Low', icon: '🔈' },
  { value: 3, label: 'Medium', icon: '🔉' },
  { value: 4, label: 'High', icon: '🔊' },
  { value: 5, label: 'Very High', icon: '📢' },
];
