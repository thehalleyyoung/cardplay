/**
 * @fileoverview Core UI Components.
 * 
 * Provides a complete set of reusable UI components with:
 * - Button variants (primary, secondary, ghost)
 * - Form controls (input, select, checkbox, slider)
 * - Interactive controls (knob, toggle, tabs)
 * - Lists and tables (virtualized scrolling)
 * - Menus and navigation
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

/**
 * Component size.
 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Component variant.
 */
export type ComponentVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

/**
 * Component state.
 */
export interface ComponentState {
  readonly disabled: boolean;
  readonly loading: boolean;
  readonly focused: boolean;
  readonly hovered: boolean;
  readonly active: boolean;
  readonly selected: boolean;
}

/**
 * Default component state.
 */
export const DEFAULT_COMPONENT_STATE: ComponentState = {
  disabled: false,
  loading: false,
  focused: false,
  hovered: false,
  active: false,
  selected: false,
};

/**
 * Component event handler types.
 */
export type ComponentEventHandler<T = void> = (event: T) => void;

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

/**
 * Button type.
 */
export type ButtonType = 'button' | 'submit' | 'reset';

/**
 * Button props.
 */
export interface ButtonProps {
  readonly label: string;
  readonly variant: ComponentVariant;
  readonly size: ComponentSize;
  readonly type: ButtonType;
  readonly disabled: boolean;
  readonly loading: boolean;
  readonly fullWidth: boolean;
  readonly icon?: string;
  readonly iconPosition: 'left' | 'right';
  readonly ariaLabel?: string;
  readonly onClick?: ComponentEventHandler;
}

/**
 * Default button props.
 */
export const DEFAULT_BUTTON_PROPS: ButtonProps = {
  label: 'Button',
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  fullWidth: false,
  iconPosition: 'left',
};

/**
 * Button style configuration.
 */
export interface ButtonStyle {
  readonly padding: string;
  readonly fontSize: string;
  readonly borderRadius: string;
  readonly height: string;
  readonly minWidth: string;
}

/**
 * Get button style for size.
 */
export function getButtonStyle(size: ComponentSize): ButtonStyle {
  const styles: Record<ComponentSize, ButtonStyle> = {
    xs: { padding: '0 8px', fontSize: '11px', borderRadius: '4px', height: '24px', minWidth: '48px' },
    sm: { padding: '0 12px', fontSize: '12px', borderRadius: '4px', height: '28px', minWidth: '56px' },
    md: { padding: '0 16px', fontSize: '14px', borderRadius: '6px', height: '32px', minWidth: '64px' },
    lg: { padding: '0 20px', fontSize: '16px', borderRadius: '6px', height: '40px', minWidth: '80px' },
    xl: { padding: '0 24px', fontSize: '18px', borderRadius: '8px', height: '48px', minWidth: '96px' },
  };
  return styles[size];
}

/**
 * Get button colors for variant.
 */
export function getButtonColors(
  variant: ComponentVariant,
  state: Partial<ComponentState> = {}
): { bg: string; text: string; border: string } {
  const { disabled = false, hovered = false, active = false } = state;

  if (disabled) {
    return {
      bg: 'var(--color-bg-disabled)',
      text: 'var(--color-text-disabled)',
      border: 'var(--color-border-secondary)',
    };
  }

  const variants: Record<ComponentVariant, { bg: string; text: string; border: string }> = {
    primary: {
      bg: active ? 'var(--color-interactive-active)' : 
          hovered ? 'var(--color-interactive-hover)' : 'var(--color-interactive)',
      text: 'var(--color-text-inverse)',
      border: 'transparent',
    },
    secondary: {
      bg: active ? 'var(--color-bg-active)' :
          hovered ? 'var(--color-bg-hover)' : 'transparent',
      text: 'var(--color-text-primary)',
      border: 'var(--color-border-primary)',
    },
    ghost: {
      bg: active ? 'var(--color-bg-active)' :
          hovered ? 'var(--color-bg-hover)' : 'transparent',
      text: 'var(--color-text-primary)',
      border: 'transparent',
    },
    danger: {
      bg: active ? 'var(--color-error-700)' :
          hovered ? 'var(--color-error-600)' : 'var(--color-error)',
      text: 'var(--color-text-inverse)',
      border: 'transparent',
    },
    success: {
      bg: active ? 'var(--color-success-700)' :
          hovered ? 'var(--color-success-600)' : 'var(--color-success)',
      text: 'var(--color-text-inverse)',
      border: 'transparent',
    },
  };

  return variants[variant];
}

// ============================================================================
// ICON BUTTON COMPONENT
// ============================================================================

/**
 * Icon button props.
 */
export interface IconButtonProps {
  readonly icon: string;
  readonly ariaLabel: string;
  readonly size: ComponentSize;
  readonly variant: ComponentVariant;
  readonly disabled: boolean;
  readonly tooltip?: string;
  readonly tooltipPosition: 'top' | 'bottom' | 'left' | 'right';
  readonly onClick?: ComponentEventHandler;
}

/**
 * Default icon button props.
 */
export const DEFAULT_ICON_BUTTON_PROPS: IconButtonProps = {
  icon: 'plus',
  ariaLabel: 'Button',
  size: 'md',
  variant: 'ghost',
  disabled: false,
  tooltipPosition: 'top',
};

/**
 * Get icon button size.
 */
export function getIconButtonSize(size: ComponentSize): number {
  const sizes: Record<ComponentSize, number> = {
    xs: 20,
    sm: 24,
    md: 32,
    lg: 40,
    xl: 48,
  };
  return sizes[size];
}

// ============================================================================
// TOGGLE BUTTON COMPONENT
// ============================================================================

/**
 * Toggle button props.
 */
export interface ToggleButtonProps {
  readonly label: string;
  readonly pressed: boolean;
  readonly size: ComponentSize;
  readonly disabled: boolean;
  readonly icon?: string;
  readonly ariaLabel?: string;
  readonly onChange?: ComponentEventHandler<boolean>;
}

/**
 * Default toggle button props.
 */
export const DEFAULT_TOGGLE_BUTTON_PROPS: ToggleButtonProps = {
  label: 'Toggle',
  pressed: false,
  size: 'md',
  disabled: false,
};

// ============================================================================
// BUTTON GROUP COMPONENT
// ============================================================================

/**
 * Button group item.
 */
export interface ButtonGroupItem {
  readonly id: string;
  readonly label: string;
  readonly icon?: string;
  readonly disabled?: boolean;
}

/**
 * Button group props.
 */
export interface ButtonGroupProps {
  readonly items: readonly ButtonGroupItem[];
  readonly value: string;
  readonly size: ComponentSize;
  readonly fullWidth: boolean;
  readonly disabled: boolean;
  readonly onChange?: ComponentEventHandler<string>;
}

/**
 * Default button group props.
 */
export const DEFAULT_BUTTON_GROUP_PROPS: ButtonGroupProps = {
  items: [],
  value: '',
  size: 'md',
  fullWidth: false,
  disabled: false,
};

// ============================================================================
// SLIDER COMPONENT
// ============================================================================

/**
 * Slider props.
 */
export interface SliderProps {
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly disabled: boolean;
  readonly showValue: boolean;
  readonly valueFormat?: (value: number) => string;
  readonly orientation: 'horizontal' | 'vertical';
  readonly size: ComponentSize;
  readonly marks?: readonly { value: number; label?: string }[];
  readonly onChange?: ComponentEventHandler<number>;
  readonly onChangeEnd?: ComponentEventHandler<number>;
}

/**
 * Default slider props.
 */
export const DEFAULT_SLIDER_PROPS: SliderProps = {
  value: 0,
  min: 0,
  max: 100,
  step: 1,
  disabled: false,
  showValue: true,
  orientation: 'horizontal',
  size: 'md',
};

/**
 * Calculate slider percentage.
 */
export function sliderToPercent(value: number, min: number, max: number): number {
  return ((value - min) / (max - min)) * 100;
}

/**
 * Calculate value from slider position.
 */
export function percentToSlider(percent: number, min: number, max: number, step: number): number {
  const raw = min + (percent / 100) * (max - min);
  const stepped = Math.round(raw / step) * step;
  return Math.max(min, Math.min(max, stepped));
}

// ============================================================================
// RANGE SLIDER COMPONENT
// ============================================================================

/**
 * Range slider props.
 */
export interface RangeSliderProps {
  readonly value: readonly [number, number];
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly minDistance: number;
  readonly disabled: boolean;
  readonly showValue: boolean;
  readonly orientation: 'horizontal' | 'vertical';
  readonly size: ComponentSize;
  readonly onChange?: ComponentEventHandler<readonly [number, number]>;
}

/**
 * Default range slider props.
 */
export const DEFAULT_RANGE_SLIDER_PROPS: RangeSliderProps = {
  value: [0, 100],
  min: 0,
  max: 100,
  step: 1,
  minDistance: 0,
  disabled: false,
  showValue: true,
  orientation: 'horizontal',
  size: 'md',
};

// ============================================================================
// KNOB COMPONENT
// ============================================================================

/**
 * Knob props.
 */
export interface KnobProps {
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly size: ComponentSize;
  readonly disabled: boolean;
  readonly showValue: boolean;
  readonly valueFormat?: (value: number) => string;
  readonly label?: string;
  readonly bipolar: boolean;
  readonly sensitivity: number;
  readonly onChange?: ComponentEventHandler<number>;
  readonly onChangeEnd?: ComponentEventHandler<number>;
}

/**
 * Default knob props.
 */
export const DEFAULT_KNOB_PROPS: KnobProps = {
  value: 0,
  min: 0,
  max: 100,
  step: 1,
  size: 'md',
  disabled: false,
  showValue: true,
  bipolar: false,
  sensitivity: 1,
};

/**
 * Get knob size in pixels.
 */
export function getKnobSize(size: ComponentSize): number {
  const sizes: Record<ComponentSize, number> = {
    xs: 24,
    sm: 32,
    md: 48,
    lg: 64,
    xl: 80,
  };
  return sizes[size];
}

/**
 * Calculate knob rotation angle.
 */
export function knobToAngle(
  value: number,
  min: number,
  max: number,
  startAngle: number = -135,
  endAngle: number = 135
): number {
  const percent = (value - min) / (max - min);
  return startAngle + percent * (endAngle - startAngle);
}

// ============================================================================
// NUMBER INPUT COMPONENT
// ============================================================================

/**
 * Number input props.
 */
export interface NumberInputProps {
  readonly value: number;
  readonly min?: number;
  readonly max?: number;
  readonly step: number;
  readonly precision: number;
  readonly size: ComponentSize;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly allowDrag: boolean;
  readonly dragSensitivity: number;
  readonly suffix?: string;
  readonly prefix?: string;
  readonly onChange?: ComponentEventHandler<number>;
}

/**
 * Default number input props.
 */
export const DEFAULT_NUMBER_INPUT_PROPS: NumberInputProps = {
  value: 0,
  step: 1,
  precision: 0,
  size: 'md',
  disabled: false,
  readOnly: false,
  allowDrag: true,
  dragSensitivity: 1,
};

/**
 * Parse number input value.
 */
export function parseNumberInput(
  input: string,
  min?: number,
  max?: number,
  precision: number = 0
): number | null {
  const parsed = parseFloat(input);
  if (isNaN(parsed)) return null;
  
  let value = parseFloat(parsed.toFixed(precision));
  if (min !== undefined) value = Math.max(min, value);
  if (max !== undefined) value = Math.min(max, value);
  
  return value;
}

// ============================================================================
// TEXT INPUT COMPONENT
// ============================================================================

/**
 * Text input type.
 */
export type TextInputType = 'text' | 'password' | 'email' | 'url' | 'search';

/**
 * Text input props.
 */
export interface TextInputProps {
  readonly value: string;
  readonly type: TextInputType;
  readonly placeholder?: string;
  readonly size: ComponentSize;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly required: boolean;
  readonly pattern?: string;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly autoComplete?: string;
  readonly error?: string;
  readonly hint?: string;
  readonly icon?: string;
  readonly clearable: boolean;
  readonly onChange?: ComponentEventHandler<string>;
  readonly onBlur?: ComponentEventHandler;
  readonly onFocus?: ComponentEventHandler;
}

/**
 * Default text input props.
 */
export const DEFAULT_TEXT_INPUT_PROPS: TextInputProps = {
  value: '',
  type: 'text',
  size: 'md',
  disabled: false,
  readOnly: false,
  required: false,
  clearable: false,
};

/**
 * Validation result.
 */
export interface ValidationResult {
  readonly valid: boolean;
  readonly message?: string;
}

/**
 * Validate text input.
 */
export function validateTextInput(
  value: string,
  props: Partial<TextInputProps>
): ValidationResult {
  const { required, minLength, maxLength, pattern } = props;

  if (required && !value) {
    return { valid: false, message: 'This field is required' };
  }

  if (minLength !== undefined && value.length < minLength) {
    return { valid: false, message: `Minimum ${minLength} characters required` };
  }

  if (maxLength !== undefined && value.length > maxLength) {
    return { valid: false, message: `Maximum ${maxLength} characters allowed` };
  }

  if (pattern) {
    const regex = new RegExp(pattern);
    if (!regex.test(value)) {
      return { valid: false, message: 'Invalid format' };
    }
  }

  return { valid: true };
}

// ============================================================================
// SELECT COMPONENT
// ============================================================================

/**
 * Select option.
 */
export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly group?: string;
}

/**
 * Select props.
 */
export interface SelectProps {
  readonly value: string;
  readonly options: readonly SelectOption[];
  readonly placeholder?: string;
  readonly size: ComponentSize;
  readonly disabled: boolean;
  readonly required: boolean;
  readonly error?: string;
  readonly onChange?: ComponentEventHandler<string>;
}

/**
 * Default select props.
 */
export const DEFAULT_SELECT_PROPS: SelectProps = {
  value: '',
  options: [],
  size: 'md',
  disabled: false,
  required: false,
};

/**
 * Group select options.
 */
export function groupSelectOptions(
  options: readonly SelectOption[]
): Map<string, readonly SelectOption[]> {
  const groups = new Map<string, SelectOption[]>();
  
  for (const option of options) {
    const groupName = option.group ?? '';
    const group = groups.get(groupName) ?? [];
    group.push(option);
    groups.set(groupName, group);
  }
  
  return groups;
}

// ============================================================================
// COMBOBOX COMPONENT
// ============================================================================

/**
 * Combobox props.
 */
export interface ComboboxProps {
  readonly value: string;
  readonly options: readonly SelectOption[];
  readonly placeholder?: string;
  readonly size: ComponentSize;
  readonly disabled: boolean;
  readonly allowCreate: boolean;
  readonly maxResults: number;
  readonly filterFn?: (option: SelectOption, query: string) => boolean;
  readonly onChange?: ComponentEventHandler<string>;
  readonly onCreate?: ComponentEventHandler<string>;
}

/**
 * Default combobox props.
 */
export const DEFAULT_COMBOBOX_PROPS: ComboboxProps = {
  value: '',
  options: [],
  size: 'md',
  disabled: false,
  allowCreate: false,
  maxResults: 10,
};

/**
 * Default filter function for combobox.
 */
export function defaultComboboxFilter(option: SelectOption, query: string): boolean {
  return option.label.toLowerCase().includes(query.toLowerCase());
}

/**
 * Filter combobox options.
 */
export function filterComboboxOptions(
  options: readonly SelectOption[],
  query: string,
  filterFn: (option: SelectOption, query: string) => boolean = defaultComboboxFilter,
  maxResults: number = 10
): readonly SelectOption[] {
  if (!query) return options.slice(0, maxResults);
  return options.filter(o => filterFn(o, query)).slice(0, maxResults);
}

// ============================================================================
// CHECKBOX COMPONENT
// ============================================================================

/**
 * Checkbox state.
 */
export type CheckboxState = 'unchecked' | 'checked' | 'indeterminate';

/**
 * Checkbox props.
 */
export interface CheckboxProps {
  readonly checked: boolean;
  readonly indeterminate: boolean;
  readonly label?: string;
  readonly size: ComponentSize;
  readonly disabled: boolean;
  readonly required: boolean;
  readonly error?: string;
  readonly onChange?: ComponentEventHandler<boolean>;
}

/**
 * Default checkbox props.
 */
export const DEFAULT_CHECKBOX_PROPS: CheckboxProps = {
  checked: false,
  indeterminate: false,
  size: 'md',
  disabled: false,
  required: false,
};

/**
 * Get checkbox state.
 */
export function getCheckboxState(checked: boolean, indeterminate: boolean): CheckboxState {
  if (indeterminate) return 'indeterminate';
  return checked ? 'checked' : 'unchecked';
}

// ============================================================================
// SWITCH COMPONENT
// ============================================================================

/**
 * Switch props.
 */
export interface SwitchProps {
  readonly checked: boolean;
  readonly label?: string;
  readonly size: ComponentSize;
  readonly disabled: boolean;
  readonly labelPosition: 'left' | 'right';
  readonly onChange?: ComponentEventHandler<boolean>;
}

/**
 * Default switch props.
 */
export const DEFAULT_SWITCH_PROPS: SwitchProps = {
  checked: false,
  size: 'md',
  disabled: false,
  labelPosition: 'right',
};

/**
 * Get switch dimensions.
 */
export function getSwitchDimensions(size: ComponentSize): { width: number; height: number; thumbSize: number } {
  const dims: Record<ComponentSize, { width: number; height: number; thumbSize: number }> = {
    xs: { width: 28, height: 16, thumbSize: 12 },
    sm: { width: 36, height: 20, thumbSize: 16 },
    md: { width: 44, height: 24, thumbSize: 20 },
    lg: { width: 52, height: 28, thumbSize: 24 },
    xl: { width: 60, height: 32, thumbSize: 28 },
  };
  return dims[size];
}

// ============================================================================
// RADIO GROUP COMPONENT
// ============================================================================

/**
 * Radio option.
 */
export interface RadioOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly description?: string;
}

/**
 * Radio group props.
 */
export interface RadioGroupProps {
  readonly value: string;
  readonly options: readonly RadioOption[];
  readonly name: string;
  readonly size: ComponentSize;
  readonly disabled: boolean;
  readonly required: boolean;
  readonly orientation: 'horizontal' | 'vertical';
  readonly error?: string;
  readonly onChange?: ComponentEventHandler<string>;
}

/**
 * Default radio group props.
 */
export const DEFAULT_RADIO_GROUP_PROPS: RadioGroupProps = {
  value: '',
  options: [],
  name: 'radio-group',
  size: 'md',
  disabled: false,
  required: false,
  orientation: 'vertical',
};

// ============================================================================
// TABS COMPONENT
// ============================================================================

/**
 * Tab item.
 */
export interface TabItem {
  readonly id: string;
  readonly label: string;
  readonly icon?: string;
  readonly disabled?: boolean;
  readonly closable?: boolean;
  readonly badge?: string | number;
}

/**
 * Tabs props.
 */
export interface TabsProps {
  readonly value: string;
  readonly tabs: readonly TabItem[];
  readonly size: ComponentSize;
  readonly variant: 'line' | 'pill' | 'enclosed';
  readonly fullWidth: boolean;
  readonly onChange?: ComponentEventHandler<string>;
  readonly onClose?: ComponentEventHandler<string>;
}

/**
 * Default tabs props.
 */
export const DEFAULT_TABS_PROPS: TabsProps = {
  value: '',
  tabs: [],
  size: 'md',
  variant: 'line',
  fullWidth: false,
};

// ============================================================================
// ACCORDION COMPONENT
// ============================================================================

/**
 * Accordion item.
 */
export interface AccordionItem {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly disabled?: boolean;
  readonly icon?: string;
}

/**
 * Accordion props.
 */
export interface AccordionProps {
  readonly items: readonly AccordionItem[];
  readonly expanded: readonly string[];
  readonly multiple: boolean;
  readonly collapsible: boolean;
  readonly onChange?: ComponentEventHandler<readonly string[]>;
}

/**
 * Default accordion props.
 */
export const DEFAULT_ACCORDION_PROPS: AccordionProps = {
  items: [],
  expanded: [],
  multiple: false,
  collapsible: true,
};

/**
 * Toggle accordion item.
 */
export function toggleAccordionItem(
  expanded: readonly string[],
  id: string,
  multiple: boolean,
  collapsible: boolean
): readonly string[] {
  const isExpanded = expanded.includes(id);
  
  if (isExpanded) {
    if (!collapsible && expanded.length === 1) {
      return expanded; // Cannot collapse last item
    }
    return expanded.filter(e => e !== id);
  }
  
  if (multiple) {
    return [...expanded, id];
  }
  
  return [id];
}

// ============================================================================
// TREE COMPONENT
// ============================================================================

/**
 * Tree node.
 */
export interface TreeNode {
  readonly id: string;
  readonly label: string;
  readonly icon?: string;
  readonly children?: readonly TreeNode[];
  readonly disabled?: boolean;
  readonly selectable?: boolean;
}

/**
 * Tree props.
 */
export interface TreeProps {
  readonly nodes: readonly TreeNode[];
  readonly selected: readonly string[];
  readonly expanded: readonly string[];
  readonly multiSelect: boolean;
  readonly checkable: boolean;
  readonly draggable: boolean;
  readonly showLines: boolean;
  readonly onSelect?: ComponentEventHandler<readonly string[]>;
  readonly onExpand?: ComponentEventHandler<readonly string[]>;
  readonly onDrop?: ComponentEventHandler<{ dragId: string; dropId: string }>;
}

/**
 * Default tree props.
 */
export const DEFAULT_TREE_PROPS: TreeProps = {
  nodes: [],
  selected: [],
  expanded: [],
  multiSelect: false,
  checkable: false,
  draggable: false,
  showLines: true,
};

/**
 * Flatten tree nodes for rendering.
 */
export function flattenTreeNodes(
  nodes: readonly TreeNode[],
  expanded: readonly string[],
  depth: number = 0
): readonly { node: TreeNode; depth: number }[] {
  const result: { node: TreeNode; depth: number }[] = [];
  
  for (const node of nodes) {
    result.push({ node, depth });
    
    if (node.children && expanded.includes(node.id)) {
      result.push(...flattenTreeNodes(node.children, expanded, depth + 1));
    }
  }
  
  return result;
}

// ============================================================================
// VIRTUALIZED LIST
// ============================================================================

/**
 * Virtual list item.
 */
export interface VirtualListItem {
  readonly key: string;
  readonly height: number;
}

/**
 * Virtual list state.
 */
export interface VirtualListState {
  readonly scrollTop: number;
  readonly viewportHeight: number;
  readonly totalHeight: number;
  readonly startIndex: number;
  readonly endIndex: number;
  readonly offsetY: number;
}

/**
 * Calculate virtual list state.
 */
export function calculateVirtualListState(
  items: readonly VirtualListItem[],
  scrollTop: number,
  viewportHeight: number,
  overscan: number = 3
): VirtualListState {
  let totalHeight = 0;
  let startIndex = 0;
  let startY = 0;
  
  // Find start index
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    if (totalHeight + item.height > scrollTop) {
      startIndex = Math.max(0, i - overscan);
      break;
    }
    totalHeight += item.height;
  }
  
  // Calculate start offset
  for (let i = 0; i < startIndex; i++) {
    startY += items[i]!.height;
  }
  
  // Find end index
  let endIndex = startIndex;
  let visibleHeight = 0;
  for (let i = startIndex; i < items.length; i++) {
    visibleHeight += items[i]!.height;
    endIndex = i;
    if (visibleHeight >= viewportHeight + scrollTop - startY) {
      endIndex = Math.min(items.length - 1, i + overscan);
      break;
    }
  }
  
  // Calculate total height
  totalHeight = 0;
  for (const item of items) {
    totalHeight += item.height;
  }
  
  return {
    scrollTop,
    viewportHeight,
    totalHeight,
    startIndex,
    endIndex,
    offsetY: startY,
  };
}

// ============================================================================
// TABLE COMPONENT
// ============================================================================

/**
 * Table column definition.
 */
export interface TableColumn<T> {
  readonly key: string;
  readonly header: string;
  readonly width?: number | string;
  readonly minWidth?: number;
  readonly maxWidth?: number;
  readonly sortable?: boolean;
  readonly resizable?: boolean;
  readonly align?: 'left' | 'center' | 'right';
  readonly render?: (value: T, row: T, index: number) => string;
}

/**
 * Sort direction.
 */
export type SortDirection = 'asc' | 'desc' | 'none';

/**
 * Table sort state.
 */
export interface TableSortState {
  readonly column: string;
  readonly direction: SortDirection;
}

/**
 * Table props.
 */
export interface TableProps<T> {
  readonly columns: readonly TableColumn<T>[];
  readonly data: readonly T[];
  readonly rowKey: keyof T;
  readonly sortable: boolean;
  readonly sort?: TableSortState;
  readonly selectable: boolean;
  readonly selected?: readonly string[];
  readonly hoverable: boolean;
  readonly striped: boolean;
  readonly bordered: boolean;
  readonly compact: boolean;
  readonly stickyHeader: boolean;
  readonly onSort?: ComponentEventHandler<TableSortState>;
  readonly onSelect?: ComponentEventHandler<readonly string[]>;
  readonly onRowClick?: ComponentEventHandler<T>;
}

/**
 * Sort table data.
 */
export function sortTableData<T>(
  data: readonly T[],
  sort: TableSortState,
  columns: readonly TableColumn<T>[]
): readonly T[] {
  if (sort.direction === 'none' || !sort.column) {
    return data;
  }
  
  const column = columns.find(c => c.key === sort.column);
  if (!column) return data;
  
  return [...data].sort((a, b) => {
    const aVal = (a as Record<string, unknown>)[sort.column];
    const bVal = (b as Record<string, unknown>)[sort.column];
    
    let comparison = 0;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      comparison = aVal.localeCompare(bVal);
    } else if (typeof aVal === 'number' && typeof bVal === 'number') {
      comparison = aVal - bVal;
    }
    
    return sort.direction === 'desc' ? -comparison : comparison;
  });
}

// ============================================================================
// MENU COMPONENT
// ============================================================================

/**
 * Menu item type.
 */
export type MenuItemType = 'item' | 'separator' | 'header' | 'submenu';

/**
 * Menu item.
 */
export interface MenuItem {
  readonly type: MenuItemType;
  readonly id: string;
  readonly label?: string;
  readonly icon?: string;
  readonly shortcut?: string;
  readonly disabled?: boolean;
  readonly checked?: boolean;
  readonly children?: readonly MenuItem[];
}

/**
 * Menu props.
 */
export interface MenuProps {
  readonly items: readonly MenuItem[];
  readonly onSelect?: ComponentEventHandler<string>;
}

/**
 * Create menu separator.
 */
export function menuSeparator(): MenuItem {
  return { type: 'separator', id: `sep-${Date.now()}` };
}

/**
 * Create menu header.
 */
export function menuHeader(label: string): MenuItem {
  return { type: 'header', id: `header-${Date.now()}`, label };
}

/**
 * Create menu item.
 */
export function menuItem(
  id: string,
  label: string,
  options: Partial<Omit<MenuItem, 'type' | 'id' | 'label'>> = {}
): MenuItem {
  return { type: 'item', id, label, ...options };
}

/**
 * Create submenu.
 */
export function submenu(
  id: string,
  label: string,
  children: readonly MenuItem[]
): MenuItem {
  return { type: 'submenu', id, label, children };
}

// ============================================================================
// TOOLTIP COMPONENT
// ============================================================================

/**
 * Tooltip position.
 */
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * Tooltip props.
 */
export interface TooltipProps {
  readonly content: string;
  readonly position: TooltipPosition;
  readonly delay: number;
  readonly disabled: boolean;
  readonly maxWidth: number;
}

/**
 * Default tooltip props.
 */
export const DEFAULT_TOOLTIP_PROPS: TooltipProps = {
  content: '',
  position: 'top',
  delay: 300,
  disabled: false,
  maxWidth: 200,
};

/**
 * Calculate tooltip position.
 */
export function calculateTooltipPosition(
  triggerRect: DOMRect,
  tooltipRect: { width: number; height: number },
  position: TooltipPosition,
  offset: number = 8
): { x: number; y: number } {
  const { left, top, right, bottom, width, height } = triggerRect;
  const centerX = left + width / 2;
  const centerY = top + height / 2;

  switch (position) {
    case 'top':
      return {
        x: centerX - tooltipRect.width / 2,
        y: top - tooltipRect.height - offset,
      };
    case 'bottom':
      return {
        x: centerX - tooltipRect.width / 2,
        y: bottom + offset,
      };
    case 'left':
      return {
        x: left - tooltipRect.width - offset,
        y: centerY - tooltipRect.height / 2,
      };
    case 'right':
      return {
        x: right + offset,
        y: centerY - tooltipRect.height / 2,
      };
  }
}

// ============================================================================
// EXPORT DIALOG COMPONENT (Phase 16)
// ============================================================================

export {
  // Types
  type ExportDialogState,
  type ExportDialogActions,
  
  // State management
  createExportDialogState,
  ExportDialogManager,
  
  // Formatting helpers
  formatFileSize,
  formatDuration,
  formatDb,
  formatProgress,
  formatTimeRemaining,
  getPhaseDisplayName,
  getFormatDisplay,
  getAvailableBitDepths,
  getSampleRateDisplay,
  getDitherDisplay,
  
  // Validation helpers
  formatSupportsBitDepth,
  isDitherRecommended,
  getExportWarnings,
} from './components/export-dialog';
