/**
 * @fileoverview Tests for session recording functionality.
 * 
 * Tests loop recording, take recording, comping, performance capture,
 * and automation recording features.
 */

import { describe, it, expect } from 'vitest';
import {
  startLoopRecording,
  recordLoopIteration,
  startLayeredTakeRecording,
  recordTakeLayer,
  createCompingInterface,
  addCompSegment,
  selectTakeForComping,
  rankTake,
  mergeTakes,
  startPerformanceCapture,
  recordClipLaunch,
  endPerformanceCapture,
  performanceToArrangement,
  captureClipSequence,
  startAutomationRecording,
  recordAutomationPoint,
  createSessionGrid,
  setClipInSlot,
  type SessionRecordingState,
  type LoopRecordingConfig,
  type ClipLaunchEvent,
  type GridPosition,
} from './session-view';
import { asTick, asTickDuration } from '../types/primitives';
import { generateContainerId } from '../containers/container';

describe('Loop Recording', () => {
  it('should start loop recording with configuration', () => {
    const initialState: SessionRecordingState = {
      armed: true,
      armedTracks: new Set([0]),
      mode: 'replace',
      active: false,
      takes: [],
    };

    const config: LoopRecordingConfig = {
      loopStartTick: asTick(0),
      loopEndTick: asTick(3840),
      mode: 'overdub',
      currentLoopIndex: 0,
    };

    const result = startLoopRecording(initialState, config);

    expect(result.active).toBe(true);
    expect(result.mode).toBe('loop');
    expect(result.loopConfig).toEqual(config);
  });

  it('should throw error if no tracks armed', () => {
    const initialState: SessionRecordingState = {
      armed: false,
      armedTracks: new Set(),
      mode: 'replace',
      active: false,
      takes: [],
    };

    const config: LoopRecordingConfig = {
      loopStartTick: asTick(0),
      loopEndTick: asTick(3840),
      mode: 'overdub',
      currentLoopIndex: 0,
    };

    expect(() => startLoopRecording(initialState, config)).toThrow(
      'Cannot start loop recording: no tracks armed'
    );
  });

  it('should layer events in overdub mode', () => {
    const config: LoopRecordingConfig = {
      loopStartTick: asTick(0),
      loopEndTick: asTick(3840),
      mode: 'overdub',
      currentLoopIndex: 0,
    };

    const state: SessionRecordingState = {
      armed: true,
      armedTracks: new Set([0]),
      mode: 'loop',
      active: true,
      loopConfig: config,
      takes: [],
      currentTake: {
        id: generateContainerId(),
        trackIndex: 0,
        clipId: generateContainerId(),
        startTick: asTick(0),
        endTick: asTick(3840),
        events: [
          {
            id: 'event1',
            kind: 'note',
            start: asTick(0),
            duration: asTickDuration(960),
            payload: { pitch: 60, velocity: 100 },
          },
        ],
        timestamp: Date.now(),
        selected: false,
      },
    };

    const newEvents = [
      {
        id: 'event2',
        kind: 'note',
        start: asTick(960),
        duration: asTickDuration(960),
        payload: { pitch: 62, velocity: 100 },
      },
    ];

    const result = recordLoopIteration(state, asTick(3840), newEvents);

    expect(result.currentTake?.events).toHaveLength(2);
    expect(result.loopConfig?.currentLoopIndex).toBe(1);
  });

  it('should stop recording when max loops reached', () => {
    const config: LoopRecordingConfig = {
      loopStartTick: asTick(0),
      loopEndTick: asTick(3840),
      mode: 'overdub',
      maxLoops: 2,
      currentLoopIndex: 1,
    };

    const state: SessionRecordingState = {
      armed: true,
      armedTracks: new Set([0]),
      mode: 'loop',
      active: true,
      loopConfig: config,
      takes: [],
    };

    const result = recordLoopIteration(state, asTick(3840), []);

    expect(result.active).toBe(false);
  });
});

describe('Layered Take Recording', () => {
  it('should start layered take recording', () => {
    const initialState: SessionRecordingState = {
      armed: false,
      armedTracks: new Set(),
      mode: 'replace',
      active: false,
      takes: [],
    };

    const result = startLayeredTakeRecording(
      initialState,
      0,
      asTick(0),
      asTick(3840)
    );

    expect(result.active).toBe(true);
    expect(result.mode).toBe('take');
    expect(result.layeredTakeState?.trackIndex).toBe(0);
    expect(result.layeredTakeState?.activeLayer).toBe(0);
  });

  it('should record multiple layers', () => {
    const state: SessionRecordingState = {
      armed: true,
      armedTracks: new Set([0]),
      mode: 'take',
      active: true,
      takes: [],
      layeredTakeState: {
        trackIndex: 0,
        startTick: asTick(0),
        endTick: asTick(3840),
        takes: [],
        activeLayer: 0,
      },
    };

    const events1 = [
      {
        id: 'event1',
        kind: 'note',
        start: asTick(0),
        duration: asTickDuration(960),
        payload: { pitch: 60, velocity: 100 },
      },
    ];

    const result1 = recordTakeLayer(state, events1);
    expect(result1.layeredTakeState?.takes).toHaveLength(1);
    expect(result1.layeredTakeState?.activeLayer).toBe(1);

    const events2 = [
      {
        id: 'event2',
        kind: 'note',
        start: asTick(960),
        duration: asTickDuration(960),
        payload: { pitch: 62, velocity: 100 },
      },
    ];

    const result2 = recordTakeLayer(result1, events2);
    expect(result2.layeredTakeState?.takes).toHaveLength(2);
    expect(result2.layeredTakeState?.activeLayer).toBe(2);
  });

  it('should throw error if not in layered take mode', () => {
    const state: SessionRecordingState = {
      armed: true,
      armedTracks: new Set([0]),
      mode: 'replace',
      active: true,
      takes: [],
    };

    expect(() => recordTakeLayer(state, [])).toThrow(
      'Cannot record take layer: not in layered take mode'
    );
  });
});

describe('Comping Interface', () => {
  it('should create comping interface', () => {
    const takes = [
      {
        id: 'take1',
        trackIndex: 0,
        clipId: generateContainerId(),
        startTick: asTick(0),
        endTick: asTick(3840),
        events: [],
        timestamp: Date.now(),
        selected: false,
      },
      {
        id: 'take2',
        trackIndex: 0,
        clipId: generateContainerId(),
        startTick: asTick(0),
        endTick: asTick(3840),
        events: [],
        timestamp: Date.now(),
        selected: false,
      },
    ];

    const result = createCompingInterface(takes, 0, asTick(0), asTick(3840));

    expect(result.takes).toHaveLength(2);
    expect(result.trackIndex).toBe(0);
    expect(result.comp).toHaveLength(0);
  });

  it('should add segment to comp', () => {
    const take1Events = [
      {
        id: 'event1',
        kind: 'note',
        start: asTick(0),
        duration: asTickDuration(960),
        payload: { pitch: 60, velocity: 100 },
      },
      {
        id: 'event2',
        kind: 'note',
        start: asTick(960),
        duration: asTickDuration(960),
        payload: { pitch: 62, velocity: 100 },
      },
    ];

    const takes = [
      {
        id: 'take1',
        trackIndex: 0,
        clipId: generateContainerId(),
        startTick: asTick(0),
        endTick: asTick(3840),
        events: take1Events,
        timestamp: Date.now(),
        selected: false,
      },
    ];

    const compState = createCompingInterface(takes, 0, asTick(0), asTick(3840));
    const result = addCompSegment(compState, 'take1', asTick(0), asTick(1920));

    expect(result.comp).toHaveLength(1);
    expect(result.comp[0]!.takeId).toBe('take1');
    expect(result.comp[0]!.events).toHaveLength(2);
  });

  it('should throw error for unknown take', () => {
    const compState = createCompingInterface([], 0, asTick(0), asTick(3840));

    expect(() => addCompSegment(compState, 'unknown', asTick(0), asTick(1920))).toThrow(
      'Take unknown not found'
    );
  });
});

describe('Take Selection and Ranking', () => {
  it('should select take for comping', () => {
    const state: SessionRecordingState = {
      armed: false,
      armedTracks: new Set(),
      mode: 'replace',
      active: false,
      takes: [
        {
          id: 'take1',
          trackIndex: 0,
          clipId: generateContainerId(),
          startTick: asTick(0),
          endTick: asTick(3840),
          events: [],
          timestamp: Date.now(),
          selected: false,
        },
        {
          id: 'take2',
          trackIndex: 0,
          clipId: generateContainerId(),
          startTick: asTick(0),
          endTick: asTick(3840),
          events: [],
          timestamp: Date.now(),
          selected: false,
        },
      ],
    };

    const result = selectTakeForComping(state, 'take2');

    expect(result.takes[0]!.selected).toBe(false);
    expect(result.takes[1]!.selected).toBe(true);
  });

  it('should rank take', () => {
    const state: SessionRecordingState = {
      armed: false,
      armedTracks: new Set(),
      mode: 'replace',
      active: false,
      takes: [
        {
          id: 'take1',
          trackIndex: 0,
          clipId: generateContainerId(),
          startTick: asTick(0),
          endTick: asTick(3840),
          events: [],
          timestamp: Date.now(),
          selected: false,
        },
      ],
    };

    const result = rankTake(state, 'take1', 5);

    expect(result.takes[0]!.ranking).toBe(5);
  });

  it('should throw error for invalid ranking', () => {
    const state: SessionRecordingState = {
      armed: false,
      armedTracks: new Set(),
      mode: 'replace',
      active: false,
      takes: [],
    };

    expect(() => rankTake(state, 'take1', 6)).toThrow('Ranking must be between 1 and 5');
    expect(() => rankTake(state, 'take1', 0)).toThrow('Ranking must be between 1 and 5');
  });
});

describe('Take Merging', () => {
  it('should merge takes in layer mode', () => {
    const state: SessionRecordingState = {
      armed: false,
      armedTracks: new Set(),
      mode: 'replace',
      active: false,
      takes: [
        {
          id: 'take1',
          trackIndex: 0,
          clipId: generateContainerId(),
          startTick: asTick(0),
          endTick: asTick(3840),
          events: [
            {
              id: 'event1',
              kind: 'note',
              start: asTick(0),
              duration: asTickDuration(960),
              payload: { pitch: 60, velocity: 100 },
            },
          ],
          timestamp: Date.now(),
          selected: false,
        },
        {
          id: 'take2',
          trackIndex: 0,
          clipId: generateContainerId(),
          startTick: asTick(0),
          endTick: asTick(3840),
          events: [
            {
              id: 'event2',
              kind: 'note',
              start: asTick(960),
              duration: asTickDuration(960),
              payload: { pitch: 62, velocity: 100 },
            },
          ],
          timestamp: Date.now(),
          selected: false,
        },
      ],
    };

    const result = mergeTakes(state, ['take1', 'take2'], 'layer');

    expect(result.takes).toHaveLength(1);
    expect(result.takes[0]!.events).toHaveLength(2);
    expect(result.takes[0]!.selected).toBe(true);
  });

  it('should merge takes in priority mode', () => {
    const state: SessionRecordingState = {
      armed: false,
      armedTracks: new Set(),
      mode: 'replace',
      active: false,
      takes: [
        {
          id: 'take1',
          trackIndex: 0,
          clipId: generateContainerId(),
          startTick: asTick(0),
          endTick: asTick(3840),
          events: [
            {
              id: 'event1',
              kind: 'note',
              start: asTick(0),
              duration: asTickDuration(960),
              payload: { pitch: 60, velocity: 100 },
            },
          ],
          timestamp: 1000,
          selected: false,
        },
        {
          id: 'take2',
          trackIndex: 0,
          clipId: generateContainerId(),
          startTick: asTick(0),
          endTick: asTick(3840),
          events: [
            {
              id: 'event2',
              kind: 'note',
              start: asTick(480),
              duration: asTickDuration(960),
              payload: { pitch: 62, velocity: 100 },
            },
          ],
          timestamp: 2000,
          selected: false,
        },
      ],
    };

    const result = mergeTakes(state, ['take1', 'take2'], 'priority');

    expect(result.takes).toHaveLength(1);
    // Second take's event should have removed first take's overlapping event
    expect(result.takes[0]!.events).toHaveLength(1);
    expect(result.takes[0]!.events[0]!.id).toBe('event2');
  });

  it('should return state unchanged if no takes to merge', () => {
    const state: SessionRecordingState = {
      armed: false,
      armedTracks: new Set(),
      mode: 'replace',
      active: false,
      takes: [],
    };

    const result = mergeTakes(state, ['nonexistent'], 'layer');

    expect(result).toBe(state);
  });
});

describe('Performance Capture', () => {
  it('should start performance capture', () => {
    const startTime = Date.now();
    const capture = startPerformanceCapture(startTime);

    expect(capture.startTime).toBe(startTime);
    expect(capture.clipLaunches).toHaveLength(0);
    expect(capture.sceneChanges).toHaveLength(0);
    expect(capture.parameterChanges).toHaveLength(0);
  });

  it('should record clip launch events', () => {
    const capture = startPerformanceCapture(Date.now());

    const launchEvent: ClipLaunchEvent = {
      timestamp: Date.now(),
      tick: asTick(0),
      trackIndex: 0,
      sceneIndex: 0,
      clipId: generateContainerId(),
    };

    const result = recordClipLaunch(capture, launchEvent);

    expect(result.clipLaunches).toHaveLength(1);
    expect(result.clipLaunches[0]).toEqual(launchEvent);
  });

  it('should end performance capture', () => {
    const startTime = Date.now();
    const capture = startPerformanceCapture(startTime);
    const endTime = Date.now() + 10000;

    const result = endPerformanceCapture(capture, endTime);

    expect(result.endTime).toBe(endTime);
  });

  it('should convert performance to arrangement', () => {
    const capture = startPerformanceCapture(Date.now());
    
    const launch1: ClipLaunchEvent = {
      timestamp: Date.now(),
      tick: asTick(0),
      trackIndex: 0,
      sceneIndex: 0,
      clipId: generateContainerId(),
    };

    const launch2: ClipLaunchEvent = {
      timestamp: Date.now() + 5000,
      tick: asTick(3840),
      trackIndex: 0,
      sceneIndex: 1,
      clipId: generateContainerId(),
    };

    let updatedCapture = recordClipLaunch(capture, launch1);
    updatedCapture = recordClipLaunch(updatedCapture, launch2);
    updatedCapture = endPerformanceCapture(updatedCapture, Date.now() + 10000);

    const arrangement = performanceToArrangement(updatedCapture);

    expect(arrangement.tracks).toHaveLength(1);
    expect(arrangement.tracks[0]!.clipSlots).toHaveLength(2);
    expect(arrangement.tracks[0]!.clipSlots[0]!.startTick).toBe(asTick(0));
    expect(arrangement.tracks[0]!.clipSlots[0]!.endTick).toBe(asTick(3840));
  });
});

describe('Clip Sequence Capture', () => {
  it('should capture clip sequence', () => {
    const grid = createSessionGrid(2, 2);
    
    const clip1Id = generateContainerId();
    const clip2Id = generateContainerId();
    
    let updatedGrid = setClipInSlot(grid, { trackIndex: 0, sceneIndex: 0 }, clip1Id);
    updatedGrid = setClipInSlot(updatedGrid, { trackIndex: 1, sceneIndex: 0 }, clip2Id);

    const positions: GridPosition[] = [
      { trackIndex: 0, sceneIndex: 0 },
      { trackIndex: 1, sceneIndex: 0 },
    ];

    const sequence = captureClipSequence(updatedGrid, positions);

    expect(sequence.clips).toHaveLength(2);
    expect(sequence.clips[0]!.clipId).toBe(clip1Id);
    expect(sequence.clips[1]!.clipId).toBe(clip2Id);
  });

  it('should throw error if no clip at position', () => {
    const grid = createSessionGrid(2, 2);
    const positions: GridPosition[] = [{ trackIndex: 0, sceneIndex: 0 }];

    expect(() => captureClipSequence(grid, positions)).toThrow(
      'No clip at position 0,0'
    );
  });
});

describe('Automation Recording', () => {
  it('should start automation recording for track', () => {
    const recording = startAutomationRecording('track', 'volume', 0);

    expect(recording.targetType).toBe('track');
    expect(recording.targetIndex).toBe(0);
    expect(recording.parameterName).toBe('volume');
    expect(recording.points).toHaveLength(0);
  });

  it('should start automation recording for global', () => {
    const recording = startAutomationRecording('global', 'tempo');

    expect(recording.targetType).toBe('global');
    expect(recording.targetIndex).toBeUndefined();
    expect(recording.parameterName).toBe('tempo');
  });

  it('should record automation points', () => {
    const recording = startAutomationRecording('track', 'volume', 0);

    let updated = recordAutomationPoint(recording, asTick(0), 0.8, 'linear');
    updated = recordAutomationPoint(updated, asTick(960), 1.0, 'smooth');

    expect(updated.points).toHaveLength(2);
    expect(updated.points[0]!.tick).toBe(asTick(0));
    expect(updated.points[0]!.value).toBe(0.8);
    expect(updated.points[0]!.interpolation).toBe('linear');
    expect(updated.points[1]!.tick).toBe(asTick(960));
    expect(updated.points[1]!.value).toBe(1.0);
    expect(updated.points[1]!.interpolation).toBe('smooth');
  });
});
