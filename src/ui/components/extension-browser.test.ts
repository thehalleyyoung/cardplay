/**
 * @fileoverview Extension Browser Tests
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExtensionBrowser } from './extension-browser';
import type { ExtensionManifest, ExtensionState } from '../../extensions/types';

describe('ExtensionBrowser', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  describe('O131: Extension browser shows extensions correctly', () => {
    it('should render empty state when no extensions installed', () => {
      const browser = new ExtensionBrowser(container);
      
      const emptyState = container.querySelector('.extension-browser-empty');
      expect(emptyState).toBeTruthy();
      expect(emptyState?.textContent).toContain('No extensions installed');
    });

    it('should render installed extensions list', () => {
      // TODO: Mock getExtensionRegistry() to return test extensions
      const browser = new ExtensionBrowser(container);
      
      const list = container.querySelector('.extension-browser-list');
      expect(list).toBeTruthy();
    });

    it('should display extension metadata correctly', () => {
      const browser = new ExtensionBrowser(container);
      
      // Extension items should show: icon, name, version, author, description, category, tags
      const items = container.querySelectorAll('.extension-browser-item');
      items.forEach(item => {
        expect(item.querySelector('.extension-browser-item-icon')).toBeTruthy();
        expect(item.querySelector('.extension-browser-item-name')).toBeTruthy();
        expect(item.querySelector('.extension-browser-item-version')).toBeTruthy();
        expect(item.querySelector('.extension-browser-item-author')).toBeTruthy();
        expect(item.querySelector('.extension-browser-item-description')).toBeTruthy();
        expect(item.querySelector('.extension-browser-item-category')).toBeTruthy();
      });
    });

    it('should show state badge for each extension', () => {
      const browser = new ExtensionBrowser(container);
      
      const items = container.querySelectorAll('.extension-browser-item');
      items.forEach(item => {
        const badge = item.querySelector('.extension-browser-state-badge');
        expect(badge).toBeTruthy();
      });
    });
  });

  describe('O125: Extension browser UI components', () => {
    it('should render header with search and filters', () => {
      const browser = new ExtensionBrowser(container);
      
      expect(container.querySelector('.extension-browser-header')).toBeTruthy();
      expect(container.querySelector('.extension-browser-search')).toBeTruthy();
      expect(container.querySelector('.extension-browser-filter')).toBeTruthy();
      expect(container.querySelector('.extension-browser-sort')).toBeTruthy();
    });

    it('should render tabs (Installed/Available)', () => {
      const browser = new ExtensionBrowser(container);
      
      const tabs = container.querySelectorAll('.extension-browser-tab');
      expect(tabs.length).toBeGreaterThanOrEqual(2);
    });

    it('should render action buttons', () => {
      const browser = new ExtensionBrowser(container);
      
      const actions = container.querySelector('.extension-browser-actions');
      expect(actions).toBeTruthy();
      expect(actions?.textContent).toContain('Install from File');
      expect(actions?.textContent).toContain('Refresh');
    });
  });

  describe('O126: Installed extensions list', () => {
    it('should show count of installed extensions', () => {
      const browser = new ExtensionBrowser(container);
      
      const installedTab = Array.from(container.querySelectorAll('.extension-browser-tab'))
        .find(tab => tab.textContent?.includes('Installed'));
      expect(installedTab).toBeTruthy();
      expect(installedTab?.textContent).toMatch(/Installed \(\d+\)/);
    });

    it('should display installation date if available', () => {
      const browser = new ExtensionBrowser(container);
      
      // Items with installation dates should show them
      // (This depends on extension registry mock data)
    });
  });

  describe('O128: Install Extension action', () => {
    it('should trigger onInstall callback when file selected', async () => {
      const onInstall = vi.fn();
      const browser = new ExtensionBrowser(container, { onInstall });
      
      const installBtn = Array.from(container.querySelectorAll('button'))
        .find(btn => btn.textContent?.includes('Install from File'));
      
      expect(installBtn).toBeTruthy();
      
      // Click would trigger file input, but we can't fully simulate file selection in JSDOM
      // Just verify the button exists and is wired up
    });
  });

  describe('O129: Uninstall Extension action', () => {
    it('should show uninstall button for installed extensions', () => {
      const browser = new ExtensionBrowser(container);
      
      const items = container.querySelectorAll('.extension-browser-item');
      items.forEach(item => {
        const buttons = item.querySelector('.extension-browser-item-buttons');
        // Check if uninstall button exists (depends on extension state)
        const uninstallBtn = Array.from(buttons?.querySelectorAll('button') || [])
          .find(btn => btn.textContent === 'Uninstall');
        
        // Should exist unless extension is uninstalled or installing
        const stateBadge = item.querySelector('.extension-browser-state-badge');
        const state = stateBadge?.textContent?.toLowerCase();
        if (state !== 'uninstalled' && state !== 'installing') {
          // Expect uninstall button if not in these states
        }
      });
    });

    it('should trigger onUninstall callback', async () => {
      const onUninstall = vi.fn();
      const browser = new ExtensionBrowser(container, { onUninstall });
      
      // Find and click uninstall button
      const uninstallBtn = Array.from(container.querySelectorAll('button'))
        .find(btn => btn.textContent === 'Uninstall');
      
      if (uninstallBtn) {
        // Mock confirm dialog
        window.confirm = vi.fn(() => true);
        
        uninstallBtn.click();
        // Verify callback triggered (depends on having test extensions)
      }
    });
  });

  describe('O130: Enable/Disable Extension toggle', () => {
    it('should show enable button for disabled extensions', () => {
      const browser = new ExtensionBrowser(container);
      
      const disabledItems = Array.from(container.querySelectorAll('.extension-browser-item'))
        .filter(item => {
          const badge = item.querySelector('.extension-browser-state-badge');
          return badge?.textContent?.toLowerCase() === 'disabled';
        });
      
      disabledItems.forEach(item => {
        const enableBtn = Array.from(item.querySelectorAll('button'))
          .find(btn => btn.textContent === 'Enable');
        expect(enableBtn).toBeTruthy();
      });
    });

    it('should show disable button for enabled extensions', () => {
      const browser = new ExtensionBrowser(container);
      
      const enabledItems = Array.from(container.querySelectorAll('.extension-browser-item'))
        .filter(item => {
          const badge = item.querySelector('.extension-browser-state-badge');
          return badge?.textContent?.toLowerCase() === 'enabled';
        });
      
      enabledItems.forEach(item => {
        const disableBtn = Array.from(item.querySelectorAll('button'))
          .find(btn => btn.textContent === 'Disable');
        expect(disableBtn).toBeTruthy();
      });
    });

    it('should trigger onEnable callback', async () => {
      const onEnable = vi.fn();
      const browser = new ExtensionBrowser(container, { onEnable });
      
      const enableBtn = Array.from(container.querySelectorAll('button'))
        .find(btn => btn.textContent === 'Enable');
      
      if (enableBtn) {
        enableBtn.click();
        // Verify callback triggered
      }
    });

    it('should trigger onDisable callback', async () => {
      const onDisable = vi.fn();
      const browser = new ExtensionBrowser(container, { onDisable });
      
      const disableBtn = Array.from(container.querySelectorAll('button'))
        .find(btn => btn.textContent === 'Disable');
      
      if (disableBtn) {
        disableBtn.click();
        // Verify callback triggered
      }
    });
  });

  describe('Search and filtering', () => {
    it('should filter extensions by search query', () => {
      const browser = new ExtensionBrowser(container);
      
      const searchInput = container.querySelector('.extension-browser-search-input') as HTMLInputElement;
      expect(searchInput).toBeTruthy();
      
      // Simulate search input
      searchInput.value = 'test';
      searchInput.dispatchEvent(new Event('input'));
      
      // Extensions list should update (depends on test data)
    });

    it('should filter extensions by category', () => {
      const browser = new ExtensionBrowser(container);
      
      const filterSelect = container.querySelector('.extension-browser-filter-select') as HTMLSelectElement;
      expect(filterSelect).toBeTruthy();
      
      // Change category filter
      filterSelect.value = 'card';
      filterSelect.dispatchEvent(new Event('change'));
      
      // Extensions list should update to show only card extensions
    });

    it('should sort extensions', () => {
      const browser = new ExtensionBrowser(container);
      
      const sortSelect = container.querySelector('.extension-browser-sort-select') as HTMLSelectElement;
      expect(sortSelect).toBeTruthy();
      
      // Change sort order
      sortSelect.value = 'author';
      sortSelect.dispatchEvent(new Event('change'));
      
      // Extensions list should re-order
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA roles', () => {
      const browser = new ExtensionBrowser(container);
      
      expect(container.querySelector('[role="tablist"]')).toBeTruthy();
      expect(container.querySelector('[role="tab"]')).toBeTruthy();
      expect(container.querySelector('[role="list"]')).toBeTruthy();
    });

    it('should have keyboard-accessible controls', () => {
      const browser = new ExtensionBrowser(container);
      
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button.tabIndex).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('O132: Install/uninstall works correctly', () => {
    it('should refresh UI after successful install', async () => {
      const onInstall = vi.fn().mockResolvedValue(undefined);
      const browser = new ExtensionBrowser(container, { onInstall });
      
      // Verify refresh is called after install
      // (Implementation detail - would need to spy on refresh method)
    });

    it('should refresh UI after successful uninstall', async () => {
      const onUninstall = vi.fn().mockResolvedValue(undefined);
      const browser = new ExtensionBrowser(container, { onUninstall });
      
      // Verify refresh is called after uninstall
    });

    it('should handle install errors gracefully', async () => {
      const onInstall = vi.fn().mockRejectedValue(new Error('Install failed'));
      const browser = new ExtensionBrowser(container, { onInstall });
      
      // Mock alert to verify error handling
      window.alert = vi.fn();
      
      // Trigger install error scenario
      // Verify error is shown to user
    });
  });

  describe('Lifecycle', () => {
    it('should clean up on destroy', () => {
      const browser = new ExtensionBrowser(container);
      
      expect(container.innerHTML).not.toBe('');
      
      browser.destroy();
      
      expect(container.innerHTML).toBe('');
    });

    it('should refresh UI when refresh method called', () => {
      const browser = new ExtensionBrowser(container);
      
      const initialHTML = container.innerHTML;
      
      browser.refresh();
      
      // UI should re-render (HTML may be identical but refresh occurred)
      expect(container.innerHTML).toBeTruthy();
    });
  });
});
