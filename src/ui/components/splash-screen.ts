/**
 * @fileoverview Animated Splash Screen Component
 * 
 * Provides a visually appealing loading screen shown during app initialization.
 * Features animated logo, loading progress, and smooth transitions.
 * 
 * @module @cardplay/core/ui/components/splash-screen
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Splash screen state
 */
export interface SplashScreenState {
  /** Loading progress (0-1) */
  readonly progress: number;
  /** Current loading message */
  readonly message: string;
  /** Whether splash is visible */
  readonly visible: boolean;
  /** Animation time (for animated effects) */
  readonly animationTime: number;
}

/**
 * Splash screen configuration
 */
export interface SplashScreenConfig {
  /** Background color */
  readonly backgroundColor?: string;
  /** Logo color */
  readonly logoColor?: string;
  /** Accent color */
  readonly accentColor?: string;
  /** Animation duration in ms */
  readonly animationDuration?: number;
  /** Auto-hide when complete */
  readonly autoHide?: boolean;
  /** Show progress bar */
  readonly showProgress?: boolean;
  /** Show loading messages */
  readonly showMessages?: boolean;
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Create initial splash screen state
 */
export function createInitialSplashState(): SplashScreenState {
  return {
    progress: 0,
    message: 'Loading CardPlay...',
    visible: true,
    animationTime: 0,
  };
}

/**
 * Update splash screen progress
 */
export function updateProgress(
  state: SplashScreenState,
  progress: number,
  message?: string
): SplashScreenState {
  return {
    ...state,
    progress: Math.max(0, Math.min(1, progress)),
    message: message || state.message,
  };
}

/**
 * Update animation time
 */
export function updateAnimationTime(
  state: SplashScreenState,
  deltaTime: number
): SplashScreenState {
  return {
    ...state,
    animationTime: state.animationTime + deltaTime,
  };
}

/**
 * Hide splash screen
 */
export function hideSplash(state: SplashScreenState): SplashScreenState {
  return {
    ...state,
    visible: false,
  };
}

// ============================================================================
// RENDERING
// ============================================================================

/**
 * Render splash screen
 */
export function renderSplashScreen(
  ctx: CanvasRenderingContext2D,
  state: SplashScreenState,
  width: number,
  height: number,
  config: SplashScreenConfig = {}
): void {
  if (!state.visible) return;
  
  const {
    backgroundColor = '#0F172A',
    logoColor = '#3B82F6',
    accentColor = '#10B981',
    showProgress = true,
    showMessages = true,
  } = config;
  
  ctx.save();
  
  // Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);
  
  // Animated logo
  const centerX = width / 2;
  const centerY = height / 2 - 50;
  renderAnimatedLogo(ctx, centerX, centerY, state.animationTime, logoColor, accentColor);
  
  // App name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CardPlay', centerX, centerY + 100);
  
  // Tagline
  ctx.fillStyle = '#94A3B8';
  ctx.font = '16px sans-serif';
  ctx.fillText('Music creation, parametrically polymorphic', centerX, centerY + 130);
  
  // Progress bar
  if (showProgress) {
    renderProgressBar(ctx, centerX, centerY + 180, 400, 6, state.progress, accentColor);
  }
  
  // Loading message
  if (showMessages) {
    ctx.fillStyle = '#64748B';
    ctx.font = '14px sans-serif';
    ctx.fillText(state.message, centerX, centerY + 210);
  }
  
  // Version
  ctx.fillStyle = '#475569';
  ctx.font = '12px sans-serif';
  ctx.fillText('v0.1.0', centerX, height - 20);
  
  ctx.restore();
}

/**
 * Render animated logo (card deck with flowing data)
 */
function renderAnimatedLogo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  primaryColor: string,
  accentColor: string
): void {
  const size = 120;
  const cardCount = 5;
  const cardWidth = size * 0.6;
  const cardHeight = size * 0.8;
  
  ctx.save();
  ctx.translate(x, y);
  
  // Draw cards in a stack with stagger animation
  for (let i = 0; i < cardCount; i++) {
    const offset = Math.sin(time / 300 + i * 0.3) * 10;
    const rotation = Math.sin(time / 500 + i * 0.5) * 0.1;
    const xOffset = (i - cardCount / 2) * 15 + offset;
    
    ctx.save();
    ctx.translate(xOffset, 0);
    ctx.rotate(rotation);
    
    // Card shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(-cardWidth / 2 + 4, -cardHeight / 2 + 4, cardWidth, cardHeight);
    
    // Card background
    const gradient = ctx.createLinearGradient(
      -cardWidth / 2,
      -cardHeight / 2,
      cardWidth / 2,
      cardHeight / 2
    );
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(1, accentColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);
    
    // Card border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);
    
    // Card icon/symbol
    const symbolY = -cardHeight / 4 + Math.sin(time / 200 + i) * 5;
    renderCardSymbol(ctx, 0, symbolY, 20, '#FFFFFF', time + i * 100);
    
    ctx.restore();
  }
  
  ctx.restore();
}

/**
 * Render card symbol (musical note with waves)
 */
function renderCardSymbol(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  time: number
): void {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  
  // Musical note
  ctx.beginPath();
  ctx.arc(x, y + size / 3, size / 4, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(x + size / 4, y + size / 3);
  ctx.lineTo(x + size / 4, y - size / 2);
  ctx.stroke();
  
  // Animated waveform
  ctx.beginPath();
  for (let i = 0; i <= 10; i++) {
    const wx = x - size / 2 + (i / 10) * size;
    const wy = y + size / 2 + Math.sin(time / 100 + i * 0.5) * size / 8;
    if (i === 0) {
      ctx.moveTo(wx, wy);
    } else {
      ctx.lineTo(wx, wy);
    }
  }
  ctx.stroke();
}

/**
 * Render progress bar
 */
function renderProgressBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  progress: number,
  color: string
): void {
  const barX = x - width / 2;
  
  // Background
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(barX, y, width, height);
  
  // Progress
  const progressWidth = width * progress;
  const gradient = ctx.createLinearGradient(barX, y, barX + progressWidth, y);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, '#3B82F6');
  ctx.fillStyle = gradient;
  ctx.fillRect(barX, y, progressWidth, height);
  
  // Border
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, y, width, height);
}

// ============================================================================
// ANIMATION CONTROLLER
// ============================================================================

/**
 * Splash screen animation controller
 */
export class SplashScreenController {
  private state: SplashScreenState;
  private config: SplashScreenConfig;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private onComplete?: () => void;
  
  constructor(config: SplashScreenConfig = {}) {
    this.state = createInitialSplashState();
    this.config = {
      animationDuration: 2000,
      autoHide: true,
      showProgress: true,
      showMessages: true,
      ...config,
    };
  }
  
  /**
   * Start animation
   */
  start(canvas: HTMLCanvasElement, onComplete?: () => void): void {
    if (onComplete !== undefined) {
      this.onComplete = onComplete;
    }
    this.lastTime = performance.now();
    
    const animate = (time: number) => {
      const deltaTime = time - this.lastTime;
      this.lastTime = time;
      
      // Update animation time
      this.state = updateAnimationTime(this.state, deltaTime);
      
      // Render
      const ctx = canvas.getContext('2d');
      if (ctx) {
        renderSplashScreen(
          ctx,
          this.state,
          canvas.width,
          canvas.height,
          this.config
        );
      }
      
      // Continue animation if visible
      if (this.state.visible) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else if (this.onComplete) {
        this.onComplete();
      }
    };
    
    this.animationFrameId = requestAnimationFrame(animate);
  }
  
  /**
   * Update progress
   */
  setProgress(progress: number, message?: string): void {
    this.state = updateProgress(this.state, progress, message);
    
    // Auto-hide when complete
    if (this.config.autoHide && progress >= 1) {
      setTimeout(() => {
        this.hide();
      }, 500);
    }
  }
  
  /**
   * Hide splash screen
   */
  hide(): void {
    this.state = hideSplash(this.state);
  }
  
  /**
   * Stop animation
   */
  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  /**
   * Get current state
   */
  getState(): SplashScreenState {
    return this.state;
  }
}

// ============================================================================
// LOADING MESSAGES
// ============================================================================

/**
 * Default loading messages with progress ranges
 */
export const DEFAULT_LOADING_MESSAGES: Array<{ progress: number; message: string }> = [
  { progress: 0.0, message: 'Loading CardPlay...' },
  { progress: 0.1, message: 'Initializing audio engine...' },
  { progress: 0.2, message: 'Loading type system...' },
  { progress: 0.3, message: 'Registering cards...' },
  { progress: 0.4, message: 'Loading presets...' },
  { progress: 0.5, message: 'Preparing instruments...' },
  { progress: 0.6, message: 'Loading phrase library...' },
  { progress: 0.7, message: 'Initializing UI...' },
  { progress: 0.8, message: 'Loading effects...' },
  { progress: 0.9, message: 'Finalizing setup...' },
  { progress: 1.0, message: 'Ready to create!' },
];

/**
 * Get loading message for progress
 */
export function getLoadingMessage(progress: number): string {
  for (let i = DEFAULT_LOADING_MESSAGES.length - 1; i >= 0; i--) {
    const msg = DEFAULT_LOADING_MESSAGES[i];
    if (msg && progress >= msg.progress) {
      return msg.message;
    }
  }
  return 'Loading...';
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Create and mount splash screen
 */
export function createSplashScreen(
  container: HTMLElement,
  config: SplashScreenConfig = {}
): SplashScreenController {
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = container.clientWidth || 800;
  canvas.height = container.clientHeight || 600;
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '9999';
  container.appendChild(canvas);
  
  // Create controller
  const controller = new SplashScreenController(config);
  
  // Start animation
  controller.start(canvas, () => {
    // Remove canvas when complete
    setTimeout(() => {
      canvas.remove();
    }, 500);
  });
  
  return controller;
}

/**
 * Simulate loading progress
 */
export function simulateLoadingProgress(
  controller: SplashScreenController,
  duration: number = 3000
): void {
  const startTime = performance.now();
  
  const update = () => {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(1, elapsed / duration);
    const message = getLoadingMessage(progress);
    
    controller.setProgress(progress, message);
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  };
  
  requestAnimationFrame(update);
}
