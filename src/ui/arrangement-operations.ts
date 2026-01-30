/**
 * @fileoverview Arrangement Operations - Edit modes and time manipulation for DAW-style arrangement.
 * 
 * Implements professional editing modes (ripple, shuffle, slip, slide) and time-based operations
 * (insert, delete, copy, paste time ranges) for arrangement editing. All operations maintain
 * clip integrity and support multi-track editing.
 * 
 * Phase 12.6: Arrangement Operations (currentsteps.md lines 2829-2848)
 * 
 * Key concepts:
 * - Ripple edit: Moving/trimming clips shifts following clips on same track
 * - Shuffle edit: Removing clips closes gap, moving subsequent clips
 * - Slip edit: Move clip contents within fixed boundaries (change offset)
 * - Slide edit: Move clip without changing offset, but shift surrounding clips
 * - Insert/Delete time: Affects all tracks, moves clips forward/backward
 * 
 * @module @cardplay/ui/arrangement-operations
 */

import type { Tick, TickDuration } from '../types/primitives';
import { asTick, asTickDuration } from '../types/primitives';
import type { Clip, ArrangementTrack as Track } from './components/arrangement-panel';

// ============================================================================
// EDIT MODE TYPES
// ============================================================================

/**
 * Edit mode affects how clip operations influence surrounding clips.
 */
export type EditMode = 
  | 'normal'     // No automatic shifting
  | 'ripple'     // Move following clips on same track
  | 'shuffle'    // Close gaps on same track
  | 'slip'       // Change clip offset without moving clip position
  | 'slide';     // Move clip and surrounding clips to close gaps

/**
 * Time range for copy/paste/insert/delete operations.
 */
export interface TimeRange {
  /** Start position in ticks */
  readonly start: Tick;
  /** End position in ticks (exclusive) */
  readonly end: Tick;
}

/**
 * Section of arrangement spanning multiple tracks.
 */
export interface ArrangementSection {
  /** Section identifier */
  readonly id: string;
  /** Human-readable name */
  readonly name: string;
  /** Time range of section */
  readonly range: TimeRange;
  /** Track IDs included in section */
  readonly trackIds: readonly string[];
  /** Color for visual marking */
  readonly color?: string;
}

/**
 * Result of an arrangement operation.
 */
export interface ArrangementOperationResult {
  /** Updated clips after operation */
  readonly clips: readonly Clip[];
  /** Optional updated tracks (if track properties changed) */
  readonly tracks?: readonly Track[];
  /** Optional undo description */
  readonly undoDescription?: string;
}

// ============================================================================
// RIPPLE EDIT MODE
// ============================================================================

/**
 * Implements ripple edit mode: moving/trimming a clip shifts all following clips
 * on the same track to maintain timeline continuity.
 * 
 * Use case: Shortening an interview clip should automatically move later clips earlier.
 * 
 * @param clips - All clips in arrangement
 * @param clipId - Clip being edited
 * @param newStart - New start position (or undefined to keep current)
 * @param newDuration - New duration (or undefined to keep current)
 * @returns Updated clips with ripple effect applied
 */
export function rippleEditClip(
  clips: readonly Clip[],
  clipId: string,
  newStart?: Tick,
  newDuration?: TickDuration
): ArrangementOperationResult {
  const targetClip = clips.find(c => c.id === clipId);
  if (!targetClip) {
    return { clips, undoDescription: 'No clip found' };
  }

  const oldEnd = asTick(targetClip.start + targetClip.duration);
  
  const finalStart = newStart ?? targetClip.start;
  const finalDuration = newDuration ?? targetClip.duration;
  const newEnd = asTick(finalStart + finalDuration);

  // Calculate shift amount for ripple effect
  const shift = newEnd - oldEnd;

  const updatedClips = clips.map(clip => {
    if (clip.id === clipId) {
      // Update the target clip
      return {
        ...clip,
        start: finalStart,
        duration: finalDuration,
      };
    } else if (clip.trackId === targetClip.trackId && clip.start >= oldEnd) {
      // Ripple: shift all clips after the edited clip on same track
      return {
        ...clip,
        start: asTick(clip.start + shift),
      };
    }
    return clip;
  });

  return {
    clips: updatedClips,
    undoDescription: `Ripple edit clip "${targetClip.name}"`,
  };
}

/**
 * Implements ripple delete: removing a clip closes the gap by shifting following clips.
 * 
 * @param clips - All clips in arrangement
 * @param clipId - Clip to delete
 * @returns Updated clips with gap closed
 */
export function rippleDeleteClip(
  clips: readonly Clip[],
  clipId: string
): ArrangementOperationResult {
  const targetClip = clips.find(c => c.id === clipId);
  if (!targetClip) {
    return { clips, undoDescription: 'No clip found' };
  }

  const shift = -targetClip.duration;

  const updatedClips = clips
    .filter(clip => clip.id !== clipId)
    .map(clip => {
      if (clip.trackId === targetClip.trackId && clip.start >= targetClip.start) {
        return {
          ...clip,
          start: asTick(clip.start + shift),
        };
      }
      return clip;
    });

  return {
    clips: updatedClips,
    undoDescription: `Ripple delete clip "${targetClip.name}"`,
  };
}

// ============================================================================
// SHUFFLE EDIT MODE
// ============================================================================

/**
 * Implements shuffle edit: clips automatically snap together, closing gaps.
 * Similar to ripple but specifically for closing gaps when dragging/deleting.
 * 
 * @param clips - All clips in arrangement
 * @param clipId - Clip being moved
 * @param newStart - New start position
 * @returns Updated clips with shuffle effect applied
 */
export function shuffleEditClip(
  clips: readonly Clip[],
  clipId: string,
  newStart: Tick
): ArrangementOperationResult {
  const targetClip = clips.find(c => c.id === clipId);
  if (!targetClip) {
    return { clips, undoDescription: 'No clip found' };
  }

  const oldStart = targetClip.start;
  const trackClips = clips
    .filter(c => c.trackId === targetClip.trackId && c.id !== clipId)
    .sort((a, b) => a.start - b.start);

  // Find clips to shuffle
  const clipsToShift: Clip[] = [];
  
  if (newStart > oldStart) {
    // Moving right: clips between old and new position shuffle left
    clipsToShift.push(...trackClips.filter(c => c.start > oldStart && c.start < newStart));
  } else {
    // Moving left: clips between new and old position shuffle right
    clipsToShift.push(...trackClips.filter(c => c.start >= newStart && c.start < oldStart));
  }

  const shift = newStart > oldStart ? -targetClip.duration : targetClip.duration;

  const updatedClips = clips.map(clip => {
    if (clip.id === clipId) {
      return { ...clip, start: newStart };
    } else if (clipsToShift.some(c => c.id === clip.id)) {
      return { ...clip, start: asTick(clip.start + shift) };
    }
    return clip;
  });

  return {
    clips: updatedClips,
    undoDescription: `Shuffle clip "${targetClip.name}"`,
  };
}

// ============================================================================
// SLIP EDIT MODE
// ============================================================================

/**
 * Implements slip edit: change clip content offset without moving clip boundaries.
 * Used for audio clips to "slip" the audio within fixed start/end points.
 * 
 * Example: Clip from 0-4 bars shows audio from offset 2-6 bars.
 * 
 * @param clips - All clips in arrangement
 * @param clipId - Clip to slip
 * @param newOffset - New offset within source material
 * @returns Updated clip with new offset
 */
export function slipEditClip(
  clips: readonly Clip[],
  clipId: string,
  newOffset: Tick
): ArrangementOperationResult {
  const updatedClips = clips.map(clip => {
    if (clip.id === clipId) {
      return {
        ...clip,
        offset: newOffset,
      };
    }
    return clip;
  });

  const targetClip = clips.find(c => c.id === clipId);
  return {
    clips: updatedClips,
    undoDescription: `Slip edit clip "${targetClip?.name ?? clipId}"`,
  };
}

// ============================================================================
// SLIDE EDIT MODE
// ============================================================================

/**
 * Implements slide edit: move clip and adjust surrounding clips to maintain continuity.
 * The gap created by moving the clip is filled by expanding/contracting neighbors.
 * 
 * @param clips - All clips in arrangement
 * @param clipId - Clip to slide
 * @param newStart - New start position
 * @returns Updated clips with slide effect applied
 */
export function slideEditClip(
  clips: readonly Clip[],
  clipId: string,
  newStart: Tick
): ArrangementOperationResult {
  const targetClip = clips.find(c => c.id === clipId);
  if (!targetClip) {
    return { clips, undoDescription: 'No clip found' };
  }

  const oldStart = targetClip.start;
  const oldEnd = asTick(oldStart + targetClip.duration);
  const newEnd = asTick(newStart + targetClip.duration);
  const shift = newStart - oldStart;

  const trackClips = clips
    .filter(c => c.trackId === targetClip.trackId && c.id !== clipId)
    .sort((a, b) => a.start - b.start);

  // Find immediate neighbors
  const prevClip = trackClips
    .reverse()
    .find(c => asTick(c.start + c.duration) <= oldStart);
  const nextClip = trackClips.find(c => c.start >= oldEnd);

  const updatedClips = clips.map(clip => {
    if (clip.id === clipId) {
      return { ...clip, start: newStart };
    }
    
    // Adjust previous clip to fill/create gap
    if (prevClip && clip.id === prevClip.id) {
      const newDuration = asTickDuration(newStart - prevClip.start);
      return { ...clip, duration: newDuration };
    }
    
    // Adjust next clip to fill/create gap
    if (nextClip && clip.id === nextClip.id) {
      return { ...clip, start: newEnd };
    }
    
    return clip;
  });

  return {
    clips: updatedClips,
    undoDescription: `Slide clip "${targetClip.name}" by ${shift} ticks`,
  };
}

// ============================================================================
// INSERT/DELETE TIME
// ============================================================================

/**
 * Insert time at a position, shifting all clips on all tracks forward.
 * Creates space for new content.
 * 
 * @param clips - All clips in arrangement
 * @param position - Where to insert time
 * @param duration - Amount of time to insert
 * @param trackIds - Optional: only affect specific tracks
 * @returns Updated clips with time inserted
 */
export function insertTime(
  clips: readonly Clip[],
  position: Tick,
  duration: TickDuration,
  trackIds?: readonly string[]
): ArrangementOperationResult {
  const affectedTracks = trackIds ? new Set(trackIds) : null;

  const updatedClips = clips.map(clip => {
    // Skip if track filter is active and clip not in filter
    if (affectedTracks && !affectedTracks.has(clip.trackId)) {
      return clip;
    }

    // Clip starts at or after insertion point: shift forward
    if (clip.start >= position) {
      return {
        ...clip,
        start: asTick(clip.start + duration),
      };
    }

    // Clip spans insertion point: split (extend duration)
    const clipEnd = asTick(clip.start + clip.duration);
    if (clip.start < position && clipEnd > position) {
      return {
        ...clip,
        duration: asTickDuration(clip.duration + duration),
      };
    }

    return clip;
  });

  return {
    clips: updatedClips,
    undoDescription: `Insert ${duration} ticks at ${position}`,
  };
}

/**
 * Delete time range, removing clips and closing the gap across all tracks.
 * 
 * @param clips - All clips in arrangement
 * @param range - Time range to delete
 * @param trackIds - Optional: only affect specific tracks
 * @returns Updated clips with time deleted
 */
export function deleteTime(
  clips: readonly Clip[],
  range: TimeRange,
  trackIds?: readonly string[]
): ArrangementOperationResult {
  const affectedTracks = trackIds ? new Set(trackIds) : null;
  const rangeSize = range.end - range.start;

  const updatedClips = clips
    .map(clip => {
      // Skip if track filter is active and clip not in filter
      if (affectedTracks && !affectedTracks.has(clip.trackId)) {
        return clip;
      }

      const clipEnd = asTick(clip.start + clip.duration);

      // Clip entirely before range: no change
      if (clipEnd <= range.start) {
        return clip;
      }

      // Clip entirely within range: delete
      if (clip.start >= range.start && clipEnd <= range.end) {
        return null; // Mark for deletion
      }

      // Clip entirely after range: shift back
      if (clip.start >= range.end) {
        return {
          ...clip,
          start: asTick(clip.start - rangeSize),
        };
      }

      // Clip starts before, ends within range: trim end
      if (clip.start < range.start && clipEnd > range.start && clipEnd <= range.end) {
        return {
          ...clip,
          duration: asTickDuration(range.start - clip.start),
        };
      }

      // Clip starts within, ends after range: trim start and shift
      if (clip.start >= range.start && clip.start < range.end && clipEnd > range.end) {
        const newDuration = asTickDuration(clipEnd - range.end);
        return {
          ...clip,
          start: range.start,
          duration: newDuration,
          offset: clip.offset ? asTick(clip.offset + (range.end - clip.start)) : asTick(range.end - clip.start),
        };
      }

      // Clip spans entire range: punch out middle
      if (clip.start < range.start && clipEnd > range.end) {
        return {
          ...clip,
          duration: asTickDuration(clip.duration - rangeSize),
        };
      }

      return clip;
    })
    .filter((clip): clip is Clip => clip !== null);

  return {
    clips: updatedClips,
    undoDescription: `Delete time ${range.start} to ${range.end}`,
  };
}

// ============================================================================
// COPY/PASTE TIME RANGE
// ============================================================================

/**
 * Clipboard for time-based copy/paste operations.
 */
export interface TimeRangeClipboard {
  /** Clips in the copied range */
  readonly clips: readonly Clip[];
  /** Original time range */
  readonly range: TimeRange;
  /** Track IDs included */
  readonly trackIds: readonly string[];
}

/**
 * Copy a time range across multiple tracks to clipboard.
 * 
 * @param clips - All clips in arrangement
 * @param range - Time range to copy
 * @param trackIds - Tracks to include in copy
 * @returns Clipboard data
 */
export function copyTimeRange(
  clips: readonly Clip[],
  range: TimeRange,
  trackIds: readonly string[]
): TimeRangeClipboard {
  const affectedTracks = new Set(trackIds);

  const copiedClips = clips
    .filter(clip => {
      if (!affectedTracks.has(clip.trackId)) return false;
      const clipEnd = asTick(clip.start + clip.duration);
      // Include clips that overlap the range
      return clip.start < range.end && clipEnd > range.start;
    })
    .map(clip => {
      const clipEnd = asTick(clip.start + clip.duration);
      
      // Clip entirely within range: copy as-is (with relative position)
      if (clip.start >= range.start && clipEnd <= range.end) {
        return {
          ...clip,
          start: asTick(clip.start - range.start), // Make relative to range start
        };
      }

      // Clip overlaps start: trim start
      if (clip.start < range.start && clipEnd > range.start) {
        const newDuration = asTickDuration(Math.min(clipEnd - range.start, range.end - range.start));
        return {
          ...clip,
          start: asTick(0),
          duration: newDuration,
          offset: clip.offset ? asTick(clip.offset + (range.start - clip.start)) : asTick(range.start - clip.start),
        };
      }

      // Clip overlaps end: trim end
      if (clip.start >= range.start && clip.start < range.end && clipEnd > range.end) {
        return {
          ...clip,
          start: asTick(clip.start - range.start),
          duration: asTickDuration(range.end - clip.start),
        };
      }

      return clip;
    });

  return {
    clips: copiedClips,
    range,
    trackIds,
  };
}

/**
 * Paste time range from clipboard at target position.
 * 
 * @param clips - All clips in arrangement
 * @param clipboard - Clipboard data from copyTimeRange
 * @param targetPosition - Where to paste
 * @param mode - Paste mode: 'insert' (make room) or 'overwrite' (replace)
 * @returns Updated clips with pasted content
 */
export function pasteTimeRange(
  clips: readonly Clip[],
  clipboard: TimeRangeClipboard,
  targetPosition: Tick,
  mode: 'insert' | 'overwrite' = 'insert'
): ArrangementOperationResult {
  const rangeSize = clipboard.range.end - clipboard.range.start;

  let workingClips = clips;

  // If insert mode, first insert time to make room
  if (mode === 'insert') {
    const insertResult = insertTime(workingClips, targetPosition, asTickDuration(rangeSize), clipboard.trackIds);
    workingClips = insertResult.clips;
  } else {
    // Overwrite mode: delete clips in target range
    const deleteResult = deleteTime(
      workingClips,
      { start: targetPosition, end: asTick(targetPosition + rangeSize) },
      clipboard.trackIds
    );
    workingClips = deleteResult.clips;
  }

  // Generate new IDs for pasted clips
  const pastedClips = clipboard.clips.map(clip => ({
    ...clip,
    id: `${clip.id}-paste-${Date.now()}-${Math.random()}`,
    start: asTick(targetPosition + clip.start), // Offset by target position
  }));

  const updatedClips = [...workingClips, ...pastedClips];

  return {
    clips: updatedClips,
    undoDescription: `Paste time range at ${targetPosition} (${mode} mode)`,
  };
}

// ============================================================================
// SECTION OPERATIONS
// ============================================================================

/**
 * Duplicate an arrangement section, inserting it after the original.
 * 
 * @param clips - All clips in arrangement
 * @param section - Section to duplicate
 * @returns Updated clips with duplicated section
 */
export function duplicateSection(
  clips: readonly Clip[],
  section: ArrangementSection
): ArrangementOperationResult {
  const clipboard = copyTimeRange(clips, section.range, section.trackIds);
  const targetPosition = section.range.end;
  return pasteTimeRange(clips, clipboard, targetPosition, 'insert');
}

/**
 * Move an entire section to a new position.
 * 
 * @param clips - All clips in arrangement
 * @param section - Section to move
 * @param targetPosition - New start position
 * @returns Updated clips with section moved
 */
export function moveSection(
  clips: readonly Clip[],
  section: ArrangementSection,
  targetPosition: Tick
): ArrangementOperationResult {
  // Copy section
  const clipboard = copyTimeRange(clips, section.range, section.trackIds);
  
  // Delete original section
  const deleteResult = deleteTime(clips, section.range, section.trackIds);
  
  // Paste at new position
  return pasteTimeRange(deleteResult.clips, clipboard, targetPosition, 'insert');
}

/**
 * Loop a section by duplicating it N times.
 * 
 * @param clips - All clips in arrangement
 * @param section - Section to loop
 * @param count - Number of repetitions (including original)
 * @returns Updated clips with looped section
 */
export function loopSection(
  clips: readonly Clip[],
  section: ArrangementSection,
  count: number
): ArrangementOperationResult {
  if (count < 1) {
    return { clips, undoDescription: 'Invalid loop count' };
  }

  const clipboard = copyTimeRange(clips, section.range, section.trackIds);
  const rangeSize = section.range.end - section.range.start;
  
  let workingClips = clips;
  
  // Paste (count - 1) times
  for (let i = 1; i < count; i++) {
    const targetPosition = asTick(section.range.start + rangeSize * i);
    const pasteResult = pasteTimeRange(workingClips, clipboard, targetPosition, 'insert');
    workingClips = pasteResult.clips;
  }

  return {
    clips: workingClips,
    undoDescription: `Loop section "${section.name}" ${count} times`,
  };
}

/**
 * Extend a section by repeating its last portion.
 * 
 * @param clips - All clips in arrangement
 * @param section - Section to extend
 * @param extensionDuration - How much to extend by
 * @returns Updated clips with extended section
 */
export function extendSection(
  clips: readonly Clip[],
  section: ArrangementSection,
  extensionDuration: TickDuration
): ArrangementOperationResult {
  const rangeSize = section.range.end - section.range.start;
  const repeatSize = Math.min(rangeSize, extensionDuration);
  
  // Copy the last part of the section
  const repeatStart = asTick(section.range.end - repeatSize);
  const clipboard = copyTimeRange(
    clips,
    { start: repeatStart, end: section.range.end },
    section.trackIds
  );

  // Paste it after the section
  return pasteTimeRange(clips, clipboard, section.range.end, 'insert');
}

/**
 * Truncate a section to a specific duration.
 * 
 * @param clips - All clips in arrangement
 * @param section - Section to truncate
 * @param newDuration - New duration (must be shorter than original)
 * @returns Updated clips with truncated section
 */
export function truncateSection(
  clips: readonly Clip[],
  section: ArrangementSection,
  newDuration: TickDuration
): ArrangementOperationResult {
  const rangeSize = section.range.end - section.range.start;
  
  if (newDuration >= rangeSize) {
    return { clips, undoDescription: 'New duration must be shorter' };
  }

  const newEnd = asTick(section.range.start + newDuration);
  const deleteRange: TimeRange = {
    start: newEnd,
    end: section.range.end,
  };

  return deleteTime(clips, deleteRange, section.trackIds);
}

/**
 * Bounce clips to audio by rendering them and replacing with audio clips.
 * Note: In actual implementation, this would render the audio and create new clip references.
 * 
 * @param clips - All clips in arrangement
 * @param targetClipIds - Clips to bounce
 * @returns Updated clips with audio bounced clips
 */
export function bounceToAudio(
  clips: readonly Clip[],
  targetClipIds: readonly string[]
): ArrangementOperationResult {
  const targetSet = new Set(targetClipIds);
  const bouncedClips: Clip[] = [];
  
  for (const clip of clips) {
    if (targetSet.has(clip.id)) {
      // Create bounced audio clip with same timing
      // In real implementation, this would render the clip and reference the audio file
      bouncedClips.push({
        ...clip,
        id: `${clip.id}-bounced-audio`,
      });
    } else {
      bouncedClips.push(clip);
    }
  }

  return {
    clips: bouncedClips,
    undoDescription: `Bounce ${targetClipIds.length} clip(s) to audio`,
  };
}

/**
 * Bounce clips to MIDI by extracting note events.
 * Note: In actual implementation, this would extract MIDI events from the clip.
 * 
 * @param clips - All clips in arrangement
 * @param targetClipIds - Clips to bounce
 * @returns Updated clips with MIDI bounced clips
 */
export function bounceToMIDI(
  clips: readonly Clip[],
  targetClipIds: readonly string[]
): ArrangementOperationResult {
  const targetSet = new Set(targetClipIds);
  const bouncedClips: Clip[] = [];
  
  for (const clip of clips) {
    if (targetSet.has(clip.id)) {
      // Create bounced MIDI clip with same timing
      // In real implementation, this would extract MIDI events from the clip
      bouncedClips.push({
        ...clip,
        id: `${clip.id}-bounced-midi`,
      });
    } else {
      bouncedClips.push(clip);
    }
  }

  return {
    clips: bouncedClips,
    undoDescription: `Bounce ${targetClipIds.length} clip(s) to MIDI`,
  };
}

/**
 * Bounce clips in place, replacing original clips with rendered audio.
 * Note: In actual implementation, this would render and replace the clip in-place.
 * 
 * @param clips - All clips in arrangement
 * @param targetClipIds - Clips to bounce in place
 * @returns Updated clips with bounced clips replacing originals
 */
export function bounceInPlace(
  clips: readonly Clip[],
  targetClipIds: readonly string[]
): ArrangementOperationResult {
  const targetSet = new Set(targetClipIds);
  const bouncedClips: Clip[] = [];
  
  for (const clip of clips) {
    if (targetSet.has(clip.id)) {
      // Replace with bounced version (same ID, same position)
      // In real implementation, this would render the clip and update its audio reference
      bouncedClips.push({
        ...clip,
      });
    } else {
      bouncedClips.push(clip);
    }
  }

  return {
    clips: bouncedClips,
    undoDescription: `Bounce ${targetClipIds.length} clip(s) in place`,
  };
}

/**
 * Consolidate multiple clips into a single clip.
 * 
 * @param clips - All clips in arrangement
 * @param targetClipIds - Clips to consolidate
 * @param trackId - Track for consolidated clip
 * @returns Updated clips with consolidated clip
 */
export function consolidateClips(
  clips: readonly Clip[],
  targetClipIds: readonly string[],
  trackId: string
): ArrangementOperationResult {
  if (targetClipIds.length === 0) {
    return { clips, undoDescription: 'No clips to consolidate' };
  }

  const targetSet = new Set(targetClipIds);
  const targetClips = clips.filter(c => targetSet.has(c.id));
  
  if (targetClips.length === 0) {
    return { clips, undoDescription: 'No valid clips found' };
  }

  // Get first clip (guaranteed to exist after length check)
  const firstClip = targetClips[0]!;
  
  // Find the time range that encompasses all target clips
  let minStart = firstClip.start;
  let maxEnd = asTick(firstClip.start + firstClip.duration);
  
  for (const clip of targetClips) {
    const clipEnd = asTick(clip.start + clip.duration);
    if (clip.start < minStart) minStart = clip.start;
    if (clipEnd > maxEnd) maxEnd = clipEnd;
  }

  // Create consolidated clip
  const consolidatedClip: Clip = {
    id: `consolidated-${Date.now()}`,
    trackId,
    start: minStart,
    duration: asTickDuration(maxEnd - minStart),
    name: 'Consolidated',
    color: firstClip.color, // Use first clip's color
  };

  // Remove target clips and add consolidated clip
  const resultClips = clips.filter(c => !targetSet.has(c.id));
  resultClips.push(consolidatedClip);

  return {
    clips: resultClips,
    undoDescription: `Consolidate ${targetClipIds.length} clips`,
  };
}

/**
 * Split clips at transient positions detected in audio.
 * Note: In actual implementation, this would analyze audio waveform for transients.
 * 
 * @param clips - All clips in arrangement
 * @param targetClipIds - Clips to split
 * @param sensitivity - Transient detection sensitivity (0-1)
 * @returns Updated clips with splits at transients
 */
export function splitAtTransients(
  clips: readonly Clip[],
  targetClipIds: readonly string[],
  sensitivity: number = 0.5
): ArrangementOperationResult {
  const targetSet = new Set(targetClipIds);
  const resultClips: Clip[] = [];
  let splitCount = 0;
  
  for (const clip of clips) {
    if (targetSet.has(clip.id) && clip.waveform) {
      // Simulate transient detection - in real implementation would analyze audio
      // For now, split at regular intervals as a placeholder
      const numSplits = Math.ceil(sensitivity * 4); // 1-4 splits based on sensitivity
      const splitDuration = Math.floor(clip.duration / (numSplits + 1));
      
      for (let i = 0; i <= numSplits; i++) {
        const splitStart = asTick(clip.start + splitDuration * i);
        const remainingDuration = asTick(clip.start + clip.duration) - splitStart;
        
        if (remainingDuration > 0) {
          resultClips.push({
            ...clip,
            id: `${clip.id}-split-${i}`,
            start: splitStart,
            duration: asTickDuration(Math.min(splitDuration, remainingDuration)),
          });
          splitCount++;
        }
      }
    } else {
      resultClips.push(clip);
    }
  }

  return {
    clips: resultClips,
    undoDescription: `Split ${targetClipIds.length} clip(s) at transients (${splitCount} splits)`,
  };
}

/**
 * Quantize clips to a grid.
 * 
 * @param clips - All clips in arrangement
 * @param targetClipIds - Clips to quantize
 * @param gridSize - Grid size in ticks
 * @param strength - Quantize strength (0-1, where 1 is full quantize)
 * @returns Updated clips with quantized positions
 */
export function quantizeClips(
  clips: readonly Clip[],
  targetClipIds: readonly string[],
  gridSize: TickDuration,
  strength: number = 1.0
): ArrangementOperationResult {
  const targetSet = new Set(targetClipIds);
  const quantizedClips: Clip[] = [];
  
  for (const clip of clips) {
    if (targetSet.has(clip.id)) {
      // Calculate nearest grid position
      const nearestGrid = Math.round(clip.start / gridSize) * gridSize;
      const offset = nearestGrid - clip.start;
      
      // Apply strength - 1.0 = full quantize, 0.0 = no change
      const newStart = asTick(Math.round(clip.start + offset * strength));
      
      quantizedClips.push({
        ...clip,
        start: newStart,
      });
    } else {
      quantizedClips.push(clip);
    }
  }

  return {
    clips: quantizedClips,
    undoDescription: `Quantize ${targetClipIds.length} clip(s) to grid`,
  };
}

/**
 * Align clips to a reference position or clip.
 * 
 * @param clips - All clips in arrangement
 * @param targetClipIds - Clips to align
 * @param referencePosition - Position to align to (or first clip if undefined)
 * @param alignMode - How to align ('start' | 'end' | 'center')
 * @returns Updated clips with aligned positions
 */
export function alignClips(
  clips: readonly Clip[],
  targetClipIds: readonly string[],
  referencePosition?: Tick,
  alignMode: 'start' | 'end' | 'center' = 'start'
): ArrangementOperationResult {
  if (targetClipIds.length === 0) {
    return { clips, undoDescription: 'No clips to align' };
  }

  const targetSet = new Set(targetClipIds);
  const targetClips = clips.filter(c => targetSet.has(c.id));
  
  if (targetClips.length === 0) {
    return { clips, undoDescription: 'No valid clips found' };
  }

  // Get first clip (guaranteed to exist after length check)
  const firstClip = targetClips[0]!;

  // Determine reference position
  let refPos: Tick;
  if (referencePosition !== undefined) {
    refPos = referencePosition;
  } else {
    // Use first clip's position
    refPos = firstClip.start;
  }

  const alignedClips: Clip[] = [];
  
  for (const clip of clips) {
    if (targetSet.has(clip.id)) {
      let newStart: Tick;
      
      switch (alignMode) {
        case 'start':
          newStart = refPos;
          break;
        case 'end':
          newStart = asTick(refPos - clip.duration);
          break;
        case 'center':
          newStart = asTick(refPos - Math.floor(clip.duration / 2));
          break;
      }
      
      alignedClips.push({
        ...clip,
        start: newStart,
      });
    } else {
      alignedClips.push(clip);
    }
  }

  return {
    clips: alignedClips,
    undoDescription: `Align ${targetClipIds.length} clip(s) by ${alignMode}`,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a default section from a time range and all tracks.
 * 
 * @param range - Time range for section
 * @param tracks - All tracks to include
 * @param name - Section name
 * @returns New section
 */
export function createSection(
  range: TimeRange,
  tracks: readonly Track[],
  name: string
): ArrangementSection {
  return {
    id: `section-${Date.now()}`,
    name,
    range,
    trackIds: tracks.map(t => t.id),
  };
}

/**
 * Get all clips within a time range.
 * 
 * @param clips - All clips
 * @param range - Time range
 * @param trackIds - Optional track filter
 * @returns Clips within range
 */
export function getClipsInRange(
  clips: readonly Clip[],
  range: TimeRange,
  trackIds?: readonly string[]
): readonly Clip[] {
  const trackFilter = trackIds ? new Set(trackIds) : null;

  return clips.filter(clip => {
    if (trackFilter && !trackFilter.has(clip.trackId)) {
      return false;
    }
    const clipEnd = asTick(clip.start + clip.duration);
    return clip.start < range.end && clipEnd > range.start;
  });
}
