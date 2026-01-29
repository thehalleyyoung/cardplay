/**
 * @fileoverview Reveal Panel AI Advisor Tab
 *
 * Provides a Reveal Panel tab that hosts the Lit-based <ai-advisor-panel>.
 *
 * This module is safe to import in Node (no DOM usage at import time).
 * In browsers, it will lazily ensure the custom element is defined.
 *
 * @module @cardplay/ui/reveal-panel-ai-advisor
 */

import type { AdvisorContext, HostAction } from '../ai/advisor/advisor-interface.js';
import type { RevealPanelContext, RevealTab } from './components/reveal-panel.js';

export interface AIAdvisorRevealTabOptions {
  /** Override tab id (defaults to 'ai-advisor'). */
  readonly id?: string;
  /** Override tab label (defaults to 'AI Advisor'). */
  readonly label?: string;
  /** Optional icon text (defaults to '🤖'). */
  readonly icon?: string;

  /** Map Reveal Panel context -> advisor context. */
  readonly getAdvisorContext?: (revealContext: RevealPanelContext) => AdvisorContext;

  /** Called whenever the panel emits an advisor action. */
  readonly onAction?: (action: HostAction) => void;

  /** Set the panel input placeholder. */
  readonly placeholder?: string;

  /** Show confidence badges in the panel (defaults to true). */
  readonly showConfidence?: boolean;
}

type AIAdvisorPanelElement = HTMLElement & {
  context: AdvisorContext;
  placeholder?: string;
  showConfidence?: boolean;
};

async function ensureAIAdvisorPanelDefined(): Promise<void> {
  // Only attempt in real browser contexts.
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const ce = (globalThis as any).customElements as CustomElementRegistry | undefined;
  if (!ce?.get) return;
  if (ce.get('ai-advisor-panel')) return;

  // Dynamic import avoids Node import-time crashes (lit touches DOM globals).
  await import('./components/ai-advisor-panel.js');
}

function dispatchGlobalAdvisorAction(action: HostAction): void {
  if (typeof document === 'undefined') return;
  document.dispatchEvent(
    new CustomEvent('cardplay:advisor-action', {
      detail: { action },
    })
  );
}

export function createAIAdvisorRevealTab(
  options: AIAdvisorRevealTabOptions = {}
): RevealTab {
  const {
    id = 'ai-advisor',
    label = 'AI Advisor',
    icon = '🤖',
    getAdvisorContext = () => ({}),
    onAction,
    placeholder,
    showConfidence,
  } = options;

  // Lazily create a single panel instance; RevealPanel will re-call content()
  // on context changes, but we return the same element so history persists.
  let panelEl: AIAdvisorPanelElement | null = null;

  const getOrCreatePanel = (): AIAdvisorPanelElement => {
    if (!panelEl) {
      // Fire-and-forget element definition; when it loads, the element upgrades.
      void ensureAIAdvisorPanelDefined();

      panelEl = document.createElement('ai-advisor-panel') as AIAdvisorPanelElement;

      if (placeholder !== undefined) panelEl.placeholder = placeholder;
      if (showConfidence !== undefined) panelEl.showConfidence = showConfidence;

      panelEl.addEventListener('advisor-action', (e: Event) => {
        const detail = (e as CustomEvent).detail as { action?: HostAction } | undefined;
        const action = detail?.action;
        if (!action) return;

        onAction?.(action);
        dispatchGlobalAdvisorAction(action);
      });
    }

    return panelEl;
  };

  return {
    id,
    label,
    icon,
    content: (revealContext: RevealPanelContext) => {
      const el = getOrCreatePanel();
      el.context = getAdvisorContext(revealContext);
      return el;
    },
  };
}

export function createAIAdvisorTabs(
  options: AIAdvisorRevealTabOptions = {}
): RevealTab[] {
  return [createAIAdvisorRevealTab(options)];
}
