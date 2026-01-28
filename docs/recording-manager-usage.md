# Recording Manager Usage Guide

This document explains how to ensure cards work correctly in both real-time playback and recording modes.

## Overview

Cards in the cardplay system can work in two main modes:

1. **Playback Mode**: Real-time audio/MIDI output for immediate listening
2. **Recording Mode**: Capture events for viewing in editors (tracker, notation, piano roll)

The Recording Manager provides utilities to handle both modes seamlessly.

## Core Concept

The Transport state contains a `recording` boolean that indicates whether recording is active:

\`\`\`typescript
interface Transport {
  readonly playing: boolean;
  readonly recording: boolean;  // <-- Indicates recording mode
  readonly tempo: number;
  readonly timeSignature: readonly [number, number];
  readonly looping: boolean;
  readonly loopStart?: Tick;
  readonly loopEnd?: Tick;
}
\`\`\`

## Card Output Requirements

For a card to support recording, it must output Events (not just audio). Typical card outputs:

\`\`\`typescript
const signature = {
  inputs: [
    { name: 'midi', type: PortTypes.MIDI },
  ],
  outputs: [
    { name: 'audio', type: PortTypes.AUDIO },     // For real-time listening
    { name: 'notes', type: PortTypes.NOTES },     // For recording to editors
  ],
};
\`\`\`

## Using the Recording Manager

### 1. Check Recording State

\`\`\`typescript
import { shouldCaptureEvents, shouldOutputRealtime } from '@cardplay/core/cards';

function processCard(input: Input, context: CardContext): CardResult<Output> {
  const recording = shouldCaptureEvents(context);
  const realtime = shouldOutputRealtime(context, 'both');
  
  // Generate events
  const events = generateEvents(input, context);
  
  // Output based on mode
  return {
    output: {
      audio: realtime ? renderAudio(events) : undefined,
      notes: recording ? events : undefined,
    },
  };
}
\`\`\`

### 2. Use Output Routing

The `routeOutput` helper automatically routes outputs based on mode:

\`\`\`typescript
import { routeOutput } from '@cardplay/core/cards';

function processCard(input: Input, context: CardContext): CardResult<Output> {
  const events = generateEvents(input);
  const audio = renderAudio(events);
  
  const routed = routeOutput(
    { audio, notes: events },
    context,
    'both'  // Supports both playback and recording
  );
  
  return {
    output: {
      audio: routed.realtime?.audio,
      notes: routed.recorded?.notes,
    },
  };
}
\`\`\`

### 3. Recording Buffers

For long-term event capture:

\`\`\`typescript
import { 
  createRecordingState,
  startRecordingBuffer,
  recordEvent,
  bufferToStream,
} from '@cardplay/core/cards';

// Initialize recording state
let recordingState = createRecordingState();

// Start recording
recordingState = startRecordingBuffer(recordingState, 'take-1');

// During processing, capture events
const event = createEvent(...);
recordingState = recordEvent(recordingState, 'take-1', event, cardId);

// When done, convert to stream for export
const stream = bufferToStream(getBuffer(recordingState, 'take-1')!);
\`\`\`

## Recording Modes

Three recording modes are supported:

\`\`\`typescript
type RecordingMode = 
  | 'playback'   // Real-time audio/MIDI only (no event capture)
  | 'recording'  // Capture events only (skip audio for efficiency)
  | 'both';      // Both real-time and capture (overdubbing)
\`\`\`

### Mode Selection Guidelines

- **playback**: Use for performance-critical scenarios where event capture isn't needed
- **recording**: Use when recording without monitoring (saves CPU)
- **both**: Use for overdubbing where you need to hear while recording

## Validating Card Support

Check if a card properly supports recording:

\`\`\`typescript
import { checkRecordingSupport } from '@cardplay/core/cards';

const support = checkRecordingSupport(cardSignature);

if (support.outputsEvents) {
  console.log('Card supports recording!');
  console.log('Supported modes:', support.supportedModes);
} else {
  console.log('Card is playback-only');
}
\`\`\`

## Complete Example: Drum Machine Card

\`\`\`typescript
import {
  createCard,
  shouldCaptureEvents,
  shouldOutputRealtime,
  type Card,
  type CardContext,
} from '@cardplay/core/cards';

interface DrumMachineOutput {
  readonly audio?: Float32Array[];
  readonly notes?: Event<NotePayload>[];
  readonly trigger?: boolean;
}

export function createDrumMachineCard(): Card<DrumMachineInput, DrumMachineOutput> {
  return createCard({
    meta: { id: 'drum-machine', name: 'Drum Machine', category: 'generators' },
    signature: {
      inputs: [
        { name: 'clock', type: PortTypes.TRIGGER },
      ],
      outputs: [
        { name: 'audio', type: PortTypes.AUDIO },
        { name: 'notes', type: PortTypes.NOTES },    // <-- Enables recording
        { name: 'trigger', type: PortTypes.TRIGGER },
      ],
      params: [],
    },
    process: (input, context) => {
      // Generate events on clock trigger
      const events = input.trigger ? generateDrumEvents(context) : [];
      
      // Determine output based on recording state
      const captureEvents = shouldCaptureEvents(context);
      const outputRealtime = shouldOutputRealtime(context, 'both');
      
      const output: DrumMachineOutput = {
        audio: outputRealtime ? renderDrumAudio(events) : undefined,
        notes: captureEvents ? events : undefined,
        trigger: input.trigger,
      };
      
      return { output };
    },
  });
}
\`\`\`

## Best Practices

1. **Always output events when recording**: Even if audio is playing, capture events
2. **Use typed outputs**: Separate `audio` and `notes` outputs clearly
3. **Test both modes**: Ensure cards work in playback and recording
4. **Document behavior**: Clarify what gets captured vs. played
5. **Preserve timing**: Record events with accurate `start` and `duration`
6. **Add source metadata**: Include `sourceCardId` for event lineage

## Testing

Test both modes explicitly:

\`\`\`typescript
import { describe, it, expect } from 'vitest';
import { createCardContext } from '@cardplay/core/cards';

describe('MyCard', () => {
  it('outputs audio in playback mode', () => {
    const context = createCardContext(0, {
      playing: true,
      recording: false,  // <-- Playback mode
      tempo: 120,
      timeSignature: [4, 4],
      looping: false,
    }, engine);
    
    const result = card.process(input, context);
    expect(result.output.audio).toBeDefined();
    expect(result.output.notes).toBeUndefined();
  });
  
  it('captures events in recording mode', () => {
    const context = createCardContext(0, {
      playing: true,
      recording: true,  // <-- Recording mode
      tempo: 120,
      timeSignature: [4, 4],
      looping: false,
    }, engine);
    
    const result = card.process(input, context);
    expect(result.output.notes).toBeDefined();
    expect(result.output.notes).toHaveLength(expectedCount);
  });
});
\`\`\`

## Viewing Recorded Events

Once events are captured, they can be viewed in any editor:

- **Tracker**: Grid-based step sequencer view
- **Piano Roll**: Graphical note editor with pitch/time
- **Notation**: Traditional music notation
- **Automation**: Continuous control curves

All editors work with the same Event stream, ensuring consistency.

## Summary

- Cards output **both audio and events**
- Use `context.transport.recording` to detect mode
- Use Recording Manager helpers for routing
- Test both playback and recording modes
- Ensure events have proper timing and metadata
