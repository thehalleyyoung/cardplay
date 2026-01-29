/**
 * @fileoverview AI Advisor UI Integration - Keyboard shortcuts and event handlers
 *
 * Handles the integration between keyboard shortcuts, command palette,
 * and the AI Advisor reveal panel tab.
 *
 * @module @cardplay/ui/ai-advisor-integration
 * @see Phase L - L308: Keyboard shortcut integration (Cmd+/)
 * @see Phase L - L300: Command palette integration (Cmd+K)
 */

import type { RevealPanel } from './components/reveal-panel.js';
import { registerCommand, type CommandContext } from './components/command-palette.js';

// ============================================================================
// STATE
// ============================================================================

let revealPanelInstance: RevealPanel | null = null;

// ============================================================================
// REGISTRATION
// ============================================================================

/**
 * Registers the reveal panel instance for AI Advisor integration.
 * Should be called during app initialization after the reveal panel is created.
 *
 * @param panel - The RevealPanel instance
 */
export function registerRevealPanel(panel: RevealPanel): void {
  revealPanelInstance = panel;
}

/**
 * Gets the registered reveal panel instance.
 * Returns null if not yet registered.
 */
export function getRevealPanel(): RevealPanel | null {
  return revealPanelInstance;
}

// ============================================================================
// AI ADVISOR ACTIONS
// ============================================================================

/**
 * Opens the AI Advisor panel.
 * - Activates the 'ai-advisor' tab
 * - Expands the reveal panel
 * - Optionally pre-fills a question
 *
 * @param options - Options for opening the advisor
 */
export function openAIAdvisor(options: {
  question?: string;
  context?: Record<string, unknown>;
} = {}): void {
  const panel = getRevealPanel();

  if (!panel) {
    console.warn('[AI Advisor] Reveal panel not registered yet');
    return;
  }

  // Activate the AI Advisor tab
  panel.activateTab('ai-advisor');

  // Expand the panel
  panel.expand();

  // If a question is provided, we could dispatch an event to pre-fill it
  // The ai-advisor-panel component can listen for this event
  if (options.question || options.context) {
    document.dispatchEvent(new CustomEvent('cardplay:ai-advisor-prefill', {
      detail: {
        question: options.question,
        context: options.context,
      },
    }));
  }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handles the 'cardplay:open-ai-advisor' keyboard shortcut event.
 */
function handleOpenAIAdvisor(event: Event): void {
  const customEvent = event as CustomEvent;
  const options = customEvent.detail || {};
  openAIAdvisor(options);
}

/**
 * Initializes AI Advisor keyboard shortcut and event handlers.
 * Should be called during app initialization.
 *
 * L308: Registers Cmd+/ keyboard shortcut handler
 * L300: Registers "Ask AI..." command in command palette
 */
export function initializeAIAdvisorIntegration(): void {
  // L308: Listen for keyboard shortcut event (dispatched by KeyboardShortcutManager)
  document.addEventListener('cardplay:open-ai-advisor', handleOpenAIAdvisor);

  // L300: Register "Ask AI..." command in command palette
  registerCommand({
    id: 'ask-ai',
    label: 'Ask AI...',
    icon: '🤖',
    category: 'AI',
    keywords: ['ai', 'advisor', 'help', 'assistant', 'question', 'suggest'],
    shortcut: 'Cmd+/',
    action: (context?: CommandContext) => {
      // Pass command palette context to AI Advisor
      openAIAdvisor({
        context: context || {},
      });
    },
  });

  // Listen for advisor action events (from ai-advisor-panel)
  document.addEventListener('cardplay:advisor-action', (event: Event) => {
    const customEvent = event as CustomEvent;
    const action = customEvent.detail?.action;

    if (action) {
      console.log('[AI Advisor] Action received:', action);
      // Handle actions dispatched by the AI Advisor panel
      // These could be things like "insert chord", "apply suggestion", etc.
    }
  });
}

/**
 * Cleanup function to remove event listeners.
 */
export function cleanupAIAdvisorIntegration(): void {
  document.removeEventListener('cardplay:open-ai-advisor', handleOpenAIAdvisor);
}
