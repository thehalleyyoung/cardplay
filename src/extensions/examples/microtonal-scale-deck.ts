/**
 * @fileoverview Example Extension: Microtonal Scale Explorer Deck
 * 
 * Demonstrates how to create a custom deck extension with Prolog integration
 * for exploring and visualizing microtonal scales.
 * 
 * @module @cardplay/extensions/examples/scale-deck
 */

import type {
  ExtensionModule,
  ExtensionContext,
  DeckExtensionDefinition,
  DeckExtensionInstance,
  PrologExtensionDefinition
} from '../types';

// ============================================================================
// MICROTONAL SCALE DEFINITIONS
// ============================================================================

interface Scale {
  readonly name: string;
  readonly pitches: readonly number[]; // Cents from root
  readonly description: string;
}

const MICROTONAL_SCALES: readonly Scale[] = [
  {
    name: '31-TET',
    pitches: [0, 39, 77, 116, 155, 194, 232, 271, 310, 348, 387, 426, 465],
    description: '31-tone equal temperament (31-TET), excellent for meantone tuning'
  },
  {
    name: '22-Shruti',
    pitches: [0, 90, 112, 204, 294, 316, 408, 498, 590, 610, 702, 792, 814, 906, 996, 1018, 1110],
    description: 'Indian classical 22-shruti scale with subtle microtonal inflections'
  },
  {
    name: 'Bohlen-Pierce',
    pitches: [0, 146, 293, 439, 586, 732, 878, 1025, 1171, 1317, 1463, 1610, 1756],
    description: 'Bohlen-Pierce scale with 13 steps per tritave (3:1 ratio)'
  },
  {
    name: 'Carlos Alpha',
    pitches: [0, 78, 156, 234, 312, 390, 468, 546, 624, 702, 780, 858, 936, 1014, 1092],
    description: 'Wendy Carlos\'s Alpha scale (15.385 steps per octave)'
  }
];

// ============================================================================
// DECK UI
// ============================================================================

/**
 * Creates the scale explorer deck UI.
 */
function createScaleDeckUI(container: HTMLElement, selectedScale: Scale): DeckExtensionInstance {
  // Clear container
  container.innerHTML = '';
  container.style.cssText = `
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    background: var(--surface-color, #1a1a1a);
    color: var(--text-color, #ffffff);
    font-family: var(--font-family, system-ui);
  `;

  // Create header
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-color, #333);
  `;
  header.innerHTML = `
    <h3 style="margin: 0; font-size: 1.1rem;">Microtonal Scale Explorer</h3>
  `;
  container.appendChild(header);

  // Create scale selector
  const selector = document.createElement('select');
  selector.style.cssText = `
    padding: 0.5rem;
    background: var(--input-background, #2a2a2a);
    color: var(--text-color, #ffffff);
    border: 1px solid var(--border-color, #444);
    border-radius: 4px;
    font-size: 0.9rem;
  `;
  
  for (const scale of MICROTONAL_SCALES) {
    const option = document.createElement('option');
    option.value = scale.name;
    option.textContent = scale.name;
    option.selected = scale.name === selectedScale.name;
    selector.appendChild(option);
  }
  
  container.appendChild(selector);

  // Create description
  const description = document.createElement('p');
  description.style.cssText = `
    margin: 0;
    font-size: 0.9rem;
    color: var(--text-secondary, #aaa);
    line-height: 1.4;
  `;
  description.textContent = selectedScale.description;
  container.appendChild(description);

  // Create pitch visualization
  const visualization = document.createElement('div');
  visualization.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
  `;

  for (let i = 0; i < selectedScale.pitches.length; i++) {
    const cents = selectedScale.pitches[i];
    const pitch = document.createElement('div');
    pitch.style.cssText = `
      padding: 0.75rem;
      background: var(--accent-color, #4a9eff);
      border-radius: 4px;
      text-align: center;
      min-width: 60px;
      cursor: pointer;
      transition: transform 0.1s;
    `;
    pitch.innerHTML = `
      <div style="font-weight: bold; font-size: 0.9rem;">Step ${i}</div>
      <div style="font-size: 0.8rem; opacity: 0.8;">${cents}¢</div>
    `;
    
    pitch.addEventListener('mouseenter', () => {
      pitch.style.transform = 'scale(1.05)';
    });
    
    pitch.addEventListener('mouseleave', () => {
      pitch.style.transform = 'scale(1)';
    });
    
    pitch.addEventListener('click', () => {
      // Placeholder: play pitch
      console.log(`Playing pitch: ${cents} cents`);
    });
    
    visualization.appendChild(pitch);
  }

  container.appendChild(visualization);

  // Create info panel
  const info = document.createElement('div');
  info.style.cssText = `
    margin-top: 1rem;
    padding: 1rem;
    background: var(--surface-raised, #252525);
    border-radius: 4px;
    font-size: 0.85rem;
  `;
  info.innerHTML = `
    <div><strong>Total pitches:</strong> ${selectedScale.pitches.length}</div>
    <div><strong>Octave size:</strong> ${selectedScale.pitches[selectedScale.pitches.length - 1]} cents</div>
    <div style="margin-top: 0.5rem; color: var(--text-secondary, #aaa);">
      Click on any pitch to preview its sound
    </div>
  `;
  container.appendChild(info);

  // Instance methods
  let currentScale = selectedScale;

  const instance: DeckExtensionInstance = {
    destroy() {
      container.innerHTML = '';
    },
    update(config: any) {
      if (config.scale) {
        const newScale = MICROTONAL_SCALES.find(s => s.name === config.scale);
        if (newScale && newScale !== currentScale) {
          currentScale = newScale;
          createScaleDeckUI(container, newScale); // Re-render
        }
      }
    },
    resize(_width: number, _height: number) {
      // Adjust layout if needed
    }
  };

  // Wire up scale selector
  selector.addEventListener('change', () => {
    const newScale = MICROTONAL_SCALES.find(s => s.name === selector.value);
    if (newScale && instance.update) {
      instance.update({ scale: newScale.name });
    }
  });

  return instance;
}

// ============================================================================
// PROLOG PREDICATES
// ============================================================================

/**
 * Prolog predicates for microtonal scale reasoning.
 */
const prologPredicates: PrologExtensionDefinition = {
  predicates: [
    {
      name: 'microtonal_scale',
      arity: 2,
      description: 'Defines a microtonal scale with name and pitch list',
      handler: (name: string) => {
        const scale = MICROTONAL_SCALES.find(s => s.name === name);
        return scale ? [scale.pitches] : [];
      }
    },
    {
      name: 'scale_cents',
      arity: 3,
      description: 'Gets cents value for a given scale and pitch index',
      handler: (scaleName: string, index: number) => {
        const scale = MICROTONAL_SCALES.find(s => s.name === scaleName);
        if (scale && index >= 0 && index < scale.pitches.length) {
          return [[scale.pitches[index]]];
        }
        return [];
      }
    }
  ],
  rules: [
    'is_microtonal(Scale) :- microtonal_scale(Scale, _).',
    'scale_size(Scale, Size) :- microtonal_scale(Scale, Pitches), length(Pitches, Size).'
  ]
};

// ============================================================================
// EXTENSION DEFINITION
// ============================================================================

const scaleDefinition: DeckExtensionDefinition = {
  id: 'microtonal-scale-explorer',
  name: 'Microtonal Scale Explorer',
  description: 'Explore and visualize microtonal scales including 31-TET, Bohlen-Pierce, and Indian shruti',
  icon: '🎵',
  render: (container: HTMLElement, config: any) => {
    const defaultScale = MICROTONAL_SCALES[0];
    if (!defaultScale) {
      throw new Error('No microtonal scales defined');
    }
    
    let selectedScale: Scale = defaultScale;
    
    if (config?.scale) {
      const foundScale = MICROTONAL_SCALES.find(s => s.name === config.scale);
      if (foundScale) {
        selectedScale = foundScale;
      }
    }
    
    return createScaleDeckUI(container, selectedScale);
  }
};

// ============================================================================
// EXTENSION MODULE
// ============================================================================

const extension: ExtensionModule = {
  activate(context: ExtensionContext) {
    console.log(`Activating Microtonal Scale Explorer (${context.extensionId})`);

    // Register deck type
    if (context.cardplay.ui) {
      context.cardplay.ui.registerDeck('microtonal-scale-explorer', scaleDefinition);
    }

    // Register Prolog predicates
    if (context.cardplay.prolog) {
      for (const predicate of prologPredicates.predicates) {
        context.cardplay.prolog.addPredicate(
          predicate.name,
          predicate.arity,
          predicate.handler
        );
      }

      // Add rules
      if (prologPredicates.rules) {
        for (const rule of prologPredicates.rules) {
          context.cardplay.prolog.addRule(rule);
        }
      }
    }
  },

  deactivate() {
    console.log('Deactivating Microtonal Scale Explorer');
    // Clean up: unregister deck, remove Prolog predicates, etc.
  }
};

export default extension;

// ============================================================================
// MANIFEST
// ============================================================================

export const manifest = {
  id: 'com.cardplay.microtonal-scale-explorer',
  name: 'Microtonal Scale Explorer',
  version: '1.0.0',
  author: 'CardPlay Team',
  description: 'Explore microtonal scales with visual feedback and Prolog reasoning',
  category: 'deck',
  tags: ['microtonal', 'scale', 'tuning', '31-tet', 'bohlen-pierce', 'deck'],
  license: 'MIT',
  cardplayVersion: '>=1.0.0',
  permissions: ['ui-extension', 'prolog-kb'],
  entryPoint: 'index.js'
};
