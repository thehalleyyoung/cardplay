/**
 * @fileoverview Tests for AI Advisor Panel (L316)
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';

// Keep this test lightweight and reliable: mock the Prolog-backed advisor layer so
// we can focus on the panel UX behavior (discoverability/helpfulness) without
// depending on KB parsing in jsdom.
vi.mock('../../ai/advisor/advisor-interface.js', () => {
  return {
    AIAdvisor: class {},
    createAIAdvisor: () => ({
      isEnabled: () => true,
      setEnabled: () => {},
      ask: vi.fn(),
    }),
  };
});

vi.mock('../../ai/advisor/conversation-manager.js', () => {
  type Turn = {
    id: string;
    question: string;
    answer: { text: string; confidence: number; canAnswer: boolean; followUps?: Array<{ question: string; category: string }> };
    context: any;
    timestamp: number;
    bookmarked: boolean;
  };

  class MockConversationManager {
    private turns: Turn[] = [];

    startSession(_initialContext?: any): any {
      this.turns = [];
      return { id: 'mock-session', turns: this.turns, bookmarks: [] };
    }

    getHistory(): Turn[] {
      return this.turns;
    }

    async ask(question: string, context: any = {}): Promise<Turn> {
      const turn: Turn = {
        id: `turn-${this.turns.length + 1}`,
        question,
        answer: {
          text: `Mock answer for: ${question}`,
          confidence: 75,
          canAnswer: true,
          followUps: [{ question: 'Show me an example.', category: 'expand' }],
        },
        context,
        timestamp: Date.now(),
        bookmarked: false,
      };
      this.turns.push(turn);
      return turn;
    }

    addBookmark(turnId: string, _label: string): any {
      const turn = this.turns.find((t) => t.id === turnId);
      if (!turn) return null;
      turn.bookmarked = true;
      return { turnId, label: 'bookmark', createdAt: Date.now() };
    }

    removeBookmark(turnId: string): boolean {
      const turn = this.turns.find((t) => t.id === turnId);
      if (!turn) return false;
      turn.bookmarked = false;
      return true;
    }
  }

  return {
    ConversationManager: MockConversationManager,
    createConversationManager: (_advisor?: any) => new MockConversationManager(),
  };
});

async function waitFor(
  predicate: () => boolean,
  { timeoutMs = 4000, intervalMs = 25 }: { timeoutMs?: number; intervalMs?: number } = {}
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (predicate()) return;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('Timed out waiting for condition');
}

describe('<ai-advisor-panel>', () => {
  let rafSpy: ReturnType<typeof vi.spyOn> | null = null;

  beforeAll(async () => {
    await import('./ai-advisor-panel');
  });

  beforeEach(() => {
    // Lit components sometimes assume rAF exists for scroll/paint timing.
    if (typeof globalThis.requestAnimationFrame !== 'function') {
      (globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) =>
        setTimeout(() => cb(performance.now()), 0);
    }
    rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame');
  });

  afterEach(() => {
    rafSpy?.mockRestore();
    document.body.innerHTML = '';
  });

  it('renders an empty state with discoverable suggestions', async () => {
    const el = document.createElement('ai-advisor-panel') as any;
    document.body.appendChild(el);
    await el.updateComplete;

    const root = el.shadowRoot as ShadowRoot;
    expect(root.querySelector('.header h2')?.textContent).toBe('AI Advisor');

    const empty = root.querySelector('.empty-state');
    expect(empty).toBeTruthy();

    const suggestions = root.querySelectorAll('.empty-state .follow-up-button');
    expect(suggestions.length).toBe(3);
  });

  it('submits a suggested question and produces an answer', async () => {
    const el = document.createElement('ai-advisor-panel') as any;
    document.body.appendChild(el);
    await el.updateComplete;

    const gotAnswer = vi.fn();
    el.addEventListener('advisor-answer', gotAnswer);

    const root = el.shadowRoot as ShadowRoot;
    const firstSuggestion = root.querySelector('.empty-state .follow-up-button') as HTMLButtonElement;
    expect(firstSuggestion).toBeTruthy();

    firstSuggestion.click();

    await waitFor(() => gotAnswer.mock.calls.length > 0);
    await el.updateComplete;

    const userMessages = root.querySelectorAll('.message.user .message-content');
    const assistantMessages = root.querySelectorAll('.message.assistant .message-content');

    expect(userMessages.length).toBeGreaterThanOrEqual(1);
    expect(String(userMessages[0]?.textContent ?? '')).toMatch(/chord/i);

    expect(assistantMessages.length).toBeGreaterThanOrEqual(1);
    expect(String(assistantMessages[0]?.textContent ?? '').trim().length).toBeGreaterThan(0);

    // Confidence should render by default.
    expect(root.querySelector('.confidence-badge')).toBeTruthy();
  });
});
