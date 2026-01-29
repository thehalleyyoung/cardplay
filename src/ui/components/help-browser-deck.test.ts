/**
 * @fileoverview Tests for Help Browser Deck Component
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  HelpBrowserDeck, 
  registerHelpTopic, 
  getAllHelpTopics,
  searchHelpTopics,
  getTopicsByCategory,
  type HelpTopic 
} from './help-browser-deck';

describe('HelpBrowserDeck', () => {
  let container: HTMLElement;
  let deck: HelpBrowserDeck;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    
    // Register test topics
    registerHelpTopic({
      id: 'test-topic-1',
      title: 'Test Topic 1',
      category: 'getting-started',
      content: 'This is test content.',
      keywords: ['test', 'example'],
    });
    
    registerHelpTopic({
      id: 'test-topic-2',
      title: 'Test Topic 2',
      category: 'tutorials',
      content: 'This is tutorial content.',
      keywords: ['tutorial', 'learn'],
      videoUrl: 'https://example.com/video',
    });
  });

  afterEach(() => {
    if (deck) {
      deck.destroy();
    }
    document.body.removeChild(container);
    
    // Clean up styles
    const styles = document.getElementById('help-browser-deck-styles');
    if (styles) {
      styles.remove();
    }
  });

  it('should create and render help browser', () => {
    deck = new HelpBrowserDeck();
    const element = deck.getElement();
    
    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.className).toBe('help-browser-deck');
  });

  it('should display header with title', () => {
    deck = new HelpBrowserDeck();
    const element = deck.getElement();
    
    const header = element.querySelector('.help-browser-header h2');
    expect(header).not.toBeNull();
    expect(header?.textContent).toBe('Help & Documentation');
  });

  it('should display board context when board is provided', () => {
    const mockBoard: any = {
      id: 'test-board',
      name: 'Test Board',
    };
    
    deck = new HelpBrowserDeck({ board: mockBoard });
    const element = deck.getElement();
    
    const context = element.querySelector('.help-browser-board-context');
    expect(context).not.toBeNull();
    expect(context?.textContent).toContain('Test Board');
  });

  it('should render search input', () => {
    deck = new HelpBrowserDeck();
    const element = deck.getElement();
    
    const searchInput = element.querySelector('.help-browser-search-input');
    expect(searchInput).toBeInstanceOf(HTMLInputElement);
    expect((searchInput as HTMLInputElement).placeholder).toBe('Search help topics...');
  });

  it('should render categories sidebar', () => {
    deck = new HelpBrowserDeck();
    const element = deck.getElement();
    
    const categories = element.querySelectorAll('.help-category-button');
    expect(categories.length).toBeGreaterThan(0);
  });

  it('should register and retrieve help topics', () => {
    const topic: HelpTopic = {
      id: 'custom-topic',
      title: 'Custom Topic',
      category: 'reference',
      content: 'Custom content',
    };
    
    registerHelpTopic(topic);
    const topics = getAllHelpTopics();
    
    const found = topics.find(t => t.id === 'custom-topic');
    expect(found).toBeDefined();
    expect(found?.title).toBe('Custom Topic');
  });

  it('should search help topics', () => {
    const results = searchHelpTopics('tutorial');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(t => t.title.includes('Tutorial'))).toBe(true);
  });

  it('should filter topics by category', () => {
    const tutorials = getTopicsByCategory('tutorials');
    
    expect(tutorials.length).toBeGreaterThan(0);
    expect(tutorials.every(t => t.category === 'tutorials')).toBe(true);
  });

  it('should display video link when present', () => {
    deck = new HelpBrowserDeck();
    const element = deck.getElement();
    
    // Simulate clicking on a topic with video
    const topicItem = element.querySelector('[data-topic-id="test-topic-2"]');
    if (topicItem) {
      (topicItem as HTMLElement).click();
      
      // Video link should appear
      const videoLink = element.querySelector('.help-video-link');
      expect(videoLink).not.toBeNull();
    }
  });

  it('should inject styles only once', () => {
    deck = new HelpBrowserDeck();
    
    const styles1 = document.getElementById('help-browser-deck-styles');
    expect(styles1).not.toBeNull();
    
    // Create another instance
    const deck2 = new HelpBrowserDeck();
    
    const styles2 = document.querySelectorAll('#help-browser-deck-styles');
    expect(styles2.length).toBe(1);
    
    deck2.destroy();
  });

  it('should have proper ARIA attributes', () => {
    deck = new HelpBrowserDeck();
    const element = deck.getElement();
    
    expect(element.getAttribute('role')).toBe('region');
    expect(element.getAttribute('aria-label')).toBe('Help Browser');
  });
});
