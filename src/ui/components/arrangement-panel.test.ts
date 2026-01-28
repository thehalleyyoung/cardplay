/**
 * @fileoverview Tests for Arrangement Panel.
 */

import { describe, it, expect } from 'vitest';
import type {
  ArrangementPanelState,
  Track,
  Clip,
  TrackType,
  FollowMode,
  Marker,
  TempoPoint,
  TimeSignaturePoint,
  AutomationLane,
  AutomationPoint,
  PunchRegion
} from './arrangement-panel';
import {
  createArrangementPanelState,
  createTrack,
  createClip,
  addTrack,
  removeTrack,
  updateTrack,
  selectTrack,
  toggleTrackMute,
  toggleTrackSolo,
  toggleTrackCollapsed,
  duplicateTrack,
  reorderTrack,
  setTrackHeight,
  toggleTrackArm,
  freezeTrack,
  flattenTrack,
  toggleTrackLock,
  groupTracks,
  ungroupTracks,
  toggleTrackFolded,
  toggleTrackHidden,
  setTrackIcon,
  getVisibleTracksWithFolding,
  TRACK_ADD_OPTIONS,
  createTrackFromOption,
  addClip,
  removeClip,
  updateClip,
  moveClip,
  resizeClip,
  selectClip,
  getClipsOnTrack,
  getClipsInRange,
  tickToPixel,
  pixelToTick,
  snapToGrid,
  formatBarsBeatsTicks,
  formatTime,
  updatePlayheadPosition,
  togglePlayback,
  setPlayheadFollowMode,
  setLoopRegion,
  toggleLoopEnabled,
  clearLoopRegion,
  setScrollX,
  setScrollY,
  scrollBy,
  scrollToTick,
  scrollToTrack,
  setZoomLevel,
  zoomIn,
  zoomOut,
  zoomToFit,
  zoomToSelection,
  getVisibleTimeRange,
  getVisibleTracks,
  getVisibleClips,
  getTrackYPosition,
  calculateContentHeight,
  calculateContentWidth,
  updateContentDimensions,
  toggleSnapEnabled,
  setSnapInterval,
  toggleSidebarVisible,
  setSidebarWidth,
  SNAP_INTERVALS,
  createDefaultRuler,
  createDefaultPlayhead,
  createDefaultSidebar,
  createDefaultScrollState,
  createDefaultZoomState,
  createDefaultMinimap,
  createDefaultCursorDisplay,
  setVerticalZoomLevel,
  zoomInVertical,
  zoomOutVertical,
  createMarker,
  addMarker,
  removeMarker,
  updateMarker,
  getMarkersInRange,
  createTempoPoint,
  addTempoPoint,
  removeTempoPoint,
  updateTempoPoint,
  getTempoAtPosition,
  createTimeSignaturePoint,
  addTimeSignaturePoint,
  removeTimeSignaturePoint,
  getTimeSignatureAtPosition,
  createAutomationLane,
  createAutomationPoint,
  addAutomationLane,
  removeAutomationLane,
  updateAutomationLane,
  addAutomationPoint,
  removeAutomationPoint,
  getAutomationValueAtPosition,
  getAutomationLanesForTrack,
  createPunchRegion,
  setPunchRegion,
  togglePunchEnabled,
  clearPunchRegion,
  toggleMinimapVisible,
  setMinimapHeight,
  setMinimapPosition,
  toggleCursorDisplayVisible,
  setCursorDisplayFormat,
  setCursorDisplayPosition,
  dragClipToLane,
  dragClipToMove,
  dragClipEdgeToResize,
  ctrlDragToCopyClip,
  altDragToDuplicateClip,
  selectMultipleClips,
  groupClips,
  ungroupClips,
  splitClipAtCursor,
  joinClips,
  toggleClipMute,
  toggleClipLock,
  setClipFadeIn,
  setClipFadeOut,
  createClipCrossfade,
  setClipGain,
  timeStretchClip,
  pitchShiftClip,
  reverseClip,
  setClipColor,
  createDefaultAutomationEditState,
  createAutomationRamp,
  selectAutomationPointsInRange,
  copySelectedAutomationPoints,
  pasteAutomationPoints,
  scaleSelectedAutomationPoints,
  thinAutomationLane,
  createDefaultAutomationRecordState,
  setAutomationRecordMode,
  startAutomationRecording,
  stopAutomationRecording,
  recordAutomationPoint,
  releaseAutomationTouch,
  searchAutomationLanes,
  quickAddAutomationLane,
  collapseAutomationLanes,
  addMarkerAtPosition,
  renameMarker,
  setMarkerColor,
  moveMarker,
  snapMarkerToGrid,
  jumpToNextMarker,
  jumpToPrevMarker,
  setLocators,
  jumpToLeftLocator,
  jumpToRightLocator,
  selectLocatorRegion,
  createLoopRegionFromLocators
} from './arrangement-panel';
import { asTick, asTickDuration } from '../../types/primitives';

describe('Arrangement Panel', () => {
  describe('Factory Functions', () => {
    it('should create track with defaults', () => {
      const track = createTrack('track-1', 'Audio 1', 'audio');
      
      expect(track.id).toBe('track-1');
      expect(track.name).toBe('Audio 1');
      expect(track.type).toBe('audio');
      expect(track.height).toBe(120);
      expect(track.muted).toBe(false);
      expect(track.solo).toBe(false);
      expect(track.collapsed).toBe(false);
    });

    it('should create track with custom options', () => {
      const track = createTrack('track-2', 'MIDI 1', 'midi', {
        color: '#ff0000',
        muted: true,
        height: 80
      });
      
      expect(track.color).toBe('#ff0000');
      expect(track.muted).toBe(true);
      expect(track.height).toBe(80);
    });

    it('should create collapsed track with minimal height', () => {
      const track = createTrack('track-3', 'Collapsed', 'audio', {
        collapsed: true
      });
      
      expect(track.collapsed).toBe(true);
      expect(track.height).toBe(40);
    });

    it('should create clip with defaults', () => {
      const clip = createClip(
        'clip-1',
        'track-1',
        'Region 1',
        asTick(0),
        asTickDuration(3840)
      );
      
      expect(clip.id).toBe('clip-1');
      expect(clip.trackId).toBe('track-1');
      expect(clip.name).toBe('Region 1');
      expect(clip.start).toBe(0);
      expect(clip.duration).toBe(3840);
      expect(clip.muted).toBeUndefined();
    });

    it('should create clip with custom options', () => {
      const clip = createClip(
        'clip-2',
        'track-2',
        'Region 2',
        asTick(3840),
        asTickDuration(1920),
        {
          color: '#00ff00',
          muted: true,
          gain: 0.8,
          loopCount: 4
        }
      );
      
      expect(clip.color).toBe('#00ff00');
      expect(clip.muted).toBe(true);
      expect(clip.gain).toBe(0.8);
      expect(clip.loopCount).toBe(4);
    });

    it('should create initial arrangement state', () => {
      const state = createArrangementPanelState();
      
      expect(state.tracks).toEqual([]);
      expect(state.clips).toEqual([]);
      expect(state.ruler).toBeDefined();
      expect(state.playhead).toBeDefined();
      expect(state.loopRegion).toBeNull();
      expect(state.sidebar).toBeDefined();
      expect(state.scroll).toBeDefined();
      expect(state.zoom).toBeDefined();
      expect(state.snapEnabled).toBe(true);
    });

    it('should create default ruler', () => {
      const ruler = createDefaultRuler();
      
      expect(ruler.height).toBe(60);
      expect(ruler.pixelsPerTick).toBe(0.1);
      expect(ruler.ticksPerBeat).toBe(960);
      expect(ruler.beatsPerBar).toBe(4);
      expect(ruler.showBeats).toBe(true);
      expect(ruler.showBars).toBe(true);
    });

    it('should create default playhead', () => {
      const playhead = createDefaultPlayhead();
      
      expect(playhead.position).toBe(0);
      expect(playhead.playing).toBe(false);
      expect(playhead.followMode).toBe('page');
    });

    it('should create default sidebar', () => {
      const sidebar = createDefaultSidebar();
      
      expect(sidebar.width).toBe(200);
      expect(sidebar.visible).toBe(true);
      expect(sidebar.showMeters).toBe(true);
    });

    it('should create default scroll state', () => {
      const scroll = createDefaultScrollState();
      
      expect(scroll.scrollX).toBe(0);
      expect(scroll.scrollY).toBe(0);
      expect(scroll.viewportWidth).toBe(800);
      expect(scroll.viewportHeight).toBe(600);
    });

    it('should create default zoom state', () => {
      const zoom = createDefaultZoomState();
      
      expect(zoom.level).toBe(1.0);
      expect(zoom.min).toBe(0.1);
      expect(zoom.max).toBe(10.0);
      expect(zoom.step).toBe(0.1);
    });
  });

  describe('Track Operations', () => {
    it('should add track to state', () => {
      const state = createArrangementPanelState();
      const track = createTrack('track-1', 'Audio 1', 'audio');
      
      const updated = addTrack(state, track);
      
      expect(updated.tracks).toHaveLength(1);
      expect(updated.tracks[0].id).toBe('track-1');
    });

    it('should add multiple tracks', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Audio 1', 'audio'));
      state = addTrack(state, createTrack('track-2', 'MIDI 1', 'midi'));
      
      expect(state.tracks).toHaveLength(2);
    });

    it('should remove track from state', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Audio 1', 'audio'));
      state = addTrack(state, createTrack('track-2', 'MIDI 1', 'midi'));
      
      const updated = removeTrack(state, 'track-1');
      
      expect(updated.tracks).toHaveLength(1);
      expect(updated.tracks[0].id).toBe('track-2');
    });

    it('should remove track clips when track removed', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Audio 1', 'audio'));
      state = addClip(state, createClip('clip-1', 'track-1', 'Region', asTick(0), asTickDuration(960)));
      
      const updated = removeTrack(state, 'track-1');
      
      expect(updated.clips).toHaveLength(0);
    });

    it('should update track properties', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Audio 1', 'audio'));
      
      const updated = updateTrack(state, 'track-1', {
        name: 'Renamed Track',
        color: '#ff0000'
      });
      
      const track = updated.tracks[0];
      expect(track.name).toBe('Renamed Track');
      expect(track.color).toBe('#ff0000');
    });

    it('should select track exclusively', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio'));
      state = addTrack(state, createTrack('track-2', 'Track 2', 'midi'));
      
      const updated = selectTrack(state, 'track-2', false);
      
      expect(updated.selectedTrackIds).toEqual(['track-2']);
      expect(updated.tracks[0].selected).toBe(false);
      expect(updated.tracks[1].selected).toBe(true);
    });

    it('should select track additively', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio'));
      state = addTrack(state, createTrack('track-2', 'Track 2', 'midi'));
      state = selectTrack(state, 'track-1', false);
      
      const updated = selectTrack(state, 'track-2', true);
      
      expect(updated.selectedTrackIds).toHaveLength(2);
      expect(updated.selectedTrackIds).toContain('track-1');
      expect(updated.selectedTrackIds).toContain('track-2');
    });

    it('should toggle track mute', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio'));
      
      const updated = toggleTrackMute(state, 'track-1');
      
      expect(updated.tracks[0].muted).toBe(true);
    });

    it('should toggle track solo', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio'));
      
      const updated = toggleTrackSolo(state, 'track-1');
      
      expect(updated.tracks[0].solo).toBe(true);
    });

    it('should toggle track collapsed', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio'));
      
      const updated = toggleTrackCollapsed(state, 'track-1');
      
      expect(updated.tracks[0].collapsed).toBe(true);
      expect(updated.tracks[0].height).toBe(40);
    });

    it('should uncollapse track', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio', { collapsed: true }));
      
      const updated = toggleTrackCollapsed(state, 'track-1');
      
      expect(updated.tracks[0].collapsed).toBe(false);
      expect(updated.tracks[0].height).toBe(120);
    });

    it('should duplicate track', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Original Track', 'audio'));
      
      const updated = duplicateTrack(state, 'track-1', 'track-2');
      
      expect(updated.tracks).toHaveLength(2);
      expect(updated.tracks[1].id).toBe('track-2');
      expect(updated.tracks[1].name).toBe('Original Track (Copy)');
      expect(updated.tracks[1].type).toBe('audio');
    });

    it('should duplicate track with clips', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio'));
      state = addClip(state, createClip('clip-1', 'track-1', 'Region', asTick(0), asTickDuration(960)));
      state = addClip(state, createClip('clip-2', 'track-1', 'Region', asTick(960), asTickDuration(960)));
      
      const updated = duplicateTrack(state, 'track-1', 'track-2');
      
      expect(updated.tracks).toHaveLength(2);
      const duplicatedClips = updated.clips.filter(c => c.trackId === 'track-2');
      expect(duplicatedClips).toHaveLength(2);
      expect(duplicatedClips[0].start).toBe(asTick(0));
      expect(duplicatedClips[1].start).toBe(asTick(960));
    });

    it('should reorder track to new position', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio'));
      state = addTrack(state, createTrack('track-2', 'Track 2', 'midi'));
      state = addTrack(state, createTrack('track-3', 'Track 3', 'instrument'));
      
      const updated = reorderTrack(state, 'track-1', 2);
      
      expect(updated.tracks[0].id).toBe('track-2');
      expect(updated.tracks[1].id).toBe('track-3');
      expect(updated.tracks[2].id).toBe('track-1');
    });

    it('should reorder track upwards', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio'));
      state = addTrack(state, createTrack('track-2', 'Track 2', 'midi'));
      state = addTrack(state, createTrack('track-3', 'Track 3', 'instrument'));
      
      const updated = reorderTrack(state, 'track-3', 0);
      
      expect(updated.tracks[0].id).toBe('track-3');
      expect(updated.tracks[1].id).toBe('track-1');
      expect(updated.tracks[2].id).toBe('track-2');
    });

    it('should set track height', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio'));
      
      const updated = setTrackHeight(state, 'track-1', 200);
      
      expect(updated.tracks[0].height).toBe(200);
    });

    it('should clamp track height to min', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio'));
      
      const updated = setTrackHeight(state, 'track-1', 10);
      
      expect(updated.tracks[0].height).toBe(40);
    });

    it('should clamp track height to max', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio'));
      
      const updated = setTrackHeight(state, 'track-1', 500);
      
      expect(updated.tracks[0].height).toBe(400);
    });

    it('should toggle track arm', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio'));
      
      const updated = toggleTrackArm(state, 'track-1');
      
      expect(updated.tracks[0].armed).toBe(true);
    });

    it('should freeze track', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'instrument'));
      
      const updated = freezeTrack(state, 'track-1');
      
      expect(updated.tracks[0].type).toBe('audio');
    });

    it('should flatten track', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'midi'));
      
      const updated = flattenTrack(state, 'track-1');
      
      expect(updated.tracks[0].type).toBe('audio');
    });

    it('should toggle track lock', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio'));
      state = addClip(state, createClip('clip-1', 'track-1', 'Region', asTick(0), asTickDuration(960)));
      
      const updated = toggleTrackLock(state, 'track-1');
      
      expect(updated.clips[0].locked).toBe(true);
    });

    it('should unlock all clips on track', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio'));
      state = addClip(state, {
        ...createClip('clip-1', 'track-1', 'Region', asTick(0), asTickDuration(960)),
        locked: true
      });
      
      const updated = toggleTrackLock(state, 'track-1');
      
      expect(updated.clips[0].locked).toBe(false);
    });

    it('should create track from add menu option', () => {
      const option = TRACK_ADD_OPTIONS[0]; // Audio track
      const track = createTrackFromOption(option, 'My Audio Track');
      
      expect(track.type).toBe('audio');
      expect(track.name).toBe('My Audio Track');
    });

    it('should create track from option with default name', () => {
      const option = TRACK_ADD_OPTIONS[1]; // MIDI track
      const track = createTrackFromOption(option);
      
      expect(track.type).toBe('midi');
      expect(track.name).toBe('MIDI Track');
    });

    it('should group tracks under folder', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio'));
      state = addTrack(state, createTrack('track-2', 'Track 2', 'midi'));
      
      const updated = groupTracks(state, ['track-1', 'track-2'], 'folder-1');
      
      const track1 = updated.tracks.find(t => t.id === 'track-1');
      const track2 = updated.tracks.find(t => t.id === 'track-2');
      const folder = updated.tracks.find(t => t.id === 'folder-1');
      
      expect(track1?.parentId).toBe('folder-1');
      expect(track2?.parentId).toBe('folder-1');
      expect(folder?.type).toBe('folder');
      expect(folder?.childIds).toContain('track-1');
      expect(folder?.childIds).toContain('track-2');
    });

    it('should create folder track when grouping', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio'));
      state = addTrack(state, createTrack('track-2', 'Track 2', 'midi'));
      
      const updated = groupTracks(state, ['track-1', 'track-2']);
      
      const folderTracks = updated.tracks.filter(t => t.type === 'folder');
      expect(folderTracks).toHaveLength(1);
      expect(folderTracks[0].childIds).toHaveLength(2);
    });

    it('should ungroup tracks', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio', { parentId: 'folder-1' }));
      state = addTrack(state, createTrack('track-2', 'Track 2', 'midi', { parentId: 'folder-1' }));
      
      const updated = ungroupTracks(state, ['track-1']);
      
      const track1 = updated.tracks.find(t => t.id === 'track-1');
      expect(track1?.parentId).toBeUndefined();
    });

    it('should toggle folder track folded state', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('folder-1', 'Folder', 'folder', { 
        childIds: ['track-1', 'track-2'] 
      }));
      
      const updated = toggleTrackFolded(state, 'folder-1');
      
      expect(updated.tracks[0].folded).toBe(true);
    });

    it('should not fold non-folder track', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio'));
      
      const updated = toggleTrackFolded(state, 'track-1');
      
      expect(updated).toEqual(state);
    });

    it('should toggle track hidden state', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio'));
      
      const updated = toggleTrackHidden(state, 'track-1');
      
      expect(updated.tracks[0].hidden).toBe(true);
    });

    it('should set track icon', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio'));
      
      const updated = setTrackIcon(state, 'track-1', '🎸');
      
      expect(updated.tracks[0].icon).toBe('🎸');
    });

    it('should get visible tracks excluding hidden', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio'));
      state = addTrack(state, createTrack('track-2', 'Track 2', 'midi', { hidden: true }));
      state = addTrack(state, createTrack('track-3', 'Track 3', 'instrument'));
      
      const visible = getVisibleTracksWithFolding(state);
      
      expect(visible).toHaveLength(2);
      expect(visible.find(t => t.id === 'track-2')).toBeUndefined();
    });

    it('should hide children of folded folders', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('folder-1', 'Folder', 'folder', { 
        folded: true,
        childIds: ['track-1', 'track-2']
      }));
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio', { parentId: 'folder-1' }));
      state = addTrack(state, createTrack('track-2', 'Track 2', 'midi', { parentId: 'folder-1' }));
      state = addTrack(state, createTrack('track-3', 'Track 3', 'instrument'));
      
      const visible = getVisibleTracksWithFolding(state);
      
      expect(visible).toHaveLength(2);
      expect(visible.find(t => t.id === 'folder-1')).toBeDefined();
      expect(visible.find(t => t.id === 'track-3')).toBeDefined();
      expect(visible.find(t => t.id === 'track-1')).toBeUndefined();
      expect(visible.find(t => t.id === 'track-2')).toBeUndefined();
    });
  });

  describe('Clip Operations', () => {
    it('should add clip to state', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio'));
      
      const clip = createClip('clip-1', 'track-1', 'Region', asTick(0), asTickDuration(960));
      const updated = addClip(state, clip);
      
      expect(updated.clips).toHaveLength(1);
      expect(updated.clips[0].id).toBe('clip-1');
    });

    it('should remove clip from state', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio'));
      state = addClip(state, createClip('clip-1', 'track-1', 'Region 1', asTick(0), asTickDuration(960)));
      state = addClip(state, createClip('clip-2', 'track-1', 'Region 2', asTick(960), asTickDuration(960)));
      
      const updated = removeClip(state, 'clip-1');
      
      expect(updated.clips).toHaveLength(1);
      expect(updated.clips[0].id).toBe('clip-2');
    });

    it('should update clip properties', () => {
      let state = createArrangementPanelState();
      state = addClip(state, createClip('clip-1', 'track-1', 'Region', asTick(0), asTickDuration(960)));
      
      const updated = updateClip(state, 'clip-1', {
        name: 'Renamed Clip',
        color: '#00ff00'
      });
      
      expect(updated.clips[0].name).toBe('Renamed Clip');
      expect(updated.clips[0].color).toBe('#00ff00');
    });

    it('should move clip without snapping', () => {
      let state = createArrangementPanelState({ snapEnabled: false });
      state = addClip(state, createClip('clip-1', 'track-1', 'Region', asTick(0), asTickDuration(960)));
      
      const updated = moveClip(state, 'clip-1', asTick(1234));
      
      expect(updated.clips[0].start).toBe(1234);
    });

    it('should move clip with snapping', () => {
      let state = createArrangementPanelState({
        snapEnabled: true,
        snapInterval: asTickDuration(960)
      });
      state = addClip(state, createClip('clip-1', 'track-1', 'Region', asTick(0), asTickDuration(960)));
      
      const updated = moveClip(state, 'clip-1', asTick(1234));
      
      expect(updated.clips[0].start).toBe(960);
    });

    it('should move clip to different track', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio'));
      state = addTrack(state, createTrack('track-2', 'Track 2', 'midi'));
      state = addClip(state, createClip('clip-1', 'track-1', 'Region', asTick(0), asTickDuration(960)));
      
      const updated = moveClip(state, 'clip-1', asTick(0), 'track-2');
      
      expect(updated.clips[0].trackId).toBe('track-2');
    });

    it('should resize clip', () => {
      let state = createArrangementPanelState({ snapEnabled: false });
      state = addClip(state, createClip('clip-1', 'track-1', 'Region', asTick(0), asTickDuration(960)));
      
      const updated = resizeClip(state, 'clip-1', asTickDuration(1920));
      
      expect(updated.clips[0].duration).toBe(1920);
    });

    it('should resize clip with snapping', () => {
      let state = createArrangementPanelState({
        snapEnabled: true,
        snapInterval: asTickDuration(960)
      });
      state = addClip(state, createClip('clip-1', 'track-1', 'Region', asTick(0), asTickDuration(960)));
      
      const updated = resizeClip(state, 'clip-1', asTickDuration(1234));
      
      expect(updated.clips[0].duration).toBe(960);
    });

    it('should select clip exclusively', () => {
      let state = createArrangementPanelState();
      state = addClip(state, createClip('clip-1', 'track-1', 'Region 1', asTick(0), asTickDuration(960)));
      state = addClip(state, createClip('clip-2', 'track-1', 'Region 2', asTick(960), asTickDuration(960)));
      
      const updated = selectClip(state, 'clip-2', false);
      
      expect(updated.selectedClipIds).toEqual(['clip-2']);
      expect(updated.clips[0].selected).toBe(false);
      expect(updated.clips[1].selected).toBe(true);
    });

    it('should select clip additively', () => {
      let state = createArrangementPanelState();
      state = addClip(state, createClip('clip-1', 'track-1', 'Region 1', asTick(0), asTickDuration(960)));
      state = addClip(state, createClip('clip-2', 'track-1', 'Region 2', asTick(960), asTickDuration(960)));
      state = selectClip(state, 'clip-1', false);
      
      const updated = selectClip(state, 'clip-2', true);
      
      expect(updated.selectedClipIds).toHaveLength(2);
      expect(updated.selectedClipIds).toContain('clip-1');
      expect(updated.selectedClipIds).toContain('clip-2');
    });

    it('should get clips on track', () => {
      let state = createArrangementPanelState();
      state = addClip(state, createClip('clip-1', 'track-1', 'Region 1', asTick(0), asTickDuration(960)));
      state = addClip(state, createClip('clip-2', 'track-2', 'Region 2', asTick(0), asTickDuration(960)));
      state = addClip(state, createClip('clip-3', 'track-1', 'Region 3', asTick(960), asTickDuration(960)));
      
      const clips = getClipsOnTrack(state, 'track-1');
      
      expect(clips).toHaveLength(2);
      expect(clips.map(c => c.id)).toEqual(['clip-1', 'clip-3']);
    });

    it('should get clips in time range', () => {
      let state = createArrangementPanelState();
      state = addClip(state, createClip('clip-1', 'track-1', 'Region 1', asTick(0), asTickDuration(960)));
      state = addClip(state, createClip('clip-2', 'track-1', 'Region 2', asTick(960), asTickDuration(960)));
      state = addClip(state, createClip('clip-3', 'track-1', 'Region 3', asTick(3840), asTickDuration(960)));
      
      const clips = getClipsInRange(state, asTick(500), asTick(2000));
      
      expect(clips).toHaveLength(2);
      expect(clips.map(c => c.id)).toEqual(['clip-1', 'clip-2']);
    });
  });

  describe('Timeline & Ruler Operations', () => {
    it('should convert tick to pixel', () => {
      const ruler = createDefaultRuler();
      const pixel = tickToPixel(asTick(960), ruler);
      
      expect(pixel).toBe(96);
    });

    it('should convert pixel to tick', () => {
      const ruler = createDefaultRuler();
      const tick = pixelToTick(96, ruler);
      
      expect(tick).toBe(960);
    });

    it('should snap to grid', () => {
      const snapped = snapToGrid(asTick(1234), asTickDuration(960));
      
      expect(snapped).toBe(960);
    });

    it('should snap to nearest grid line', () => {
      const snapped = snapToGrid(asTick(1700), asTickDuration(960));
      
      expect(snapped).toBe(1920);
    });

    it('should format bars:beats:ticks', () => {
      const formatted = formatBarsBeatsTicks(asTick(3840), 960, 4);
      
      expect(formatted).toBe('2:1:000');
    });

    it('should format bars:beats:ticks with tick offset', () => {
      const formatted = formatBarsBeatsTicks(asTick(4560), 960, 4);
      
      expect(formatted).toBe('2:1:720');
    });

    it('should format time', () => {
      const formatted = formatTime(asTick(960), 960, 120);
      
      expect(formatted).toBe('00:00:00.500');
    });

    it('should format time with hours', () => {
      const formatted = formatTime(asTick(960 * 120 * 60), 960, 120);
      
      expect(formatted).toBe('01:00:00.000');
    });
  });

  describe('Playhead Operations', () => {
    it('should update playhead position', () => {
      const state = createArrangementPanelState();
      const updated = updatePlayheadPosition(state, asTick(1920));
      
      expect(updated.playhead.position).toBe(1920);
    });

    it('should toggle playback', () => {
      const state = createArrangementPanelState();
      const updated = togglePlayback(state);
      
      expect(updated.playhead.playing).toBe(true);
    });

    it('should set playhead follow mode', () => {
      const state = createArrangementPanelState();
      const updated = setPlayheadFollowMode(state, 'continuous');
      
      expect(updated.playhead.followMode).toBe('continuous');
    });

    it('should auto-scroll in page mode when playhead reaches edge', () => {
      let state = createArrangementPanelState({
        scroll: {
          scrollX: 0,
          scrollY: 0,
          viewportWidth: 800,
          viewportHeight: 600,
          contentWidth: 10000,
          contentHeight: 1000
        }
      });
      state = setPlayheadFollowMode(state, 'page');
      
      // Move playhead beyond viewport
      const updated = updatePlayheadPosition(state, asTick(10000));
      
      expect(updated.scroll.scrollX).toBeGreaterThan(0);
    });

    it('should auto-scroll in continuous mode', () => {
      let state = createArrangementPanelState({
        scroll: {
          scrollX: 0,
          scrollY: 0,
          viewportWidth: 800,
          viewportHeight: 600,
          contentWidth: 10000,
          contentHeight: 1000
        }
      });
      state = setPlayheadFollowMode(state, 'continuous');
      
      const updated = updatePlayheadPosition(state, asTick(5000));
      
      expect(updated.scroll.scrollX).toBeGreaterThan(0);
    });
  });

  describe('Loop Region Operations', () => {
    it('should set loop region', () => {
      const state = createArrangementPanelState();
      const updated = setLoopRegion(state, asTick(0), asTick(3840));
      
      expect(updated.loopRegion).toBeDefined();
      expect(updated.loopRegion?.start).toBe(0);
      expect(updated.loopRegion?.end).toBe(3840);
      expect(updated.loopRegion?.enabled).toBe(true);
    });

    it('should swap start and end if reversed', () => {
      const state = createArrangementPanelState();
      const updated = setLoopRegion(state, asTick(3840), asTick(0));
      
      expect(updated.loopRegion?.start).toBe(0);
      expect(updated.loopRegion?.end).toBe(3840);
    });

    it('should toggle loop enabled', () => {
      let state = createArrangementPanelState();
      state = setLoopRegion(state, asTick(0), asTick(3840));
      
      const updated = toggleLoopEnabled(state);
      
      expect(updated.loopRegion?.enabled).toBe(false);
    });

    it('should clear loop region', () => {
      let state = createArrangementPanelState();
      state = setLoopRegion(state, asTick(0), asTick(3840));
      
      const updated = clearLoopRegion(state);
      
      expect(updated.loopRegion).toBeNull();
    });
  });

  describe('Scroll Operations', () => {
    it('should set horizontal scroll', () => {
      const state = createArrangementPanelState();
      const updated = setScrollX(state, 500);
      
      expect(updated.scroll.scrollX).toBe(500);
    });

    it('should clamp horizontal scroll to max', () => {
      const state = createArrangementPanelState({
        scroll: {
          scrollX: 0,
          scrollY: 0,
          viewportWidth: 800,
          viewportHeight: 600,
          contentWidth: 2000,
          contentHeight: 1000
        }
      });
      
      const updated = setScrollX(state, 5000);
      
      expect(updated.scroll.scrollX).toBe(1200);
    });

    it('should clamp horizontal scroll to min', () => {
      const state = createArrangementPanelState();
      const updated = setScrollX(state, -100);
      
      expect(updated.scroll.scrollX).toBe(0);
    });

    it('should set vertical scroll', () => {
      const state = createArrangementPanelState();
      const updated = setScrollY(state, 300);
      
      expect(updated.scroll.scrollY).toBe(300);
    });

    it('should clamp vertical scroll to max', () => {
      const state = createArrangementPanelState({
        scroll: {
          scrollX: 0,
          scrollY: 0,
          viewportWidth: 800,
          viewportHeight: 600,
          contentWidth: 10000,
          contentHeight: 1000
        }
      });
      
      const updated = setScrollY(state, 5000);
      
      expect(updated.scroll.scrollY).toBe(400);
    });

    it('should scroll by delta', () => {
      let state = createArrangementPanelState();
      state = setScrollX(state, 100);
      state = setScrollY(state, 50);
      
      const updated = scrollBy(state, 20, 30);
      
      expect(updated.scroll.scrollX).toBe(120);
      expect(updated.scroll.scrollY).toBe(80);
    });

    it('should scroll to tick', () => {
      const state = createArrangementPanelState();
      const updated = scrollToTick(state, asTick(5000), false);
      
      expect(updated.scroll.scrollX).toBe(500);
    });

    it('should scroll to tick centered', () => {
      const state = createArrangementPanelState();
      const updated = scrollToTick(state, asTick(5000), true);
      
      expect(updated.scroll.scrollX).toBe(100);
    });

    it('should scroll to track', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio', { height: 100 }));
      state = addTrack(state, createTrack('track-2', 'Track 2', 'midi', { height: 120 }));
      state = addTrack(state, createTrack('track-3', 'Track 3', 'audio', { height: 80 }));
      
      const updated = scrollToTrack(state, 'track-3', false);
      
      const expectedY = 60 + 100 + 120;
      expect(updated.scroll.scrollY).toBe(expectedY);
    });
  });

  describe('Zoom Operations', () => {
    it('should set zoom level', () => {
      const state = createArrangementPanelState();
      const updated = setZoomLevel(state, 2.0);
      
      expect(updated.zoom.level).toBe(2.0);
      expect(updated.ruler.zoomLevel).toBe(2.0);
    });

    it('should clamp zoom to min', () => {
      const state = createArrangementPanelState();
      const updated = setZoomLevel(state, 0.01);
      
      expect(updated.zoom.level).toBe(0.1);
    });

    it('should clamp zoom to max', () => {
      const state = createArrangementPanelState();
      const updated = setZoomLevel(state, 100.0);
      
      expect(updated.zoom.level).toBe(10.0);
    });

    it('should zoom in', () => {
      const state = createArrangementPanelState();
      const updated = zoomIn(state);
      
      expect(updated.zoom.level).toBe(1.1);
    });

    it('should zoom out', () => {
      const state = createArrangementPanelState();
      const updated = zoomOut(state);
      
      expect(updated.zoom.level).toBe(0.9);
    });

    it('should zoom to fit all clips', () => {
      let state = createArrangementPanelState();
      state = addClip(state, createClip('clip-1', 'track-1', 'Region', asTick(0), asTickDuration(3840)));
      
      const updated = zoomToFit(state);
      
      expect(updated.zoom.level).toBeGreaterThan(0);
    });

    it('should zoom to fit with no clips', () => {
      const state = createArrangementPanelState();
      const updated = zoomToFit(state);
      
      expect(updated.zoom.level).toBe(1.0);
    });

    it('should zoom to selection', () => {
      let state = createArrangementPanelState();
      state = addClip(state, createClip('clip-1', 'track-1', 'Region', asTick(0), asTickDuration(960)));
      state = selectClip(state, 'clip-1');
      
      const updated = zoomToSelection(state);
      
      expect(updated.zoom.level).toBeGreaterThan(0);
    });

    it('should not zoom to selection if no clips selected', () => {
      const state = createArrangementPanelState();
      const updated = zoomToSelection(state);
      
      expect(updated.zoom.level).toBe(state.zoom.level);
    });
  });

  describe('View Calculations', () => {
    it('should get visible time range', () => {
      const state = createArrangementPanelState({
        scroll: {
          scrollX: 500,
          scrollY: 0,
          viewportWidth: 800,
          viewportHeight: 600,
          contentWidth: 10000,
          contentHeight: 1000
        }
      });
      
      const range = getVisibleTimeRange(state);
      
      expect(range.start).toBe(5000);
      expect(range.end).toBe(13000);
    });

    it('should get visible tracks', () => {
      let state = createArrangementPanelState({
        scroll: {
          scrollX: 0,
          scrollY: 100,
          viewportWidth: 800,
          viewportHeight: 600,
          contentWidth: 10000,
          contentHeight: 1000
        }
      });
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio', { height: 80 }));
      state = addTrack(state, createTrack('track-2', 'Track 2', 'midi', { height: 100 }));
      state = addTrack(state, createTrack('track-3', 'Track 3', 'audio', { height: 120 }));
      
      const visible = getVisibleTracks(state);
      
      expect(visible.length).toBeGreaterThan(0);
    });

    it('should get visible clips', () => {
      let state = createArrangementPanelState({
        scroll: {
          scrollX: 0,
          scrollY: 0,
          viewportWidth: 800,
          viewportHeight: 600,
          contentWidth: 10000,
          contentHeight: 1000
        }
      });
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio'));
      state = addClip(state, createClip('clip-1', 'track-1', 'Region 1', asTick(0), asTickDuration(960)));
      state = addClip(state, createClip('clip-2', 'track-1', 'Region 2', asTick(50000), asTickDuration(960)));
      
      const visible = getVisibleClips(state);
      
      expect(visible).toHaveLength(1);
      expect(visible[0].id).toBe('clip-1');
    });

    it('should get track Y position', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio', { height: 100 }));
      state = addTrack(state, createTrack('track-2', 'Track 2', 'midi', { height: 120 }));
      
      const y = getTrackYPosition(state, 'track-2');
      
      expect(y).toBe(160);
    });

    it('should return -1 for non-existent track Y position', () => {
      const state = createArrangementPanelState();
      const y = getTrackYPosition(state, 'nonexistent');
      
      expect(y).toBe(-1);
    });

    it('should calculate content height', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio', { height: 100 }));
      state = addTrack(state, createTrack('track-2', 'Track 2', 'midi', { height: 120 }));
      
      const height = calculateContentHeight(state);
      
      expect(height).toBe(280);
    });

    it('should calculate content width', () => {
      let state = createArrangementPanelState();
      state = addClip(state, createClip('clip-1', 'track-1', 'Region', asTick(0), asTickDuration(5000)));
      
      const width = calculateContentWidth(state);
      
      expect(width).toBeGreaterThan(0);
    });

    it('should update content dimensions', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio', { height: 100 }));
      state = addClip(state, createClip('clip-1', 'track-1', 'Region', asTick(0), asTickDuration(5000)));
      
      const updated = updateContentDimensions(state);
      
      expect(updated.scroll.contentHeight).toBeGreaterThan(0);
      expect(updated.scroll.contentWidth).toBeGreaterThan(0);
    });
  });

  describe('Grid & Snap Operations', () => {
    it('should toggle snap enabled', () => {
      const state = createArrangementPanelState({ snapEnabled: true });
      const updated = toggleSnapEnabled(state);
      
      expect(updated.snapEnabled).toBe(false);
    });

    it('should set snap interval', () => {
      const state = createArrangementPanelState();
      const updated = setSnapInterval(state, SNAP_INTERVALS.EIGHTH);
      
      expect(updated.snapInterval).toBe(480);
    });

    it('should have correct snap interval presets', () => {
      expect(SNAP_INTERVALS.QUARTER).toBe(960);
      expect(SNAP_INTERVALS.EIGHTH).toBe(480);
      expect(SNAP_INTERVALS.SIXTEENTH).toBe(240);
      expect(SNAP_INTERVALS.THIRTY_SECOND).toBe(120);
      expect(SNAP_INTERVALS.BAR).toBe(3840);
      expect(SNAP_INTERVALS.HALF).toBe(1920);
    });
  });

  describe('Sidebar Operations', () => {
    it('should toggle sidebar visibility', () => {
      const state = createArrangementPanelState();
      const updated = toggleSidebarVisible(state);
      
      expect(updated.sidebar.visible).toBe(false);
    });

    it('should set sidebar width', () => {
      const state = createArrangementPanelState();
      const updated = setSidebarWidth(state, 300);
      
      expect(updated.sidebar.width).toBe(300);
    });

    it('should clamp sidebar width to min', () => {
      const state = createArrangementPanelState();
      const updated = setSidebarWidth(state, 50);
      
      expect(updated.sidebar.width).toBe(100);
    });

    it('should clamp sidebar width to max', () => {
      const state = createArrangementPanelState();
      const updated = setSidebarWidth(state, 500);
      
      expect(updated.sidebar.width).toBe(400);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complex multi-track arrangement', () => {
      let state = createArrangementPanelState();
      
      state = addTrack(state, createTrack('drums', 'Drums', 'audio'));
      state = addTrack(state, createTrack('bass', 'Bass', 'midi'));
      state = addTrack(state, createTrack('lead', 'Lead', 'instrument'));
      
      state = addClip(state, createClip('drums-1', 'drums', 'Drum Loop', asTick(0), asTickDuration(3840)));
      state = addClip(state, createClip('bass-1', 'bass', 'Bass Line', asTick(0), asTickDuration(3840)));
      state = addClip(state, createClip('lead-1', 'lead', 'Lead Melody', asTick(3840), asTickDuration(3840)));
      
      expect(state.tracks).toHaveLength(3);
      expect(state.clips).toHaveLength(3);
      
      const drumsClips = getClipsOnTrack(state, 'drums');
      expect(drumsClips).toHaveLength(1);
      
      const firstBarClips = getClipsInRange(state, asTick(0), asTick(3840));
      expect(firstBarClips).toHaveLength(2);
    });

    it('should handle playback with loop region', () => {
      let state = createArrangementPanelState();
      state = setLoopRegion(state, asTick(0), asTick(7680));
      state = updatePlayheadPosition(state, asTick(0));
      state = togglePlayback(state);
      
      expect(state.playhead.playing).toBe(true);
      expect(state.loopRegion?.enabled).toBe(true);
      
      state = updatePlayheadPosition(state, asTick(3840));
      expect(state.playhead.position).toBe(3840);
    });

    it('should handle zoom and scroll coordination', () => {
      let state = createArrangementPanelState();
      state = addClip(state, createClip('clip-1', 'track-1', 'Region', asTick(0), asTickDuration(10000)));
      
      state = zoomIn(state);
      state = scrollToTick(state, asTick(5000), true);
      
      expect(state.zoom.level).toBeGreaterThan(1.0);
      expect(state.scroll.scrollX).toBeGreaterThan(0);
    });

    it('should handle track selection and clip operations', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio'));
      state = addTrack(state, createTrack('track-2', 'Track 2', 'midi'));
      
      state = selectTrack(state, 'track-1');
      state = addClip(state, createClip('clip-1', 'track-1', 'Region', asTick(0), asTickDuration(960)));
      state = selectClip(state, 'clip-1');
      
      expect(state.selectedTrackIds).toContain('track-1');
      expect(state.selectedClipIds).toContain('clip-1');
    });
  });

  describe('Vertical Zoom', () => {
    it('should set vertical zoom level', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio'));
      
      const initialHeight = state.tracks[0].height;
      state = setVerticalZoomLevel(state, 2.0);
      
      expect(state.zoom.verticalLevel).toBe(2.0);
      expect(state.tracks[0].height).toBeGreaterThan(initialHeight);
    });

    it('should zoom in vertically', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio'));
      
      const initialLevel = state.zoom.verticalLevel;
      state = zoomInVertical(state);
      
      expect(state.zoom.verticalLevel).toBeGreaterThan(initialLevel);
    });

    it('should zoom out vertically', () => {
      let state = createArrangementPanelState();
      state = addTrack(state, createTrack('track-1', 'Track 1', 'audio'));
      state = setVerticalZoomLevel(state, 2.0);
      
      state = zoomOutVertical(state);
      
      expect(state.zoom.verticalLevel).toBeLessThan(2.0);
    });

    it('should clamp vertical zoom to min/max', () => {
      let state = createArrangementPanelState();
      
      state = setVerticalZoomLevel(state, 10.0);
      expect(state.zoom.verticalLevel).toBe(state.zoom.verticalMax);
      
      state = setVerticalZoomLevel(state, 0.1);
      expect(state.zoom.verticalLevel).toBe(state.zoom.verticalMin);
    });
  });

  describe('Markers', () => {
    it('should create marker with defaults', () => {
      const marker = createMarker('marker-1', 'Intro', asTick(0));
      
      expect(marker.id).toBe('marker-1');
      expect(marker.name).toBe('Intro');
      expect(marker.position).toBe(0);
      expect(marker.type).toBe('cue');
    });

    it('should add marker to timeline', () => {
      let state = createArrangementPanelState();
      const marker = createMarker('marker-1', 'Verse', asTick(3840));
      
      state = addMarker(state, marker);
      
      expect(state.markers).toHaveLength(1);
      expect(state.markers[0].name).toBe('Verse');
    });

    it('should keep markers sorted by position', () => {
      let state = createArrangementPanelState();
      
      state = addMarker(state, createMarker('m3', 'End', asTick(7680)));
      state = addMarker(state, createMarker('m1', 'Start', asTick(0)));
      state = addMarker(state, createMarker('m2', 'Middle', asTick(3840)));
      
      expect(state.markers[0].position).toBe(0);
      expect(state.markers[1].position).toBe(3840);
      expect(state.markers[2].position).toBe(7680);
    });

    it('should remove marker', () => {
      let state = createArrangementPanelState();
      state = addMarker(state, createMarker('marker-1', 'Test', asTick(0)));
      
      state = removeMarker(state, 'marker-1');
      
      expect(state.markers).toHaveLength(0);
    });

    it('should update marker', () => {
      let state = createArrangementPanelState();
      state = addMarker(state, createMarker('marker-1', 'Test', asTick(0)));
      
      state = updateMarker(state, 'marker-1', { name: 'Updated', position: asTick(960) });
      
      expect(state.markers[0].name).toBe('Updated');
      expect(state.markers[0].position).toBe(960);
    });

    it('should get markers in range', () => {
      let state = createArrangementPanelState();
      state = addMarker(state, createMarker('m1', 'Start', asTick(0)));
      state = addMarker(state, createMarker('m2', 'Middle', asTick(3840)));
      state = addMarker(state, createMarker('m3', 'End', asTick(7680)));
      
      const markersInRange = getMarkersInRange(state, asTick(1000), asTick(5000));
      
      expect(markersInRange).toHaveLength(1);
      expect(markersInRange[0].name).toBe('Middle');
    });
  });

  describe('Tempo Track', () => {
    it('should create tempo point', () => {
      const tempo = createTempoPoint(asTick(0), 120);
      
      expect(tempo.position).toBe(0);
      expect(tempo.bpm).toBe(120);
      expect(tempo.curve).toBe('instant');
    });

    it('should add tempo point', () => {
      let state = createArrangementPanelState();
      
      state = addTempoPoint(state, createTempoPoint(asTick(0), 120));
      
      expect(state.tempoTrack).toHaveLength(1);
    });

    it('should keep tempo points sorted', () => {
      let state = createArrangementPanelState();
      
      state = addTempoPoint(state, createTempoPoint(asTick(7680), 140));
      state = addTempoPoint(state, createTempoPoint(asTick(0), 120));
      state = addTempoPoint(state, createTempoPoint(asTick(3840), 130));
      
      expect(state.tempoTrack[0].bpm).toBe(120);
      expect(state.tempoTrack[1].bpm).toBe(130);
      expect(state.tempoTrack[2].bpm).toBe(140);
    });

    it('should get tempo at position', () => {
      let state = createArrangementPanelState();
      state = addTempoPoint(state, createTempoPoint(asTick(0), 120));
      state = addTempoPoint(state, createTempoPoint(asTick(3840), 140));
      
      expect(getTempoAtPosition(state, asTick(0))).toBe(120);
      expect(getTempoAtPosition(state, asTick(2000))).toBe(120);
      expect(getTempoAtPosition(state, asTick(4000))).toBe(140);
    });

    it('should clamp tempo to valid range', () => {
      const tooSlow = createTempoPoint(asTick(0), 10);
      const tooFast = createTempoPoint(asTick(0), 1000);
      
      expect(tooSlow.bpm).toBe(20);
      expect(tooFast.bpm).toBe(999);
    });
  });

  describe('Time Signature Track', () => {
    it('should create time signature point', () => {
      const timeSig = createTimeSignaturePoint(asTick(0), 4, 4);
      
      expect(timeSig.position).toBe(0);
      expect(timeSig.numerator).toBe(4);
      expect(timeSig.denominator).toBe(4);
    });

    it('should add time signature point', () => {
      let state = createArrangementPanelState();
      
      state = addTimeSignaturePoint(state, createTimeSignaturePoint(asTick(0), 4, 4));
      
      expect(state.timeSignatureTrack).toHaveLength(1);
    });

    it('should get time signature at position', () => {
      let state = createArrangementPanelState();
      state = addTimeSignaturePoint(state, createTimeSignaturePoint(asTick(0), 4, 4));
      state = addTimeSignaturePoint(state, createTimeSignaturePoint(asTick(7680), 3, 4));
      
      const beforeChange = getTimeSignatureAtPosition(state, asTick(5000));
      const afterChange = getTimeSignatureAtPosition(state, asTick(8000));
      
      expect(beforeChange.numerator).toBe(4);
      expect(afterChange.numerator).toBe(3);
    });

    it('should validate time signature values', () => {
      const timeSig = createTimeSignaturePoint(asTick(0), 7, 8);
      
      expect(timeSig.numerator).toBe(7);
      expect(timeSig.denominator).toBe(8);
    });
  });

  describe('Automation Lanes', () => {
    it('should create automation lane', () => {
      const lane = createAutomationLane('lane-1', 'track-1', 'volume', 'Volume');
      
      expect(lane.id).toBe('lane-1');
      expect(lane.trackId).toBe('track-1');
      expect(lane.parameter).toBe('volume');
      expect(lane.visible).toBe(true);
    });

    it('should add automation lane', () => {
      let state = createArrangementPanelState();
      const lane = createAutomationLane('lane-1', 'track-1', 'volume', 'Volume');
      
      state = addAutomationLane(state, lane);
      
      expect(state.automationLanes).toHaveLength(1);
    });

    it('should add automation point', () => {
      let state = createArrangementPanelState();
      const lane = createAutomationLane('lane-1', 'track-1', 'volume', 'Volume');
      state = addAutomationLane(state, lane);
      
      const point = createAutomationPoint(asTick(0), 0.8);
      state = addAutomationPoint(state, 'lane-1', point);
      
      expect(state.automationLanes[0].points).toHaveLength(1);
      expect(state.automationLanes[0].points[0].value).toBe(0.8);
    });

    it('should interpolate automation values', () => {
      const lane = createAutomationLane('lane-1', 'track-1', 'volume', 'Volume', {
        points: [
          createAutomationPoint(asTick(0), 0.0, 'linear'),
          createAutomationPoint(asTick(1000), 1.0, 'linear')
        ]
      });
      
      const midValue = getAutomationValueAtPosition(lane, asTick(500));
      
      expect(midValue).toBeCloseTo(0.5, 2);
    });

    it('should handle step curve', () => {
      const lane = createAutomationLane('lane-1', 'track-1', 'volume', 'Volume', {
        points: [
          createAutomationPoint(asTick(0), 0.0, 'step'),
          createAutomationPoint(asTick(1000), 1.0, 'step')
        ]
      });
      
      const value = getAutomationValueAtPosition(lane, asTick(999));
      
      expect(value).toBe(0.0);
    });

    it('should get automation lanes for track', () => {
      let state = createArrangementPanelState();
      state = addAutomationLane(state, createAutomationLane('lane-1', 'track-1', 'volume', 'Volume'));
      state = addAutomationLane(state, createAutomationLane('lane-2', 'track-1', 'pan', 'Pan'));
      state = addAutomationLane(state, createAutomationLane('lane-3', 'track-2', 'volume', 'Volume'));
      
      const track1Lanes = getAutomationLanesForTrack(state, 'track-1');
      
      expect(track1Lanes).toHaveLength(2);
    });

    it('should clamp automation values to 0-1', () => {
      const point1 = createAutomationPoint(asTick(0), -0.5);
      const point2 = createAutomationPoint(asTick(0), 1.5);
      
      expect(point1.value).toBe(0);
      expect(point2.value).toBe(1);
    });
  });

  describe('Punch Region', () => {
    it('should create punch region', () => {
      const punch = createPunchRegion(asTick(3840), asTick(7680));
      
      expect(punch.punchIn).toBe(3840);
      expect(punch.punchOut).toBe(7680);
      expect(punch.enabled).toBe(true);
    });

    it('should set punch region', () => {
      let state = createArrangementPanelState();
      const punch = createPunchRegion(asTick(0), asTick(3840));
      
      state = setPunchRegion(state, punch);
      
      expect(state.punchRegion).not.toBeNull();
      expect(state.punchRegion?.punchIn).toBe(0);
    });

    it('should toggle punch enabled', () => {
      let state = createArrangementPanelState();
      state = setPunchRegion(state, createPunchRegion(asTick(0), asTick(3840)));
      
      state = togglePunchEnabled(state);
      
      expect(state.punchRegion?.enabled).toBe(false);
    });

    it('should clear punch region', () => {
      let state = createArrangementPanelState();
      state = setPunchRegion(state, createPunchRegion(asTick(0), asTick(3840)));
      
      state = clearPunchRegion(state);
      
      expect(state.punchRegion).toBeNull();
    });
  });

  describe('Minimap', () => {
    it('should toggle minimap visibility', () => {
      let state = createArrangementPanelState();
      const initialVisible = state.minimap.visible;
      
      state = toggleMinimapVisible(state);
      
      expect(state.minimap.visible).toBe(!initialVisible);
    });

    it('should set minimap height', () => {
      let state = createArrangementPanelState();
      
      state = setMinimapHeight(state, 100);
      
      expect(state.minimap.height).toBe(100);
    });

    it('should clamp minimap height', () => {
      let state = createArrangementPanelState();
      
      state = setMinimapHeight(state, 300);
      expect(state.minimap.height).toBe(200);
      
      state = setMinimapHeight(state, 20);
      expect(state.minimap.height).toBe(40);
    });

    it('should set minimap position', () => {
      let state = createArrangementPanelState();
      
      state = setMinimapPosition(state, 'top');
      
      expect(state.minimap.position).toBe('top');
    });
  });

  describe('Cursor Display', () => {
    it('should toggle cursor display visibility', () => {
      let state = createArrangementPanelState();
      const initialVisible = state.cursorDisplay.visible;
      
      state = toggleCursorDisplayVisible(state);
      
      expect(state.cursorDisplay.visible).toBe(!initialVisible);
    });

    it('should set cursor display format', () => {
      let state = createArrangementPanelState();
      
      state = setCursorDisplayFormat(state, 'time');
      
      expect(state.cursorDisplay.format).toBe('time');
    });

    it('should set cursor display position', () => {
      let state = createArrangementPanelState();
      
      state = setCursorDisplayPosition(state, 'bottom-right');
      
      expect(state.cursorDisplay.position).toBe('bottom-right');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete arrangement with all features', () => {
      let state = createArrangementPanelState();
      
      // Add tracks
      state = addTrack(state, createTrack('drums', 'Drums', 'audio'));
      state = addTrack(state, createTrack('bass', 'Bass', 'instrument'));
      
      // Add markers
      state = addMarker(state, createMarker('intro', 'Intro', asTick(0)));
      state = addMarker(state, createMarker('verse', 'Verse', asTick(7680)));
      
      // Add tempo changes
      state = addTempoPoint(state, createTempoPoint(asTick(0), 120));
      state = addTempoPoint(state, createTempoPoint(asTick(15360), 140));
      
      // Add automation
      const volumeLane = createAutomationLane('vol-1', 'drums', 'volume', 'Volume');
      state = addAutomationLane(state, volumeLane);
      state = addAutomationPoint(state, 'vol-1', createAutomationPoint(asTick(0), 0.5));
      
      // Set punch region
      state = setPunchRegion(state, createPunchRegion(asTick(7680), asTick(15360)));
      
      // Apply vertical zoom
      state = setVerticalZoomLevel(state, 1.5);
      
      expect(state.tracks).toHaveLength(2);
      expect(state.markers).toHaveLength(2);
      expect(state.tempoTrack).toHaveLength(2);
      expect(state.automationLanes).toHaveLength(1);
      expect(state.punchRegion).not.toBeNull();
      expect(state.zoom.verticalLevel).toBe(1.5);
    });
  });

  // ============================================================================
  // Clip Arrangement Operations (currentsteps.md lines 2741-2760)
  // ============================================================================

  describe('Clip Arrangement Operations', () => {
    // Helper function to create a basic test state with two tracks
    function createTestState() {
      const track1 = createTrack('track1', 'Track 1', 'audio');
      const track2 = createTrack('track2', 'Track 2', 'audio');
      return createArrangementPanelState({ tracks: [track1, track2] });
    }

    describe('dragClipToLane', () => {
      it('should move clip to a different track', () => {
        const state = createTestState();
        const clip = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(960));
        let newState = addClip(state, clip);
        
        newState = dragClipToLane(newState, 'clip1', 'track2');
        
        const movedClip = newState.clips.find(c => c.id === 'clip1');
        expect(movedClip?.trackId).toBe('track2');
      });
    });

    describe('dragClipToMove', () => {
      it('should move clip to new position', () => {
        const state = createTestState();
        const clip = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(960));
        let newState = addClip(state, clip);
        
        newState = dragClipToMove(newState, 'clip1', asTick(1920));
        
        const movedClip = newState.clips.find(c => c.id === 'clip1');
        expect(movedClip?.start).toBe(1920);
      });

      it('should move clip to new position and track', () => {
        const state = createTestState();
        const clip = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(960));
        let newState = addClip(state, clip);
        
        newState = dragClipToMove(newState, 'clip1', asTick(1920), 'track2');
        
        const movedClip = newState.clips.find(c => c.id === 'clip1');
        expect(movedClip?.start).toBe(1920);
        expect(movedClip?.trackId).toBe('track2');
      });
    });

    describe('dragClipEdgeToResize', () => {
      it('should resize clip from start edge', () => {
        const state = createTestState();
        const clip = createClip('clip1', 'track1', 'Clip 1', asTick(960), asTickDuration(1920));
        let newState = addClip(state, clip);
        
        newState = dragClipEdgeToResize(newState, 'clip1', 'start', asTick(0));
        
        const resizedClip = newState.clips.find(c => c.id === 'clip1');
        expect(resizedClip?.start).toBe(0);
        expect(resizedClip?.duration).toBe(2880); // 960 + 1920
      });

      it('should resize clip from end edge', () => {
        const state = createTestState();
        const clip = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(1920));
        let newState = addClip(state, clip);
        
        newState = dragClipEdgeToResize(newState, 'clip1', 'end', asTick(3840));
        
        const resizedClip = newState.clips.find(c => c.id === 'clip1');
        expect(resizedClip?.start).toBe(0);
        expect(resizedClip?.duration).toBe(3840);
      });

      it('should respect minimum duration', () => {
        const state = createTestState();
        const clip = createClip('clip1', 'track1', 'Clip 1', asTick(960), asTickDuration(1920));
        let newState = addClip(state, clip);
        
        // Try to resize to less than snap interval
        newState = dragClipEdgeToResize(newState, 'clip1', 'end', asTick(1000));
        
        const resizedClip = newState.clips.find(c => c.id === 'clip1');
        expect(resizedClip?.duration).toBeGreaterThanOrEqual(state.snapInterval);
      });
    });

    describe('ctrlDragToCopyClip', () => {
      it('should create a copy of clip at new position', () => {
        const state = createTestState();
        const clip = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(960));
        let newState = addClip(state, clip);
        
        newState = ctrlDragToCopyClip(newState, 'clip1', asTick(1920));
        
        expect(newState.clips).toHaveLength(2);
        const copiedClip = newState.clips.find(c => c.id !== 'clip1');
        expect(copiedClip?.start).toBe(1920);
        expect(copiedClip?.name).toContain('Copy');
      });

      it('should copy clip to different track', () => {
        const state = createTestState();
        const clip = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(960));
        let newState = addClip(state, clip);
        
        newState = ctrlDragToCopyClip(newState, 'clip1', asTick(1920), 'track2');
        
        expect(newState.clips).toHaveLength(2);
        const copiedClip = newState.clips.find(c => c.id !== 'clip1');
        expect(copiedClip?.trackId).toBe('track2');
      });
    });

    describe('selectMultipleClips', () => {
      it('should select multiple clips', () => {
        const state = createTestState();
        const clip1 = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(960));
        const clip2 = createClip('clip2', 'track1', 'Clip 2', asTick(960), asTickDuration(960));
        let newState = addClip(addClip(state, clip1), clip2);
        
        newState = selectMultipleClips(newState, ['clip1', 'clip2']);
        
        expect(newState.selectedClipIds).toEqual(['clip1', 'clip2']);
        expect(newState.clips.find(c => c.id === 'clip1')?.selected).toBe(true);
        expect(newState.clips.find(c => c.id === 'clip2')?.selected).toBe(true);
      });

      it('should add to existing selection when additive', () => {
        const state = createTestState();
        const clip1 = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(960));
        const clip2 = createClip('clip2', 'track1', 'Clip 2', asTick(960), asTickDuration(960));
        const clip3 = createClip('clip3', 'track1', 'Clip 3', asTick(1920), asTickDuration(960));
        let newState = addClip(addClip(addClip(state, clip1), clip2), clip3);
        
        newState = selectMultipleClips(newState, ['clip1']);
        newState = selectMultipleClips(newState, ['clip2', 'clip3'], true);
        
        expect(newState.selectedClipIds).toEqual(['clip1', 'clip2', 'clip3']);
      });
    });

    describe('groupClips', () => {
      it('should create a clip group', () => {
        const state = createTestState();
        const clip1 = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(960));
        const clip2 = createClip('clip2', 'track1', 'Clip 2', asTick(960), asTickDuration(960));
        let newState = addClip(addClip(state, clip1), clip2);
        
        newState = groupClips(newState, ['clip1', 'clip2'], 'My Group');
        
        expect(newState.clipGroups).toHaveLength(1);
        expect(newState.clipGroups[0].name).toBe('My Group');
        expect(newState.clipGroups[0].clipIds).toEqual(['clip1', 'clip2']);
      });

      it('should auto-generate group name if not provided', () => {
        const state = createTestState();
        const clip1 = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(960));
        let newState = addClip(state, clip1);
        
        newState = groupClips(newState, ['clip1']);
        
        expect(newState.clipGroups).toHaveLength(1);
        expect(newState.clipGroups[0].name).toContain('Group');
      });
    });

    describe('ungroupClips', () => {
      it('should remove a clip group', () => {
        const state = createTestState();
        const clip1 = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(960));
        let newState = addClip(state, clip1);
        
        newState = groupClips(newState, ['clip1'], 'My Group');
        const groupId = newState.clipGroups[0].id;
        
        newState = ungroupClips(newState, groupId);
        
        expect(newState.clipGroups).toHaveLength(0);
      });
    });

    describe('splitClipAtCursor', () => {
      it('should split clip into two clips', () => {
        const state = createTestState();
        const clip = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(1920));
        let newState = addClip(state, clip);
        
        newState = splitClipAtCursor(newState, 'clip1', asTick(960));
        
        expect(newState.clips).toHaveLength(2);
        const firstClip = newState.clips.find(c => c.id === 'clip1');
        const secondClip = newState.clips.find(c => c.id !== 'clip1');
        
        expect(firstClip?.duration).toBe(960);
        expect(secondClip?.start).toBe(960);
        expect(secondClip?.duration).toBe(960);
      });

      it('should not split if position is outside clip bounds', () => {
        const state = createTestState();
        const clip = createClip('clip1', 'track1', 'Clip 1', asTick(960), asTickDuration(1920));
        let newState = addClip(state, clip);
        
        newState = splitClipAtCursor(newState, 'clip1', asTick(0));
        
        expect(newState.clips).toHaveLength(1);
      });
    });

    describe('joinClips', () => {
      it('should join two adjacent clips', () => {
        const state = createTestState();
        const clip1 = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(960));
        const clip2 = createClip('clip2', 'track1', 'Clip 2', asTick(960), asTickDuration(960));
        let newState = addClip(addClip(state, clip1), clip2);
        
        newState = joinClips(newState, 'clip1', 'clip2');
        
        expect(newState.clips).toHaveLength(1);
        const joinedClip = newState.clips[0];
        expect(joinedClip.start).toBe(0);
        expect(joinedClip.duration).toBe(1920);
        expect(joinedClip.name).toContain('+');
      });

      it('should not join non-adjacent clips', () => {
        const state = createTestState();
        const clip1 = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(960));
        const clip2 = createClip('clip2', 'track1', 'Clip 2', asTick(2000), asTickDuration(960));
        let newState = addClip(addClip(state, clip1), clip2);
        
        newState = joinClips(newState, 'clip1', 'clip2');
        
        expect(newState.clips).toHaveLength(2);
      });

      it('should not join clips on different tracks', () => {
        const state = createTestState();
        const clip1 = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(960));
        const clip2 = createClip('clip2', 'track2', 'Clip 2', asTick(960), asTickDuration(960));
        let newState = addClip(addClip(state, clip1), clip2);
        
        newState = joinClips(newState, 'clip1', 'clip2');
        
        expect(newState.clips).toHaveLength(2);
      });
    });

    describe('toggleClipMute', () => {
      it('should mute an unmuted clip', () => {
        const state = createTestState();
        const clip = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(960));
        let newState = addClip(state, clip);
        
        newState = toggleClipMute(newState, 'clip1');
        
        const mutedClip = newState.clips.find(c => c.id === 'clip1');
        expect(mutedClip?.muted).toBe(true);
      });

      it('should unmute a muted clip', () => {
        const state = createTestState();
        const clip = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(960), { muted: true });
        let newState = addClip(state, clip);
        
        newState = toggleClipMute(newState, 'clip1');
        
        const unmutedClip = newState.clips.find(c => c.id === 'clip1');
        expect(unmutedClip?.muted).toBe(false);
      });
    });

    describe('toggleClipLock', () => {
      it('should lock an unlocked clip', () => {
        const state = createTestState();
        const clip = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(960));
        let newState = addClip(state, clip);
        
        newState = toggleClipLock(newState, 'clip1');
        
        const lockedClip = newState.clips.find(c => c.id === 'clip1');
        expect(lockedClip?.locked).toBe(true);
      });

      it('should unlock a locked clip', () => {
        const state = createTestState();
        const clip = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(960), { locked: true });
        let newState = addClip(state, clip);
        
        newState = toggleClipLock(newState, 'clip1');
        
        const unlockedClip = newState.clips.find(c => c.id === 'clip1');
        expect(unlockedClip?.locked).toBe(false);
      });
    });

    describe('setClipFadeIn', () => {
      it('should set fade in duration', () => {
        const state = createTestState();
        const clip = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(1920));
        let newState = addClip(state, clip);
        
        newState = setClipFadeIn(newState, 'clip1', asTickDuration(480));
        
        const fadeClip = newState.clips.find(c => c.id === 'clip1');
        expect(fadeClip?.fadeIn).toBe(480);
      });

      it('should clamp fade in to clip duration', () => {
        const state = createTestState();
        const clip = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(960));
        let newState = addClip(state, clip);
        
        newState = setClipFadeIn(newState, 'clip1', asTickDuration(2000));
        
        const fadeClip = newState.clips.find(c => c.id === 'clip1');
        expect(fadeClip?.fadeIn).toBeLessThanOrEqual(960);
      });
    });

    describe('setClipFadeOut', () => {
      it('should set fade out duration', () => {
        const state = createTestState();
        const clip = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(1920));
        let newState = addClip(state, clip);
        
        newState = setClipFadeOut(newState, 'clip1', asTickDuration(480));
        
        const fadeClip = newState.clips.find(c => c.id === 'clip1');
        expect(fadeClip?.fadeOut).toBe(480);
      });
    });

    describe('createClipCrossfade', () => {
      it('should create crossfade between adjacent clips', () => {
        const state = createTestState();
        const clip1 = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(1920));
        const clip2 = createClip('clip2', 'track1', 'Clip 2', asTick(1920), asTickDuration(1920));
        let newState = addClip(addClip(state, clip1), clip2);
        
        newState = createClipCrossfade(newState, 'clip1', 'clip2', asTickDuration(480));
        
        const firstClip = newState.clips.find(c => c.id === 'clip1');
        const secondClip = newState.clips.find(c => c.id === 'clip2');
        expect(firstClip?.fadeOut).toBe(480);
        expect(secondClip?.fadeIn).toBe(480);
      });

      it('should not crossfade non-adjacent clips', () => {
        const state = createTestState();
        const clip1 = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(960));
        const clip2 = createClip('clip2', 'track1', 'Clip 2', asTick(2000), asTickDuration(960));
        let newState = addClip(addClip(state, clip1), clip2);
        
        newState = createClipCrossfade(newState, 'clip1', 'clip2', asTickDuration(480));
        
        const firstClip = newState.clips.find(c => c.id === 'clip1');
        const secondClip = newState.clips.find(c => c.id === 'clip2');
        expect(firstClip?.fadeOut).toBeUndefined();
        expect(secondClip?.fadeIn).toBeUndefined();
      });
    });

    describe('setClipGain', () => {
      it('should set clip gain', () => {
        const state = createTestState();
        const clip = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(960));
        let newState = addClip(state, clip);
        
        newState = setClipGain(newState, 'clip1', 0.5);
        
        const gainClip = newState.clips.find(c => c.id === 'clip1');
        expect(gainClip?.gain).toBe(0.5);
      });

      it('should clamp gain to valid range', () => {
        const state = createTestState();
        const clip = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(960));
        let newState = addClip(state, clip);
        
        newState = setClipGain(newState, 'clip1', 10.0);
        
        const gainClip = newState.clips.find(c => c.id === 'clip1');
        expect(gainClip?.gain).toBeLessThanOrEqual(4.0);
      });
    });

    describe('timeStretchClip', () => {
      it('should time-stretch clip', () => {
        const state = createTestState();
        const clip = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(1920));
        let newState = addClip(state, clip);
        
        newState = timeStretchClip(newState, 'clip1', 2.0);
        
        const stretchedClip = newState.clips.find(c => c.id === 'clip1');
        expect(stretchedClip?.duration).toBe(3840);
        expect(stretchedClip?.name).toContain('2.00x');
      });
    });

    describe('pitchShiftClip', () => {
      it('should pitch-shift clip up', () => {
        const state = createTestState();
        const clip = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(960));
        let newState = addClip(state, clip);
        
        newState = pitchShiftClip(newState, 'clip1', 5);
        
        const shiftedClip = newState.clips.find(c => c.id === 'clip1');
        expect(shiftedClip?.name).toContain('+5st');
      });

      it('should pitch-shift clip down', () => {
        const state = createTestState();
        const clip = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(960));
        let newState = addClip(state, clip);
        
        newState = pitchShiftClip(newState, 'clip1', -3);
        
        const shiftedClip = newState.clips.find(c => c.id === 'clip1');
        expect(shiftedClip?.name).toContain('-3st');
      });
    });

    describe('reverseClip', () => {
      it('should reverse clip', () => {
        const state = createTestState();
        const clip = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(960), {
          fadeIn: asTickDuration(240),
          fadeOut: asTickDuration(480)
        });
        let newState = addClip(state, clip);
        
        newState = reverseClip(newState, 'clip1');
        
        const reversedClip = newState.clips.find(c => c.id === 'clip1');
        expect(reversedClip?.name).toContain('Reversed');
        expect(reversedClip?.fadeIn).toBe(480);
        expect(reversedClip?.fadeOut).toBe(240);
      });

      it('should toggle reversed state', () => {
        const state = createTestState();
        const clip = createClip('clip1', 'track1', 'Clip 1 (Reversed)', asTick(0), asTickDuration(960));
        let newState = addClip(state, clip);
        
        newState = reverseClip(newState, 'clip1');
        
        const unreversedClip = newState.clips.find(c => c.id === 'clip1');
        expect(unreversedClip?.name).not.toContain('Reversed');
      });
    });

    describe('setClipColor', () => {
      it('should set clip color', () => {
        const state = createTestState();
        const clip = createClip('clip1', 'track1', 'Clip 1', asTick(0), asTickDuration(960));
        let newState = addClip(state, clip);
        
        newState = setClipColor(newState, 'clip1', '#FF0000');
        
        const coloredClip = newState.clips.find(c => c.id === 'clip1');
        expect(coloredClip?.color).toBe('#FF0000');
      });
    });
  });

  describe('Automation Features (Steps 2792-2801)', () => {
    // Helper function to create a basic test state with tracks
    function createTestState() {
      const track1 = createTrack('track1', 'Track 1', 'audio');
      return createArrangementPanelState({ tracks: [track1] });
    }

    describe('createAutomationRamp', () => {
      it('should create linear ramp between two points', () => {
        const state = createTestState();
        const lane = createAutomationLane('lane1', 'track1', 'volume', 'Volume');
        let newState = addAutomationLane(state, lane);
        
        const editState = { 
          ...createDefaultAutomationEditState(), 
          mode: 'ramp' as const,
          activeLaneId: 'lane1'
        };
        
        const result = createAutomationRamp(newState, editState, asTick(0), 0.0, asTick(960), 1.0);
        
        const updatedLane = result.state.automationLanes.find(l => l.id === 'lane1');
        expect(updatedLane?.points).toHaveLength(2);
        expect(updatedLane?.points[0]?.position).toBe(0);
        expect(updatedLane?.points[0]?.value).toBe(0.0);
        expect(updatedLane?.points[1]?.position).toBe(960);
        expect(updatedLane?.points[1]?.value).toBe(1.0);
        expect(updatedLane?.points[0]?.curve).toBe('linear');
      });

      it('should remove intermediate points when creating ramp', () => {
        const state = createTestState();
        const points = [
          createAutomationPoint(asTick(0), 0.0, 'linear'),
          createAutomationPoint(asTick(240), 0.5, 'linear'),
          createAutomationPoint(asTick(480), 0.3, 'linear'),
          createAutomationPoint(asTick(960), 1.0, 'linear')
        ];
        const lane = createAutomationLane('lane1', 'track1', 'volume', 'Volume', { points });
        let newState = addAutomationLane(state, lane);
        
        const editState = {
          ...createDefaultAutomationEditState(),
          mode: 'ramp' as const,
          activeLaneId: 'lane1'
        };
        
        const result = createAutomationRamp(newState, editState, asTick(0), 0.0, asTick(960), 1.0);
        
        const updatedLane = result.state.automationLanes.find(l => l.id === 'lane1');
        expect(updatedLane?.points).toHaveLength(2);
      });

      it('should not create ramp if mode is not ramp', () => {
        const state = createTestState();
        const lane = createAutomationLane('lane1', 'track1', 'volume', 'Volume');
        let newState = addAutomationLane(state, lane);
        
        const editState = {
          ...createDefaultAutomationEditState(),
          mode: 'select' as const,
          activeLaneId: 'lane1'
        };
        
        const result = createAutomationRamp(newState, editState, asTick(0), 0.0, asTick(960), 1.0);
        
        expect(result.state).toBe(newState);
      });
    });

    describe('selectAutomationPointsInRange', () => {
      it('should select points in range', () => {
        const state = createTestState();
        const points = [
          createAutomationPoint(asTick(0), 0.0, 'linear'),
          createAutomationPoint(asTick(240), 0.5, 'linear'),
          createAutomationPoint(asTick(480), 0.7, 'linear'),
          createAutomationPoint(asTick(960), 1.0, 'linear')
        ];
        const lane = createAutomationLane('lane1', 'track1', 'volume', 'Volume', { points });
        let newState = addAutomationLane(state, lane);
        
        const editState = {
          ...createDefaultAutomationEditState(),
          mode: 'select' as const
        };
        
        const result = selectAutomationPointsInRange(newState, editState, 'lane1', asTick(200), asTick(500));
        
        expect(result.selectedPoints).toHaveLength(2);
        expect(result.selectedPoints[0]?.position).toBe(240);
        expect(result.selectedPoints[1]?.position).toBe(480);
      });

      it('should append to selection when append is true', () => {
        const state = createTestState();
        const points = [
          createAutomationPoint(asTick(0), 0.0, 'linear'),
          createAutomationPoint(asTick(480), 0.7, 'linear')
        ];
        const lane = createAutomationLane('lane1', 'track1', 'volume', 'Volume', { points });
        let newState = addAutomationLane(state, lane);
        
        let editState = {
          ...createDefaultAutomationEditState(),
          mode: 'select' as const,
          selectedPoints: [{ laneId: 'lane1', position: asTick(0) }]
        };
        
        editState = selectAutomationPointsInRange(newState, editState, 'lane1', asTick(400), asTick(500), true);
        
        expect(editState.selectedPoints).toHaveLength(2);
      });
    });

    describe('copySelectedAutomationPoints', () => {
      it('should copy selected points to clipboard', () => {
        const state = createTestState();
        const points = [
          createAutomationPoint(asTick(240), 0.5, 'linear'),
          createAutomationPoint(asTick(480), 0.7, 'smooth')
        ];
        const lane = createAutomationLane('lane1', 'track1', 'volume', 'Volume', { points });
        let newState = addAutomationLane(state, lane);
        
        const editState = {
          ...createDefaultAutomationEditState(),
          selectedPoints: [
            { laneId: 'lane1', position: asTick(240) },
            { laneId: 'lane1', position: asTick(480) }
          ]
        };
        
        const clipboard = copySelectedAutomationPoints(newState, editState);
        
        expect(clipboard).not.toBeNull();
        expect(clipboard?.points).toHaveLength(2);
        expect(clipboard?.referencePosition).toBe(240);
        expect(clipboard?.points[0]?.relativePosition).toBe(0);
        expect(clipboard?.points[1]?.relativePosition).toBe(240);
      });

      it('should return null if no points selected', () => {
        const state = createTestState();
        const editState = createDefaultAutomationEditState();
        
        const clipboard = copySelectedAutomationPoints(state, editState);
        
        expect(clipboard).toBeNull();
      });
    });

    describe('pasteAutomationPoints', () => {
      it('should paste points at target position', () => {
        const state = createTestState();
        const lane = createAutomationLane('lane1', 'track1', 'volume', 'Volume');
        let newState = addAutomationLane(state, lane);
        
        const clipboard = {
          points: [
            { laneId: 'lane1', relativePosition: 0, value: 0.5, curve: 'linear' as const },
            { laneId: 'lane1', relativePosition: 240, value: 0.7, curve: 'smooth' as const }
          ],
          referencePosition: asTick(240)
        };
        
        const editState = createDefaultAutomationEditState();
        const result = pasteAutomationPoints(newState, editState, clipboard, asTick(960));
        
        const updatedLane = result.state.automationLanes.find(l => l.id === 'lane1');
        expect(updatedLane?.points).toHaveLength(2);
        expect(updatedLane?.points[0]?.position).toBe(960);
        expect(updatedLane?.points[1]?.position).toBe(1200);
        expect(result.editState.selectedPoints).toHaveLength(2);
      });
    });

    describe('scaleSelectedAutomationPoints', () => {
      it('should scale points around center', () => {
        const state = createTestState();
        const points = [
          createAutomationPoint(asTick(0), 0.2, 'linear'),
          createAutomationPoint(asTick(240), 0.5, 'linear'),
          createAutomationPoint(asTick(480), 0.8, 'linear')
        ];
        const lane = createAutomationLane('lane1', 'track1', 'volume', 'Volume', { points });
        let newState = addAutomationLane(state, lane);
        
        const editState = {
          ...createDefaultAutomationEditState(),
          selectedPoints: points.map(p => ({ laneId: 'lane1', position: p.position }))
        };
        
        const result = scaleSelectedAutomationPoints(newState, editState, 2.0, 'center');
        
        const updatedLane = result.state.automationLanes.find(l => l.id === 'lane1');
        expect(updatedLane?.points[0]?.value).toBeCloseTo(0.0);
        expect(updatedLane?.points[1]?.value).toBeCloseTo(0.5);
        expect(updatedLane?.points[2]?.value).toBeCloseTo(1.0);
      });

      it('should clamp scaled values to 0-1 range', () => {
        const state = createTestState();
        const points = [
          createAutomationPoint(asTick(0), 0.9, 'linear')
        ];
        const lane = createAutomationLane('lane1', 'track1', 'volume', 'Volume', { points });
        let newState = addAutomationLane(state, lane);
        
        const editState = {
          ...createDefaultAutomationEditState(),
          selectedPoints: [{ laneId: 'lane1', position: asTick(0) }]
        };
        
        const result = scaleSelectedAutomationPoints(newState, editState, 5.0);
        
        const updatedLane = result.state.automationLanes.find(l => l.id === 'lane1');
        expect(updatedLane?.points[0]?.value).toBeLessThanOrEqual(1.0);
      });
    });

    describe('thinAutomationLane', () => {
      it('should remove unnecessary points', () => {
        const state = createTestState();
        const points = [
          createAutomationPoint(asTick(0), 0.0, 'linear'),
          createAutomationPoint(asTick(240), 0.25, 'linear'),
          createAutomationPoint(asTick(480), 0.5, 'linear'),
          createAutomationPoint(asTick(720), 0.75, 'linear'),
          createAutomationPoint(asTick(960), 1.0, 'linear')
        ];
        const lane = createAutomationLane('lane1', 'track1', 'volume', 'Volume', { points });
        let newState = addAutomationLane(state, lane);
        
        newState = thinAutomationLane(newState, 'lane1', 0.01);
        
        const updatedLane = newState.automationLanes.find(l => l.id === 'lane1');
        expect(updatedLane?.points.length).toBeLessThan(5);
        expect(updatedLane?.points[0]?.position).toBe(0);
        expect(updatedLane?.points[updatedLane.points.length - 1]?.position).toBe(960);
      });

      it('should keep curves that deviate significantly', () => {
        const state = createTestState();
        const points = [
          createAutomationPoint(asTick(0), 0.0, 'linear'),
          createAutomationPoint(asTick(240), 0.1, 'linear'),
          createAutomationPoint(asTick(480), 0.9, 'linear'),  // Significant deviation
          createAutomationPoint(asTick(720), 0.8, 'linear'),
          createAutomationPoint(asTick(960), 1.0, 'linear')
        ];
        const lane = createAutomationLane('lane1', 'track1', 'volume', 'Volume', { points });
        let newState = addAutomationLane(state, lane);
        
        newState = thinAutomationLane(newState, 'lane1', 0.1);
        
        const updatedLane = newState.automationLanes.find(l => l.id === 'lane1');
        const hasDeviationPoint = updatedLane?.points.some(p => p.position === 480);
        expect(hasDeviationPoint).toBe(true);
      });
    });

    describe('Automation Recording Modes', () => {
      describe('createDefaultAutomationRecordState', () => {
        it('should create default record state in read mode', () => {
          const recordState = createDefaultAutomationRecordState();
          
          expect(recordState.mode).toBe('read');
          expect(recordState.recording).toBe(false);
          expect(recordState.activeLaneIds).toHaveLength(0);
        });
      });

      describe('setAutomationRecordMode', () => {
        it('should set record mode', () => {
          let recordState = createDefaultAutomationRecordState();
          
          recordState = setAutomationRecordMode(recordState, 'write');
          
          expect(recordState.mode).toBe('write');
        });

        it('should clear latch state when changing from latch mode', () => {
          let recordState = createDefaultAutomationRecordState();
          recordState = setAutomationRecordMode(recordState, 'latch');
          recordState = {
            ...recordState,
            latchedLanes: new Set(['lane1'])
          };
          
          recordState = setAutomationRecordMode(recordState, 'write');
          
          expect(recordState.latchedLanes.size).toBe(0);
        });
      });

      describe('startAutomationRecording', () => {
        it('should start recording for specified lanes', () => {
          let recordState = createDefaultAutomationRecordState();
          
          recordState = startAutomationRecording(recordState, ['lane1', 'lane2']);
          
          expect(recordState.recording).toBe(true);
          expect(recordState.activeLaneIds).toHaveLength(2);
        });
      });

      describe('recordAutomationPoint', () => {
        it('should add point to record buffer', () => {
          let recordState = createDefaultAutomationRecordState();
          recordState = startAutomationRecording(recordState, ['lane1']);
          
          recordState = recordAutomationPoint(recordState, 'lane1', asTick(240), 0.5);
          
          expect(recordState.recordBuffer.get('lane1')).toHaveLength(1);
          expect(recordState.recordBuffer.get('lane1')?.[0]?.value).toBe(0.5);
        });

        it('should mark lane as touched in touch mode', () => {
          let recordState = createDefaultAutomationRecordState();
          recordState = setAutomationRecordMode(recordState, 'touch');
          recordState = startAutomationRecording(recordState, ['lane1']);
          
          recordState = recordAutomationPoint(recordState, 'lane1', asTick(240), 0.5, true);
          
          expect(recordState.touchedLanes.has('lane1')).toBe(true);
        });

        it('should mark lane as latched in latch mode', () => {
          let recordState = createDefaultAutomationRecordState();
          recordState = setAutomationRecordMode(recordState, 'latch');
          recordState = startAutomationRecording(recordState, ['lane1']);
          
          recordState = recordAutomationPoint(recordState, 'lane1', asTick(240), 0.5, true);
          
          expect(recordState.latchedLanes.has('lane1')).toBe(true);
        });
      });

      describe('stopAutomationRecording', () => {
        it('should commit points in write mode', () => {
          const state = createTestState();
          const lane = createAutomationLane('lane1', 'track1', 'volume', 'Volume');
          let newState = addAutomationLane(state, lane);
          
          let recordState = createDefaultAutomationRecordState();
          recordState = setAutomationRecordMode(recordState, 'write');
          recordState = startAutomationRecording(recordState, ['lane1']);
          recordState = recordAutomationPoint(recordState, 'lane1', asTick(240), 0.5);
          recordState = recordAutomationPoint(recordState, 'lane1', asTick(480), 0.7);
          
          const result = stopAutomationRecording(newState, recordState);
          
          const updatedLane = result.state.automationLanes.find(l => l.id === 'lane1');
          expect(updatedLane?.points).toHaveLength(2);
          expect(result.recordState.recording).toBe(false);
        });

        it('should only commit touched lanes in touch mode', () => {
          const state = createTestState();
          const lane1 = createAutomationLane('lane1', 'track1', 'volume', 'Volume');
          const lane2 = createAutomationLane('lane2', 'track1', 'pan', 'Pan');
          let newState = addAutomationLane(state, lane1);
          newState = addAutomationLane(newState, lane2);
          
          let recordState = createDefaultAutomationRecordState();
          recordState = setAutomationRecordMode(recordState, 'touch');
          recordState = startAutomationRecording(recordState, ['lane1', 'lane2']);
          recordState = recordAutomationPoint(recordState, 'lane1', asTick(240), 0.5, true);
          recordState = recordAutomationPoint(recordState, 'lane2', asTick(240), 0.3, false);
          
          const result = stopAutomationRecording(newState, recordState);
          
          const updatedLane1 = result.state.automationLanes.find(l => l.id === 'lane1');
          const updatedLane2 = result.state.automationLanes.find(l => l.id === 'lane2');
          expect(updatedLane1?.points).toHaveLength(1);
          expect(updatedLane2?.points).toHaveLength(0);
        });

        it('should add to existing automation in trim mode', () => {
          const state = createTestState();
          const points = [createAutomationPoint(asTick(240), 0.3, 'linear')];
          const lane = createAutomationLane('lane1', 'track1', 'volume', 'Volume', { points });
          let newState = addAutomationLane(state, lane);
          
          let recordState = createDefaultAutomationRecordState();
          recordState = setAutomationRecordMode(recordState, 'trim');
          recordState = startAutomationRecording(recordState, ['lane1']);
          // Recording 0.7 with existing 0.3 should add: 0.3 + (0.7 - 0.5) = 0.5
          recordState = recordAutomationPoint(recordState, 'lane1', asTick(240), 0.7);
          
          const result = stopAutomationRecording(newState, recordState);
          
          const updatedLane = result.state.automationLanes.find(l => l.id === 'lane1');
          const point = updatedLane?.points.find(p => p.position === 240);
          expect(point?.value).toBeCloseTo(0.5);
        });

        it('should not commit anything in read mode', () => {
          const state = createTestState();
          const lane = createAutomationLane('lane1', 'track1', 'volume', 'Volume');
          let newState = addAutomationLane(state, lane);
          
          let recordState = createDefaultAutomationRecordState();
          recordState = setAutomationRecordMode(recordState, 'read');
          recordState = startAutomationRecording(recordState, ['lane1']);
          recordState = recordAutomationPoint(recordState, 'lane1', asTick(240), 0.5);
          
          const result = stopAutomationRecording(newState, recordState);
          
          const updatedLane = result.state.automationLanes.find(l => l.id === 'lane1');
          expect(updatedLane?.points).toHaveLength(0);
        });
      });

      describe('releaseAutomationTouch', () => {
        it('should remove lane from touched lanes', () => {
          let recordState = createDefaultAutomationRecordState();
          recordState = setAutomationRecordMode(recordState, 'touch');
          recordState = startAutomationRecording(recordState, ['lane1']);
          recordState = recordAutomationPoint(recordState, 'lane1', asTick(240), 0.5, true);
          
          recordState = releaseAutomationTouch(recordState, 'lane1');
          
          expect(recordState.touchedLanes.has('lane1')).toBe(false);
        });
      });
    });
  });

  // ========================================================================
  // AUTOMATION SEARCH & MANAGEMENT (Steps 2802-2804)
  // ========================================================================
  
  describe('Automation Search & Management', () => {
    describe('searchAutomationLanes', () => {
      it('should find lanes by parameter name', () => {
        let state = createArrangementPanelState();
        const lane1 = createAutomationLane('lane1', 'track1', 'volume', 'Volume');
        const lane2 = createAutomationLane('lane2', 'track1', 'pan', 'Pan');
        const lane3 = createAutomationLane('lane3', 'track2', 'volume', 'Volume');
        
        state = addAutomationLane(state, lane1);
        state = addAutomationLane(state, lane2);
        state = addAutomationLane(state, lane3);
        
        const results = searchAutomationLanes(state, 'volume');
        expect(results).toHaveLength(2);
        expect(results[0].parameter).toBe('volume');
        expect(results[1].parameter).toBe('volume');
      });
      
      it('should find lanes by display name', () => {
        let state = createArrangementPanelState();
        const lane1 = createAutomationLane('lane1', 'track1', 'filter_cutoff', 'Filter Cutoff');
        const lane2 = createAutomationLane('lane2', 'track1', 'volume', 'Volume');
        
        state = addAutomationLane(state, lane1);
        state = addAutomationLane(state, lane2);
        
        const results = searchAutomationLanes(state, 'filter');
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Filter Cutoff');
      });
      
      it('should be case-insensitive', () => {
        let state = createArrangementPanelState();
        const lane1 = createAutomationLane('lane1', 'track1', 'Volume', 'Volume');
        state = addAutomationLane(state, lane1);
        
        const results = searchAutomationLanes(state, 'VOLUME');
        expect(results).toHaveLength(1);
      });
      
      it('should return empty array when no matches', () => {
        let state = createArrangementPanelState();
        const lane1 = createAutomationLane('lane1', 'track1', 'volume', 'Volume');
        state = addAutomationLane(state, lane1);
        
        const results = searchAutomationLanes(state, 'nonexistent');
        expect(results).toHaveLength(0);
      });
    });
    
    describe('quickAddAutomationLane', () => {
      it('should add automation lane for track parameter', () => {
        let state = createArrangementPanelState();
        const track = createTrack('track1', 'Track 1', 'audio');
        state = { ...state, tracks: [track] };
        
        state = quickAddAutomationLane(state, 'track1', 'volume');
        
        expect(state.automationLanes).toHaveLength(1);
        expect(state.automationLanes[0].trackId).toBe('track1');
        expect(state.automationLanes[0].parameter).toBe('volume');
        expect(state.automationLanes[0].visible).toBe(true);
      });
      
      it('should use custom name if provided', () => {
        let state = createArrangementPanelState();
        const track = createTrack('track1', 'Track 1', 'audio');
        state = { ...state, tracks: [track] };
        
        state = quickAddAutomationLane(state, 'track1', 'volume', 'Master Volume');
        
        expect(state.automationLanes[0].name).toBe('Master Volume');
      });
      
      it('should return unchanged state if track not found', () => {
        let state = createArrangementPanelState();
        const originalState = state;
        
        state = quickAddAutomationLane(state, 'nonexistent', 'volume');
        
        expect(state).toBe(originalState);
      });
    });
    
    describe('collapseAutomationLanes', () => {
      it('should collapse all lanes to minimal height', () => {
        let state = createArrangementPanelState();
        const lane1 = createAutomationLane('lane1', 'track1', 'volume', 'Volume', { height: 60 });
        const lane2 = createAutomationLane('lane2', 'track1', 'pan', 'Pan', { height: 80 });
        
        state = addAutomationLane(state, lane1);
        state = addAutomationLane(state, lane2);
        
        state = collapseAutomationLanes(state, true);
        
        expect(state.automationLanes[0].height).toBe(30);
        expect(state.automationLanes[1].height).toBe(30);
      });
      
      it('should expand all lanes to default height', () => {
        let state = createArrangementPanelState();
        const lane1 = createAutomationLane('lane1', 'track1', 'volume', 'Volume', { height: 30 });
        const lane2 = createAutomationLane('lane2', 'track1', 'pan', 'Pan', { height: 30 });
        
        state = addAutomationLane(state, lane1);
        state = addAutomationLane(state, lane2);
        
        state = collapseAutomationLanes(state, false);
        
        expect(state.automationLanes[0].height).toBe(60);
        expect(state.automationLanes[1].height).toBe(60);
      });
    });
  });

  // ========================================================================
  // MARKERS & LOCATORS (Steps 2807-2822)
  // ========================================================================
  
  describe('Markers & Locators', () => {
    describe('addMarker', () => {
      it('should add marker at position', () => {
        let state = createArrangementPanelState();
        
        state = addMarkerAtPosition(state, asTick(480), 'Marker 1');
        
        expect(state.markers).toHaveLength(1);
        expect(state.markers[0].name).toBe('Marker 1');
        expect(state.markers[0].position).toBe(480);
      });
      
      it('should sort markers by position', () => {
        let state = createArrangementPanelState();
        
        state = addMarkerAtPosition(state, asTick(960), 'Second');
        state = addMarkerAtPosition(state, asTick(480), 'First');
        state = addMarkerAtPosition(state, asTick(1440), 'Third');
        
        expect(state.markers[0].name).toBe('First');
        expect(state.markers[1].name).toBe('Second');
        expect(state.markers[2].name).toBe('Third');
      });
      
      it('should assign default color based on type', () => {
        let state = createArrangementPanelState();
        
        state = addMarkerAtPosition(state, asTick(480), 'Chorus', 'chorus');
        
        expect(state.markers[0].color).toBe('#f59e0b');
      });
    });
    
    describe('deleteMarker', () => {
      it('should remove marker by id', () => {
        let state = createArrangementPanelState();
        state = addMarkerAtPosition(state, asTick(480), 'Marker 1');
        const markerId = state.markers[0].id;
        
        state = removeMarker(state, markerId);
        
        expect(state.markers).toHaveLength(0);
      });
    });
    
    describe('renameMarker', () => {
      it('should update marker name', () => {
        let state = createArrangementPanelState();
        state = addMarkerAtPosition(state, asTick(480), 'Old Name');
        const markerId = state.markers[0].id;
        
        state = renameMarker(state, markerId, 'New Name');
        
        expect(state.markers[0].name).toBe('New Name');
      });
    });
    
    describe('setMarkerColor', () => {
      it('should update marker color', () => {
        let state = createArrangementPanelState();
        state = addMarkerAtPosition(state, asTick(480), 'Marker');
        const markerId = state.markers[0].id;
        
        state = setMarkerColor(state, markerId, '#ff0000');
        
        expect(state.markers[0].color).toBe('#ff0000');
      });
    });
    
    describe('moveMarker', () => {
      it('should move marker to new position', () => {
        let state = createArrangementPanelState();
        state = addMarkerAtPosition(state, asTick(480), 'Marker');
        const markerId = state.markers[0].id;
        
        // Verify initial state
        expect(state.markers[0].position).toBe(480);
        
        state = moveMarker(state, markerId, asTick(960));
        
        // Verify after move
        expect(state.markers[0].position).toBe(960);
        expect(state.markers[0].name).toBe('Marker');
      });
      
      it('should maintain sort order after move', () => {
        let state = createArrangementPanelState();
        state = addMarkerAtPosition(state, asTick(480), 'First');
        state = addMarkerAtPosition(state, asTick(960), 'Second');
        state = addMarkerAtPosition(state, asTick(1440), 'Third');
        
        // Verify initial order and unique IDs
        expect(state.markers[0].name).toBe('First');
        expect(state.markers[1].name).toBe('Second');
        expect(state.markers[2].name).toBe('Third');
        expect(state.markers[0].id).not.toBe(state.markers[1].id);
        expect(state.markers[1].id).not.toBe(state.markers[2].id);
        
        const secondMarkerId = state.markers[1].id;
        
        // Move Second from 960 to 1680 (after Third at 1440)
        state = moveMarker(state, secondMarkerId, asTick(1680));
        
        // After move, should be sorted: First(480), Third(1440), Second(1680)
        expect(state.markers).toHaveLength(3);
        expect(state.markers[0].name).toBe('First');
        expect(state.markers[0].position).toBe(480);
        expect(state.markers[1].name).toBe('Third');
        expect(state.markers[1].position).toBe(1440);
        expect(state.markers[2].name).toBe('Second');
        expect(state.markers[2].position).toBe(1680);
      });
    });
    
    describe('snapMarkerToGrid', () => {
      it('should snap marker to nearest grid position', () => {
        let state = createArrangementPanelState({
          snapEnabled: true,
          snapInterval: asTickDuration(120)
        });
        state = addMarkerAtPosition(state, asTick(490), 'Marker');
        const markerId = state.markers[0].id;
        
        state = snapMarkerToGrid(state, markerId);
        
        expect(state.markers[0].position).toBe(480); // snaps to nearest 120
      });
      
      it('should not snap if snap disabled', () => {
        let state = createArrangementPanelState({
          snapEnabled: false,
          snapInterval: asTickDuration(120)
        });
        state = addMarkerAtPosition(state, asTick(490), 'Marker');
        const markerId = state.markers[0].id;
        
        state = snapMarkerToGrid(state, markerId);
        
        expect(state.markers[0].position).toBe(490);
      });
    });
    
    describe('jumpToNextMarker', () => {
      it('should return next marker position', () => {
        let state = createArrangementPanelState();
        state = addMarkerAtPosition(state, asTick(480), 'First');
        state = addMarkerAtPosition(state, asTick(960), 'Second');
        
        const nextPos = jumpToNextMarker(state, asTick(240));
        
        expect(nextPos).toBe(480);
      });
      
      it('should return null if no marker ahead', () => {
        let state = createArrangementPanelState();
        state = addMarkerAtPosition(state, asTick(480), 'First');
        
        const nextPos = jumpToNextMarker(state, asTick(960));
        
        expect(nextPos).toBeNull();
      });
    });
    
    describe('jumpToPrevMarker', () => {
      it('should return previous marker position', () => {
        let state = createArrangementPanelState();
        state = addMarkerAtPosition(state, asTick(480), 'First');
        state = addMarkerAtPosition(state, asTick(960), 'Second');
        
        const prevPos = jumpToPrevMarker(state, asTick(1200));
        
        expect(prevPos).toBe(960);
      });
      
      it('should return null if no marker behind', () => {
        let state = createArrangementPanelState();
        state = addMarkerAtPosition(state, asTick(960), 'First');
        
        const prevPos = jumpToPrevMarker(state, asTick(480));
        
        expect(prevPos).toBeNull();
      });
    });
    
    describe('setLocators', () => {
      it('should create locator pair', () => {
        const locators = setLocators(asTick(480), asTick(960));
        
        expect(locators.left).toBe(480);
        expect(locators.right).toBe(960);
      });
      
      it('should swap if left > right', () => {
        const locators = setLocators(asTick(960), asTick(480));
        
        expect(locators.left).toBe(480);
        expect(locators.right).toBe(960);
      });
      
      it('should use default color if not provided', () => {
        const locators = setLocators(asTick(480), asTick(960));
        
        expect(locators.color).toBe('#fbbf24');
      });
    });
    
    describe('jumpToLeftLocator', () => {
      it('should return left locator position', () => {
        const locators = setLocators(asTick(480), asTick(960));
        
        const pos = jumpToLeftLocator(locators);
        
        expect(pos).toBe(480);
      });
    });
    
    describe('jumpToRightLocator', () => {
      it('should return right locator position', () => {
        const locators = setLocators(asTick(480), asTick(960));
        
        const pos = jumpToRightLocator(locators);
        
        expect(pos).toBe(960);
      });
    });
    
    describe('selectLocatorRegion', () => {
      it('should return selection from locators', () => {
        const locators = setLocators(asTick(480), asTick(960));
        
        const selection = selectLocatorRegion(locators);
        
        expect(selection.start).toBe(480);
        expect(selection.duration).toBe(480);
      });
    });
    
    describe('createLoopRegionFromLocators', () => {
      it('should create loop region from locators', () => {
        let state = createArrangementPanelState();
        const locators = setLocators(asTick(480), asTick(1920), '#00ff00');
        
        state = createLoopRegionFromLocators(state, locators);
        
        expect(state.loopRegion).not.toBeNull();
        expect(state.loopRegion!.start).toBe(480);
        expect(state.loopRegion!.end).toBe(1920);
        expect(state.loopRegion!.enabled).toBe(true);
        expect(state.loopRegion!.color).toBe('#00ff00');
      });
    });
  });
});
