/**
 * Registry DevTool Deck Factory
 * DeckType: registry-devtool-deck
 * 
 * Provides a UI for inspecting loaded packs, registered entities,
 * and registry health. Useful for debugging extension loading and ID conflicts.
 */

import type { DeckFactory, DeckInstance } from '../factory-types.js';
import type { DeckId } from '../../types.js';
import { getLoadedPacks, getAllRegisteredEntities, type PackInfo } from '../../../extensions/registry.js';
import { getPortTypeRegistry } from '../../../cards/card.js';
import { getEventKindRegistry } from '../../../types/event-kind.js';
import { getAllTheoryCards } from '../../../ai/theory/theory-card-registry.js';
import { getDeckTemplateRegistry } from '../../../ai/theory/deck-templates.js';
import { getOntologyRegistry } from '../../../ai/theory/ontologies/index.js';

export const registryDevtoolDeckFactory: DeckFactory = {
  deckType: 'registry-devtool-deck',
  
  create(deckDef): DeckInstance {
    const container = document.createElement('div');
    container.className = 'registry-devtool-deck';
    container.style.cssText = 'padding: 1rem; overflow-y: auto; font-family: monospace; font-size: 0.875rem;';
    
    renderRegistryDevtool(container);
    
    return {
      id: deckDef.id as DeckId,
      type: deckDef.type,
      title: 'Registry DevTool',
      ...(deckDef.panelId !== undefined && { panelId: deckDef.panelId }),
      render: () => container,
      destroy: () => {
        container.remove();
      }
    };
  }
};

function renderRegistryDevtool(container: HTMLElement): void {
  const packs = getLoadedPacks();
  const entities = getAllRegisteredEntities();
  const portTypes = getPortTypeRegistry();
  const eventKinds = getEventKindRegistry();
  const theoryCards = getAllTheoryCards();
  const deckTemplates = getDeckTemplateRegistry();
  const ontologies = getOntologyRegistry();
  
  container.innerHTML = '';
  
  // Header
  const header = document.createElement('h2');
  header.textContent = 'Registry DevTool';
  header.style.cssText = 'margin: 0 0 1rem 0; font-size: 1.25rem;';
  container.appendChild(header);
  
  // Packs section
  const packsSection = createSection('Loaded Packs', packs.length.toString());
  packs.forEach((pack: PackInfo) => {
    const packDiv = document.createElement('div');
    packDiv.style.cssText = 'margin: 0.5rem 0; padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 4px;';
    packDiv.innerHTML = `
      <strong>${pack.name}</strong> (v${pack.version || '0.0.0'})
      <br>Namespace: <code>${pack.namespace}</code>
      ${pack.capabilities ? `<br>Capabilities: ${pack.capabilities.join(', ')}` : ''}
      ${pack.author ? `<br>Author: ${pack.author}` : ''}
    `;
    packsSection.appendChild(packDiv);
  });
  container.appendChild(packsSection);
  
  // Entities section
  const entitiesSection = createSection('Registered Entities', entities.length.toString());
  const groupedEntities = groupBy(entities, e => e.type);
  Object.entries(groupedEntities).forEach(([type, items]) => {
    const typeDiv = document.createElement('div');
    typeDiv.style.cssText = 'margin: 0.5rem 0;';
    typeDiv.innerHTML = `<strong>${type}:</strong> ${items.length}`;
    
    const itemsList = document.createElement('ul');
    itemsList.style.cssText = 'margin: 0.25rem 0 0 1rem; padding: 0; list-style: none;';
    items.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `• ${item.id}`;
      if (item.namespace) {
        li.innerHTML += ` <em>(${item.namespace})</em>`;
      }
      itemsList.appendChild(li);
    });
    typeDiv.appendChild(itemsList);
    entitiesSection.appendChild(typeDiv);
  });
  container.appendChild(entitiesSection);
  
  // Port Types section
  const portTypesSection = createSection('Port Types', Object.keys(portTypes).length.toString());
  Object.entries(portTypes).forEach(([id, meta]) => {
    const portDiv = document.createElement('div');
    portDiv.style.cssText = 'margin: 0.25rem 0; padding: 0.25rem; background: rgba(255,255,255,0.05);';
    portDiv.innerHTML = `<code>${id}</code>`;
    if ((meta as any).displayName) {
      portDiv.innerHTML += ` — ${(meta as any).displayName}`;
    }
    portTypesSection.appendChild(portDiv);
  });
  container.appendChild(portTypesSection);
  
  // Event Kinds section
  const eventKindsSection = createSection('Event Kinds', Object.keys(eventKinds).length.toString());
  Object.keys(eventKinds).forEach(kind => {
    const kindDiv = document.createElement('div');
    kindDiv.style.cssText = 'margin: 0.25rem 0;';
    kindDiv.innerHTML = `<code>${kind}</code>`;
    eventKindsSection.appendChild(kindDiv);
  });
  container.appendChild(eventKindsSection);
  
  // Theory Cards section
  const theoryCardsSection = createSection('Theory Cards', theoryCards.length.toString());
  theoryCards.forEach((card: any) => {
    const cardDiv = document.createElement('div');
    cardDiv.style.cssText = 'margin: 0.25rem 0;';
    cardDiv.innerHTML = `<code>${card.id}</code> — ${card.name}`;
    theoryCardsSection.appendChild(cardDiv);
  });
  container.appendChild(theoryCardsSection);
  
  // Deck Templates section
  const templatesSection = createSection('Deck Templates', deckTemplates.length.toString());
  deckTemplates.forEach((template: any) => {
    const templateDiv = document.createElement('div');
    templateDiv.style.cssText = 'margin: 0.25rem 0;';
    templateDiv.innerHTML = `<code>${template.id}</code> — ${template.name}`;
    templatesSection.appendChild(templateDiv);
  });
  container.appendChild(templatesSection);
  
  // Ontologies section
  const ontologiesSection = createSection('Ontology Packs', ontologies.length.toString());
  ontologies.forEach((ont: any) => {
    const ontDiv = document.createElement('div');
    ontDiv.style.cssText = 'margin: 0.25rem 0;';
    ontDiv.innerHTML = `<code>${ont.id}</code> — ${ont.name}`;
    ontologiesSection.appendChild(ontDiv);
  });
  container.appendChild(ontologiesSection);
}

function createSection(title: string, count: string): HTMLElement {
  const section = document.createElement('div');
  section.style.cssText = 'margin: 1.5rem 0; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 8px;';
  
  const header = document.createElement('h3');
  header.style.cssText = 'margin: 0 0 0.5rem 0; font-size: 1rem;';
  header.innerHTML = `${title} <span style="color: #888;">(${count})</span>`;
  section.appendChild(header);
  
  return section;
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  items.forEach(item => {
    const key = keyFn(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return groups;
}
