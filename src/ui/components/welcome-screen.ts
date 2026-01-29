/**
 * @fileoverview Beautiful welcome screen for first-time CardPlay users
 * 
 * Provides an elegant introduction to the application with smooth animations.
 */

import { fadeIn, slideIn, stagger } from '../animations';

export interface WelcomeScreenOptions {
  onGetStarted?: () => void;
  onSkip?: () => void;
}

export function createWelcomeScreen(options: WelcomeScreenOptions = {}): HTMLElement {
  const { onGetStarted, onSkip } = options;
  
  const container = document.createElement('div');
  container.className = 'welcome-screen';
  
  // Hero section
  const hero = document.createElement('div');
  hero.className = 'welcome-screen__hero';
  
  const logo = document.createElement('div');
  logo.className = 'welcome-screen__logo';
  logo.textContent = '🎵';
  hero.appendChild(logo);
  
  const title = document.createElement('h1');
  title.className = 'welcome-screen__title';
  title.textContent = 'Welcome to CardPlay';
  hero.appendChild(title);
  
  const subtitle = document.createElement('p');
  subtitle.className = 'welcome-screen__subtitle';
  subtitle.textContent = 'Your adaptive music creation workspace';
  hero.appendChild(subtitle);
  
  container.appendChild(hero);
  
  // Features section
  const features = document.createElement('div');
  features.className = 'welcome-screen__features';
  
  const featureList = [
    {
      icon: '🎹',
      title: 'Multiple Workflows',
      description: 'Tracker, notation, piano roll, session view - choose your style'
    },
    {
      icon: '🤖',
      title: 'Adaptive AI',
      description: 'As much or as little AI assistance as you want'
    },
    {
      icon: '🎨',
      title: 'Beautiful Interface',
      description: 'Modern, accessible design that gets out of your way'
    },
    {
      icon: '⚡',
      title: 'Blazing Fast',
      description: 'Runs entirely in your browser with zero latency'
    }
  ];
  
  featureList.forEach(feature => {
    const featureCard = document.createElement('div');
    featureCard.className = 'welcome-screen__feature';
    
    const featureIcon = document.createElement('div');
    featureIcon.className = 'welcome-screen__feature-icon';
    featureIcon.textContent = feature.icon;
    featureCard.appendChild(featureIcon);
    
    const featureTitle = document.createElement('h3');
    featureTitle.className = 'welcome-screen__feature-title';
    featureTitle.textContent = feature.title;
    featureCard.appendChild(featureTitle);
    
    const featureDesc = document.createElement('p');
    featureDesc.className = 'welcome-screen__feature-description';
    featureDesc.textContent = feature.description;
    featureCard.appendChild(featureDesc);
    
    features.appendChild(featureCard);
  });
  
  container.appendChild(features);
  
  // Actions section
  const actions = document.createElement('div');
  actions.className = 'welcome-screen__actions';
  
  const getStartedBtn = document.createElement('button');
  getStartedBtn.className = 'welcome-screen__btn welcome-screen__btn--primary';
  getStartedBtn.textContent = 'Get Started';
  getStartedBtn.onclick = () => {
    if (onGetStarted) onGetStarted();
  };
  actions.appendChild(getStartedBtn);
  
  const skipBtn = document.createElement('button');
  skipBtn.className = 'welcome-screen__btn welcome-screen__btn--secondary';
  skipBtn.textContent = 'Skip';
  skipBtn.onclick = () => {
    if (onSkip) onSkip();
  };
  actions.appendChild(skipBtn);
  
  container.appendChild(actions);
  
  // Inject styles
  injectWelcomeScreenStyles();
  
  // Animate entrance
  setTimeout(() => {
    fadeIn(hero, 250);
    
    // Stagger feature cards
    const featureCards = Array.from(features.querySelectorAll('.welcome-screen__feature')) as HTMLElement[];
    stagger(featureCards, (el) => slideIn(el, 'bottom', 250), 100);
    
    // Animate actions last
    setTimeout(() => {
      fadeIn(actions, 250);
    }, 800);
  }, 100);
  
  return container;
}

let stylesInjected = false;

function injectWelcomeScreenStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  
  const style = document.createElement('style');
  style.textContent = `
    .welcome-screen {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3rem;
      padding: 2rem;
      background: linear-gradient(135deg, 
        #667eea 0%, 
        #764ba2 50%, 
        #f093fb 100%
      );
      overflow-y: auto;
      z-index: 9999;
    }
    
    .welcome-screen__hero {
      text-align: center;
      opacity: 0;
    }
    
    .welcome-screen__logo {
      font-size: 6rem;
      margin-bottom: 1rem;
      animation: welcome-float 3s ease-in-out infinite;
      filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3));
    }
    
    @keyframes welcome-float {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-10px);
      }
    }
    
    .welcome-screen__title {
      font-size: 3rem;
      font-weight: 700;
      color: white;
      margin: 0 0 0.5rem 0;
      text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      letter-spacing: -0.02em;
    }
    
    .welcome-screen__subtitle {
      font-size: 1.25rem;
      color: rgba(255, 255, 255, 0.9);
      margin: 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    .welcome-screen__features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      max-width: 1000px;
      width: 100%;
    }
    
    .welcome-screen__feature {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 1rem;
      padding: 2rem;
      text-align: center;
      transition: all 0.3s ease;
      opacity: 0;
    }
    
    .welcome-screen__feature:hover {
      transform: translateY(-4px);
      background: rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }
    
    .welcome-screen__feature-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }
    
    .welcome-screen__feature-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: white;
      margin: 0 0 0.5rem 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    .welcome-screen__feature-description {
      font-size: 0.95rem;
      color: rgba(255, 255, 255, 0.85);
      margin: 0;
      line-height: 1.5;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
    
    .welcome-screen__actions {
      display: flex;
      gap: 1rem;
      opacity: 0;
    }
    
    .welcome-screen__btn {
      padding: 1rem 2.5rem;
      border: none;
      border-radius: 0.75rem;
      font-size: 1.125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    
    .welcome-screen__btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
    }
    
    .welcome-screen__btn:active {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    
    .welcome-screen__btn--primary {
      background: white;
      color: #667eea;
    }
    
    .welcome-screen__btn--primary:hover {
      background: #f8f9fa;
    }
    
    .welcome-screen__btn--secondary {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    
    .welcome-screen__btn--secondary:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .welcome-screen {
        gap: 2rem;
        padding: 1.5rem;
      }
      
      .welcome-screen__logo {
        font-size: 4rem;
      }
      
      .welcome-screen__title {
        font-size: 2rem;
      }
      
      .welcome-screen__subtitle {
        font-size: 1rem;
      }
      
      .welcome-screen__features {
        grid-template-columns: 1fr;
      }
      
      .welcome-screen__actions {
        flex-direction: column;
        width: 100%;
      }
      
      .welcome-screen__btn {
        width: 100%;
      }
    }
    
    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .welcome-screen__logo {
        animation: none;
      }
      
      .welcome-screen__feature:hover {
        transform: none;
      }
      
      .welcome-screen__btn:hover {
        transform: none;
      }
    }
  `;
  
  document.head.appendChild(style);
}
