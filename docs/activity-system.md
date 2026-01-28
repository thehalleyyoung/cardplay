# Activity System
Assumes canonical model and terminology in `cardplay2.md` (repo root).

The Activity System provides guided, interactive learning experiences for beginners in Cardplay. Activities are genre-specific workflows that teach users how to create beats, chord progressions, and basslines through a structured, validated approach.

## Overview

An **Activity** is a guided workflow that:
- Loads a pre-configured starter deck (cards + stacks)
- Provides step-by-step hints tailored to the genre
- Validates user progress automatically
- Teaches musical concepts through hands-on creation

## Architecture

The Activity System consists of three core components:

1. **Activity Runner** (`activity-runner.ts`): Manages the lifecycle of an activity session
2. **Deck Loader** (`deck-loader.ts`): Loads and validates activity deck definitions
3. **Validation Engine** (`validation-engine.ts`): Validates user progress against activity requirements

## Activity Deck Schema

An Activity Deck is a JSON object that defines a complete guided workflow:

```typescript
interface ActivityDeck {
  // Unique identifier (e.g., "activity-beat-lofi-hiphop")
  id: string;

  // Human-readable genre name (e.g., "Lo-fi hip hop")
  genre: string;

  // Type of activity: 'beat', 'chord-progression', or 'bassline'
  activityType: 'beat' | 'chord-progression' | 'bassline';

  // Recommended tempo in BPM
  recommendedTempo: number;

  // Display name shown to user
  name: string;

  // Description of what the activity teaches
  description: string;

  // Cards to instantiate when starting the activity (Card<A,B> morphisms — see cardplay2.md §2.1)
  starterCards: Array<{
    id: string;           // Card instance ID
    type: string;         // Card type (e.g., 'DrumMachine', 'Instrument')
    name: string;         // Display name
    params: Record<string, any>;  // Card parameters (CardDefinition params)
  }>;

  // Stacks that connect the starter cards
  starterStacks: Array<{
    id: string;           // Stack ID
    cardIds: string[];    // Card IDs to include in the stack
    behavior: 'layer' | 'serial' | 'parallel';  // Stack composition mode
  }>;

  // Hints displayed to guide the user
  hints: string[];

  // Validation steps that track progress
  validationSteps: Array<{
    description: string;  // What the user should accomplish
    check: string;        // Name of validation check to run
  }>;
}
```

## Example Activity Deck

Here's a complete example for a Lo-fi hip hop beat activity:

```json
{
  "id": "activity-beat-lofi-hiphop",
  "genre": "Lo-fi hip hop",
  "activityType": "beat",
  "recommendedTempo": 85,
  "name": "Make a beat (Lo-fi hip hop)",
  "description": "Create a Lo-fi hip hop beat with characteristic patterns and timing",
  "starterCards": [
    {
      "id": "drum-card",
      "type": "DrumMachine",
      "name": "Drum Machine",
      "params": {
        "preset": "lofi-hiphop",
        "tempo": 85
      }
    },
    {
      "id": "mixer-card",
      "type": "Mixer",
      "name": "Mixer",
      "params": {
        "gain": 0.8
      }
    },
    {
      "id": "out-card",
      "type": "AudioOut",
      "name": "Audio Out",
      "params": {}
    }
  ],
  "starterStacks": [
    {
      "id": "stack-beat-lofi-hiphop",
      "cardIds": ["drum-card", "mixer-card", "out-card"],
      "behavior": "serial"
    }
  ],
  "hints": [
    "Lo-fi hip hop beats are typically around 85 BPM",
    "Key characteristics: laid-back, dusty, vintage samples",
    "Start with a basic kick pattern and add layers",
    "Use the pads panel to record your beat"
  ],
  "validationSteps": [
    {
      "description": "Create a clip with at least 4 events",
      "check": "clip-has-events"
    },
    {
      "description": "Set tempo to recommended BPM",
      "check": "tempo-matches"
    },
    {
      "description": "Play the beat and verify timing",
      "check": "playback-works"
    }
  ]
}
```

## Usage

### Starting an Activity

```typescript
import { activityRegistry, activityRunner } from './ui/activities';

// Load an activity from the registry
const activity = activityRegistry.getActivity('activity-beat-lofi-hiphop');

if (activity) {
  // Start running the activity
  const runState = activityRunner.startActivity(activity);
  
  console.log('Activity started:', runState.activityId);
  console.log('Current step:', runState.currentStep);
}
```

### Validating Progress

```typescript
import { validationEngine } from './ui/activities';
import { store } from './state/store';

// Get current project state
const project = store.getState().project;

// Validate a specific step
const result = validationEngine.validateStep(project, activity, 0);

if (result.passed) {
  console.log('Step completed:', result.message);
  activityRunner.completeStep(0);
} else {
  console.log('Step incomplete:', result.message);
}

// Validate all steps
const allResults = validationEngine.validateAll(project, activity);
console.log('Progress:', allResults.filter(r => r.passed).length, '/', allResults.length);
```

### Recording User Actions

```typescript
// Record when user creates a clip
activityRunner.recordAction('create-clip', { clipId: 'clip-001' });

// Record when user plays
activityRunner.recordAction('play');

// Record when user adjusts tempo
activityRunner.recordAction('set-tempo', { tempo: 85 });
```

### Persisting Activity State

```typescript
// Serialize for localStorage
const serialized = activityRunner.serialize();
if (serialized) {
  localStorage.setItem('activity-state', serialized);
}

// Restore from localStorage
const saved = localStorage.getItem('activity-state');
if (saved) {
  activityRunner.deserialize(saved, activity);
}
```

## Built-in Validation Checks

The validation engine includes these built-in checks:

### `clip-has-events`
Validates that the project has at least one clip with 4+ events.

### `tempo-matches`
Validates that the project tempo is within ±5 BPM of the recommended tempo.

### `playback-works`
Validates that the project has clips with events and is ready for playback.

### `has-chord-events`
Validates that the project has at least 3 chord or note events.

### `chord-variety`
Validates that at least 3 different pitches are used in chord events.

## Custom Validation Checks

You can register custom validation checks:

```typescript
validationEngine.registerCheck('custom-check', (project, activity, stepIndex) => {
  // Your validation logic here
  const passed = /* ... */;
  
  return {
    stepIndex,
    passed,
    message: passed ? 'Success!' : 'Try again',
    evidence: { /* optional debugging data */ }
  };
});
```

## Loading Custom Decks

```typescript
import { deckLoader } from './ui/activities';

// Load from JSON file
const json = await fetch('/decks/my-custom-deck.json').then(r => r.text());
const result = deckLoader.loadFromJSON(json);

if (result.success && result.deck) {
  activityRunner.startActivity(result.deck);
} else {
  console.error('Failed to load deck:', result.error);
}
```

## Genre Coverage

The Activity System currently supports 36 genres × 3 activity types = 108 activities:

- **Electronic**: Liquid DnB, Jungle, Breakbeat, Garage, UKG, Dubstep, Future bass, IDM, Electro, Techno, House, etc.
- **Hip-hop/Urban**: Lo-fi hip hop, Boom bap, Trap, UK drill
- **Retro**: Synthwave, Vaporwave, Chiptune, Disco
- **Ambient/Chill**: Ambient, Downtempo, Trip hop
- **Live/Organic**: Rock, Metal, Punk, Funk, Pop, Indie pop
- **World/Regional**: Reggae, Dub, Ska, Afrobeat, Amapiano, Latin, Reggaeton, Salsa, Bossa nova

Each genre includes:
- Beat creation activity
- Chord progression activity
- Bassline creation activity

## Implementation Notes

- All activities are **deterministic** and **testable**
- Validation is **pure** (no side effects)
- Activity state is **serializable** for persistence
- The system is **extensible** (custom checks, custom decks)
- Activities are **framework-agnostic** (core logic separate from UI)

## Future Enhancements

- Activity templates (users can create and share custom activities)
- Multi-step progression (activity chains)
- Collaborative activities (multiple users)
- Real-time feedback (audio analysis)
- Adaptive difficulty (based on user performance)
- Activity marketplace (community-contributed activities)
