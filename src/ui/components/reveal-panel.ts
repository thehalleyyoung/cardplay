/**
 * @fileoverview Reveal Panel Component
 * 
 * The Reveal Panel slides up from the bottom to show detailed
 * views of cards and stacks:
 * - Spring physics animation
 * - Multiple tabs (parameters, connections, info, etc.)
 * - Resize handle
 * - Pin/dock functionality
 * - Context-sensitive content
 * 
 * @module @cardplay/ui/components/reveal-panel
 */

// ============================================================================
// TYPES
// ============================================================================

/** Panel state */
export type RevealPanelState = 
  | 'collapsed'
  | 'peeking'      // Showing just header
  | 'partial'      // Half open
  | 'expanded'     // Full height
  | 'animating';

/** Tab definition */
export interface RevealTab {
  id: string;
  label: string;
  icon?: string;
  badge?: number | string;
  disabled?: boolean;
  content: HTMLElement | ((context: RevealPanelContext) => HTMLElement);
}

/** Panel context (what's being revealed) */
export interface RevealPanelContext {
  type: 'card' | 'stack' | 'connection' | 'selection' | 'empty';
  cardId?: string;
  stackId?: string;
  connectionId?: string;
  cardIds?: string[];  // For multi-selection
}

/** Panel options */
export interface RevealPanelOptions {
  defaultHeight?: number;       // Default panel height in pixels
  minHeight?: number;           // Minimum height
  maxHeightRatio?: number;      // Max height as ratio of viewport
  peekHeight?: number;          // Height when peeking
  snapThresholds?: number[];    // Heights to snap to (ratios)
  springTension?: number;       // Animation spring tension
  springFriction?: number;      // Animation spring friction
  tabs?: RevealTab[];           // Available tabs
  defaultTab?: string;          // Default tab ID
  showOnSelect?: boolean;       // Auto-show when something selected
  persistHeight?: boolean;      // Remember height across sessions
}

/** Event types */
export interface RevealPanelEvents {
  'reveal-state-change': { oldState: RevealPanelState; newState: RevealPanelState };
  'reveal-tab-change': { tabId: string };
  'reveal-context-change': { context: RevealPanelContext };
  'reveal-height-change': { height: number };
  'reveal-pin-change': { pinned: boolean };
}

// ============================================================================
// SPRING PHYSICS
// ============================================================================

interface SpringState {
  position: number;
  velocity: number;
  target: number;
}

class Spring {
  private state: SpringState;
  private tension: number;
  private friction: number;
  private precision: number = 0.1;
  
  constructor(initial: number, tension: number, friction: number) {
    this.state = {
      position: initial,
      velocity: 0,
      target: initial,
    };
    this.tension = tension;
    this.friction = friction;
  }
  
  setTarget(target: number): void {
    this.state.target = target;
  }
  
  setImmediate(value: number): void {
    this.state.position = value;
    this.state.target = value;
    this.state.velocity = 0;
  }
  
  update(dt: number): number {
    const { position, velocity, target } = this.state;
    
    // Spring force
    const springForce = this.tension * (target - position);
    
    // Damping
    const dampingForce = -this.friction * velocity;
    
    // Acceleration
    const acceleration = springForce + dampingForce;
    
    // Update velocity and position
    this.state.velocity = velocity + acceleration * dt;
    this.state.position = position + this.state.velocity * dt;
    
    return this.state.position;
  }
  
  isSettled(): boolean {
    const { position, velocity, target } = this.state;
    return (
      Math.abs(position - target) < this.precision &&
      Math.abs(velocity) < this.precision
    );
  }
  
  get current(): number {
    return this.state.position;
  }
}

// ============================================================================
// REVEAL PANEL
// ============================================================================

export class RevealPanel {
  // DOM
  private container: HTMLElement;
  private element: HTMLElement;
  private header: HTMLElement;
  private tabBar: HTMLElement;
  private content: HTMLElement;
  private resizeHandle: HTMLElement;
  private contextIndicator: HTMLElement;
  private pinButton: HTMLElement;
  
  // State
  private state: RevealPanelState = 'collapsed';
  private context: RevealPanelContext = { type: 'empty' };
  private currentHeight: number;
  private isPinned: boolean = false;
  private activeTabId: string | null = null;
  
  // Options
  private options: Required<RevealPanelOptions>;
  
  // Tabs
  private tabs: Map<string, RevealTab> = new Map();
  private tabElements: Map<string, HTMLElement> = new Map();
  private tabContentCache: Map<string, HTMLElement> = new Map();
  
  // Animation
  private spring: Spring;
  private animationFrame: number | null = null;
  private isAnimating: boolean = false;
  
  // Interaction
  private isDragging: boolean = false;
  private dragStartY: number = 0;
  private dragStartHeight: number = 0;
  
  // Gesture recognition
  private velocityTracker: { time: number; y: number }[] = [];
  
  constructor(container: HTMLElement, options: RevealPanelOptions = {}) {
    this.container = container;
    
    this.options = {
      defaultHeight: options.defaultHeight ?? 300,
      minHeight: options.minHeight ?? 80,
      maxHeightRatio: options.maxHeightRatio ?? 0.8,
      peekHeight: options.peekHeight ?? 48,
      snapThresholds: options.snapThresholds ?? [0.2, 0.5, 0.8],
      springTension: options.springTension ?? 300,
      springFriction: options.springFriction ?? 25,
      tabs: options.tabs ?? [],
      defaultTab: options.defaultTab ?? '',
      showOnSelect: options.showOnSelect ?? true,
      persistHeight: options.persistHeight ?? true,
    };
    
    this.currentHeight = this.options.defaultHeight;
    this.spring = new Spring(0, this.options.springTension, this.options.springFriction);
    
    this.element = this.createElement();
    this.header = this.element.querySelector('.reveal-header')!;
    this.tabBar = this.element.querySelector('.reveal-tab-bar')!;
    this.content = this.element.querySelector('.reveal-content')!;
    this.resizeHandle = this.element.querySelector('.reveal-resize-handle')!;
    this.contextIndicator = this.element.querySelector('.reveal-context')!;
    this.pinButton = this.element.querySelector('.reveal-pin-button')!;
    
    this.container.appendChild(this.element);
    
    // Register initial tabs
    for (const tab of this.options.tabs) {
      this.registerTab(tab);
    }
    
    // Set initial tab
    if (this.options.defaultTab && this.tabs.has(this.options.defaultTab)) {
      this.activateTab(this.options.defaultTab);
    } else if (this.tabs.size > 0) {
      this.activateTab(this.tabs.keys().next().value!);
    }
    
    this.setupEventListeners();
    this.loadPersistedState();
  }
  
  // ===========================================================================
  // DOM CREATION
  // ===========================================================================
  
  private createElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'reveal-panel collapsed';
    el.setAttribute('role', 'complementary');
    el.setAttribute('aria-label', 'Reveal Panel');
    
    el.innerHTML = `
      <div class="reveal-resize-handle" role="separator" aria-orientation="horizontal" tabindex="0">
        <div class="reveal-resize-grip"></div>
      </div>
      
      <div class="reveal-header">
        <div class="reveal-context">
          <span class="reveal-context-icon"></span>
          <span class="reveal-context-text">No selection</span>
        </div>
        
        <div class="reveal-header-actions">
          <button class="reveal-pin-button" aria-label="Pin panel" aria-pressed="false">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" fill="currentColor"/>
            </svg>
          </button>
          
          <button class="reveal-collapse-button" aria-label="Collapse panel">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="reveal-tab-bar" role="tablist"></div>
      
      <div class="reveal-content" role="tabpanel"></div>
    `;
    
    // Apply initial styles
    el.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: ${this.options.peekHeight}px;
      transform: translateY(100%);
    `;
    
    return el;
  }
  
  // ===========================================================================
  // TABS
  // ===========================================================================
  
  /**
   * Register a tab
   */
  registerTab(tab: RevealTab): void {
    this.tabs.set(tab.id, tab);
    
    const tabEl = this.createTabElement(tab);
    this.tabElements.set(tab.id, tabEl);
    this.tabBar.appendChild(tabEl);
  }
  
  /**
   * Unregister a tab
   */
  unregisterTab(tabId: string): void {
    const tabEl = this.tabElements.get(tabId);
    if (tabEl) {
      tabEl.remove();
    }
    
    this.tabs.delete(tabId);
    this.tabElements.delete(tabId);
    this.tabContentCache.delete(tabId);
    
    if (this.activeTabId === tabId) {
      const firstTab = this.tabs.keys().next().value;
      if (firstTab) {
        this.activateTab(firstTab);
      }
    }
  }
  
  private createTabElement(tab: RevealTab): HTMLElement {
    const el = document.createElement('button');
    el.className = 'reveal-tab';
    el.setAttribute('role', 'tab');
    el.setAttribute('aria-selected', 'false');
    el.setAttribute('aria-controls', `reveal-content-${tab.id}`);
    el.id = `reveal-tab-${tab.id}`;
    
    if (tab.disabled) {
      el.setAttribute('aria-disabled', 'true');
      el.classList.add('disabled');
    }
    
    el.innerHTML = `
      ${tab.icon ? `<span class="reveal-tab-icon">${tab.icon}</span>` : ''}
      <span class="reveal-tab-label">${tab.label}</span>
      ${tab.badge !== undefined ? `<span class="reveal-tab-badge">${tab.badge}</span>` : ''}
    `;
    
    el.addEventListener('click', () => {
      if (!tab.disabled) {
        this.activateTab(tab.id);
      }
    });
    
    return el;
  }
  
  /**
   * Activate a tab
   */
  activateTab(tabId: string): void {
    if (this.activeTabId === tabId) return;
    
    const tab = this.tabs.get(tabId);
    if (!tab) return;
    
    // Deactivate previous
    if (this.activeTabId) {
      const prevEl = this.tabElements.get(this.activeTabId);
      if (prevEl) {
        prevEl.classList.remove('active');
        prevEl.setAttribute('aria-selected', 'false');
      }
    }
    
    // Activate new
    const tabEl = this.tabElements.get(tabId);
    if (tabEl) {
      tabEl.classList.add('active');
      tabEl.setAttribute('aria-selected', 'true');
    }
    
    this.activeTabId = tabId;
    
    // Update content
    this.updateTabContent();
    
    this.dispatchEvent('reveal-tab-change', { tabId });
  }
  
  private updateTabContent(): void {
    if (!this.activeTabId) return;
    
    const tab = this.tabs.get(this.activeTabId);
    if (!tab) return;
    
    // Clear content
    this.content.innerHTML = '';
    
    // Get or create content
    let contentEl = this.tabContentCache.get(this.activeTabId);
    
    if (!contentEl) {
      if (typeof tab.content === 'function') {
        contentEl = tab.content(this.context);
      } else {
        contentEl = tab.content;
      }
      this.tabContentCache.set(this.activeTabId, contentEl);
    }
    
    this.content.appendChild(contentEl);
    this.content.id = `reveal-content-${this.activeTabId}`;
    this.content.setAttribute('aria-labelledby', `reveal-tab-${this.activeTabId}`);
  }
  
  /**
   * Update tab badge
   */
  updateTabBadge(tabId: string, badge: number | string | undefined): void {
    const tab = this.tabs.get(tabId);
    if (tab) {
      if (badge === undefined) {
        delete tab.badge;
      } else {
        tab.badge = badge;
      }
    }
    
    const tabEl = this.tabElements.get(tabId);
    if (tabEl) {
      const badgeEl = tabEl.querySelector('.reveal-tab-badge');
      if (badge !== undefined) {
        if (badgeEl) {
          badgeEl.textContent = String(badge);
        } else {
          const newBadge = document.createElement('span');
          newBadge.className = 'reveal-tab-badge';
          newBadge.textContent = String(badge);
          tabEl.appendChild(newBadge);
        }
      } else {
        badgeEl?.remove();
      }
    }
  }
  
  // ===========================================================================
  // CONTEXT
  // ===========================================================================
  
  /**
   * Set panel context
   */
  setContext(context: RevealPanelContext): void {
    this.context = context;
    this.updateContextIndicator();
    
    // Clear content cache (context changed)
    for (const tab of this.tabs.values()) {
      if (typeof tab.content === 'function') {
        this.tabContentCache.delete(tab.id);
      }
    }
    
    this.updateTabContent();
    
    // Auto-show on select
    if (this.options.showOnSelect && context.type !== 'empty') {
      if (this.state === 'collapsed') {
        this.peek();
      }
    }
    
    this.dispatchEvent('reveal-context-change', { context });
  }
  
  private updateContextIndicator(): void {
    const iconEl = this.contextIndicator.querySelector('.reveal-context-icon');
    const textEl = this.contextIndicator.querySelector('.reveal-context-text');
    
    if (!iconEl || !textEl) return;
    
    switch (this.context.type) {
      case 'card':
        iconEl.innerHTML = '🎴';
        textEl.textContent = `Card: ${this.context.cardId}`;
        break;
      case 'stack':
        iconEl.innerHTML = '📚';
        textEl.textContent = `Stack: ${this.context.stackId}`;
        break;
      case 'connection':
        iconEl.innerHTML = '🔗';
        textEl.textContent = `Connection: ${this.context.connectionId}`;
        break;
      case 'selection':
        iconEl.innerHTML = '✨';
        textEl.textContent = `${this.context.cardIds?.length ?? 0} selected`;
        break;
      case 'empty':
      default:
        iconEl.innerHTML = '';
        textEl.textContent = 'No selection';
        break;
    }
  }
  
  /**
   * Get current context
   */
  getContext(): RevealPanelContext {
    return { ...this.context };
  }
  
  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================
  
  /**
   * Collapse panel (hidden)
   */
  collapse(): void {
    this.setState('collapsed');
    this.animateTo(this.options.peekHeight, true);
  }
  
  /**
   * Peek panel (show header only)
   */
  peek(): void {
    this.setState('peeking');
    this.animateTo(this.options.peekHeight, false);
  }
  
  /**
   * Show partial panel
   */
  partial(): void {
    this.setState('partial');
    this.animateTo(Math.min(
      this.options.defaultHeight,
      this.getMaxHeight() * 0.5
    ), false);
  }
  
  /**
   * Expand panel
   */
  expand(): void {
    this.setState('expanded');
    this.animateTo(this.currentHeight, false);
  }
  
  /**
   * Expand to full height
   */
  expandFull(): void {
    this.setState('expanded');
    this.animateTo(this.getMaxHeight(), false);
  }
  
  /**
   * Toggle between collapsed and expanded
   */
  toggle(): void {
    if (this.state === 'collapsed' || this.state === 'peeking') {
      this.expand();
    } else {
      this.collapse();
    }
  }
  
  private setState(newState: RevealPanelState): void {
    if (newState === this.state) return;
    
    const oldState = this.state;
    this.state = newState;
    
    // Update CSS class
    this.element.classList.remove('collapsed', 'peeking', 'partial', 'expanded', 'animating');
    this.element.classList.add(newState);
    
    // Update aria
    this.element.setAttribute('aria-expanded', 
      newState !== 'collapsed' && newState !== 'peeking' ? 'true' : 'false'
    );
    
    this.dispatchEvent('reveal-state-change', { oldState, newState });
  }
  
  /**
   * Get current state
   */
  getState(): RevealPanelState {
    return this.state;
  }
  
  // ===========================================================================
  // PIN
  // ===========================================================================
  
  /**
   * Pin/unpin panel
   */
  setPinned(pinned: boolean): void {
    this.isPinned = pinned;
    this.pinButton.setAttribute('aria-pressed', String(pinned));
    this.element.classList.toggle('pinned', pinned);
    
    this.dispatchEvent('reveal-pin-change', { pinned });
    this.savePersistedState();
  }
  
  /**
   * Toggle pin state
   */
  togglePinned(): void {
    this.setPinned(!this.isPinned);
  }
  
  /**
   * Check if pinned
   */
  isPinnedState(): boolean {
    return this.isPinned;
  }
  
  // ===========================================================================
  // HEIGHT
  // ===========================================================================
  
  /**
   * Set panel height
   */
  setHeight(height: number, animate: boolean = true): void {
    height = Math.max(this.options.minHeight, Math.min(height, this.getMaxHeight()));
    this.currentHeight = height;
    
    if (this.state !== 'collapsed' && this.state !== 'peeking') {
      if (animate) {
        this.animateTo(height, false);
      } else {
        this.spring.setImmediate(height);
        this.applyHeight(height);
      }
    }
    
    this.dispatchEvent('reveal-height-change', { height });
    this.savePersistedState();
  }
  
  private getMaxHeight(): number {
    const viewportHeight = this.container.clientHeight || window.innerHeight;
    return viewportHeight * this.options.maxHeightRatio;
  }
  
  private applyHeight(height: number): void {
    this.element.style.height = `${height}px`;
    
    // Update transform for collapse
    if (this.state === 'collapsed') {
      this.element.style.transform = `translateY(100%)`;
    } else if (this.state === 'peeking') {
      this.element.style.transform = `translateY(calc(100% - ${this.options.peekHeight}px))`;
    } else {
      this.element.style.transform = `translateY(0)`;
    }
  }
  
  /**
   * Snap to nearest threshold
   */
  private snapToNearest(height: number): number {
    const maxHeight = this.getMaxHeight();
    const ratio = height / maxHeight;
    
    let closest = this.options.snapThresholds[0] ?? 0.5;
    let minDist = Infinity;
    
    for (const threshold of this.options.snapThresholds) {
      const dist = Math.abs(ratio - threshold);
      if (dist < minDist) {
        minDist = dist;
        closest = threshold;
      }
    }
    
    return maxHeight * closest;
  }
  
  // ===========================================================================
  // ANIMATION
  // ===========================================================================
  
  private animateTo(targetHeight: number, collapse: boolean): void {
    this.isAnimating = true;
    this.element.classList.add('animating');
    
    // Set spring target
    this.spring.setTarget(collapse ? 0 : targetHeight);
    
    // Start animation loop
    if (!this.animationFrame) {
      this.animationFrame = requestAnimationFrame(this.animationLoop);
    }
  }
  
  private animationLoop = (): void => {
    if (!this.isAnimating) return;
    
    const dt = 1 / 60; // Assume 60fps for simplicity
    const height = this.spring.update(dt);
    
    this.applyAnimationState(height);
    
    if (this.spring.isSettled()) {
      this.isAnimating = false;
      this.animationFrame = null;
      this.element.classList.remove('animating');
      
      // Apply final state
      const finalHeight = this.state === 'collapsed' ? 0 
        : this.state === 'peeking' ? this.options.peekHeight 
        : this.currentHeight;
      this.applyHeight(finalHeight);
    } else {
      this.animationFrame = requestAnimationFrame(this.animationLoop);
    }
  };
  
  private applyAnimationState(springValue: number): void {
    if (this.state === 'collapsed' || this.state === 'peeking') {
      // Animate translate
      const progress = springValue / this.currentHeight;
      const translateY = (1 - progress) * 100;
      this.element.style.transform = `translateY(${Math.max(0, translateY)}%)`;
      this.element.style.height = `${this.currentHeight}px`;
    } else {
      // Animate height
      this.element.style.height = `${springValue}px`;
      this.element.style.transform = `translateY(0)`;
    }
  }
  
  // ===========================================================================
  // EVENT HANDLING
  // ===========================================================================
  
  private setupEventListeners(): void {
    // Resize handle
    this.resizeHandle.addEventListener('pointerdown', this.onResizeStart);
    
    // Pin button
    this.pinButton.addEventListener('click', () => this.togglePinned());
    
    // Collapse button
    const collapseBtn = this.element.querySelector('.reveal-collapse-button');
    collapseBtn?.addEventListener('click', () => this.collapse());
    
    // Header double-click to toggle
    this.header.addEventListener('dblclick', () => this.toggle());
    
    // Keyboard
    this.element.addEventListener('keydown', this.onKeyDown);
    
    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (this.state === 'expanded' && this.currentHeight > this.getMaxHeight()) {
        this.setHeight(this.getMaxHeight(), false);
      }
    });
    resizeObserver.observe(this.container);
  }
  
  private onResizeStart = (e: PointerEvent): void => {
    if (e.button !== 0) return;
    
    this.isDragging = true;
    this.dragStartY = e.clientY;
    this.dragStartHeight = this.currentHeight;
    this.velocityTracker = [{ time: performance.now(), y: e.clientY }];
    
    this.element.classList.add('dragging');
    this.resizeHandle.setPointerCapture(e.pointerId);
    
    document.addEventListener('pointermove', this.onResizeMove);
    document.addEventListener('pointerup', this.onResizeEnd);
    
    e.preventDefault();
  };
  
  private onResizeMove = (e: PointerEvent): void => {
    if (!this.isDragging) return;
    
    const delta = this.dragStartY - e.clientY;
    const newHeight = this.dragStartHeight + delta;
    
    // Track velocity
    this.velocityTracker.push({ time: performance.now(), y: e.clientY });
    if (this.velocityTracker.length > 5) {
      this.velocityTracker.shift();
    }
    
    // Apply height immediately (no animation)
    const clampedHeight = Math.max(this.options.minHeight, Math.min(newHeight, this.getMaxHeight()));
    this.element.style.height = `${clampedHeight}px`;
    
    // Update state based on height
    if (clampedHeight < this.options.peekHeight + 20) {
      this.element.classList.add('near-collapse');
    } else {
      this.element.classList.remove('near-collapse');
    }
  };
  
  private onResizeEnd = (_e: PointerEvent): void => {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.element.classList.remove('dragging', 'near-collapse');
    
    document.removeEventListener('pointermove', this.onResizeMove);
    document.removeEventListener('pointerup', this.onResizeEnd);
    
    // Calculate velocity
    const velocity = this.calculateVelocity();
    const currentHeight = parseFloat(this.element.style.height);
    
    // Determine final state based on velocity and position
    if (velocity > 500 || currentHeight < this.options.minHeight + 20) {
      // Fast downward swipe or near minimum - collapse
      this.collapse();
    } else if (velocity < -500) {
      // Fast upward swipe - expand full
      this.expandFull();
    } else {
      // Snap to nearest threshold
      const snappedHeight = this.snapToNearest(currentHeight);
      this.currentHeight = snappedHeight;
      
      if (snappedHeight <= this.options.peekHeight) {
        this.peek();
      } else {
        this.setState('expanded');
        this.setHeight(snappedHeight, true);
      }
    }
  };
  
  private calculateVelocity(): number {
    if (this.velocityTracker.length < 2) return 0;
    
    const recent = this.velocityTracker.slice(-3);
    const first = recent[0];
    const last = recent[recent.length - 1];
    
    if (!first || !last) return 0;
    
    const dt = (last.time - first.time) / 1000; // seconds
    const dy = last.y - first.y;
    
    return dt > 0 ? dy / dt : 0;
  }
  
  private onKeyDown = (e: KeyboardEvent): void => {
    switch (e.key) {
      case 'Escape':
        if (this.state !== 'collapsed') {
          this.collapse();
        }
        break;
      case 'Enter':
        if (this.state === 'collapsed' || this.state === 'peeking') {
          this.expand();
        }
        break;
      case 'ArrowUp':
        if (e.ctrlKey || e.metaKey) {
          this.expandFull();
        } else {
          this.setHeight(this.currentHeight + 50);
        }
        break;
      case 'ArrowDown':
        if (e.ctrlKey || e.metaKey) {
          this.peek();
        } else {
          this.setHeight(this.currentHeight - 50);
        }
        break;
      case 'Tab':
        // Navigate between tabs
        if (e.target === this.tabBar || this.tabBar.contains(e.target as Node)) {
          this.handleTabNavigation(e);
        }
        break;
    }
  };
  
  private handleTabNavigation(e: KeyboardEvent): void {
    const tabIds = Array.from(this.tabs.keys());
    const currentIndex = this.activeTabId ? tabIds.indexOf(this.activeTabId) : -1;
    
    let nextIndex: number;
    if (e.shiftKey) {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : tabIds.length - 1;
    } else {
      nextIndex = currentIndex < tabIds.length - 1 ? currentIndex + 1 : 0;
    }
    
    // Skip disabled tabs
    while (this.tabs.get(tabIds[nextIndex]!)?.disabled && nextIndex !== currentIndex) {
      if (e.shiftKey) {
        nextIndex = nextIndex > 0 ? nextIndex - 1 : tabIds.length - 1;
      } else {
        nextIndex = nextIndex < tabIds.length - 1 ? nextIndex + 1 : 0;
      }
    }
    
    const nextTabId = tabIds[nextIndex];
    if (nextTabId) {
      this.activateTab(nextTabId);
      this.tabElements.get(nextTabId)?.focus();
    }
    e.preventDefault();
  }
  
  // ===========================================================================
  // PERSISTENCE
  // ===========================================================================
  
  private loadPersistedState(): void {
    if (!this.options.persistHeight) return;
    
    try {
      const saved = localStorage.getItem('cardplay-reveal-panel');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.height) {
          this.currentHeight = Math.min(data.height, this.getMaxHeight());
        }
        if (data.pinned !== undefined) {
          this.setPinned(data.pinned);
        }
      }
    } catch (e) {
      // Ignore
    }
  }
  
  private savePersistedState(): void {
    if (!this.options.persistHeight) return;
    
    try {
      localStorage.setItem('cardplay-reveal-panel', JSON.stringify({
        height: this.currentHeight,
        pinned: this.isPinned,
      }));
    } catch (e) {
      // Ignore
    }
  }
  
  // ===========================================================================
  // EVENTS
  // ===========================================================================
  
  private dispatchEvent<K extends keyof RevealPanelEvents>(
    type: K,
    detail: RevealPanelEvents[K]
  ): void {
    this.element.dispatchEvent(new CustomEvent(type, {
      bubbles: true,
      detail,
    }));
  }
  
  /**
   * Add event listener
   */
  on<K extends keyof RevealPanelEvents>(
    type: K,
    handler: (e: CustomEvent<RevealPanelEvents[K]>) => void
  ): void {
    this.element.addEventListener(type, handler as EventListener);
  }
  
  /**
   * Remove event listener
   */
  off<K extends keyof RevealPanelEvents>(
    type: K,
    handler: (e: CustomEvent<RevealPanelEvents[K]>) => void
  ): void {
    this.element.removeEventListener(type, handler as EventListener);
  }
  
  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================
  
  /**
   * Dispose panel
   */
  dispose(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    document.removeEventListener('pointermove', this.onResizeMove);
    document.removeEventListener('pointerup', this.onResizeEnd);
    
    this.element.remove();
  }
  
  /**
   * Get element
   */
  getElement(): HTMLElement {
    return this.element;
  }
}

// ============================================================================
// CSS STYLES
// ============================================================================

export const REVEAL_PANEL_CSS = `
/* Reveal Panel Container */
.reveal-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--cardplay-panel-bg, #1e1e1e);
  border-top: 1px solid var(--cardplay-border, #333);
  border-radius: 12px 12px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  will-change: transform, height;
}

.reveal-panel.collapsed {
  transform: translateY(100%);
}

.reveal-panel.peeking {
  transform: translateY(calc(100% - 48px));
}

.reveal-panel.animating {
  transition: none;
}

.reveal-panel.dragging {
  user-select: none;
}

/* Resize Handle */
.reveal-resize-handle {
  position: absolute;
  top: -8px;
  left: 0;
  right: 0;
  height: 16px;
  cursor: ns-resize;
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
}

.reveal-resize-grip {
  width: 40px;
  height: 4px;
  background: var(--cardplay-border, #444);
  border-radius: 2px;
  transition: background 0.15s ease;
}

.reveal-resize-handle:hover .reveal-resize-grip,
.reveal-resize-handle:focus .reveal-resize-grip {
  background: var(--cardplay-accent, #6366f1);
}

/* Header */
.reveal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--cardplay-panel-header, #252525);
  border-bottom: 1px solid var(--cardplay-border, #333);
  min-height: 48px;
}

.reveal-context {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--cardplay-text-secondary, #aaa);
}

.reveal-context-icon {
  font-size: 16px;
}

.reveal-context-text {
  font-weight: 500;
}

.reveal-header-actions {
  display: flex;
  gap: 4px;
}

.reveal-header-actions button {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--cardplay-text-secondary, #aaa);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.reveal-header-actions button:hover {
  background: var(--cardplay-hover, #333);
  color: var(--cardplay-text, #fff);
}

.reveal-pin-button[aria-pressed="true"] {
  color: var(--cardplay-accent, #6366f1);
  background: var(--cardplay-accent-dim, rgba(99, 102, 241, 0.2));
}

/* Tab Bar */
.reveal-tab-bar {
  display: flex;
  padding: 0 16px;
  background: var(--cardplay-panel-header, #252525);
  border-bottom: 1px solid var(--cardplay-border, #333);
  overflow-x: auto;
  scrollbar-width: none;
}

.reveal-tab-bar::-webkit-scrollbar {
  display: none;
}

.reveal-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: var(--cardplay-text-secondary, #aaa);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  position: relative;
  transition: all 0.15s ease;
}

.reveal-tab::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 16px;
  right: 16px;
  height: 2px;
  background: transparent;
  border-radius: 1px 1px 0 0;
  transition: background 0.15s ease;
}

.reveal-tab:hover {
  color: var(--cardplay-text, #fff);
}

.reveal-tab.active {
  color: var(--cardplay-accent, #6366f1);
}

.reveal-tab.active::after {
  background: var(--cardplay-accent, #6366f1);
}

.reveal-tab.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reveal-tab-icon {
  font-size: 14px;
}

.reveal-tab-badge {
  background: var(--cardplay-accent, #6366f1);
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

/* Content */
.reveal-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.reveal-content::-webkit-scrollbar {
  width: 8px;
}

.reveal-content::-webkit-scrollbar-track {
  background: transparent;
}

.reveal-content::-webkit-scrollbar-thumb {
  background: var(--cardplay-border, #333);
  border-radius: 4px;
}

.reveal-content::-webkit-scrollbar-thumb:hover {
  background: var(--cardplay-text-secondary, #555);
}

/* Near collapse indicator */
.reveal-panel.near-collapse .reveal-header {
  background: rgba(239, 68, 68, 0.1);
}

/* Pinned state */
.reveal-panel.pinned {
  box-shadow: 0 -4px 30px rgba(99, 102, 241, 0.2);
}

.reveal-panel.pinned::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--cardplay-accent, #6366f1);
}
`;

// ============================================================================
// FACTORY
// ============================================================================

export function createRevealPanel(container: HTMLElement, options?: RevealPanelOptions): RevealPanel {
  return new RevealPanel(container, options);
}

// ============================================================================
// DEFAULT TABS
// ============================================================================

export function createParametersTab(): RevealTab {
  return {
    id: 'parameters',
    label: 'Parameters',
    icon: '⚙️',
    content: (_context) => {
      const el = document.createElement('div');
      el.className = 'reveal-tab-content parameters-content';
      el.innerHTML = `
        <div class="parameters-empty" style="text-align: center; padding: 40px; color: #666;">
          Select a card to view parameters
        </div>
      `;
      return el;
    }
  };
}

export function createConnectionsTab(): RevealTab {
  return {
    id: 'connections',
    label: 'Connections',
    icon: '🔗',
    content: (_context) => {
      const el = document.createElement('div');
      el.className = 'reveal-tab-content connections-content';
      el.innerHTML = `
        <div class="connections-empty" style="text-align: center; padding: 40px; color: #666;">
          Select a card to view connections
        </div>
      `;
      return el;
    }
  };
}

export function createInfoTab(): RevealTab {
  return {
    id: 'info',
    label: 'Info',
    icon: 'ℹ️',
    content: (_context) => {
      const el = document.createElement('div');
      el.className = 'reveal-tab-content info-content';
      el.innerHTML = `
        <div class="info-empty" style="text-align: center; padding: 40px; color: #666;">
          Select a card to view info
        </div>
      `;
      return el;
    }
  };
}

export function createPresetBrowserTab(): RevealTab {
  return {
    id: 'presets',
    label: 'Presets',
    icon: '📋',
    content: (_context) => {
      const el = document.createElement('div');
      el.className = 'reveal-tab-content presets-content';
      el.innerHTML = `
        <div class="presets-browser">
          <div class="presets-search">
            <input type="text" placeholder="Search presets..." class="presets-search-input" />
          </div>
          <div class="presets-list">
            <!-- Preset items would go here -->
          </div>
        </div>
      `;
      return el;
    }
  };
}
