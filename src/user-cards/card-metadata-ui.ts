/**
 * @fileoverview Card Metadata Editor UI.
 * 
 * Visual editor for card metadata:
 * - Icon picker with emoji search
 * - Color scheme selector
 * - Category dropdown
 * - Tag editor with autocomplete
 * - Version field with semver validation
 * - Author and license fields
 * - Description editor
 * 
 * @module @cardplay/user-cards/card-metadata-ui
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Icon picker options.
 */
export interface IconPickerOptions {
  readonly emoji?: string;
  readonly onSelect?: (emoji: string) => void;
}

/**
 * Color scheme option.
 */
export interface ColorScheme {
  readonly id: string;
  readonly name: string;
  readonly primary: string;
  readonly secondary?: string;
  readonly gradient?: readonly [string, string];
}

/**
 * Card category option.
 */
export interface CategoryOption {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly description: string;
}

// ============================================================================
// ICON LIBRARY
// ============================================================================

/**
 * Common emoji categories for card icons.
 */
export const ICON_CATEGORIES = Object.freeze({
  music: [
    '🎵', '🎶', '🎼', '🎹', '🎸', '🎺', '🎻', '🥁',
    '🎤', '🎧', '📻', '🔊', '🎚️', '🎛️',
  ],
  generators: [
    '⚡', '✨', '🌟', '💫', '🔮', '🎲', '🎰', '🎯',
  ],
  effects: [
    '🌀', '🌊', '🔥', '💧', '❄️', '🌈', '🎨', '✏️',
  ],
  transforms: [
    '🔄', '🔀', '🔁', '↔️', '⬆️', '⬇️', '🔃', '♻️',
  ],
  analysis: [
    '📊', '📈', '📉', '🔍', '🔬', '📡', '🎯', '🧪',
  ],
  utility: [
    '⚙️', '🔧', '🔨', '🛠️', '📦', '📁', '💾', '🔐',
  ],
});

/**
 * All available icons (flattened).
 */
export const ALL_ICONS = Object.freeze(
  Object.values(ICON_CATEGORIES).flat()
);

/**
 * Search icons by keyword.
 */
export function searchIcons(query: string): readonly string[] {
  const q = query.toLowerCase();
  
  if (!q) {
    return ALL_ICONS;
  }
  
  // Map keywords to icons
  const keywordMap: Record<string, readonly string[]> = {
    music: ICON_CATEGORIES.music,
    note: ['🎵', '🎶', '🎼'],
    instrument: ['🎹', '🎸', '🎺', '🎻', '🥁'],
    sound: ['🔊', '🎧', '📻'],
    generator: ICON_CATEGORIES.generators,
    effect: ICON_CATEGORIES.effects,
    transform: ICON_CATEGORIES.transforms,
    analyze: ICON_CATEGORIES.analysis,
    tool: ICON_CATEGORIES.utility,
  };
  
  const results: string[] = [];
  for (const [keyword, icons] of Object.entries(keywordMap)) {
    if (keyword.includes(q)) {
      results.push(...icons);
    }
  }
  
  return results;
}

// ============================================================================
// COLOR SCHEMES
// ============================================================================

/**
 * Predefined color schemes.
 */
export const COLOR_SCHEMES: readonly ColorScheme[] = Object.freeze([
  {
    id: 'blue',
    name: 'Blue',
    primary: '#3b82f6',
  },
  {
    id: 'purple',
    name: 'Purple',
    primary: '#8b5cf6',
  },
  {
    id: 'pink',
    name: 'Pink',
    primary: '#ec4899',
  },
  {
    id: 'red',
    name: 'Red',
    primary: '#ef4444',
  },
  {
    id: 'orange',
    name: 'Orange',
    primary: '#f97316',
  },
  {
    id: 'yellow',
    name: 'Yellow',
    primary: '#eab308',
  },
  {
    id: 'green',
    name: 'Green',
    primary: '#22c55e',
  },
  {
    id: 'teal',
    name: 'Teal',
    primary: '#14b8a6',
  },
  {
    id: 'cyan',
    name: 'Cyan',
    primary: '#06b6d4',
  },
  {
    id: 'gray',
    name: 'Gray',
    primary: '#6b7280',
  },
  {
    id: 'blue-purple',
    name: 'Blue-Purple Gradient',
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    gradient: ['#3b82f6', '#8b5cf6'],
  },
  {
    id: 'pink-orange',
    name: 'Pink-Orange Gradient',
    primary: '#ec4899',
    secondary: '#f97316',
    gradient: ['#ec4899', '#f97316'],
  },
  {
    id: 'green-blue',
    name: 'Green-Blue Gradient',
    primary: '#22c55e',
    secondary: '#06b6d4',
    gradient: ['#22c55e', '#06b6d4'],
  },
]);

// ============================================================================
// CATEGORIES
// ============================================================================

/**
 * Card category options.
 */
export const CARD_CATEGORIES: readonly CategoryOption[] = Object.freeze([
  {
    id: 'generator',
    name: 'Generator',
    icon: '⚡',
    description: 'Creates musical content from scratch',
  },
  {
    id: 'transform',
    name: 'Transform',
    icon: '🔄',
    description: 'Transforms incoming musical data',
  },
  {
    id: 'effect',
    name: 'Effect',
    icon: '🎨',
    description: 'Audio processing and effects',
  },
  {
    id: 'analyzer',
    name: 'Analyzer',
    icon: '📊',
    description: 'Analyzes audio or musical data',
  },
  {
    id: 'utility',
    name: 'Utility',
    icon: '🔧',
    description: 'Utility and helper functions',
  },
  {
    id: 'routing',
    name: 'Routing',
    icon: '🔀',
    description: 'Routes and distributes signals',
  },
  {
    id: 'custom',
    name: 'Custom',
    icon: '✨',
    description: 'Custom user-defined card',
  },
]);

// ============================================================================
// TAGS
// ============================================================================

/**
 * Common tag suggestions.
 */
export const TAG_SUGGESTIONS: readonly string[] = Object.freeze([
  'midi',
  'audio',
  'rhythm',
  'melody',
  'harmony',
  'chord',
  'scale',
  'arpeggio',
  'sequence',
  'pattern',
  'loop',
  'sample',
  'synth',
  'filter',
  'delay',
  'reverb',
  'modulation',
  'automation',
  'creative',
  'experimental',
  'beginner',
  'advanced',
  'realtime',
  'offline',
]);

/**
 * Search tags with autocomplete.
 */
export function searchTags(query: string): readonly string[] {
  const q = query.toLowerCase();
  return TAG_SUGGESTIONS.filter(tag => tag.includes(q));
}

// ============================================================================
// LICENSES
// ============================================================================

/**
 * Common open-source licenses.
 */
export const LICENSES: readonly string[] = Object.freeze([
  'MIT',
  'Apache-2.0',
  'GPL-3.0',
  'BSD-3-Clause',
  'ISC',
  'CC0-1.0',
  'Unlicense',
  'LGPL-3.0',
  'MPL-2.0',
  'Custom',
]);

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate semver version string.
 */
export function isValidVersion(version: string): boolean {
  const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
  return semverRegex.test(version);
}

/**
 * Validate card ID (kebab-case).
 */
export function isValidCardId(id: string): boolean {
  const idRegex = /^[a-z][a-z0-9-]*$/;
  return idRegex.test(id);
}

/**
 * Validate color hex code.
 */
export function isValidColor(color: string): boolean {
  const hexRegex = /^#[0-9a-fA-F]{6}$/;
  return hexRegex.test(color);
}

// ============================================================================
// UI HELPERS
// ============================================================================

/**
 * Create icon preview element.
 */
export function createIconPreview(emoji: string): HTMLElement {
  const div = document.createElement('div');
  div.textContent = emoji;
  div.style.fontSize = '48px';
  div.style.textAlign = 'center';
  div.style.padding = '20px';
  div.style.cursor = 'pointer';
  return div;
}

/**
 * Create color swatch element.
 */
export function createColorSwatch(
  color: string,
  gradient?: readonly [string, string]
): HTMLElement {
  const div = document.createElement('div');
  div.style.width = '40px';
  div.style.height = '40px';
  div.style.borderRadius = '8px';
  div.style.cursor = 'pointer';
  div.style.border = '2px solid #e5e7eb';
  
  if (gradient) {
    div.style.background = `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`;
  } else {
    div.style.backgroundColor = color;
  }
  
  return div;
}

/**
 * Create category badge element.
 */
export function createCategoryBadge(category: CategoryOption): HTMLElement {
  const div = document.createElement('div');
  div.style.display = 'inline-flex';
  div.style.alignItems = 'center';
  div.style.gap = '6px';
  div.style.padding = '4px 12px';
  div.style.borderRadius = '12px';
  div.style.backgroundColor = '#f3f4f6';
  div.style.cursor = 'pointer';
  
  const icon = document.createElement('span');
  icon.textContent = category.icon;
  
  const name = document.createElement('span');
  name.textContent = category.name;
  name.style.fontSize = '14px';
  name.style.fontWeight = '500';
  
  div.appendChild(icon);
  div.appendChild(name);
  
  return div;
}

/**
 * Create tag pill element.
 */
export function createTagPill(
  tag: string,
  onRemove?: () => void
): HTMLElement {
  const div = document.createElement('div');
  div.style.display = 'inline-flex';
  div.style.alignItems = 'center';
  div.style.gap = '4px';
  div.style.padding = '2px 8px';
  div.style.borderRadius = '12px';
  div.style.backgroundColor = '#dbeafe';
  div.style.color = '#1e40af';
  div.style.fontSize = '12px';
  
  const text = document.createElement('span');
  text.textContent = tag;
  div.appendChild(text);
  
  if (onRemove) {
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.style.border = 'none';
    removeBtn.style.background = 'none';
    removeBtn.style.cursor = 'pointer';
    removeBtn.style.fontSize = '16px';
    removeBtn.style.lineHeight = '1';
    removeBtn.style.padding = '0';
    removeBtn.style.marginLeft = '2px';
    removeBtn.onclick = onRemove;
    div.appendChild(removeBtn);
  }
  
  return div;
}

// ============================================================================
// FORM FIELD CREATION
// ============================================================================

/**
 * Create text input field.
 */
export function createTextField(
  label: string,
  value: string,
  onChange: (value: string) => void,
  options: {
    placeholder?: string;
    readonly?: boolean;
    validate?: (value: string) => boolean;
    error?: string;
  } = {}
): HTMLElement {
  const container = document.createElement('div');
  container.style.marginBottom = '16px';
  
  const labelEl = document.createElement('label');
  labelEl.textContent = label;
  labelEl.style.display = 'block';
  labelEl.style.marginBottom = '4px';
  labelEl.style.fontSize = '14px';
  labelEl.style.fontWeight = '500';
  
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value;
  input.placeholder = options.placeholder ?? '';
  input.readOnly = options.readonly ?? false;
  input.style.width = '100%';
  input.style.padding = '8px 12px';
  input.style.border = '1px solid #d1d5db';
  input.style.borderRadius = '6px';
  input.style.fontSize = '14px';
  
  if (options.error) {
    input.style.borderColor = '#ef4444';
  }
  
  input.oninput = () => {
    const newValue = input.value;
    if (!options.validate || options.validate(newValue)) {
      input.style.borderColor = '#d1d5db';
      onChange(newValue);
    } else {
      input.style.borderColor = '#ef4444';
    }
  };
  
  container.appendChild(labelEl);
  container.appendChild(input);
  
  if (options.error) {
    const errorEl = document.createElement('div');
    errorEl.textContent = options.error;
    errorEl.style.color = '#ef4444';
    errorEl.style.fontSize = '12px';
    errorEl.style.marginTop = '4px';
    container.appendChild(errorEl);
  }
  
  return container;
}

/**
 * Create textarea field.
 */
export function createTextArea(
  label: string,
  value: string,
  onChange: (value: string) => void,
  options: {
    placeholder?: string;
    rows?: number;
    readonly?: boolean;
  } = {}
): HTMLElement {
  const container = document.createElement('div');
  container.style.marginBottom = '16px';
  
  const labelEl = document.createElement('label');
  labelEl.textContent = label;
  labelEl.style.display = 'block';
  labelEl.style.marginBottom = '4px';
  labelEl.style.fontSize = '14px';
  labelEl.style.fontWeight = '500';
  
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.placeholder = options.placeholder ?? '';
  textarea.rows = options.rows ?? 3;
  textarea.readOnly = options.readonly ?? false;
  textarea.style.width = '100%';
  textarea.style.padding = '8px 12px';
  textarea.style.border = '1px solid #d1d5db';
  textarea.style.borderRadius = '6px';
  textarea.style.fontSize = '14px';
  textarea.style.fontFamily = 'inherit';
  textarea.style.resize = 'vertical';
  
  textarea.oninput = () => {
    onChange(textarea.value);
  };
  
  container.appendChild(labelEl);
  container.appendChild(textarea);
  
  return container;
}

/**
 * Create select/dropdown field.
 */
export function createSelectField<T extends string>(
  label: string,
  value: T,
  options: readonly { value: T; label: string }[],
  onChange: (value: T) => void
): HTMLElement {
  const container = document.createElement('div');
  container.style.marginBottom = '16px';
  
  const labelEl = document.createElement('label');
  labelEl.textContent = label;
  labelEl.style.display = 'block';
  labelEl.style.marginBottom = '4px';
  labelEl.style.fontSize = '14px';
  labelEl.style.fontWeight = '500';
  
  const select = document.createElement('select');
  select.style.width = '100%';
  select.style.padding = '8px 12px';
  select.style.border = '1px solid #d1d5db';
  select.style.borderRadius = '6px';
  select.style.fontSize = '14px';
  select.style.backgroundColor = '#ffffff';
  
  for (const opt of options) {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    option.selected = opt.value === value;
    select.appendChild(option);
  }
  
  select.onchange = () => {
    onChange(select.value as T);
  };
  
  container.appendChild(labelEl);
  container.appendChild(select);
  
  return container;
}

// ============================================================================
// TAG EDITOR
// ============================================================================

/**
 * Options for tag editor.
 */
export interface TagEditorOptions {
  readonly tags: readonly string[];
  readonly onAdd: (tag: string) => void;
  readonly onRemove: (tag: string) => void;
  readonly suggestions?: readonly string[];
  readonly maxTags?: number;
}

/**
 * Create interactive tag editor with autocomplete.
 */
export function createTagEditor(options: TagEditorOptions): HTMLElement {
  const container = document.createElement('div');
  container.style.marginBottom = '16px';
  
  const label = document.createElement('label');
  label.textContent = 'Tags';
  label.style.display = 'block';
  label.style.marginBottom = '8px';
  label.style.fontSize = '14px';
  label.style.fontWeight = '500';
  container.appendChild(label);
  
  // Tags display area
  const tagsDisplay = document.createElement('div');
  tagsDisplay.style.display = 'flex';
  tagsDisplay.style.flexWrap = 'wrap';
  tagsDisplay.style.gap = '6px';
  tagsDisplay.style.marginBottom = '8px';
  tagsDisplay.style.minHeight = '32px';
  tagsDisplay.style.padding = '8px';
  tagsDisplay.style.border = '1px solid #e5e7eb';
  tagsDisplay.style.borderRadius = '6px';
  tagsDisplay.style.backgroundColor = '#f9fafb';
  
  function refreshTags() {
    tagsDisplay.innerHTML = '';
    for (const tag of options.tags) {
      const pill = createTagPill(tag, () => {
        options.onRemove(tag);
        refreshTags();
      });
      tagsDisplay.appendChild(pill);
    }
  }
  refreshTags();
  container.appendChild(tagsDisplay);
  
  // Input area with autocomplete
  const inputWrapper = document.createElement('div');
  inputWrapper.style.position = 'relative';
  
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Add tag...';
  input.style.width = '100%';
  input.style.padding = '8px 12px';
  input.style.border = '1px solid #d1d5db';
  input.style.borderRadius = '6px';
  input.style.fontSize = '14px';
  
  // Autocomplete dropdown
  const dropdown = document.createElement('div');
  dropdown.style.position = 'absolute';
  dropdown.style.top = '100%';
  dropdown.style.left = '0';
  dropdown.style.right = '0';
  dropdown.style.maxHeight = '200px';
  dropdown.style.overflowY = 'auto';
  dropdown.style.backgroundColor = '#ffffff';
  dropdown.style.border = '1px solid #d1d5db';
  dropdown.style.borderRadius = '6px';
  dropdown.style.marginTop = '2px';
  dropdown.style.display = 'none';
  dropdown.style.zIndex = '1000';
  dropdown.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
  
  function showSuggestions(query: string) {
    const suggestions = options.suggestions || TAG_SUGGESTIONS;
    const filtered = suggestions.filter(s => 
      s.toLowerCase().includes(query.toLowerCase()) &&
      !options.tags.includes(s)
    );
    
    if (filtered.length === 0 || !query) {
      dropdown.style.display = 'none';
      return;
    }
    
    dropdown.innerHTML = '';
    for (const suggestion of filtered.slice(0, 10)) {
      const item = document.createElement('div');
      item.textContent = suggestion;
      item.style.padding = '8px 12px';
      item.style.cursor = 'pointer';
      item.style.fontSize = '14px';
      
      item.onmouseenter = () => {
        item.style.backgroundColor = '#f3f4f6';
      };
      item.onmouseleave = () => {
        item.style.backgroundColor = '';
      };
      item.onclick = () => {
        addTag(suggestion);
        input.value = '';
        dropdown.style.display = 'none';
      };
      
      dropdown.appendChild(item);
    }
    dropdown.style.display = 'block';
  }
  
  function addTag(tag: string) {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed) return;
    if (options.tags.includes(trimmed)) return;
    if (options.maxTags && options.tags.length >= options.maxTags) {
      alert(`Maximum ${options.maxTags} tags allowed`);
      return;
    }
    options.onAdd(trimmed);
    refreshTags();
  }
  
  input.oninput = () => {
    showSuggestions(input.value);
  };
  
  input.onkeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(input.value);
      input.value = '';
      dropdown.style.display = 'none';
    } else if (e.key === 'Escape') {
      dropdown.style.display = 'none';
    }
  };
  
  input.onblur = () => {
    setTimeout(() => {
      dropdown.style.display = 'none';
    }, 200);
  };
  
  inputWrapper.appendChild(input);
  inputWrapper.appendChild(dropdown);
  container.appendChild(inputWrapper);
  
  return container;
}

// ============================================================================
// VERSION FIELD
// ============================================================================

/**
 * Create version field with semver validation.
 */
export function createVersionField(
  value: string,
  onChange: (value: string) => void
): HTMLElement {
  const container = document.createElement('div');
  container.style.marginBottom = '16px';
  
  const label = document.createElement('label');
  label.textContent = 'Version (semver)';
  label.style.display = 'block';
  label.style.marginBottom = '4px';
  label.style.fontSize = '14px';
  label.style.fontWeight = '500';
  container.appendChild(label);
  
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value;
  input.placeholder = '1.0.0';
  input.style.width = '100%';
  input.style.padding = '8px 12px';
  input.style.border = '1px solid #d1d5db';
  input.style.borderRadius = '6px';
  input.style.fontSize = '14px';
  
  const hint = document.createElement('div');
  hint.style.fontSize = '12px';
  hint.style.color = '#6b7280';
  hint.style.marginTop = '4px';
  hint.textContent = 'Format: MAJOR.MINOR.PATCH (e.g., 1.0.0)';
  
  const error = document.createElement('div');
  error.style.fontSize = '12px';
  error.style.color = '#dc2626';
  error.style.marginTop = '4px';
  error.style.display = 'none';
  error.textContent = 'Invalid version format';
  
  function validate() {
    const isValid = isValidVersion(input.value);
    if (!isValid && input.value) {
      input.style.borderColor = '#dc2626';
      error.style.display = 'block';
      hint.style.display = 'none';
    } else {
      input.style.borderColor = '#d1d5db';
      error.style.display = 'none';
      hint.style.display = 'block';
    }
    return isValid;
  }
  
  input.oninput = () => {
    validate();
    if (validate() || !input.value) {
      onChange(input.value);
    }
  };
  
  container.appendChild(input);
  container.appendChild(hint);
  container.appendChild(error);
  
  return container;
}

// ============================================================================
// AUTHOR FIELD
// ============================================================================

/**
 * Create author field with email support.
 */
export function createAuthorField(
  value: string,
  onChange: (value: string) => void
): HTMLElement {
  const container = document.createElement('div');
  container.style.marginBottom = '16px';
  
  const label = document.createElement('label');
  label.textContent = 'Author';
  label.style.display = 'block';
  label.style.marginBottom = '4px';
  label.style.fontSize = '14px';
  label.style.fontWeight = '500';
  container.appendChild(label);
  
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value;
  input.placeholder = 'Your Name <email@example.com>';
  input.style.width = '100%';
  input.style.padding = '8px 12px';
  input.style.border = '1px solid #d1d5db';
  input.style.borderRadius = '6px';
  input.style.fontSize = '14px';
  
  const hint = document.createElement('div');
  hint.style.fontSize = '12px';
  hint.style.color = '#6b7280';
  hint.style.marginTop = '4px';
  hint.textContent = 'Optional: include email in angle brackets';
  
  input.oninput = () => {
    onChange(input.value);
  };
  
  container.appendChild(input);
  container.appendChild(hint);
  
  return container;
}

// ============================================================================
// LICENSE SELECTOR
// ============================================================================

/**
 * Create license selector dropdown.
 */
export function createLicenseSelector(
  value: string,
  onChange: (value: string) => void
): HTMLElement {
  const options = LICENSES.map(license => ({
    value: license,
    label: license,
  }));
  
  return createSelectField('License', value, options, onChange);
}

// ============================================================================
// README EDITOR
// ============================================================================

/**
 * README editor options.
 */
export interface ReadmeEditorOptions {
  readonly content: string;
  readonly onChange: (content: string) => void;
  readonly showPreview?: boolean;
}

/**
 * Create markdown README editor with preview.
 */
export function createReadmeEditor(options: ReadmeEditorOptions): HTMLElement {
  const container = document.createElement('div');
  container.style.marginBottom = '16px';
  
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '8px';
  
  const label = document.createElement('label');
  label.textContent = 'README (Markdown)';
  label.style.fontSize = '14px';
  label.style.fontWeight = '500';
  header.appendChild(label);
  
  const tabs = document.createElement('div');
  tabs.style.display = 'flex';
  tabs.style.gap = '8px';
  
  let showPreview = options.showPreview ?? false;
  
  const editTab = document.createElement('button');
  editTab.textContent = 'Edit';
  editTab.style.padding = '4px 12px';
  editTab.style.border = '1px solid #d1d5db';
  editTab.style.borderRadius = '6px';
  editTab.style.backgroundColor = '#ffffff';
  editTab.style.cursor = 'pointer';
  editTab.style.fontSize = '12px';
  
  const previewTab = document.createElement('button');
  previewTab.textContent = 'Preview';
  previewTab.style.padding = '4px 12px';
  previewTab.style.border = '1px solid #d1d5db';
  previewTab.style.borderRadius = '6px';
  previewTab.style.backgroundColor = '#ffffff';
  previewTab.style.cursor = 'pointer';
  previewTab.style.fontSize = '12px';
  
  function updateTabStyles() {
    if (showPreview) {
      editTab.style.backgroundColor = '#ffffff';
      previewTab.style.backgroundColor = '#3b82f6';
      previewTab.style.color = '#ffffff';
      textarea.style.display = 'none';
      preview.style.display = 'block';
      updatePreview();
    } else {
      editTab.style.backgroundColor = '#3b82f6';
      editTab.style.color = '#ffffff';
      previewTab.style.backgroundColor = '#ffffff';
      previewTab.style.color = '';
      textarea.style.display = 'block';
      preview.style.display = 'none';
    }
  }
  
  editTab.onclick = () => {
    showPreview = false;
    updateTabStyles();
  };
  
  previewTab.onclick = () => {
    showPreview = true;
    updateTabStyles();
  };
  
  tabs.appendChild(editTab);
  tabs.appendChild(previewTab);
  header.appendChild(tabs);
  container.appendChild(header);
  
  const textarea = document.createElement('textarea');
  textarea.value = options.content;
  textarea.placeholder = '# Card Name\n\nDescription of your card...\n\n## Usage\n\n...\n\n## Parameters\n\n...';
  textarea.rows = 15;
  textarea.style.width = '100%';
  textarea.style.padding = '12px';
  textarea.style.border = '1px solid #d1d5db';
  textarea.style.borderRadius = '6px';
  textarea.style.fontSize = '14px';
  textarea.style.fontFamily = 'monospace';
  textarea.style.resize = 'vertical';
  
  textarea.oninput = () => {
    options.onChange(textarea.value);
  };
  
  const preview = document.createElement('div');
  preview.style.width = '100%';
  preview.style.padding = '12px';
  preview.style.border = '1px solid #d1d5db';
  preview.style.borderRadius = '6px';
  preview.style.backgroundColor = '#f9fafb';
  preview.style.minHeight = '300px';
  preview.style.display = 'none';
  preview.style.fontSize = '14px';
  preview.style.lineHeight = '1.6';
  
  function updatePreview() {
    // Simple markdown-to-HTML conversion (basic)
    let html = options.content
      // Headers
      .replace(/^### (.*$)/gm, '<h3 style="font-size:16px;font-weight:600;margin:12px 0 8px">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 style="font-size:18px;font-weight:600;margin:16px 0 8px">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 style="font-size:20px;font-weight:700;margin:16px 0 12px">$1</h1>')
      // Bold
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Code inline
      .replace(/`([^`]+)`/g, '<code style="background:#e5e7eb;padding:2px 4px;border-radius:3px;font-family:monospace;font-size:13px">$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#3b82f6;text-decoration:underline">$1</a>')
      // Line breaks
      .replace(/\n\n/g, '</p><p style="margin:8px 0">')
      .replace(/\n/g, '<br>');
    
    html = '<p style="margin:8px 0">' + html + '</p>';
    preview.innerHTML = html;
  }
  
  container.appendChild(textarea);
  container.appendChild(preview);
  
  updateTabStyles();
  
  return container;
}
