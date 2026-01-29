/**
 * @fileoverview Beautiful visual effects for CardPlay UI
 * 
 * Provides gradients, shadows, glassmorphism, and other visual enhancements.
 */

/**
 * Beautiful gradient presets
 */
export const gradients = {
  // Warm gradients
  sunset: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 50%, #c44569 100%)',
  fire: 'linear-gradient(135deg, #f83600 0%, #f9d423 100%)',
  peachy: 'linear-gradient(135deg, #ed4264 0%, #ffedbc 100%)',
  
  // Cool gradients
  ocean: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  sky: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
  mint: 'linear-gradient(135deg, #00f260 0%, #0575e6 100%)',
  aurora: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  
  // Dark gradients
  midnight: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
  nebula: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
  carbon: 'linear-gradient(135deg, #434343 0%, #000000 100%)',
  
  // Vibrant gradients
  rainbow: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
  electric: 'linear-gradient(135deg, #7f00ff 0%, #e100ff 100%)',
  citrus: 'linear-gradient(135deg, #f4d03f 0%, #16a085 100%)',
  
  // Subtle gradients for UI
  whisper: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  smoke: 'linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%)',
  mist: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)',
  
  // Musical/artistic gradients
  jazz: 'linear-gradient(135deg, #283c86 0%, #45a247 100%)',
  classical: 'linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)',
  electronic: 'linear-gradient(135deg, #00d2ff 0%, #3a47d5 100%)',
  ambient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  
  // Metallic gradients
  gold: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
  silver: 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)',
  bronze: 'linear-gradient(135deg, #b79891 0%, #94716b 100%)',
  copper: 'linear-gradient(135deg, #c94b4b 0%, #4b134f 100%)',
} as const;

/**
 * Shadow depth presets
 */
export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  
  // Colored shadows for emphasis
  primaryGlow: '0 0 20px rgba(99, 102, 241, 0.5)',
  accentGlow: '0 0 20px rgba(59, 130, 246, 0.5)',
  successGlow: '0 0 20px rgba(34, 197, 94, 0.5)',
  warningGlow: '0 0 20px rgba(251, 146, 60, 0.5)',
  errorGlow: '0 0 20px rgba(239, 68, 68, 0.5)',
  
  // Neumorphic shadows
  neuLight: '6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff',
  neuDark: '6px 6px 12px #0a0a0a, -6px -6px 12px #1e1e1e',
} as const;

/**
 * Glassmorphism effect styles
 */
export interface GlassmorphismOptions {
  blur?: number;
  opacity?: number;
  borderOpacity?: number;
  saturation?: number;
}

export function glassmorphism(options: GlassmorphismOptions = {}): Record<string, string> {
  const {
    blur = 10,
    opacity = 0.8,
    borderOpacity = 0.3,
    saturation = 1.5
  } = options;
  
  return {
    background: `rgba(255, 255, 255, ${opacity})`,
    backdropFilter: `blur(${blur}px) saturate(${saturation})`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation})`,
    border: `1px solid rgba(255, 255, 255, ${borderOpacity})`,
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
  };
}

/**
 * Apply glassmorphism to an element
 */
export function applyGlassmorphism(
  element: HTMLElement,
  options: GlassmorphismOptions = {}
): void {
  const styles = glassmorphism(options);
  Object.entries(styles).forEach(([key, value]) => {
    if (value !== undefined) {
      element.style.setProperty(key, value);
    }
  });
}

/**
 * Frosted glass effect (darker variant)
 */
export function frostedGlass(options: GlassmorphismOptions = {}): Record<string, string> {
  const {
    blur = 10,
    opacity = 0.3,
    borderOpacity = 0.2,
    saturation = 1.2
  } = options;
  
  return {
    background: `rgba(17, 25, 40, ${opacity})`,
    backdropFilter: `blur(${blur}px) saturate(${saturation})`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation})`,
    border: `1px solid rgba(255, 255, 255, ${borderOpacity})`,
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
  };
}

/**
 * Neumorphic effect styles
 */
export interface NeumorphismOptions {
  mode?: 'light' | 'dark';
  intensity?: number;
  distance?: number;
}

export function neumorphism(options: NeumorphismOptions = {}): Record<string, string> {
  const {
    mode = 'light',
    intensity = 0.2,
    distance = 8
  } = options;
  
  if (mode === 'light') {
    return {
      background: '#e0e5ec',
      boxShadow: `${distance}px ${distance}px ${distance * 2}px rgba(163, 177, 198, ${intensity}), -${distance}px -${distance}px ${distance * 2}px rgba(255, 255, 255, ${intensity})`,
      borderRadius: '16px'
    };
  } else {
    return {
      background: '#1a1a1a',
      boxShadow: `${distance}px ${distance}px ${distance * 2}px rgba(0, 0, 0, ${intensity}), -${distance}px -${distance}px ${distance * 2}px rgba(40, 40, 40, ${intensity})`,
      borderRadius: '16px'
    };
  }
}

/**
 * Apply neumorphism to an element
 */
export function applyNeumorphism(
  element: HTMLElement,
  options: NeumorphismOptions = {}
): void {
  const styles = neumorphism(options);
  Object.entries(styles).forEach(([key, value]) => {
    if (value !== undefined) {
      element.style.setProperty(key, value);
    }
  });
}

/**
 * Mesh gradient background generator
 */
export function meshGradient(colors: string[]): string {
  if (colors.length < 2) {
    throw new Error('Mesh gradient requires at least 2 colors');
  }
  
  // Create a complex mesh gradient using multiple radial gradients
  const gradients = colors.map((color, index) => {
    const angle = (360 / colors.length) * index;
    const x = 50 + 40 * Math.cos((angle * Math.PI) / 180);
    const y = 50 + 40 * Math.sin((angle * Math.PI) / 180);
    return `radial-gradient(at ${x}% ${y}%, ${color} 0px, transparent 50%)`;
  });
  
  return gradients.join(', ');
}

/**
 * Create a particle field effect
 */
export interface ParticleFieldOptions {
  count?: number;
  colors?: string[];
  size?: [number, number];
  speed?: [number, number];
}

export function createParticleField(
  container: HTMLElement,
  options: ParticleFieldOptions = {}
): () => void {
  const {
    count = 50,
    colors = ['#667eea', '#764ba2', '#f093fb'],
    size = [2, 6],
    speed = [10, 30]
  } = options;
  
  const particles: HTMLElement[] = [];
  
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.style.position = 'absolute';
    particle.style.borderRadius = '50%';
    particle.style.pointerEvents = 'none';
    particle.style.opacity = '0.6';
    
    // Random properties
    const particleSize = size[0] + Math.random() * (size[1] - size[0]);
    const colorIndex = Math.floor(Math.random() * colors.length);
    const particleColor = colors[colorIndex] ?? colors[0] ?? '#667eea';
    const particleSpeed = speed[0] + Math.random() * (speed[1] - speed[0]);
    const startX = Math.random() * 100;
    const startY = Math.random() * 100;
    
    particle.style.width = `${particleSize}px`;
    particle.style.height = `${particleSize}px`;
    particle.style.backgroundColor = particleColor;
    particle.style.left = `${startX}%`;
    particle.style.top = `${startY}%`;
    
    // Floating animation
    particle.animate(
      [
        { 
          transform: 'translate(0, 0)',
          opacity: 0.6
        },
        { 
          transform: `translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px)`,
          opacity: 0.3
        },
        { 
          transform: 'translate(0, 0)',
          opacity: 0.6
        }
      ],
      {
        duration: particleSpeed * 1000,
        iterations: Infinity,
        easing: 'ease-in-out'
      }
    );
    
    container.appendChild(particle);
    particles.push(particle);
  }
  
  // Return cleanup function
  return () => {
    particles.forEach(p => p.remove());
  };
}

/**
 * Text gradient effect
 */
export function textGradient(gradient: string): Record<string, string> {
  return {
    background: gradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  };
}

/**
 * Apply text gradient to an element
 */
export function applyTextGradient(element: HTMLElement, gradient: string): void {
  const styles = textGradient(gradient);
  Object.assign(element.style, styles);
}

/**
 * Hover lift effect (card elevation on hover)
 */
export function hoverLift(element: HTMLElement): () => void {
  const originalTransform = element.style.transform;
  const originalBoxShadow = element.style.boxShadow;
  const originalTransition = element.style.transition;
  
  element.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
  
  const handleMouseEnter = () => {
    element.style.transform = 'translateY(-4px)';
    element.style.boxShadow = shadows.xl;
  };
  
  const handleMouseLeave = () => {
    element.style.transform = originalTransform;
    element.style.boxShadow = originalBoxShadow;
  };
  
  element.addEventListener('mouseenter', handleMouseEnter);
  element.addEventListener('mouseleave', handleMouseLeave);
  
  // Return cleanup function
  return () => {
    element.removeEventListener('mouseenter', handleMouseEnter);
    element.removeEventListener('mouseleave', handleMouseLeave);
    element.style.transition = originalTransition;
  };
}

/**
 * Glow effect on hover
 */
export function hoverGlow(element: HTMLElement, color: string = 'rgba(99, 102, 241, 0.5)'): () => void {
  const originalBoxShadow = element.style.boxShadow;
  const originalTransition = element.style.transition;
  
  element.style.transition = 'box-shadow 0.3s ease';
  
  const handleMouseEnter = () => {
    element.style.boxShadow = `0 0 20px ${color}`;
  };
  
  const handleMouseLeave = () => {
    element.style.boxShadow = originalBoxShadow;
  };
  
  element.addEventListener('mouseenter', handleMouseEnter);
  element.addEventListener('mouseleave', handleMouseLeave);
  
  // Return cleanup function
  return () => {
    element.removeEventListener('mouseenter', handleMouseEnter);
    element.removeEventListener('mouseleave', handleMouseLeave);
    element.style.transition = originalTransition;
  };
}

/**
 * Create a subtle grid pattern background
 */
export function gridPattern(options: {
  size?: number;
  color?: string;
} = {}): string {
  const { size = 20, color = '#000000' } = options;
  
  return `
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent ${size - 1}px,
      ${color} ${size - 1}px,
      ${color} ${size}px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent ${size - 1}px,
      ${color} ${size - 1}px,
      ${color} ${size}px
    )
  `.replace(/\s+/g, ' ').trim();
}

/**
 * Create a dot pattern background
 */
export function dotPattern(options: {
  size?: number;
  spacing?: number;
  color?: string;
  opacity?: number;
} = {}): string {
  const { size = 2, color = '#000000' } = options;
  
  return `radial-gradient(${color} ${size}px, transparent ${size}px)`;
}

/**
 * Shimmer loading effect
 */
export function shimmer(element: HTMLElement): Animation {
  element.style.background = `linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)`;
  element.style.backgroundSize = '200% 100%';
  
  return element.animate(
    [
      { backgroundPosition: '200% 0' },
      { backgroundPosition: '-200% 0' }
    ],
    {
      duration: 2000,
      iterations: Infinity,
      easing: 'ease-in-out'
    }
  );
}

/**
 * Apply a beautiful gradient border
 */
export function gradientBorder(
  element: HTMLElement,
  gradient: string,
  borderWidth: number = 2
): void {
  element.style.position = 'relative';
  element.style.background = 'var(--bg-card, white)';
  element.style.backgroundClip = 'padding-box';
  element.style.border = `${borderWidth}px solid transparent`;
  
  // Create pseudo-element for gradient border
  const style = document.createElement('style');
  const className = `gradient-border-${Math.random().toString(36).substr(2, 9)}`;
  element.classList.add(className);
  
  style.textContent = `
    .${className}::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: inherit;
      padding: ${borderWidth}px;
      background: ${gradient};
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
      z-index: -1;
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Create beautiful scroll reveal effect
 */
export function scrollReveal(elements: HTMLElement[], options: {
  threshold?: number;
  delay?: number;
  distance?: number;
} = {}): IntersectionObserver {
  const { threshold = 0.1, delay = 0, distance = 50 } = options;
  
  // Hide elements initially
  elements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = `translateY(${distance}px)`;
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  });
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting && entry.target instanceof HTMLElement) {
        setTimeout(() => {
          const target = entry.target as HTMLElement;
          target.style.opacity = '1';
          target.style.transform = 'translateY(0)';
        }, delay * index);
        
        observer.unobserve(entry.target);
      }
    });
  }, { threshold });
  
  elements.forEach(el => observer.observe(el));
  
  return observer;
}
