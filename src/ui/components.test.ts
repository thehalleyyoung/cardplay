/**
 * @fileoverview Tests for Core UI Components.
 */

import { describe, it, expect } from 'vitest';
import {
  // Types
  type ComponentSize,
  type ComponentVariant,
  DEFAULT_COMPONENT_STATE,
  
  // Button
  DEFAULT_BUTTON_PROPS,
  getButtonStyle,
  getButtonColors,
  
  // Icon Button
  DEFAULT_ICON_BUTTON_PROPS,
  getIconButtonSize,
  
  // Toggle Button
  DEFAULT_TOGGLE_BUTTON_PROPS,
  
  // Button Group
  DEFAULT_BUTTON_GROUP_PROPS,
  
  // Slider
  DEFAULT_SLIDER_PROPS,
  sliderToPercent,
  percentToSlider,
  
  // Range Slider
  DEFAULT_RANGE_SLIDER_PROPS,
  
  // Knob
  DEFAULT_KNOB_PROPS,
  getKnobSize,
  knobToAngle,
  
  // Number Input
  DEFAULT_NUMBER_INPUT_PROPS,
  parseNumberInput,
  
  // Text Input
  DEFAULT_TEXT_INPUT_PROPS,
  validateTextInput,
  
  // Select
  DEFAULT_SELECT_PROPS,
  groupSelectOptions,
  
  // Combobox
  DEFAULT_COMBOBOX_PROPS,
  defaultComboboxFilter,
  filterComboboxOptions,
  
  // Checkbox
  DEFAULT_CHECKBOX_PROPS,
  getCheckboxState,
  
  // Switch
  DEFAULT_SWITCH_PROPS,
  getSwitchDimensions,
  
  // Radio Group
  DEFAULT_RADIO_GROUP_PROPS,
  
  // Tabs
  DEFAULT_TABS_PROPS,
  
  // Accordion
  DEFAULT_ACCORDION_PROPS,
  toggleAccordionItem,
  
  // Tree
  DEFAULT_TREE_PROPS,
  flattenTreeNodes,
  
  // Virtual List
  calculateVirtualListState,
  
  // Table
  sortTableData,
  
  // Menu
  menuSeparator,
  menuHeader,
  menuItem,
  submenu,
  
  // Tooltip
  DEFAULT_TOOLTIP_PROPS,
  calculateTooltipPosition,
} from './components';

// ============================================================================
// BUTTON TESTS
// ============================================================================

describe('Button', () => {
  describe('DEFAULT_BUTTON_PROPS', () => {
    it('should have valid defaults', () => {
      expect(DEFAULT_BUTTON_PROPS.variant).toBe('primary');
      expect(DEFAULT_BUTTON_PROPS.size).toBe('md');
      expect(DEFAULT_BUTTON_PROPS.disabled).toBe(false);
    });
  });

  describe('getButtonStyle', () => {
    it('should return style for each size', () => {
      const sizes: ComponentSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
      
      for (const size of sizes) {
        const style = getButtonStyle(size);
        expect(style.padding).toBeDefined();
        expect(style.fontSize).toBeDefined();
        expect(style.height).toBeDefined();
      }
    });

    it('should have increasing heights', () => {
      const xs = parseInt(getButtonStyle('xs').height);
      const md = parseInt(getButtonStyle('md').height);
      const xl = parseInt(getButtonStyle('xl').height);
      
      expect(xs).toBeLessThan(md);
      expect(md).toBeLessThan(xl);
    });
  });

  describe('getButtonColors', () => {
    it('should return colors for each variant', () => {
      const variants: ComponentVariant[] = ['primary', 'secondary', 'ghost', 'danger', 'success'];
      
      for (const variant of variants) {
        const colors = getButtonColors(variant);
        expect(colors.bg).toBeDefined();
        expect(colors.text).toBeDefined();
        expect(colors.border).toBeDefined();
      }
    });

    it('should return disabled colors when disabled', () => {
      const colors = getButtonColors('primary', { disabled: true });
      expect(colors.bg).toContain('disabled');
    });

    it('should return hover colors when hovered', () => {
      const colors = getButtonColors('primary', { hovered: true });
      expect(colors.bg).toContain('hover');
    });

    it('should return active colors when active', () => {
      const colors = getButtonColors('primary', { active: true });
      expect(colors.bg).toContain('active');
    });
  });
});

describe('Icon Button', () => {
  it('should have valid defaults', () => {
    expect(DEFAULT_ICON_BUTTON_PROPS.variant).toBe('ghost');
    expect(DEFAULT_ICON_BUTTON_PROPS.tooltipPosition).toBe('top');
  });

  it('should return sizes for each component size', () => {
    const sizes: ComponentSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
    
    for (const size of sizes) {
      expect(getIconButtonSize(size)).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// SLIDER TESTS
// ============================================================================

describe('Slider', () => {
  describe('sliderToPercent', () => {
    it('should convert value to percent', () => {
      expect(sliderToPercent(50, 0, 100)).toBe(50);
      expect(sliderToPercent(0, 0, 100)).toBe(0);
      expect(sliderToPercent(100, 0, 100)).toBe(100);
    });

    it('should handle different ranges', () => {
      expect(sliderToPercent(50, 0, 200)).toBe(25);
      expect(sliderToPercent(10, -10, 10)).toBe(100);
    });
  });

  describe('percentToSlider', () => {
    it('should convert percent to value', () => {
      expect(percentToSlider(50, 0, 100, 1)).toBe(50);
      expect(percentToSlider(0, 0, 100, 1)).toBe(0);
      expect(percentToSlider(100, 0, 100, 1)).toBe(100);
    });

    it('should respect step', () => {
      expect(percentToSlider(33, 0, 100, 10)).toBe(30);
      expect(percentToSlider(37, 0, 100, 10)).toBe(40);
    });

    it('should clamp to range', () => {
      expect(percentToSlider(150, 0, 100, 1)).toBe(100);
      expect(percentToSlider(-50, 0, 100, 1)).toBe(0);
    });
  });
});

describe('Range Slider', () => {
  it('should have valid defaults', () => {
    expect(DEFAULT_RANGE_SLIDER_PROPS.value).toEqual([0, 100]);
    expect(DEFAULT_RANGE_SLIDER_PROPS.minDistance).toBe(0);
  });
});

// ============================================================================
// KNOB TESTS
// ============================================================================

describe('Knob', () => {
  describe('getKnobSize', () => {
    it('should return size for each component size', () => {
      const sizes: ComponentSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
      
      for (const size of sizes) {
        expect(getKnobSize(size)).toBeGreaterThan(0);
      }
    });

    it('should have increasing sizes', () => {
      expect(getKnobSize('xs')).toBeLessThan(getKnobSize('md'));
      expect(getKnobSize('md')).toBeLessThan(getKnobSize('xl'));
    });
  });

  describe('knobToAngle', () => {
    it('should calculate angle from value', () => {
      expect(knobToAngle(0, 0, 100)).toBe(-135);
      expect(knobToAngle(100, 0, 100)).toBe(135);
      expect(knobToAngle(50, 0, 100)).toBe(0);
    });

    it('should use custom angle range', () => {
      expect(knobToAngle(0, 0, 100, -90, 90)).toBe(-90);
      expect(knobToAngle(100, 0, 100, -90, 90)).toBe(90);
    });
  });
});

// ============================================================================
// INPUT TESTS
// ============================================================================

describe('Number Input', () => {
  describe('parseNumberInput', () => {
    it('should parse valid numbers', () => {
      expect(parseNumberInput('42')).toBe(42);
      expect(parseNumberInput('3.14')).toBe(3);
      expect(parseNumberInput('3.14', undefined, undefined, 2)).toBe(3.14);
    });

    it('should return null for invalid input', () => {
      expect(parseNumberInput('abc')).toBeNull();
      expect(parseNumberInput('')).toBeNull();
    });

    it('should clamp to min/max', () => {
      expect(parseNumberInput('150', 0, 100)).toBe(100);
      expect(parseNumberInput('-50', 0, 100)).toBe(0);
    });
  });
});

describe('Text Input', () => {
  describe('validateTextInput', () => {
    it('should validate required fields', () => {
      expect(validateTextInput('', { required: true }).valid).toBe(false);
      expect(validateTextInput('hello', { required: true }).valid).toBe(true);
    });

    it('should validate min length', () => {
      expect(validateTextInput('hi', { minLength: 5 }).valid).toBe(false);
      expect(validateTextInput('hello', { minLength: 5 }).valid).toBe(true);
    });

    it('should validate max length', () => {
      expect(validateTextInput('hello world', { maxLength: 5 }).valid).toBe(false);
      expect(validateTextInput('hello', { maxLength: 5 }).valid).toBe(true);
    });

    it('should validate pattern', () => {
      expect(validateTextInput('abc', { pattern: '^\\d+$' }).valid).toBe(false);
      expect(validateTextInput('123', { pattern: '^\\d+$' }).valid).toBe(true);
    });
  });
});

// ============================================================================
// SELECT TESTS
// ============================================================================

describe('Select', () => {
  describe('groupSelectOptions', () => {
    it('should group options by group name', () => {
      const options = [
        { value: 'a', label: 'A', group: 'letters' },
        { value: 'b', label: 'B', group: 'letters' },
        { value: '1', label: 'One', group: 'numbers' },
      ];
      
      const groups = groupSelectOptions(options);
      
      expect(groups.get('letters')?.length).toBe(2);
      expect(groups.get('numbers')?.length).toBe(1);
    });

    it('should handle ungrouped options', () => {
      const options = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ];
      
      const groups = groupSelectOptions(options);
      
      expect(groups.get('')?.length).toBe(2);
    });
  });
});

describe('Combobox', () => {
  describe('defaultComboboxFilter', () => {
    it('should filter by label (case-insensitive)', () => {
      const option = { value: 'test', label: 'Test Option' };
      
      expect(defaultComboboxFilter(option, 'test')).toBe(true);
      expect(defaultComboboxFilter(option, 'TEST')).toBe(true);
      expect(defaultComboboxFilter(option, 'opt')).toBe(true);
      expect(defaultComboboxFilter(option, 'xyz')).toBe(false);
    });
  });

  describe('filterComboboxOptions', () => {
    it('should filter options by query', () => {
      const options = [
        { value: 'a', label: 'Apple' },
        { value: 'b', label: 'Banana' },
        { value: 'c', label: 'Cherry' },
      ];
      
      const filtered = filterComboboxOptions(options, 'an');
      
      expect(filtered.length).toBe(1);
      expect(filtered[0]!.value).toBe('b');
    });

    it('should limit results', () => {
      const options = Array.from({ length: 20 }, (_, i) => ({
        value: `v${i}`,
        label: `Option ${i}`,
      }));
      
      const filtered = filterComboboxOptions(options, '', undefined, 5);
      
      expect(filtered.length).toBe(5);
    });
  });
});

// ============================================================================
// CHECKBOX & SWITCH TESTS
// ============================================================================

describe('Checkbox', () => {
  describe('getCheckboxState', () => {
    it('should return correct state', () => {
      expect(getCheckboxState(false, false)).toBe('unchecked');
      expect(getCheckboxState(true, false)).toBe('checked');
      expect(getCheckboxState(false, true)).toBe('indeterminate');
      expect(getCheckboxState(true, true)).toBe('indeterminate');
    });
  });
});

describe('Switch', () => {
  describe('getSwitchDimensions', () => {
    it('should return dimensions for each size', () => {
      const sizes: ComponentSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
      
      for (const size of sizes) {
        const dims = getSwitchDimensions(size);
        expect(dims.width).toBeGreaterThan(0);
        expect(dims.height).toBeGreaterThan(0);
        expect(dims.thumbSize).toBeGreaterThan(0);
        expect(dims.thumbSize).toBeLessThan(dims.height);
      }
    });
  });
});

// ============================================================================
// ACCORDION TESTS
// ============================================================================

describe('Accordion', () => {
  describe('toggleAccordionItem', () => {
    it('should expand collapsed item', () => {
      const result = toggleAccordionItem([], 'a', false, true);
      expect(result).toContain('a');
    });

    it('should collapse expanded item', () => {
      const result = toggleAccordionItem(['a'], 'a', false, true);
      expect(result).not.toContain('a');
    });

    it('should not collapse last item when not collapsible', () => {
      const result = toggleAccordionItem(['a'], 'a', false, false);
      expect(result).toContain('a');
    });

    it('should replace item in single mode', () => {
      const result = toggleAccordionItem(['a'], 'b', false, true);
      expect(result).toEqual(['b']);
    });

    it('should add item in multiple mode', () => {
      const result = toggleAccordionItem(['a'], 'b', true, true);
      expect(result).toContain('a');
      expect(result).toContain('b');
    });
  });
});

// ============================================================================
// TREE TESTS
// ============================================================================

describe('Tree', () => {
  describe('flattenTreeNodes', () => {
    it('should flatten single level', () => {
      const nodes = [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ];
      
      const flat = flattenTreeNodes(nodes, []);
      
      expect(flat.length).toBe(2);
      expect(flat[0]!.depth).toBe(0);
    });

    it('should flatten expanded children', () => {
      const nodes = [
        {
          id: 'a',
          label: 'A',
          children: [
            { id: 'a1', label: 'A1' },
            { id: 'a2', label: 'A2' },
          ],
        },
      ];
      
      const flat = flattenTreeNodes(nodes, ['a']);
      
      expect(flat.length).toBe(3);
      expect(flat[1]!.node.id).toBe('a1');
      expect(flat[1]!.depth).toBe(1);
    });

    it('should not include collapsed children', () => {
      const nodes = [
        {
          id: 'a',
          label: 'A',
          children: [{ id: 'a1', label: 'A1' }],
        },
      ];
      
      const flat = flattenTreeNodes(nodes, []);
      
      expect(flat.length).toBe(1);
    });
  });
});

// ============================================================================
// VIRTUAL LIST TESTS
// ============================================================================

describe('Virtual List', () => {
  describe('calculateVirtualListState', () => {
    it('should calculate visible range', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        key: `item-${i}`,
        height: 40,
      }));
      
      const state = calculateVirtualListState(items, 0, 200, 0);
      
      expect(state.startIndex).toBe(0);
      expect(state.endIndex).toBeGreaterThan(0);
      expect(state.totalHeight).toBe(4000);
    });

    it('should handle scrolled position', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        key: `item-${i}`,
        height: 40,
      }));
      
      const state = calculateVirtualListState(items, 400, 200, 0);
      
      expect(state.startIndex).toBeGreaterThan(0);
    });

    it('should include overscan items', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        key: `item-${i}`,
        height: 40,
      }));
      
      const stateNoOverscan = calculateVirtualListState(items, 0, 200, 0);
      const stateWithOverscan = calculateVirtualListState(items, 0, 200, 5);
      
      expect(stateWithOverscan.endIndex).toBeGreaterThan(stateNoOverscan.endIndex);
    });
  });
});

// ============================================================================
// TABLE TESTS
// ============================================================================

describe('Table', () => {
  describe('sortTableData', () => {
    it('should sort by string column', () => {
      const data = [
        { id: '1', name: 'Charlie' },
        { id: '2', name: 'Alice' },
        { id: '3', name: 'Bob' },
      ];
      const columns = [
        { key: 'name', header: 'Name' },
      ];
      
      const sorted = sortTableData(data, { column: 'name', direction: 'asc' }, columns);
      
      expect(sorted[0]!.name).toBe('Alice');
      expect(sorted[2]!.name).toBe('Charlie');
    });

    it('should sort by number column', () => {
      const data = [
        { id: '1', value: 30 },
        { id: '2', value: 10 },
        { id: '3', value: 20 },
      ];
      const columns = [
        { key: 'value', header: 'Value' },
      ];
      
      const sorted = sortTableData(data, { column: 'value', direction: 'asc' }, columns);
      
      expect(sorted[0]!.value).toBe(10);
      expect(sorted[2]!.value).toBe(30);
    });

    it('should sort descending', () => {
      const data = [
        { id: '1', value: 10 },
        { id: '2', value: 30 },
        { id: '3', value: 20 },
      ];
      const columns = [
        { key: 'value', header: 'Value' },
      ];
      
      const sorted = sortTableData(data, { column: 'value', direction: 'desc' }, columns);
      
      expect(sorted[0]!.value).toBe(30);
    });

    it('should not sort when direction is none', () => {
      const data = [
        { id: '1', value: 30 },
        { id: '2', value: 10 },
      ];
      const columns = [{ key: 'value', header: 'Value' }];
      
      const sorted = sortTableData(data, { column: 'value', direction: 'none' }, columns);
      
      expect(sorted[0]!.value).toBe(30);
    });
  });
});

// ============================================================================
// MENU TESTS
// ============================================================================

describe('Menu', () => {
  it('should create separator', () => {
    const sep = menuSeparator();
    expect(sep.type).toBe('separator');
  });

  it('should create header', () => {
    const header = menuHeader('Section');
    expect(header.type).toBe('header');
    expect(header.label).toBe('Section');
  });

  it('should create menu item', () => {
    const item = menuItem('copy', 'Copy', { shortcut: 'Cmd+C' });
    expect(item.type).toBe('item');
    expect(item.id).toBe('copy');
    expect(item.shortcut).toBe('Cmd+C');
  });

  it('should create submenu', () => {
    const sub = submenu('recent', 'Recent Files', [
      menuItem('file1', 'File 1'),
    ]);
    expect(sub.type).toBe('submenu');
    expect(sub.children?.length).toBe(1);
  });
});

// ============================================================================
// TOOLTIP TESTS
// ============================================================================

describe('Tooltip', () => {
  describe('calculateTooltipPosition', () => {
    const triggerRect: DOMRect = {
      left: 100,
      top: 100,
      right: 200,
      bottom: 140,
      width: 100,
      height: 40,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    };
    const tooltipSize = { width: 80, height: 30 };

    it('should position on top', () => {
      const pos = calculateTooltipPosition(triggerRect, tooltipSize, 'top');
      expect(pos.y).toBeLessThan(triggerRect.top);
    });

    it('should position on bottom', () => {
      const pos = calculateTooltipPosition(triggerRect, tooltipSize, 'bottom');
      expect(pos.y).toBeGreaterThan(triggerRect.bottom);
    });

    it('should position on left', () => {
      const pos = calculateTooltipPosition(triggerRect, tooltipSize, 'left');
      expect(pos.x).toBeLessThan(triggerRect.left);
    });

    it('should position on right', () => {
      const pos = calculateTooltipPosition(triggerRect, tooltipSize, 'right');
      expect(pos.x).toBeGreaterThan(triggerRect.right);
    });
  });
});

// ============================================================================
// DEFAULTS TESTS
// ============================================================================

describe('Default Props', () => {
  it('should have valid DEFAULT_COMPONENT_STATE', () => {
    expect(DEFAULT_COMPONENT_STATE.disabled).toBe(false);
    expect(DEFAULT_COMPONENT_STATE.loading).toBe(false);
  });

  it('should have valid DEFAULT_TOGGLE_BUTTON_PROPS', () => {
    expect(DEFAULT_TOGGLE_BUTTON_PROPS.pressed).toBe(false);
  });

  it('should have valid DEFAULT_BUTTON_GROUP_PROPS', () => {
    expect(DEFAULT_BUTTON_GROUP_PROPS.items).toEqual([]);
  });

  it('should have valid DEFAULT_SLIDER_PROPS', () => {
    expect(DEFAULT_SLIDER_PROPS.min).toBe(0);
    expect(DEFAULT_SLIDER_PROPS.max).toBe(100);
  });

  it('should have valid DEFAULT_KNOB_PROPS', () => {
    expect(DEFAULT_KNOB_PROPS.bipolar).toBe(false);
  });

  it('should have valid DEFAULT_NUMBER_INPUT_PROPS', () => {
    expect(DEFAULT_NUMBER_INPUT_PROPS.allowDrag).toBe(true);
  });

  it('should have valid DEFAULT_TEXT_INPUT_PROPS', () => {
    expect(DEFAULT_TEXT_INPUT_PROPS.clearable).toBe(false);
  });

  it('should have valid DEFAULT_SELECT_PROPS', () => {
    expect(DEFAULT_SELECT_PROPS.options).toEqual([]);
  });

  it('should have valid DEFAULT_COMBOBOX_PROPS', () => {
    expect(DEFAULT_COMBOBOX_PROPS.allowCreate).toBe(false);
  });

  it('should have valid DEFAULT_CHECKBOX_PROPS', () => {
    expect(DEFAULT_CHECKBOX_PROPS.indeterminate).toBe(false);
  });

  it('should have valid DEFAULT_SWITCH_PROPS', () => {
    expect(DEFAULT_SWITCH_PROPS.labelPosition).toBe('right');
  });

  it('should have valid DEFAULT_RADIO_GROUP_PROPS', () => {
    expect(DEFAULT_RADIO_GROUP_PROPS.orientation).toBe('vertical');
  });

  it('should have valid DEFAULT_TABS_PROPS', () => {
    expect(DEFAULT_TABS_PROPS.variant).toBe('line');
  });

  it('should have valid DEFAULT_ACCORDION_PROPS', () => {
    expect(DEFAULT_ACCORDION_PROPS.collapsible).toBe(true);
  });

  it('should have valid DEFAULT_TREE_PROPS', () => {
    expect(DEFAULT_TREE_PROPS.showLines).toBe(true);
  });

  it('should have valid DEFAULT_TOOLTIP_PROPS', () => {
    expect(DEFAULT_TOOLTIP_PROPS.delay).toBe(300);
  });
});
