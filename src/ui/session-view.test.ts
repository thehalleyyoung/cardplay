/**
 * @fileoverview Tests for Session View components and state management.
 */

import { describe, it, expect } from 'vitest';
import {
  createSessionGrid,
  setClipInSlot,
  removeClipFromSlot,
  setClipSlotState,
  setClipSlotColor,
  selectClipSlot,
  clearSelection,
  selectRectangle,
  startDragSelect,
  updateDragSelect,
  endDragSelect,
  cancelDragSelect,
  renameTrack,
  setTrackColor,
  toggleTrackMute,
  toggleTrackSolo,
  toggleTrackArm,
  renameScene,
  setSceneColor,
  setSceneTempo,
  showContextMenu,
  hideContextMenu,
  gridPositionToKey,
  keyToGridPosition,
  gridPositionsEqual,
  calculateSlotPosition,
  pixelToGridPosition,
  DEFAULT_SESSION_LAYOUT,
  duplicateClip,
  deleteClip,
  renameClip,
  changeClipColor,
  setClipLength,
  setClipWaveformPreview,
  setClipMidiPreview,
  setClipLoadingProgress,
  setClipError,
  setClipRecordingState,
  setClipLaunchMode,
  setClipLaunchQuantization,
  setClipPlayMode,
  setClipFollowAction,
  setClipFadeIn,
  setClipFadeOut,
  setClipStartOffset,
  quantizationToTicks,
  calculateNextLaunchTime,
  shouldTriggerFollowAction,
  // New functions for Phase 6.4
  setClipEndOffset,
  setClipWarpMarkers,
  setClipTempoSync,
  setClipPitchLock,
  setClipVelocityCurve,
  setClipGrooveAmount,
  setClipProbability,
  setClipCondition,
  setClipChokeGroup,
  setClipExclusiveMode,
  shouldTriggerClipByCondition,
  shouldTriggerClipByProbability,
  setSceneTimeSignature,
  setSceneFollowAction,
  launchScene,
  duplicateScene,
  deleteScene,
  reorderScene,
  insertScene,
  addSceneMarkers,
  setSceneDescription,
  snapshotScene,
  recallSceneSnapshot,
  setSceneLoopMode,
  setSceneTransition,
  addSceneCuePoint,
  captureSceneArrangement,
  sceneToArrangement,
  type GridPosition,
  type ClipSlotState,
  type SceneMarker,
  type SceneSnapshot,
  type SceneLoopMode,
  type SceneTransitionType,
  type SceneCuePoint,
  addTrack,
  deleteTrack,
  duplicateTrack,
  reorderTrack,
  createTrackGroup,
  toggleTrackGroupCollapsed,
  setTrackIcon,
  setTrackWidth,
  freezeTrack,
  unfreezeTrack,
  flattenTrack,
  setTrackMonitorMode,
  type TrackType,
  type MonitorMode,
  // Clip Editor functions
  createClipEditorState,
  openClipEditorWithEnterKey,
  closeClipEditorWithEscapeKey,
  recordClipEditInHistory,
  createClipEditPreview,
  commitClipEdit,
  cancelClipEdit,
  setClipEditorZoom,
  setClipEditorScrollPosition,
  setClipEditorSelection,
  copyClipEditorContent,
  pasteClipEditorContent,
} from './session-view';
import { generateContainerId } from '../containers/container';

describe('Session View', () => {
  describe('Grid Position Helpers', () => {
    it('should convert grid position to key', () => {
      const pos: GridPosition = { trackIndex: 2, sceneIndex: 3 };
      expect(gridPositionToKey(pos)).toBe('2:3');
    });

    it('should parse key to grid position', () => {
      const pos = keyToGridPosition('2:3');
      expect(pos).toEqual({ trackIndex: 2, sceneIndex: 3 });
    });

    it('should return null for invalid key', () => {
      expect(keyToGridPosition('invalid')).toBeNull();
      expect(keyToGridPosition('2')).toBeNull();
      expect(keyToGridPosition('a:b')).toBeNull();
    });

    it('should check grid position equality', () => {
      const pos1: GridPosition = { trackIndex: 1, sceneIndex: 2 };
      const pos2: GridPosition = { trackIndex: 1, sceneIndex: 2 };
      const pos3: GridPosition = { trackIndex: 1, sceneIndex: 3 };

      expect(gridPositionsEqual(pos1, pos2)).toBe(true);
      expect(gridPositionsEqual(pos1, pos3)).toBe(false);
    });
  });

  describe('Session Grid Creation', () => {
    it('should create empty session grid', () => {
      const grid = createSessionGrid(4, 6);

      expect(grid.trackCount).toBe(4);
      expect(grid.sceneCount).toBe(6);
      expect(grid.slots.size).toBe(24);
      expect(grid.trackHeaders).toHaveLength(4);
      expect(grid.sceneHeaders).toHaveLength(6);
      expect(grid.selection.selectedSlots.size).toBe(0);
      expect(grid.dragSelect.active).toBe(false);
    });

    it('should initialize track headers with default names', () => {
      const grid = createSessionGrid(3, 2);

      expect(grid.trackHeaders[0].name).toBe('Track 1');
      expect(grid.trackHeaders[1].name).toBe('Track 2');
      expect(grid.trackHeaders[2].name).toBe('Track 3');
      expect(grid.trackHeaders[0].muted).toBe(false);
      expect(grid.trackHeaders[0].soloed).toBe(false);
      expect(grid.trackHeaders[0].armed).toBe(false);
    });

    it('should initialize scene headers with default names', () => {
      const grid = createSessionGrid(2, 3);

      expect(grid.sceneHeaders[0].name).toBe('Scene 1');
      expect(grid.sceneHeaders[1].name).toBe('Scene 2');
      expect(grid.sceneHeaders[2].name).toBe('Scene 3');
    });

    it('should initialize all slots as empty', () => {
      const grid = createSessionGrid(2, 2);

      for (const slot of grid.slots.values()) {
        expect(slot.state).toBe('empty');
        expect(slot.selected).toBe(false);
        expect(slot.clipId).toBeUndefined();
      }
    });
  });

  describe('Clip Slot Management', () => {
    it('should set clip in slot', () => {
      const grid = createSessionGrid(3, 3);
      const clipId = generateContainerId();
      const position: GridPosition = { trackIndex: 1, sceneIndex: 2 };

      const updated = setClipInSlot(grid, position, clipId, 'My Clip', '#ff0000');

      const slot = updated.slots.get(gridPositionToKey(position));
      expect(slot?.clipId).toBe(clipId);
      expect(slot?.name).toBe('My Clip');
      expect(slot?.color).toBe('#ff0000');
      expect(slot?.state).toBe('filled');
    });

    it('should remove clip from slot', () => {
      const grid = createSessionGrid(3, 3);
      const clipId = generateContainerId();
      const position: GridPosition = { trackIndex: 1, sceneIndex: 2 };

      const withClip = setClipInSlot(grid, position, clipId);
      const removed = removeClipFromSlot(withClip, position);

      const slot = removed.slots.get(gridPositionToKey(position));
      expect(slot?.clipId).toBeUndefined();
      expect(slot?.state).toBe('empty');
    });

    it('should update clip slot state', () => {
      const grid = createSessionGrid(3, 3);
      const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
      const clipId = generateContainerId();

      let updated = setClipInSlot(grid, position, clipId);

      const states: ClipSlotState[] = ['playing', 'queued', 'stopping', 'filled'];
      for (const state of states) {
        updated = setClipSlotState(updated, position, state);
        const slot = updated.slots.get(gridPositionToKey(position));
        expect(slot?.state).toBe(state);
      }
    });

    it('should change clip slot color', () => {
      const grid = createSessionGrid(3, 3);
      const position: GridPosition = { trackIndex: 1, sceneIndex: 1 };
      const clipId = generateContainerId();

      let updated = setClipInSlot(grid, position, clipId);
      updated = setClipSlotColor(updated, position, '#00ff00');

      const slot = updated.slots.get(gridPositionToKey(position));
      expect(slot?.color).toBe('#00ff00');
    });
  });

  describe('Selection Management', () => {
    it('should select single clip slot', () => {
      const grid = createSessionGrid(3, 3);
      const position: GridPosition = { trackIndex: 1, sceneIndex: 1 };

      const selected = selectClipSlot(grid, position);

      expect(selected.selection.selectedSlots.size).toBe(1);
      expect(selected.selection.selectedSlots.has(gridPositionToKey(position))).toBe(true);

      const slot = selected.slots.get(gridPositionToKey(position));
      expect(slot?.selected).toBe(true);
    });

    it('should replace selection when not adding', () => {
      const grid = createSessionGrid(3, 3);
      const pos1: GridPosition = { trackIndex: 0, sceneIndex: 0 };
      const pos2: GridPosition = { trackIndex: 1, sceneIndex: 1 };

      const selected1 = selectClipSlot(grid, pos1);
      const selected2 = selectClipSlot(selected1, pos2, false);

      expect(selected2.selection.selectedSlots.size).toBe(1);
      expect(selected2.selection.selectedSlots.has(gridPositionToKey(pos2))).toBe(true);
      expect(selected2.selection.selectedSlots.has(gridPositionToKey(pos1))).toBe(false);
    });

    it('should add to selection when specified', () => {
      const grid = createSessionGrid(3, 3);
      const pos1: GridPosition = { trackIndex: 0, sceneIndex: 0 };
      const pos2: GridPosition = { trackIndex: 1, sceneIndex: 1 };

      const selected1 = selectClipSlot(grid, pos1);
      const selected2 = selectClipSlot(selected1, pos2, true);

      expect(selected2.selection.selectedSlots.size).toBe(2);
      expect(selected2.selection.selectedSlots.has(gridPositionToKey(pos1))).toBe(true);
      expect(selected2.selection.selectedSlots.has(gridPositionToKey(pos2))).toBe(true);
    });

    it('should toggle selection when adding to existing', () => {
      const grid = createSessionGrid(3, 3);
      const position: GridPosition = { trackIndex: 1, sceneIndex: 1 };

      const selected = selectClipSlot(grid, position);
      const toggled = selectClipSlot(selected, position, true);

      expect(toggled.selection.selectedSlots.size).toBe(0);
    });

    it('should clear selection', () => {
      const grid = createSessionGrid(3, 3);
      const pos1: GridPosition = { trackIndex: 0, sceneIndex: 0 };
      const pos2: GridPosition = { trackIndex: 1, sceneIndex: 1 };

      let selected = selectClipSlot(grid, pos1);
      selected = selectClipSlot(selected, pos2, true);

      const cleared = clearSelection(selected);

      expect(cleared.selection.selectedSlots.size).toBe(0);
      for (const slot of cleared.slots.values()) {
        expect(slot.selected).toBe(false);
      }
    });

    it('should select rectangle', () => {
      const grid = createSessionGrid(4, 4);
      const start: GridPosition = { trackIndex: 1, sceneIndex: 1 };
      const end: GridPosition = { trackIndex: 2, sceneIndex: 3 };

      const selected = selectRectangle(grid, start, end);

      // Should select 2x3 = 6 slots
      expect(selected.selection.selectedSlots.size).toBe(6);

      // Check specific slots
      expect(selected.selection.selectedSlots.has('1:1')).toBe(true);
      expect(selected.selection.selectedSlots.has('1:2')).toBe(true);
      expect(selected.selection.selectedSlots.has('1:3')).toBe(true);
      expect(selected.selection.selectedSlots.has('2:1')).toBe(true);
      expect(selected.selection.selectedSlots.has('2:2')).toBe(true);
      expect(selected.selection.selectedSlots.has('2:3')).toBe(true);

      // Check slots not selected
      expect(selected.selection.selectedSlots.has('0:0')).toBe(false);
      expect(selected.selection.selectedSlots.has('3:3')).toBe(false);
    });

    it('should select rectangle in reverse direction', () => {
      const grid = createSessionGrid(4, 4);
      const start: GridPosition = { trackIndex: 2, sceneIndex: 3 };
      const end: GridPosition = { trackIndex: 1, sceneIndex: 1 };

      const selected = selectRectangle(grid, start, end);

      // Should select same 2x3 = 6 slots regardless of direction
      expect(selected.selection.selectedSlots.size).toBe(6);
    });

    it('should add rectangle to existing selection', () => {
      const grid = createSessionGrid(4, 4);
      const pos: GridPosition = { trackIndex: 0, sceneIndex: 0 };

      let selected = selectClipSlot(grid, pos);
      selected = selectRectangle(
        selected,
        { trackIndex: 2, sceneIndex: 2 },
        { trackIndex: 3, sceneIndex: 3 },
        true
      );

      // 1 original + 4 from rectangle = 5
      expect(selected.selection.selectedSlots.size).toBe(5);
    });
  });

  describe('Drag-Select', () => {
    it('should start drag-select', () => {
      const grid = createSessionGrid(3, 3);
      const position: GridPosition = { trackIndex: 1, sceneIndex: 1 };

      const dragging = startDragSelect(grid, position);

      expect(dragging.dragSelect.active).toBe(true);
      expect(dragging.dragSelect.start).toEqual(position);
      expect(dragging.dragSelect.current).toEqual(position);
    });

    it('should update drag-select position', () => {
      const grid = createSessionGrid(3, 3);
      const start: GridPosition = { trackIndex: 0, sceneIndex: 0 };
      const current: GridPosition = { trackIndex: 2, sceneIndex: 2 };

      let dragging = startDragSelect(grid, start);
      dragging = updateDragSelect(dragging, current);

      expect(dragging.dragSelect.current).toEqual(current);
      expect(dragging.dragSelect.start).toEqual(start);
    });

    it('should not update drag-select when not active', () => {
      const grid = createSessionGrid(3, 3);
      const position: GridPosition = { trackIndex: 1, sceneIndex: 1 };

      const updated = updateDragSelect(grid, position);

      expect(updated).toBe(grid);
    });

    it('should end drag-select and apply selection', () => {
      const grid = createSessionGrid(4, 4);
      const start: GridPosition = { trackIndex: 0, sceneIndex: 0 };
      const end: GridPosition = { trackIndex: 1, sceneIndex: 1 };

      let dragging = startDragSelect(grid, start);
      dragging = updateDragSelect(dragging, end);
      const result = endDragSelect(dragging);

      expect(result.dragSelect.active).toBe(false);
      expect(result.selection.selectedSlots.size).toBe(4);
      expect(result.selection.selectedSlots.has('0:0')).toBe(true);
      expect(result.selection.selectedSlots.has('1:1')).toBe(true);
    });

    it('should cancel drag-select', () => {
      const grid = createSessionGrid(3, 3);
      const position: GridPosition = { trackIndex: 1, sceneIndex: 1 };

      let dragging = startDragSelect(grid, position);
      dragging = updateDragSelect(dragging, { trackIndex: 2, sceneIndex: 2 });
      const cancelled = cancelDragSelect(dragging);

      expect(cancelled.dragSelect.active).toBe(false);
      expect(cancelled.selection.selectedSlots.size).toBe(0);
    });
  });

  describe('Track Header Management', () => {
    it('should rename track', () => {
      const grid = createSessionGrid(3, 3);
      const renamed = renameTrack(grid, 1, 'Bass');

      expect(renamed.trackHeaders[1].name).toBe('Bass');
    });

    it('should set track color', () => {
      const grid = createSessionGrid(3, 3);
      const updated = setTrackColor(grid, 0, '#ff00ff');

      expect(updated.trackHeaders[0].color).toBe('#ff00ff');
    });

    it('should toggle track mute', () => {
      const grid = createSessionGrid(3, 3);
      
      const muted = toggleTrackMute(grid, 1);
      expect(muted.trackHeaders[1].muted).toBe(true);

      const unmuted = toggleTrackMute(muted, 1);
      expect(unmuted.trackHeaders[1].muted).toBe(false);
    });

    it('should toggle track solo', () => {
      const grid = createSessionGrid(3, 3);
      
      const soloed = toggleTrackSolo(grid, 2);
      expect(soloed.trackHeaders[2].soloed).toBe(true);

      const unsoloed = toggleTrackSolo(soloed, 2);
      expect(unsoloed.trackHeaders[2].soloed).toBe(false);
    });

    it('should toggle track arm', () => {
      const grid = createSessionGrid(3, 3);
      
      const armed = toggleTrackArm(grid, 0);
      expect(armed.trackHeaders[0].armed).toBe(true);

      const disarmed = toggleTrackArm(armed, 0);
      expect(disarmed.trackHeaders[0].armed).toBe(false);
    });

    it('should handle invalid track index', () => {
      const grid = createSessionGrid(3, 3);
      
      const result = renameTrack(grid, 10, 'Invalid');
      expect(result).toBe(grid);
    });
  });

  describe('Scene Header Management', () => {
    it('should rename scene', () => {
      const grid = createSessionGrid(3, 4);
      const renamed = renameScene(grid, 2, 'Chorus');

      expect(renamed.sceneHeaders[2].name).toBe('Chorus');
    });

    it('should set scene color', () => {
      const grid = createSessionGrid(3, 4);
      const updated = setSceneColor(grid, 1, '#00ffff');

      expect(updated.sceneHeaders[1].color).toBe('#00ffff');
    });

    it('should set scene tempo', () => {
      const grid = createSessionGrid(3, 4);
      const updated = setSceneTempo(grid, 0, 140);

      expect(updated.sceneHeaders[0].tempo).toBe(140);
    });

    it('should handle invalid scene index', () => {
      const grid = createSessionGrid(3, 3);
      
      const result = renameScene(grid, 10, 'Invalid');
      expect(result).toBe(grid);
    });
  });

  describe('Context Menu', () => {
    it('should show context menu', () => {
      const position: GridPosition = { trackIndex: 1, sceneIndex: 2 };
      const menu = showContextMenu(position, 100, 200);

      expect(menu.visible).toBe(true);
      expect(menu.position).toEqual({ x: 100, y: 200 });
      expect(menu.slot).toEqual(position);
      expect(menu.actions).toContain('duplicate');
      expect(menu.actions).toContain('delete');
      expect(menu.actions).toContain('rename');
    });

    it('should hide context menu', () => {
      const menu = hideContextMenu();

      expect(menu.visible).toBe(false);
      expect(menu.actions).toHaveLength(0);
    });
  });

  describe('Layout Calculations', () => {
    it('should calculate slot position', () => {
      const position: GridPosition = { trackIndex: 2, sceneIndex: 1 };
      const rect = calculateSlotPosition(position);

      expect(rect.width).toBe(DEFAULT_SESSION_LAYOUT.slotWidth);
      expect(rect.height).toBe(DEFAULT_SESSION_LAYOUT.slotHeight);
      
      const expectedX = DEFAULT_SESSION_LAYOUT.sidebarWidth + 
        2 * (DEFAULT_SESSION_LAYOUT.slotWidth + DEFAULT_SESSION_LAYOUT.gap);
      const expectedY = DEFAULT_SESSION_LAYOUT.headerHeight +
        1 * (DEFAULT_SESSION_LAYOUT.slotHeight + DEFAULT_SESSION_LAYOUT.gap);
      
      expect(rect.x).toBe(expectedX);
      expect(rect.y).toBe(expectedY);
    });

    it('should convert pixel to grid position', () => {
      const layout = DEFAULT_SESSION_LAYOUT;
      const x = layout.sidebarWidth + 1.5 * (layout.slotWidth + layout.gap);
      const y = layout.headerHeight + 2.5 * (layout.slotHeight + layout.gap);

      const position = pixelToGridPosition(x, y);

      expect(position).toEqual({ trackIndex: 1, sceneIndex: 2 });
    });

    it('should return null for pixels outside grid', () => {
      const position1 = pixelToGridPosition(10, 10);
      expect(position1).toBeNull();
    });

    it('should return null for pixels in gap', () => {
      const layout = DEFAULT_SESSION_LAYOUT;
      const x = layout.sidebarWidth + layout.slotWidth + 1; // In gap
      const y = layout.headerHeight + 10;

      const position = pixelToGridPosition(x, y);
      expect(position).toBeNull();
    });
  });

  describe('Clip Operations', () => {
    describe('duplicateClip', () => {
      it('should duplicate clip to specified target', () => {
        let grid = createSessionGrid(4, 4);
        const clipId = generateContainerId();
        const source: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const target: GridPosition = { trackIndex: 1, sceneIndex: 1 };

        grid = setClipInSlot(grid, source, clipId, 'Test Clip', '#ff0000');
        grid = duplicateClip(grid, source, target);

        const sourceSlot = grid.slots.get(gridPositionToKey(source));
        const targetSlot = grid.slots.get(gridPositionToKey(target));

        expect(sourceSlot?.clipId).toBe(clipId);
        expect(targetSlot?.state).toBe('filled');
        expect(targetSlot?.clipId).not.toBe(clipId);
        expect(targetSlot?.name).toBe('Test Clip (copy)');
        expect(targetSlot?.color).toBe('#ff0000');
      });

      it('should find next empty slot in same track if no target', () => {
        let grid = createSessionGrid(2, 4);
        const clipId = generateContainerId();
        const source: GridPosition = { trackIndex: 0, sceneIndex: 0 };

        grid = setClipInSlot(grid, source, clipId, 'Test Clip');
        grid = duplicateClip(grid, source);

        const duplicateSlot = grid.slots.get(gridPositionToKey({ trackIndex: 0, sceneIndex: 1 }));
        expect(duplicateSlot?.state).toBe('filled');
        expect(duplicateSlot?.name).toBe('Test Clip (copy)');
      });

      it('should return unchanged grid if source has no clip', () => {
        const grid = createSessionGrid(2, 2);
        const source: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const result = duplicateClip(grid, source);
        expect(result).toBe(grid);
      });
    });

    describe('deleteClip', () => {
      it('should delete clip from slot', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();

        grid = setClipInSlot(grid, position, clipId);
        grid = deleteClip(grid, position);

        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.state).toBe('empty');
        expect(slot?.clipId).toBeUndefined();
      });
    });

    describe('renameClip', () => {
      it('should rename clip', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();

        grid = setClipInSlot(grid, position, clipId, 'Old Name');
        grid = renameClip(grid, position, 'New Name');

        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.name).toBe('New Name');
      });

      it('should not rename empty slot', () => {
        const grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const result = renameClip(grid, position, 'Name');
        expect(result).toBe(grid);
      });
    });

    describe('changeClipColor', () => {
      it('should change clip color', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();

        grid = setClipInSlot(grid, position, clipId);
        grid = changeClipColor(grid, position, '#00ff00');

        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.color).toBe('#00ff00');
      });
    });

    describe('setClipLength', () => {
      it('should set clip length', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();

        grid = setClipInSlot(grid, position, clipId);
        grid = setClipLength(grid, position, 3840);

        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.info?.length).toBe(3840);
      });
    });

    describe('setClipWaveformPreview', () => {
      it('should set waveform data', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();
        const waveform = new Float32Array([0.1, 0.2, 0.3]);

        grid = setClipInSlot(grid, position, clipId);
        grid = setClipWaveformPreview(grid, position, waveform);

        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.info?.waveformData).toBe(waveform);
      });
    });

    describe('setClipMidiPreview', () => {
      it('should set MIDI preview notes', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();
        const notes = [
          { pitch: 60, start: 0, duration: 100 },
          { pitch: 64, start: 100, duration: 100 },
        ];

        grid = setClipInSlot(grid, position, clipId);
        grid = setClipMidiPreview(grid, position, notes);

        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.info?.midiPreviewNotes).toEqual(notes);
      });
    });

    describe('setClipLoadingProgress', () => {
      it('should set loading progress', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };

        grid = setClipLoadingProgress(grid, position, 0.5);

        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.info?.loadingProgress).toBe(0.5);
      });

      it('should clamp progress to 0-1', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };

        grid = setClipLoadingProgress(grid, position, 1.5);
        let slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.info?.loadingProgress).toBe(1);

        grid = setClipLoadingProgress(grid, position, -0.5);
        slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.info?.loadingProgress).toBe(0);
      });
    });

    describe('setClipError', () => {
      it('should set error message', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };

        grid = setClipError(grid, position, 'Failed to load');

        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.info?.error).toBe('Failed to load');
      });
    });

    describe('setClipRecordingState', () => {
      it('should set recording state', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };

        grid = setClipRecordingState(grid, position, {
          active: true,
          startTime: 1000,
          currentLength: 500,
        });

        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.info?.recording?.active).toBe(true);
        expect(slot?.info?.recording?.startTime).toBe(1000);
        expect(slot?.info?.recording?.currentLength).toBe(500);
        expect(slot?.state).toBe('filled');
      });

      it('should not change state if recording is inactive', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };

        grid = setClipRecordingState(grid, position, { active: false });

        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.state).toBe('empty');
      });
    });
  });

  describe('Clip Launch System', () => {
    describe('Launch Configuration', () => {
      it('should set launch mode to immediate', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();
        grid = setClipInSlot(grid, position, clipId);

        grid = setClipLaunchMode(grid, position, 'immediate');

        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.launchConfig?.launchMode).toBe('immediate');
      });

      it('should set launch mode to quantized', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();
        grid = setClipInSlot(grid, position, clipId);

        grid = setClipLaunchMode(grid, position, 'quantized');

        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.launchConfig?.launchMode).toBe('quantized');
      });

      it('should set launch quantization', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();
        grid = setClipInSlot(grid, position, clipId);

        grid = setClipLaunchQuantization(grid, position, '4');

        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.launchConfig?.quantization).toBe('4');
      });

      it('should set play mode to loop', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();
        grid = setClipInSlot(grid, position, clipId);

        grid = setClipPlayMode(grid, position, 'loop');

        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.launchConfig?.playMode).toBe('loop');
      });

      it('should set play mode to one-shot', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();
        grid = setClipInSlot(grid, position, clipId);

        grid = setClipPlayMode(grid, position, 'one-shot');

        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.launchConfig?.playMode).toBe('one-shot');
      });

      it('should set play mode to legato', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();
        grid = setClipInSlot(grid, position, clipId);

        grid = setClipPlayMode(grid, position, 'legato');

        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.launchConfig?.playMode).toBe('legato');
      });

      it('should set fade in duration', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();
        grid = setClipInSlot(grid, position, clipId);

        grid = setClipFadeIn(grid, position, 960);

        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.launchConfig?.fadeInTicks).toBe(960);
      });

      it('should set fade out duration', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();
        grid = setClipInSlot(grid, position, clipId);

        grid = setClipFadeOut(grid, position, 1920);

        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.launchConfig?.fadeOutTicks).toBe(1920);
      });

      it('should set start offset', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();
        grid = setClipInSlot(grid, position, clipId);

        grid = setClipStartOffset(grid, position, 3840);

        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.launchConfig?.startOffsetTicks).toBe(3840);
      });
    });

    describe('Follow Actions', () => {
      it('should set follow action to stop', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();
        grid = setClipInSlot(grid, position, clipId);

        grid = setClipFollowAction(grid, position, {
          type: 'stop',
          timeInBars: 4,
        });

        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.launchConfig?.followAction?.type).toBe('stop');
        expect(slot?.launchConfig?.followAction?.timeInBars).toBe(4);
      });

      it('should set follow action to next-clip', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();
        grid = setClipInSlot(grid, position, clipId);

        grid = setClipFollowAction(grid, position, {
          type: 'next-clip',
          timeInBars: 8,
        });

        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.launchConfig?.followAction?.type).toBe('next-clip');
        expect(slot?.launchConfig?.followAction?.timeInBars).toBe(8);
      });

      it('should set follow action with probability', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();
        grid = setClipInSlot(grid, position, clipId);

        grid = setClipFollowAction(grid, position, {
          type: 'any-clip',
          timeInBars: 2,
          probability: 0.75,
        });

        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.launchConfig?.followAction?.probability).toBe(0.75);
      });

      it('should clear follow action', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();
        grid = setClipInSlot(grid, position, clipId);

        grid = setClipFollowAction(grid, position, {
          type: 'stop',
          timeInBars: 4,
        });

        grid = setClipFollowAction(grid, position, undefined);

        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.launchConfig?.followAction).toBeUndefined();
      });
    });

    describe('Quantization Calculations', () => {
      it('should convert none quantization to 0 ticks', () => {
        const ticks = quantizationToTicks('none', 960, 4);
        expect(ticks).toBe(0);
      });

      it('should convert 1/4 quantization to one beat', () => {
        const ticks = quantizationToTicks('1/4', 960, 4);
        expect(ticks).toBe(960);
      });

      it('should convert 1/2 quantization to two beats', () => {
        const ticks = quantizationToTicks('1/2', 960, 4);
        expect(ticks).toBe(1920);
      });

      it('should convert 1 bar quantization to one bar', () => {
        const ticks = quantizationToTicks('1', 960, 4);
        expect(ticks).toBe(3840);
      });

      it('should convert 2 bar quantization', () => {
        const ticks = quantizationToTicks('2', 960, 4);
        expect(ticks).toBe(7680);
      });

      it('should convert 4 bar quantization', () => {
        const ticks = quantizationToTicks('4', 960, 4);
        expect(ticks).toBe(15360);
      });

      it('should convert 8 bar quantization', () => {
        const ticks = quantizationToTicks('8', 960, 4);
        expect(ticks).toBe(30720);
      });

      it('should handle different time signatures', () => {
        const ticks = quantizationToTicks('1', 960, 3); // 3/4 time
        expect(ticks).toBe(2880);
      });
    });

    describe('Launch Time Calculations', () => {
      it('should return immediate time for none quantization', () => {
        const launchTime = calculateNextLaunchTime(1234, 'none', 960, 4);
        expect(launchTime).toBe(1234);
      });

      it('should round up to next quarter note', () => {
        const launchTime = calculateNextLaunchTime(100, '1/4', 960, 4);
        expect(launchTime).toBe(960);
      });

      it('should return current time if exactly on boundary', () => {
        const launchTime = calculateNextLaunchTime(960, '1/4', 960, 4);
        expect(launchTime).toBe(960);
      });

      it('should round up to next bar', () => {
        const launchTime = calculateNextLaunchTime(3841, '1', 960, 4);
        expect(launchTime).toBe(7680);
      });

      it('should round up to next 4-bar boundary', () => {
        const launchTime = calculateNextLaunchTime(15361, '4', 960, 4);
        expect(launchTime).toBe(30720);
      });
    });

    describe('Follow Action Triggering', () => {
      it('should trigger follow action after specified time', () => {
        const shouldTrigger = shouldTriggerFollowAction(
          0,
          15360, // 4 bars at 960 ticks/beat, 4 beats/bar
          3840,
          { type: 'stop', timeInBars: 4 },
          960,
          4
        );
        expect(shouldTrigger).toBe(true);
      });

      it('should not trigger before specified time', () => {
        const shouldTrigger = shouldTriggerFollowAction(
          0,
          7680, // 2 bars
          3840,
          { type: 'stop', timeInBars: 4 },
          960,
          4
        );
        expect(shouldTrigger).toBe(false);
      });

      it('should trigger exactly at specified time', () => {
        const shouldTrigger = shouldTriggerFollowAction(
          0,
          3840, // 1 bar
          3840,
          { type: 'next-clip', timeInBars: 1 },
          960,
          4
        );
        expect(shouldTrigger).toBe(true);
      });

      it('should work with non-zero start tick', () => {
        const shouldTrigger = shouldTriggerFollowAction(
          3840, // Start at 1 bar
          7680, // Current at 2 bars (1 bar elapsed)
          3840,
          { type: 'stop', timeInBars: 1 },
          960,
          4
        );
        expect(shouldTrigger).toBe(true);
      });
    });

    describe('New Clip Launch Config Properties', () => {
      it('should set clip end offset', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();
        
        grid = setClipInSlot(grid, position, clipId);
        grid = setClipEndOffset(grid, position, 480);
        
        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.launchConfig?.endOffsetTicks).toBe(480);
      });

      it('should set clip warp markers', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();
        
        grid = setClipInSlot(grid, position, clipId);
        const markers = [
          { tickPosition: 0, audioPosition: 0 },
          { tickPosition: 960, audioPosition: 1.0 },
        ];
        grid = setClipWarpMarkers(grid, position, markers);
        
        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.launchConfig?.warpMarkers).toEqual(markers);
      });

      it('should set clip tempo sync', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();
        
        grid = setClipInSlot(grid, position, clipId);
        grid = setClipTempoSync(grid, position, true);
        
        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.launchConfig?.tempoSync).toBe(true);
      });

      it('should set clip pitch lock', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();
        
        grid = setClipInSlot(grid, position, clipId);
        grid = setClipPitchLock(grid, position, true);
        
        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.launchConfig?.pitchLock).toBe(true);
      });

      it('should set clip velocity curve', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();
        
        grid = setClipInSlot(grid, position, clipId);
        grid = setClipVelocityCurve(grid, position, 0.5);
        
        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.launchConfig?.velocityCurve).toBe(0.5);
      });

      it('should set clip groove amount and clamp to 0-1', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();
        
        grid = setClipInSlot(grid, position, clipId);
        grid = setClipGrooveAmount(grid, position, 1.5); // Should clamp to 1
        
        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.launchConfig?.grooveAmount).toBe(1);
        
        grid = setClipGrooveAmount(grid, position, -0.5); // Should clamp to 0
        expect(grid.slots.get(gridPositionToKey(position))?.launchConfig?.grooveAmount).toBe(0);
      });

      it('should set clip probability and clamp to 0-1', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();
        
        grid = setClipInSlot(grid, position, clipId);
        grid = setClipProbability(grid, position, 0.75);
        
        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.launchConfig?.probability).toBe(0.75);
      });

      it('should set clip condition', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();
        
        grid = setClipInSlot(grid, position, clipId);
        grid = setClipCondition(grid, position, 'nth-time', 4);
        
        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.launchConfig?.condition).toBe('nth-time');
        expect(slot?.launchConfig?.conditionInterval).toBe(4);
      });

      it('should set clip choke group', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();
        
        grid = setClipInSlot(grid, position, clipId);
        grid = setClipChokeGroup(grid, position, 1);
        
        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.launchConfig?.chokeGroup).toBe(1);
      });

      it('should set clip exclusive mode', () => {
        let grid = createSessionGrid(2, 2);
        const position: GridPosition = { trackIndex: 0, sceneIndex: 0 };
        const clipId = generateContainerId();
        
        grid = setClipInSlot(grid, position, clipId);
        grid = setClipExclusiveMode(grid, position, true);
        
        const slot = grid.slots.get(gridPositionToKey(position));
        expect(slot?.launchConfig?.exclusiveMode).toBe(true);
      });
    });

    describe('Clip Condition Checks', () => {
      it('should always trigger for always condition', () => {
        expect(shouldTriggerClipByCondition('always', 1, 5, 10)).toBe(true);
      });

      it('should trigger only first time for first condition', () => {
        expect(shouldTriggerClipByCondition('first', 1, 0, 0)).toBe(true);
        expect(shouldTriggerClipByCondition('first', 1, 1, 0)).toBe(false);
        expect(shouldTriggerClipByCondition('first', 1, 10, 0)).toBe(false);
      });

      it('should trigger every nth time for nth-time condition', () => {
        expect(shouldTriggerClipByCondition('nth-time', 3, 0, 0)).toBe(true); // 0 % 3 === 0
        expect(shouldTriggerClipByCondition('nth-time', 3, 1, 0)).toBe(false);
        expect(shouldTriggerClipByCondition('nth-time', 3, 2, 0)).toBe(false);
        expect(shouldTriggerClipByCondition('nth-time', 3, 3, 0)).toBe(true);
        expect(shouldTriggerClipByCondition('nth-time', 3, 6, 0)).toBe(true);
      });

      it('should trigger every nth bar for nth-bar condition', () => {
        expect(shouldTriggerClipByCondition('nth-bar', 4, 0, 0)).toBe(true); // Bar 0
        expect(shouldTriggerClipByCondition('nth-bar', 4, 0, 1)).toBe(false);
        expect(shouldTriggerClipByCondition('nth-bar', 4, 0, 4)).toBe(true);
        expect(shouldTriggerClipByCondition('nth-bar', 4, 0, 8)).toBe(true);
      });
    });

    describe('Clip Probability Checks', () => {
      it('should always trigger for probability 1', () => {
        for (let i = 0; i < 100; i++) {
          expect(shouldTriggerClipByProbability(1)).toBe(true);
        }
      });

      it('should never trigger for probability 0', () => {
        for (let i = 0; i < 100; i++) {
          expect(shouldTriggerClipByProbability(0)).toBe(false);
        }
      });

      it('should sometimes trigger for probability 0.5', () => {
        const results = [];
        for (let i = 0; i < 1000; i++) {
          results.push(shouldTriggerClipByProbability(0.5));
        }
        const trueCount = results.filter(r => r).length;
        // Should be around 500, allow 400-600 range for randomness
        expect(trueCount).toBeGreaterThan(400);
        expect(trueCount).toBeLessThan(600);
      });
    });

    describe('Scene Management', () => {
      it('should set scene time signature', () => {
        let grid = createSessionGrid(2, 2);
        grid = setSceneTimeSignature(grid, 0, 3, 4);
        
        expect(grid.sceneHeaders[0]?.timeSignature).toEqual({ numerator: 3, denominator: 4 });
      });

      it('should set scene follow action', () => {
        let grid = createSessionGrid(2, 2);
        const followAction = { type: 'next-scene' as const, timeInBars: 2 };
        grid = setSceneFollowAction(grid, 0, followAction);
        
        expect(grid.sceneHeaders[0]?.followAction).toEqual(followAction);
      });

      it('should launch all clips in a scene', () => {
        let grid = createSessionGrid(3, 2);
        
        // Add clips to scene 0
        const clipId1 = generateContainerId();
        const clipId2 = generateContainerId();
        grid = setClipInSlot(grid, { trackIndex: 0, sceneIndex: 0 }, clipId1);
        grid = setClipInSlot(grid, { trackIndex: 1, sceneIndex: 0 }, clipId2);
        
        // Launch the scene
        grid = launchScene(grid, 0);
        
        // Check that both clips are queued
        expect(grid.slots.get('0:0')?.state).toBe('queued');
        expect(grid.slots.get('1:0')?.state).toBe('queued');
        expect(grid.slots.get('2:0')?.state).toBe('empty'); // No clip here
      });

      it('should duplicate a scene', () => {
        let grid = createSessionGrid(2, 2);
        
        // Add clips and customize scene 0
        const clipId = generateContainerId();
        grid = setClipInSlot(grid, { trackIndex: 0, sceneIndex: 0 }, clipId);
        grid = renameScene(grid, 0, 'Original');
        grid = setSceneColor(grid, 0, '#ff0000');
        grid = setSceneTempo(grid, 0, 120);
        
        // Duplicate scene 0
        grid = duplicateScene(grid, 0);
        
        // Should have 3 scenes now
        expect(grid.sceneCount).toBe(3);
        expect(grid.sceneHeaders.length).toBe(3);
        
        // New scene should be at index 1 with copied properties
        expect(grid.sceneHeaders[1]?.name).toBe('Original Copy');
        expect(grid.sceneHeaders[1]?.color).toBe('#ff0000');
        expect(grid.sceneHeaders[1]?.tempo).toBe(120);
        
        // Clips should be copied
        expect(grid.slots.get('0:1')?.clipId).toBe(clipId);
      });

      it('should delete a scene', () => {
        let grid = createSessionGrid(2, 3);
        const clipId = generateContainerId();
        grid = setClipInSlot(grid, { trackIndex: 0, sceneIndex: 1 }, clipId);
        
        // Delete scene 1
        grid = deleteScene(grid, 1);
        
        // Should have 2 scenes now
        expect(grid.sceneCount).toBe(2);
        expect(grid.sceneHeaders.length).toBe(2);
        
        // Scene indices should be updated
        expect(grid.sceneHeaders[0]?.sceneIndex).toBe(0);
        expect(grid.sceneHeaders[1]?.sceneIndex).toBe(1);
        
        // Original scene 2 should now be at index 1
        expect(grid.sceneHeaders[1]?.name).toBe('Scene 3');
      });

      it('should not delete the last scene', () => {
        let grid = createSessionGrid(2, 1);
        const originalGrid = grid;
        
        grid = deleteScene(grid, 0);
        
        // Should be unchanged
        expect(grid).toBe(originalGrid);
        expect(grid.sceneCount).toBe(1);
      });

      it('should reorder scenes', () => {
        let grid = createSessionGrid(2, 4);
        
        // Rename scenes for tracking
        grid = renameScene(grid, 0, 'A');
        grid = renameScene(grid, 1, 'B');
        grid = renameScene(grid, 2, 'C');
        grid = renameScene(grid, 3, 'D');
        
        // Add clip to scene 1
        const clipId = generateContainerId();
        grid = setClipInSlot(grid, { trackIndex: 0, sceneIndex: 1 }, clipId);
        
        // Move scene 1 (B) to position 3
        grid = reorderScene(grid, 1, 3);
        
        // Order should now be: A, C, D, B
        expect(grid.sceneHeaders[0]?.name).toBe('A');
        expect(grid.sceneHeaders[1]?.name).toBe('C');
        expect(grid.sceneHeaders[2]?.name).toBe('D');
        expect(grid.sceneHeaders[3]?.name).toBe('B');
        
        // Clip should move with the scene
        expect(grid.slots.get('0:3')?.clipId).toBe(clipId);
        expect(grid.slots.get('0:1')?.clipId).toBeUndefined();
      });

      it('should insert a new scene at specified position', () => {
        let grid = createSessionGrid(2, 2);
        
        // Insert scene at index 1
        grid = insertScene(grid, 1, 'Inserted Scene');
        
        // Should have 3 scenes now
        expect(grid.sceneCount).toBe(3);
        expect(grid.sceneHeaders.length).toBe(3);
        
        // New scene should be at index 1
        expect(grid.sceneHeaders[1]?.name).toBe('Inserted Scene');
        expect(grid.sceneHeaders[1]?.sceneIndex).toBe(1);
        
        // Original scenes should be shifted
        expect(grid.sceneHeaders[0]?.sceneIndex).toBe(0);
        expect(grid.sceneHeaders[2]?.sceneIndex).toBe(2);
        
        // All tracks should have empty slots in the new scene
        expect(grid.slots.get('0:1')?.state).toBe('empty');
        expect(grid.slots.get('1:1')?.state).toBe('empty');
      });

      it('should add markers to a scene', () => {
        let grid = createSessionGrid(2, 2);
        const markers: SceneMarker[] = [
          { position: 0, label: 'Start' },
          { position: 1920, label: 'Drop' },
        ];
        
        grid = addSceneMarkers(grid, 0, markers);
        
        expect(grid.sceneHeaders[0]?.markers).toEqual(markers);
        expect(grid.sceneHeaders[0]?.markers?.length).toBe(2);
      });

      it('should set scene description', () => {
        let grid = createSessionGrid(2, 2);
        const description = 'Verse section with piano and drums';
        
        grid = setSceneDescription(grid, 0, description);
        
        expect(grid.sceneHeaders[0]?.description).toBe(description);
      });

      it('should create a scene snapshot', () => {
        let grid = createSessionGrid(3, 2);
        
        // Add clips and set states
        const clipId1 = generateContainerId();
        const clipId2 = generateContainerId();
        grid = setClipInSlot(grid, { trackIndex: 0, sceneIndex: 0 }, clipId1);
        grid = setClipInSlot(grid, { trackIndex: 1, sceneIndex: 0 }, clipId2);
        grid = setClipSlotState(grid, { trackIndex: 0, sceneIndex: 0 }, 'playing');
        grid = setClipSlotState(grid, { trackIndex: 1, sceneIndex: 0 }, 'queued');
        
        // Customize scene header
        grid = renameScene(grid, 0, 'Snapshot Test');
        grid = setSceneColor(grid, 0, '#00ff00');
        
        const snapshot = snapshotScene(grid, 0);
        
        expect(snapshot).not.toBeNull();
        expect(snapshot?.sceneIndex).toBe(0);
        expect(snapshot?.sceneHeader.name).toBe('Snapshot Test');
        expect(snapshot?.sceneHeader.color).toBe('#00ff00');
        expect(snapshot?.clipStates.get(0)).toBe('playing');
        expect(snapshot?.clipStates.get(1)).toBe('queued');
        expect(snapshot?.clipStates.get(2)).toBe('empty');
      });

      it('should recall a scene from snapshot', () => {
        let grid = createSessionGrid(3, 2);
        
        // Setup initial state
        const clipId1 = generateContainerId();
        grid = setClipInSlot(grid, { trackIndex: 0, sceneIndex: 0 }, clipId1);
        grid = setClipSlotState(grid, { trackIndex: 0, sceneIndex: 0 }, 'playing');
        grid = renameScene(grid, 0, 'Original');
        
        const snapshot = snapshotScene(grid, 0);
        expect(snapshot).not.toBeNull();
        
        // Change the scene
        grid = setClipSlotState(grid, { trackIndex: 0, sceneIndex: 0 }, 'stopping');
        grid = renameScene(grid, 0, 'Modified');
        
        // Recall from snapshot
        if (snapshot) {
          grid = recallSceneSnapshot(grid, snapshot);
        }
        
        // Should be restored
        expect(grid.sceneHeaders[0]?.name).toBe('Original');
        expect(grid.slots.get('0:0')?.state).toBe('playing');
      });

      it('should return null snapshot for invalid scene index', () => {
        const grid = createSessionGrid(2, 2);
        
        expect(snapshotScene(grid, -1)).toBeNull();
        expect(snapshotScene(grid, 5)).toBeNull();
      });

      it('should set scene loop mode', () => {
        let grid = createSessionGrid(2, 2);
        
        grid = setSceneLoopMode(grid, 0, 'loop');
        expect(grid.sceneHeaders[0]?.loopMode).toBe('loop');
        
        grid = setSceneLoopMode(grid, 0, 'ping-pong');
        expect(grid.sceneHeaders[0]?.loopMode).toBe('ping-pong');
        
        grid = setSceneLoopMode(grid, 0, 'off');
        expect(grid.sceneHeaders[0]?.loopMode).toBe('off');
      });

      it('should set scene transition type', () => {
        let grid = createSessionGrid(2, 2);
        
        grid = setSceneTransition(grid, 0, 'crossfade');
        expect(grid.sceneHeaders[0]?.transitionType).toBe('crossfade');
        
        grid = setSceneTransition(grid, 0, 'ramp');
        expect(grid.sceneHeaders[0]?.transitionType).toBe('ramp');
        
        grid = setSceneTransition(grid, 0, 'cut');
        expect(grid.sceneHeaders[0]?.transitionType).toBe('cut');
      });

      it('should add cue points to a scene', () => {
        let grid = createSessionGrid(2, 2);
        
        const cuePoint1: SceneCuePoint = {
          id: 'cue1',
          position: 0,
          name: 'Intro',
          color: '#ff0000',
        };
        
        const cuePoint2: SceneCuePoint = {
          id: 'cue2',
          position: 3840,
          name: 'Chorus',
          color: '#00ff00',
        };
        
        grid = addSceneCuePoint(grid, 0, cuePoint1);
        grid = addSceneCuePoint(grid, 0, cuePoint2);
        
        expect(grid.sceneHeaders[0]?.cuePoints?.length).toBe(2);
        expect(grid.sceneHeaders[0]?.cuePoints?.[0]).toEqual(cuePoint1);
        expect(grid.sceneHeaders[0]?.cuePoints?.[1]).toEqual(cuePoint2);
      });

      it('should capture scene arrangement', () => {
        let grid = createSessionGrid(3, 2);
        
        // Add clips to various positions
        const clipId1 = generateContainerId();
        const clipId2 = generateContainerId();
        const clipId3 = generateContainerId();
        
        grid = setClipInSlot(grid, { trackIndex: 0, sceneIndex: 0 }, clipId1);
        grid = setClipInSlot(grid, { trackIndex: 1, sceneIndex: 0 }, clipId2);
        grid = setClipInSlot(grid, { trackIndex: 0, sceneIndex: 1 }, clipId3);
        
        const arrangement = captureSceneArrangement(grid);
        
        expect(arrangement.length).toBe(2); // 2 scenes
        expect(arrangement[0]?.clips.length).toBe(2);
        expect(arrangement[0]?.clips[0]?.clipId).toBe(clipId1);
        expect(arrangement[0]?.clips[1]?.clipId).toBe(clipId2);
        expect(arrangement[1]?.clips.length).toBe(1);
        expect(arrangement[1]?.clips[0]?.clipId).toBe(clipId3);
      });

      it('should convert scenes to timeline arrangement', () => {
        let grid = createSessionGrid(2, 3);
        
        const clipId1 = generateContainerId();
        const clipId2 = generateContainerId();
        const clipId3 = generateContainerId();
        
        grid = setClipInSlot(grid, { trackIndex: 0, sceneIndex: 0 }, clipId1);
        grid = setClipInSlot(grid, { trackIndex: 1, sceneIndex: 1 }, clipId2);
        grid = setClipInSlot(grid, { trackIndex: 0, sceneIndex: 2 }, clipId3);
        
        // Convert scenes 0, 1, 2 to arrangement with 4 bars per scene
        const arrangement = sceneToArrangement(grid, [0, 1, 2], 4);
        
        expect(arrangement.length).toBe(3); // 3 clips total
        
        // Scene 0 clip should start at bar 0
        expect(arrangement[0]?.clipId).toBe(clipId1);
        expect(arrangement[0]?.startBar).toBe(0);
        expect(arrangement[0]?.lengthBars).toBe(4);
        
        // Scene 1 clip should start at bar 4
        expect(arrangement[1]?.clipId).toBe(clipId2);
        expect(arrangement[1]?.startBar).toBe(4);
        expect(arrangement[1]?.lengthBars).toBe(4);
        
        // Scene 2 clip should start at bar 8
        expect(arrangement[2]?.clipId).toBe(clipId3);
        expect(arrangement[2]?.startBar).toBe(8);
        expect(arrangement[2]?.lengthBars).toBe(4);
      });

      it('should handle custom bars per scene in arrangement', () => {
        let grid = createSessionGrid(2, 2);
        
        const clipId1 = generateContainerId();
        const clipId2 = generateContainerId();
        
        grid = setClipInSlot(grid, { trackIndex: 0, sceneIndex: 0 }, clipId1);
        grid = setClipInSlot(grid, { trackIndex: 0, sceneIndex: 1 }, clipId2);
        
        // Convert with 8 bars per scene
        const arrangement = sceneToArrangement(grid, [0, 1], 8);
        
        expect(arrangement[0]?.startBar).toBe(0);
        expect(arrangement[0]?.lengthBars).toBe(8);
        expect(arrangement[1]?.startBar).toBe(8);
        expect(arrangement[1]?.lengthBars).toBe(8);
      });
    });
  });

  describe('Track Management', () => {
    describe('addTrack', () => {
      it('should add a new MIDI track to the grid', () => {
        const grid = createSessionGrid(2, 2);
        const updatedGrid = addTrack(grid, 'midi');

        expect(updatedGrid.trackCount).toBe(3);
        expect(updatedGrid.trackHeaders).toHaveLength(3);
        expect(updatedGrid.trackHeaders[2]?.name).toBe('Track 3');
        expect(updatedGrid.trackHeaders[2]?.muted).toBe(false);
        expect(updatedGrid.trackHeaders[2]?.soloed).toBe(false);
        expect(updatedGrid.trackHeaders[2]?.armed).toBe(false);
      });

      it('should add a new audio track with custom name and color', () => {
        const grid = createSessionGrid(1, 1);
        const updatedGrid = addTrack(grid, 'audio', 'Vocals', '#ff0000');

        expect(updatedGrid.trackCount).toBe(2);
        expect(updatedGrid.trackHeaders[1]?.name).toBe('Vocals');
        expect(updatedGrid.trackHeaders[1]?.color).toBe('#ff0000');
      });

      it('should create empty slots for all scenes in the new track', () => {
        const grid = createSessionGrid(2, 3);
        const updatedGrid = addTrack(grid, 'midi');

        for (let sceneIndex = 0; sceneIndex < 3; sceneIndex++) {
          const position = { trackIndex: 2, sceneIndex };
          const key = gridPositionToKey(position);
          const slot = updatedGrid.slots.get(key);
          expect(slot?.state).toBe('empty');
          expect(slot?.position.trackIndex).toBe(2);
          expect(slot?.position.sceneIndex).toBe(sceneIndex);
        }
      });
    });

    describe('deleteTrack', () => {
      it('should delete a track from the grid', () => {
        const grid = createSessionGrid(3, 2);
        const updatedGrid = deleteTrack(grid, 1);

        expect(updatedGrid.trackCount).toBe(2);
        expect(updatedGrid.trackHeaders).toHaveLength(2);
        expect(updatedGrid.trackHeaders[0]?.trackIndex).toBe(0);
        expect(updatedGrid.trackHeaders[1]?.trackIndex).toBe(1);
      });

      it('should reindex tracks after deleted track', () => {
        let grid = createSessionGrid(3, 2);
        const clipId = generateContainerId();
        grid = setClipInSlot(grid, { trackIndex: 2, sceneIndex: 0 }, clipId);
        
        const updatedGrid = deleteTrack(grid, 0);
        
        // Track 2 should now be track 1
        const slot = updatedGrid.slots.get(gridPositionToKey({ trackIndex: 1, sceneIndex: 0 }));
        expect(slot?.clipId).toBe(clipId);
      });

      it('should handle invalid track index gracefully', () => {
        const grid = createSessionGrid(2, 2);
        const updatedGrid1 = deleteTrack(grid, -1);
        const updatedGrid2 = deleteTrack(grid, 10);

        expect(updatedGrid1).toEqual(grid);
        expect(updatedGrid2).toEqual(grid);
      });
    });

    describe('duplicateTrack', () => {
      it('should duplicate a track with all its clips', () => {
        let grid = createSessionGrid(2, 2);
        const clipId1 = generateContainerId();
        const clipId2 = generateContainerId();
        grid = setClipInSlot(grid, { trackIndex: 0, sceneIndex: 0 }, clipId1);
        grid = setClipInSlot(grid, { trackIndex: 0, sceneIndex: 1 }, clipId2);

        const updatedGrid = duplicateTrack(grid, 0);

        expect(updatedGrid.trackCount).toBe(3);
        expect(updatedGrid.trackHeaders[2]?.name).toBe('Track 1 (Copy)');
        
        // New track should have clips in same positions
        const slot1 = updatedGrid.slots.get(gridPositionToKey({ trackIndex: 2, sceneIndex: 0 }));
        const slot2 = updatedGrid.slots.get(gridPositionToKey({ trackIndex: 2, sceneIndex: 1 }));
        expect(slot1?.clipId).toBeDefined();
        expect(slot2?.clipId).toBeDefined();
        // Clip IDs should be different (new clips)
        expect(slot1?.clipId).not.toBe(clipId1);
        expect(slot2?.clipId).not.toBe(clipId2);
      });

      it('should copy track properties', () => {
        let grid = createSessionGrid(1, 1);
        grid = setTrackColor(grid, 0, '#00ff00');
        grid = renameTrack(grid, 0, 'My Track');

        const updatedGrid = duplicateTrack(grid, 0);

        expect(updatedGrid.trackHeaders[1]?.color).toBe('#00ff00');
        expect(updatedGrid.trackHeaders[1]?.name).toBe('My Track (Copy)');
      });
    });

    describe('reorderTrack', () => {
      it('should move a track forward', () => {
        let grid = createSessionGrid(3, 1);
        grid = renameTrack(grid, 0, 'First');
        grid = renameTrack(grid, 1, 'Second');
        grid = renameTrack(grid, 2, 'Third');

        const updatedGrid = reorderTrack(grid, 0, 2);

        expect(updatedGrid.trackHeaders[0]?.name).toBe('Second');
        expect(updatedGrid.trackHeaders[1]?.name).toBe('Third');
        expect(updatedGrid.trackHeaders[2]?.name).toBe('First');
      });

      it('should move a track backward', () => {
        let grid = createSessionGrid(3, 1);
        grid = renameTrack(grid, 0, 'First');
        grid = renameTrack(grid, 1, 'Second');
        grid = renameTrack(grid, 2, 'Third');

        const updatedGrid = reorderTrack(grid, 2, 0);

        expect(updatedGrid.trackHeaders[0]?.name).toBe('Third');
        expect(updatedGrid.trackHeaders[1]?.name).toBe('First');
        expect(updatedGrid.trackHeaders[2]?.name).toBe('Second');
      });

      it('should reindex clips correctly', () => {
        let grid = createSessionGrid(3, 1);
        const clipId = generateContainerId();
        grid = setClipInSlot(grid, { trackIndex: 0, sceneIndex: 0 }, clipId);

        const updatedGrid = reorderTrack(grid, 0, 2);

        // Clip should now be in track 2
        const slot = updatedGrid.slots.get(gridPositionToKey({ trackIndex: 2, sceneIndex: 0 }));
        expect(slot?.clipId).toBe(clipId);
      });

      it('should handle invalid indices gracefully', () => {
        const grid = createSessionGrid(2, 2);
        expect(reorderTrack(grid, -1, 1)).toEqual(grid);
        expect(reorderTrack(grid, 0, 5)).toEqual(grid);
        expect(reorderTrack(grid, 0, 0)).toEqual(grid);
      });
    });

    describe('createTrackGroup', () => {
      it('should create a track group', () => {
        const group = createTrackGroup([0, 2, 1], 'Drums', '#ff0000');

        expect(group.name).toBe('Drums');
        expect(group.color).toBe('#ff0000');
        expect(group.trackIndices).toEqual([0, 1, 2]); // Should be sorted
        expect(group.collapsed).toBe(false);
        expect(group.id).toBeDefined();
      });

      it('should sort track indices', () => {
        const group = createTrackGroup([3, 1, 2], 'Group');
        expect(group.trackIndices).toEqual([1, 2, 3]);
      });
    });

    describe('toggleTrackGroupCollapsed', () => {
      it('should toggle collapsed state', () => {
        const group = createTrackGroup([0, 1], 'Group');
        const collapsed = toggleTrackGroupCollapsed(group);
        const expanded = toggleTrackGroupCollapsed(collapsed);

        expect(collapsed.collapsed).toBe(true);
        expect(expanded.collapsed).toBe(false);
      });
    });

    describe('setTrackIcon', () => {
      it('should set track icon', () => {
        const header = {
          trackIndex: 0,
          name: 'Track 1',
          muted: false,
          soloed: false,
          armed: false,
        };
        const updated = setTrackIcon(header, '🎸');

        expect(updated.icon).toBe('🎸');
      });
    });

    describe('setTrackWidth', () => {
      it('should set track width', () => {
        const header = {
          trackIndex: 0,
          name: 'Track 1',
          muted: false,
          soloed: false,
          armed: false,
        };
        const updated = setTrackWidth(header, 200);

        expect(updated.width).toBe(200);
      });

      it('should enforce minimum width', () => {
        const header = {
          trackIndex: 0,
          name: 'Track 1',
          muted: false,
          soloed: false,
          armed: false,
        };
        const updated = setTrackWidth(header, 10);

        expect(updated.width).toBe(50);
      });
    });

    describe('freezeTrack and unfreezeTrack', () => {
      it('should freeze a track', () => {
        const header = {
          trackIndex: 0,
          name: 'Track 1',
          muted: false,
          soloed: false,
          armed: false,
        };
        const frozen = freezeTrack(header);

        expect(frozen.frozen).toBe(true);
      });

      it('should unfreeze a track', () => {
        const header = {
          trackIndex: 0,
          name: 'Track 1',
          muted: false,
          soloed: false,
          armed: false,
          frozen: true,
        };
        const unfrozen = unfreezeTrack(header);

        expect(unfrozen.frozen).toBe(false);
      });
    });

    describe('flattenTrack', () => {
      it('should return grid unchanged (placeholder)', () => {
        const grid = createSessionGrid(2, 2);
        const flattened = flattenTrack(grid, 0);

        expect(flattened).toEqual(grid);
      });
    });

    describe('setTrackMonitorMode', () => {
      it('should set monitor mode to "in"', () => {
        const header = {
          trackIndex: 0,
          name: 'Track 1',
          muted: false,
          soloed: false,
          armed: false,
        };
        const updated = setTrackMonitorMode(header, 'in');

        expect(updated.monitorMode).toBe('in');
      });

      it('should set monitor mode to "auto"', () => {
        const header = {
          trackIndex: 0,
          name: 'Track 1',
          muted: false,
          soloed: false,
          armed: false,
        };
        const updated = setTrackMonitorMode(header, 'auto');

        expect(updated.monitorMode).toBe('auto');
      });

      it('should set monitor mode to "off"', () => {
        const header = {
          trackIndex: 0,
          name: 'Track 1',
          muted: false,
          soloed: false,
          armed: false,
          monitorMode: 'in' as const,
        };
        const updated = setTrackMonitorMode(header, 'off');

        expect(updated.monitorMode).toBe('off');
      });
    });
  });

  describe('Clip Editor Integration', () => {
    describe('openClipEditorWithEnterKey', () => {
      it('should open clip editor with Enter key', () => {
        const editorState = createClipEditorState();
        const position = { trackIndex: 0, sceneIndex: 1 };
        const updated = openClipEditorWithEnterKey(editorState, position);

        expect(updated.clipSlot).toEqual(position);
        expect(updated.mode).toBe('inline');
      });
    });

    describe('closeClipEditorWithEscapeKey', () => {
      it('should close clip editor with Escape key', () => {
        const editorState = {
          ...createClipEditorState(),
          clipSlot: { trackIndex: 0, sceneIndex: 1 },
          mode: 'panel' as const,
        };
        const updated = closeClipEditorWithEscapeKey(editorState);

        expect(updated.clipSlot).toBeNull();
      });
    });

    describe('recordClipEditInHistory', () => {
      it('should record clip edit in history', () => {
        const editorState = createClipEditorState();
        const clipState = { events: [] };
        const updated = recordClipEditInHistory(editorState, clipState, 'Test edit');

        expect(updated.history).toHaveLength(1);
        expect(updated.historyIndex).toBe(0);
        expect(updated.history[0].description).toBe('Test edit');
        expect(updated.history[0].clipState).toBe(clipState);
      });

      it('should truncate history when recording after undo', () => {
        let editorState = createClipEditorState();
        editorState = recordClipEditInHistory(editorState, { events: [1] }, 'Edit 1');
        editorState = recordClipEditInHistory(editorState, { events: [1, 2] }, 'Edit 2');
        editorState = recordClipEditInHistory(editorState, { events: [1, 2, 3] }, 'Edit 3');
        
        // Simulate undo by moving historyIndex back
        editorState = { ...editorState, historyIndex: 0 };
        
        // Record new edit
        editorState = recordClipEditInHistory(editorState, { events: [1, 4] }, 'Edit 4');

        expect(editorState.history).toHaveLength(2);
        expect(editorState.historyIndex).toBe(1);
        expect(editorState.history[1].description).toBe('Edit 4');
      });
    });

    describe('createClipEditPreview', () => {
      it('should create preview with original and preview states', () => {
        const originalState = { events: [1, 2] };
        const previewState = { events: [1, 2, 3] };
        const preview = createClipEditPreview(originalState, previewState);

        expect(preview.originalState).toBe(originalState);
        expect(preview.previewState).toBe(previewState);
      });
    });

    describe('commitClipEdit', () => {
      it('should commit clip edit to history', () => {
        const editorState = createClipEditorState();
        const clipState = { events: [1, 2, 3] };
        const updated = commitClipEdit(editorState, clipState, 'Committed edit');

        expect(updated.history).toHaveLength(1);
        expect(updated.history[0].description).toBe('Committed edit');
      });
    });

    describe('cancelClipEdit', () => {
      it('should cancel edit and clear selection', () => {
        const editorState = {
          ...createClipEditorState(),
          selection: { startTick: 0, endTick: 960 } as const,
        };
        const updated = cancelClipEdit(editorState);

        expect(updated.selection).toBeUndefined();
      });

      it('should return same state if no selection', () => {
        const editorState = createClipEditorState();
        const updated = cancelClipEdit(editorState);

        expect(updated).toBe(editorState);
      });
    });

    describe('setClipEditorZoom', () => {
      it('should set zoom level', () => {
        const editorState = createClipEditorState();
        const updated = setClipEditorZoom(editorState, 2.0);

        expect(updated.zoom).toBe(2.0);
      });

      it('should clamp zoom to minimum 0.1', () => {
        const editorState = createClipEditorState();
        const updated = setClipEditorZoom(editorState, 0.05);

        expect(updated.zoom).toBe(0.1);
      });

      it('should clamp zoom to maximum 10.0', () => {
        const editorState = createClipEditorState();
        const updated = setClipEditorZoom(editorState, 20.0);

        expect(updated.zoom).toBe(10.0);
      });
    });

    describe('setClipEditorScrollPosition', () => {
      it('should set scroll position', () => {
        const editorState = createClipEditorState();
        const updated = setClipEditorScrollPosition(editorState, 1920);

        expect(updated.scrollPosition).toBe(1920);
      });

      it('should clamp scroll to minimum 0', () => {
        const editorState = createClipEditorState();
        const updated = setClipEditorScrollPosition(editorState, -100);

        expect(updated.scrollPosition).toBe(0);
      });
    });

    describe('setClipEditorSelection', () => {
      it('should set selection range', () => {
        const editorState = createClipEditorState();
        const selection = { startTick: 0, endTick: 960 };
        const updated = setClipEditorSelection(editorState, selection);

        expect(updated.selection).toEqual(selection);
      });

      it('should clear selection when undefined', () => {
        const editorState = {
          ...createClipEditorState(),
          selection: { startTick: 0, endTick: 960 } as const,
        };
        const updated = setClipEditorSelection(editorState, undefined);

        expect(updated.selection).toBeUndefined();
      });

      it('should return same state when clearing already empty selection', () => {
        const editorState = createClipEditorState();
        const updated = setClipEditorSelection(editorState, undefined);

        expect(updated).toBe(editorState);
      });
    });

    describe('copyClipEditorContent', () => {
      it('should copy selected content', () => {
        const editorState = {
          ...createClipEditorState(),
          selection: { startTick: 0, endTick: 960 },
        };
        const events = [{ id: 'ev1' }, { id: 'ev2' }];
        const copyData = copyClipEditorContent(editorState, events);

        expect(copyData).not.toBeNull();
        expect(copyData!.events).toBe(events);
        expect(copyData!.startTick).toBe(0);
        expect(copyData!.duration).toBe(960);
      });

      it('should return null when no selection', () => {
        const editorState = createClipEditorState();
        const events = [{ id: 'ev1' }];
        const copyData = copyClipEditorContent(editorState, events);

        expect(copyData).toBeNull();
      });

      it('should return null when no events', () => {
        const editorState = {
          ...createClipEditorState(),
          selection: { startTick: 0, endTick: 960 },
        };
        const copyData = copyClipEditorContent(editorState, []);

        expect(copyData).toBeNull();
      });
    });

    describe('pasteClipEditorContent', () => {
      it('should paste content at specified position', () => {
        const copyData = {
          events: [{ id: 'ev1' }, { id: 'ev2' }],
          startTick: 0,
          duration: 960,
        };
        const pasted = pasteClipEditorContent(copyData, 1920);

        expect(pasted).toBe(copyData.events);
      });
    });
  });
});
