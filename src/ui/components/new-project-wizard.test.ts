/**
 * Tests for New Project Wizard
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NewProjectWizard, openNewProjectWizard } from './new-project-wizard';
import { JSDOM } from 'jsdom';

describe('NewProjectWizard', () => {
  let dom: JSDOM;
  let container: HTMLElement;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.document = dom.window.document as unknown as Document;
    global.HTMLElement = dom.window.HTMLElement as typeof HTMLElement;
    
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    vi.restoreAllMocks();
  });

  it('should create wizard with persona selection as first step', () => {
    const wizard = new NewProjectWizard();
    wizard.mount(container);

    const wizardElement = container.querySelector('.new-project-wizard');
    expect(wizardElement).toBeTruthy();
    
    const personaGrid = container.querySelector('.persona-grid');
    expect(personaGrid).toBeTruthy();
    
    wizard.destroy();
  });

  it('should show persona cards with correct data', () => {
    const wizard = new NewProjectWizard();
    wizard.mount(container);

    const personaCards = container.querySelectorAll('.persona-card');
    expect(personaCards.length).toBeGreaterThan(0);
    
    // Check first card has expected structure
    const firstCard = personaCards[0];
    expect(firstCard.querySelector('.persona-icon')).toBeTruthy();
    expect(firstCard.querySelector('h3')).toBeTruthy();
    expect(firstCard.querySelector('p')).toBeTruthy();
    
    wizard.destroy();
  });

  it('should advance to template selection when persona is selected', () => {
    const wizard = new NewProjectWizard();
    wizard.mount(container);

    // Find and click first persona card
    const personaCard = container.querySelector('.persona-card') as HTMLButtonElement;
    expect(personaCard).toBeTruthy();
    
    personaCard.click();

    // Should now show template selection
    const templateGrid = container.querySelector('.template-grid');
    expect(templateGrid).toBeTruthy();
    
    wizard.destroy();
  });

  it('should show blank project option in template selection', () => {
    const wizard = new NewProjectWizard();
    wizard.mount(container);

    // Select persona
    const personaCard = container.querySelector('.persona-card') as HTMLButtonElement;
    personaCard.click();

    // Check for blank option
    const blankOption = container.querySelector('.template-card.blank');
    expect(blankOption).toBeTruthy();
    expect(blankOption?.textContent).toContain('Blank Project');
    
    wizard.destroy();
  });

  it('should advance to tutorial step when template is selected', () => {
    const wizard = new NewProjectWizard();
    wizard.mount(container);

    // Select persona
    const personaCard = container.querySelector('.persona-card') as HTMLButtonElement;
    personaCard.click();

    // Select blank template
    const blankOption = container.querySelector('.template-card.blank') as HTMLButtonElement;
    blankOption.click();

    // Should show tutorial option
    const tutorialToggle = container.querySelector('.tutorial-toggle');
    expect(tutorialToggle).toBeTruthy();
    
    wizard.destroy();
  });

  it('should show back button on template and tutorial steps', () => {
    const wizard = new NewProjectWizard();
    wizard.mount(container);

    // Persona step - no back button
    let backBtn = container.querySelector('.wizard-nav button') as HTMLButtonElement;
    expect(backBtn?.textContent).not.toBe('Back');

    // Template step - has back button
    const personaCard = container.querySelector('.persona-card') as HTMLButtonElement;
    personaCard.click();
    
    backBtn = Array.from(container.querySelectorAll('.wizard-nav button'))
      .find(btn => btn.textContent === 'Back') as HTMLButtonElement;
    expect(backBtn).toBeTruthy();
    
    wizard.destroy();
  });

  it('should navigate back through wizard steps', () => {
    const wizard = new NewProjectWizard();
    wizard.mount(container);

    // Go forward
    const personaCard = container.querySelector('.persona-card') as HTMLButtonElement;
    personaCard.click();
    
    const blankOption = container.querySelector('.template-card.blank') as HTMLButtonElement;
    blankOption.click();

    // Go back to template
    let backBtn = Array.from(container.querySelectorAll('.wizard-nav button'))
      .find(btn => btn.textContent === 'Back') as HTMLButtonElement;
    backBtn.click();
    
    expect(container.querySelector('.template-grid')).toBeTruthy();

    // Go back to persona
    backBtn = Array.from(container.querySelectorAll('.wizard-nav button'))
      .find(btn => btn.textContent === 'Back') as HTMLButtonElement;
    backBtn.click();
    
    expect(container.querySelector('.persona-grid')).toBeTruthy();
    
    wizard.destroy();
  });

  it('should call onComplete when project is created', () => {
    const onComplete = vi.fn();
    const wizard = new NewProjectWizard({ onComplete });
    wizard.mount(container);

    // Navigate to end
    const personaCard = container.querySelector('.persona-card') as HTMLButtonElement;
    personaCard.click();
    
    const blankOption = container.querySelector('.template-card.blank') as HTMLButtonElement;
    blankOption.click();

    // Create project
    const createBtn = Array.from(container.querySelectorAll('.wizard-nav button'))
      .find(btn => btn.textContent === 'Create Project') as HTMLButtonElement;
    createBtn.click();

    expect(onComplete).toHaveBeenCalled();
  });

  it('should call onCancel when cancel is clicked', () => {
    const onCancel = vi.fn();
    const wizard = new NewProjectWizard({ onCancel });
    wizard.mount(container);

    const cancelBtn = Array.from(container.querySelectorAll('.wizard-nav button'))
      .find(btn => btn.textContent === 'Cancel') as HTMLButtonElement;
    cancelBtn.click();

    expect(onCancel).toHaveBeenCalled();
  });

  it('should toggle tutorial checkbox', () => {
    const wizard = new NewProjectWizard();
    wizard.mount(container);

    // Navigate to tutorial step
    const personaCard = container.querySelector('.persona-card') as HTMLButtonElement;
    personaCard.click();
    
    const blankOption = container.querySelector('.template-card.blank') as HTMLButtonElement;
    blankOption.click();

    // Toggle tutorial
    const checkbox = container.querySelector('.tutorial-toggle input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
    
    checkbox.click();
    expect(checkbox.checked).toBe(true);
    
    wizard.destroy();
  });

  it('should inject styles only once', () => {
    const wizard1 = new NewProjectWizard();
    wizard1.mount(container);

    const stylesBefore = document.querySelectorAll('#new-project-wizard-styles').length;
    
    const wizard2 = new NewProjectWizard();
    const container2 = document.createElement('div');
    document.body.appendChild(container2);
    wizard2.mount(container2);

    const stylesAfter = document.querySelectorAll('#new-project-wizard-styles').length;
    expect(stylesAfter).toBe(stylesBefore);
    
    wizard1.destroy();
    wizard2.destroy();
    container2.remove();
  });
});

describe('openNewProjectWizard', () => {
  let dom: JSDOM;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.document = dom.window.document as unknown as Document;
    global.HTMLElement = dom.window.HTMLElement as typeof HTMLElement;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create overlay and mount wizard', () => {
    const wizard = openNewProjectWizard();

    const overlay = document.querySelector('.wizard-overlay');
    expect(overlay).toBeTruthy();
    
    const wizardElement = document.querySelector('.new-project-wizard');
    expect(wizardElement).toBeTruthy();
    
    wizard.destroy();
  });

  it('should remove overlay when wizard is cancelled', () => {
    const onCancel = vi.fn();
    const wizard = openNewProjectWizard({ onCancel });

    const cancelBtn = Array.from(document.querySelectorAll('.wizard-nav button'))
      .find(btn => btn.textContent === 'Cancel') as HTMLButtonElement;
    cancelBtn?.click();

    const overlay = document.querySelector('.wizard-overlay');
    expect(overlay).toBeFalsy();
    expect(onCancel).toHaveBeenCalled();
  });

  it('should remove overlay when project is created', () => {
    const onComplete = vi.fn();
    const wizard = openNewProjectWizard({ onComplete });

    // Navigate to end and create
    const personaCard = document.querySelector('.persona-card') as HTMLButtonElement;
    personaCard?.click();
    
    const blankOption = document.querySelector('.template-card.blank') as HTMLButtonElement;
    blankOption?.click();

    const createBtn = Array.from(document.querySelectorAll('.wizard-nav button'))
      .find(btn => btn.textContent === 'Create Project') as HTMLButtonElement;
    createBtn?.click();

    const overlay = document.querySelector('.wizard-overlay');
    expect(overlay).toBeFalsy();
    expect(onComplete).toHaveBeenCalled();
  });
});
