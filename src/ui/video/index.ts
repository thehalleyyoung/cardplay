/**
 * @fileoverview Video Generation Module for CardPlay.
 * 
 * This module provides comprehensive video generation capabilities for
 * creating demo videos, tutorials, and user behavior visualizations.
 * 
 * Components:
 * - Interaction Recorder: Record and define user action sequences
 * - Frame Compositor: Render complete UI states to individual frames
 * - Video Exporter: Encode frames to MP4/WebM/GIF video files
 * 
 * @example
 * ```typescript
 * import { 
 *   SequenceBuilder, 
 *   SequencePlayer,
 *   FrameCompositor, 
 *   VideoExporter,
 *   createPersonaDemoSequence 
 * } from './video';
 * 
 * // Create a demo sequence for a first-time user
 * const sequence = createPersonaDemoSequence('first-timer', ABLETON_LAYOUT);
 * 
 * // Export to MP4
 * const exporter = new VideoExporter({ quality: 'preview' });
 * const blob = await exporter.export(sequence, progress => {
 *   console.log(`${progress.percent}% complete`);
 * });
 * 
 * // Download the video
 * const url = URL.createObjectURL(blob);
 * const link = document.createElement('a');
 * link.href = url;
 * link.download = 'cardplay-demo.mp4';
 * link.click();
 * ```
 */

// ============================================================================
// INTERACTION RECORDER
// ============================================================================

export type {
  InteractionType,
  InteractionAction,
  MouseMoveAction,
  ClickAction,
  DragAction,
  DragSequenceAction,
  ScrollAction,
  KeyAction,
  HoverAction,
  TouchAction,
  PinchAction,
  AnnotationAction,
  WaitAction,
  InteractionSequence,
  SequenceInitialState,
  VisualEffect,
  PlaybackState,
  EasingFunction,
  ModifierKeys,
  MouseButton,
} from './interaction-recorder';

export {
  EASING_FUNCTIONS,
  interpolate,
  interpolatePoint,
  applyEasing,
  SequenceBuilder,
  SequencePlayer,
  createBasicDemoSequence,
  createDragDropDemoSequence,
  createPersonaDemoSequence,
} from './interaction-recorder';

// ============================================================================
// FRAME COMPOSITOR
// ============================================================================

export type {
  FrameConfig,
  CompositorTheme,
  LayerContext,
  CompositorColors,
} from './frame-compositor';

export {
  DEFAULT_FRAME_CONFIG,
  DARK_COMPOSITOR_COLORS,
  LIGHT_COMPOSITOR_COLORS,
  getCompositorColors,
  FrameCompositor,
} from './frame-compositor';

// ============================================================================
// VIDEO EXPORTER
// ============================================================================

export type {
  VideoFormat,
  VideoCodec,
  QualityPreset,
  ExportConfig,
  ExportProgressCallback,
  ExportProgress,
  ExportPhase,
} from './video-exporter';

export {
  QUALITY_PRESETS,
  DEFAULT_EXPORT_CONFIG,
  FrameBuffer,
  VideoEncoderWrapper,
  SimpleMp4Muxer,
  VideoExporter,
  createLayoutDemoVideo,
  isVideoExportSupported,
  getSupportedFormats,
} from './video-exporter';

// ============================================================================
// CONVENIENCE FACTORY FUNCTIONS
// ============================================================================

import type { DeckLayout } from '../layout-bridge';
import type { UserPersona } from '../beginner-bridge';
import { SequenceBuilder, SequencePlayer, type PlaybackState } from './interaction-recorder';
import { VideoExporter, type QualityPreset, type ExportProgressCallback, type ExportProgress } from './video-exporter';

/**
 * Options for creating a tutorial video.
 */
export interface TutorialVideoOptions {
  /** Unique ID for the sequence */
  readonly id: string;
  /** Name for the sequence */
  readonly name: string;
  /** Layout to use for the demo */
  readonly layout: DeckLayout;
  /** Target user persona */
  readonly persona?: UserPersona;
  /** Video quality preset */
  readonly quality?: QualityPreset;
  /** Include audio narration (placeholder) */
  readonly includeAudio?: boolean;
  /** Custom annotations to add */
  readonly annotations?: ReadonlyArray<{
    readonly text: string;
    readonly timestamp: number;
    readonly duration: number;
  }>;
}

/**
 * Create a complete tutorial video for a specific layout and persona.
 */
export async function createTutorialVideo(
  options: TutorialVideoOptions,
  onProgress?: ExportProgressCallback
): Promise<Blob> {
  const { id, name, layout, persona, quality = 'preview' } = options;

  // Build sequence - cast persona to ensure type compatibility
  const personaValue = (persona ?? 'first-timer') as UserPersona;
  const builder = new SequenceBuilder(id, name, layout, personaValue);

  // Add welcome annotation
  builder.annotate('Welcome to CardPlay!', 2000, { style: 'callout', position: { x: 100, y: 100 } });
  builder.wait(2500);

  // Mouse exploration
  const centerX = layout.stacks[0]?.x ?? 400;
  const centerY = layout.stacks[0]?.y ?? 300;

  builder.moveTo(centerX, centerY, 1000);
  builder.annotate('This is your first stack', 2000, { style: 'tooltip', position: { x: centerX, y: centerY - 60 } });
  builder.wait(2500);

  // Click interaction
  builder.moveTo(centerX + 100, centerY + 50, 300);
  builder.click({ showRipple: true });
  builder.annotate('Click to select a card', 1500, { style: 'highlight' });
  builder.wait(2000);

  // Drag demonstration
  builder.moveTo(centerX + 100, centerY + 50, 300);
  builder.dragTo(centerX + 400, centerY + 100, 1500, { showGhost: true });
  builder.annotate('Drag cards between stacks', 2000, { style: 'arrow', targetPosition: { x: centerX + 400, y: centerY + 100 } });
  builder.wait(2500);

  // Keyboard shortcut
  builder.pressKey('z', { modifiers: { shift: false, ctrl: false, alt: false, meta: true } });
  builder.annotate('Use ⌘Z to undo', 1500, { style: 'tooltip', position: { x: centerX + 200, y: centerY + 200 } });
  builder.wait(2000);

  // Add custom annotations
  if (options.annotations) {
    for (const ann of options.annotations) {
      builder.wait(ann.timestamp);
      builder.annotate(ann.text, ann.duration);
    }
  }

  const sequence = builder.build();

  // Export
  const exporter = new VideoExporter({ quality });
  return exporter.export(sequence, onProgress);
}

/**
 * Quick export a sequence to video.
 */
export async function quickExport(
  buildSequence: (builder: SequenceBuilder) => void,
  id: string,
  name: string,
  layout: DeckLayout,
  quality: QualityPreset = 'preview',
  onProgress?: ExportProgressCallback
): Promise<Blob> {
  const builder = new SequenceBuilder(id, name, layout);
  buildSequence(builder);
  const sequence = builder.build();

  const exporter = new VideoExporter({ quality });
  return exporter.export(sequence, onProgress);
}

/**
 * Preview a sequence in real-time (for development).
 * Returns a player that can be controlled. Use getState() in a requestAnimationFrame loop
 * to get the current state for rendering.
 */
export function createPreviewPlayer(
  sequence: ReturnType<SequenceBuilder['build']>,
  _canvas: HTMLCanvasElement,
  _onFrame?: (state: PlaybackState) => void
): SequencePlayer {
  const player = new SequencePlayer(sequence);
  return player;
}

// ============================================================================
// VIDEO GENERATION PIPELINE
// ============================================================================

/**
 * Complete video generation pipeline.
 */
export class VideoGenerationPipeline {
  private exporter: VideoExporter;

  constructor(quality: QualityPreset = 'standard') {
    const config = { quality };
    this.exporter = new VideoExporter(config);
  }

  /**
   * Generate video from a sequence builder function.
   */
  async generate(
    id: string,
    name: string,
    layout: DeckLayout,
    buildSequence: (builder: SequenceBuilder) => void,
    onProgress?: ExportProgressCallback
  ): Promise<Blob> {
    const builder = new SequenceBuilder(id, name, layout);
    buildSequence(builder);
    const sequence = builder.build();
    return this.exporter.export(sequence, onProgress);
  }

  /**
   * Generate batch of videos for multiple personas.
   */
  async generateForPersonas(
    id: string,
    name: string,
    layout: DeckLayout,
    personas: ReadonlyArray<UserPersona>,
    buildSequence: (builder: SequenceBuilder, persona: UserPersona) => void,
    onProgress?: (persona: UserPersona, progress: ExportProgress) => void
  ): Promise<Map<UserPersona, Blob>> {
    const results = new Map<UserPersona, Blob>();

    for (const persona of personas) {
      const builder = new SequenceBuilder(`${id}-${persona}`, `${name} - ${persona}`, layout, persona);
      buildSequence(builder, persona);
      const sequence = builder.build();

      const blob = await this.exporter.export(sequence, (progress) => {
        onProgress?.(persona, progress);
      });

      results.set(persona, blob);
    }

    return results;
  }

  /**
   * Generate comparison video showing same sequence in different layouts.
   */
  async generateLayoutComparison(
    id: string,
    name: string,
    layouts: ReadonlyArray<DeckLayout>,
    buildSequence: (builder: SequenceBuilder) => void,
    onProgress?: (layoutIndex: number, progress: ExportProgress) => void
  ): Promise<Blob[]> {
    const results: Blob[] = [];

    for (let i = 0; i < layouts.length; i++) {
      const layout = layouts[i];
      if (!layout) continue;
      
      const builder = new SequenceBuilder(`${id}-${i}`, `${name} - Layout ${i}`, layout);
      buildSequence(builder);
      const sequence = builder.build();

      const blob = await this.exporter.export(sequence, (progress) => {
        onProgress?.(i, progress);
      });

      results.push(blob);
    }

    return results;
  }
}
