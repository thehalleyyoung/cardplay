/**
 * @fileoverview Mixer Panel Component (E044-E046)
 * 
 * Track strips with meters, mute/solo/arm, volume/pan controls.
 * Integrates with routing graph and DeckLayoutAdapter.
 * 
 * @module @cardplay/ui/components/mixer-panel
 */

// ============================================================================
// TYPES
// ============================================================================

export interface MixerTrack {
  id: string;
  name: string;
  color?: string;
  volume: number; // 0-1
  pan: number; // -1 to 1
  mute: boolean;
  solo: boolean;
  arm: boolean;
  meterLevel: number; // 0-1 (current audio level)
  clipLevel: number; // 0-1 (peak level, slower decay)
}

export interface MixerPanelConfig {
  tracks: MixerTrack[];
  onVolumeChange?: (trackId: string, volume: number) => void;
  onPanChange?: (trackId: string, pan: number) => void;
  onMuteToggle?: (trackId: string) => void;
  onSoloToggle?: (trackId: string) => void;
  onArmToggle?: (trackId: string) => void;
  onTrackSelect?: (trackId: string) => void;
}

// ============================================================================
// MIXER PANEL
// ============================================================================

/**
 * Creates a mixer panel with track strips.
 * E044-E046: Mixer deck with strips, meters, and controls.
 */
export function createMixerPanel(config: MixerPanelConfig): HTMLElement {
  const container = document.createElement('div');
  container.className = 'mixer-panel';
  container.setAttribute('role', 'region');
  container.setAttribute('aria-label', 'Mixer');
  
  // Apply styles
  injectMixerStyles();
  
  // Render tracks
  renderTracks(container, config);
  
  return container;
}

function renderTracks(container: HTMLElement, config: MixerPanelConfig): void {
  container.innerHTML = '';
  
  const tracksContainer = document.createElement('div');
  tracksContainer.className = 'mixer-tracks';
  
  if (config.tracks.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'mixer-empty';
    emptyState.textContent = 'No tracks';
    tracksContainer.appendChild(emptyState);
  } else {
    config.tracks.forEach(track => {
      const stripEl = createTrackStrip(track, config);
      tracksContainer.appendChild(stripEl);
    });
  }
  
  container.appendChild(tracksContainer);
}

function createTrackStrip(track: MixerTrack, config: MixerPanelConfig): HTMLElement {
  const strip = document.createElement('div');
  strip.className = 'mixer-track-strip';
  strip.setAttribute('data-track-id', track.id);
  
  if (track.color) {
    strip.style.setProperty('--track-color', track.color);
  }
  
  // Track header
  const header = document.createElement('div');
  header.className = 'mixer-track-header';
  header.textContent = track.name;
  header.addEventListener('click', () => {
    if (config.onTrackSelect) {
      config.onTrackSelect(track.id);
    }
  });
  strip.appendChild(header);
  
  // Meter
  const meterContainer = document.createElement('div');
  meterContainer.className = 'mixer-meter-container';
  
  const meterBg = document.createElement('div');
  meterBg.className = 'mixer-meter-bg';
  
  const meterBar = document.createElement('div');
  meterBar.className = 'mixer-meter-bar';
  meterBar.style.height = `${track.meterLevel * 100}%`;
  
  const meterClip = document.createElement('div');
  meterClip.className = 'mixer-meter-clip';
  if (track.clipLevel > 0.99) {
    meterClip.classList.add('mixer-meter-clip--active');
  }
  
  meterBg.appendChild(meterBar);
  meterContainer.appendChild(meterBg);
  meterContainer.appendChild(meterClip);
  strip.appendChild(meterContainer);
  
  // Volume fader
  const volumeContainer = document.createElement('div');
  volumeContainer.className = 'mixer-control-group';
  
  const volumeLabel = document.createElement('label');
  volumeLabel.className = 'mixer-control-label';
  volumeLabel.textContent = 'Vol';
  
  const volumeSlider = document.createElement('input');
  volumeSlider.type = 'range';
  volumeSlider.min = '0';
  volumeSlider.max = '100';
  volumeSlider.value = (track.volume * 100).toString();
  volumeSlider.className = 'mixer-slider mixer-slider--volume';
  volumeSlider.setAttribute('aria-label', `Volume for ${track.name}`);
  volumeSlider.addEventListener('input', (e) => {
    const value = parseInt((e.target as HTMLInputElement).value) / 100;
    if (config.onVolumeChange) {
      config.onVolumeChange(track.id, value);
    }
  });
  
  const volumeValue = document.createElement('div');
  volumeValue.className = 'mixer-control-value';
  volumeValue.textContent = `${Math.round(track.volume * 100)}%`;
  
  volumeContainer.appendChild(volumeLabel);
  volumeContainer.appendChild(volumeSlider);
  volumeContainer.appendChild(volumeValue);
  strip.appendChild(volumeContainer);
  
  // Pan knob
  const panContainer = document.createElement('div');
  panContainer.className = 'mixer-control-group';
  
  const panLabel = document.createElement('label');
  panLabel.className = 'mixer-control-label';
  panLabel.textContent = 'Pan';
  
  const panSlider = document.createElement('input');
  panSlider.type = 'range';
  panSlider.min = '-100';
  panSlider.max = '100';
  panSlider.value = (track.pan * 100).toString();
  panSlider.className = 'mixer-slider mixer-slider--pan';
  panSlider.setAttribute('aria-label', `Pan for ${track.name}`);
  panSlider.addEventListener('input', (e) => {
    const value = parseInt((e.target as HTMLInputElement).value) / 100;
    if (config.onPanChange) {
      config.onPanChange(track.id, value);
    }
  });
  
  const panValue = document.createElement('div');
  panValue.className = 'mixer-control-value';
  panValue.textContent = track.pan === 0 ? 'C' : 
    track.pan > 0 ? `R${Math.round(track.pan * 100)}` :
    `L${Math.round(-track.pan * 100)}`;
  
  panContainer.appendChild(panLabel);
  panContainer.appendChild(panSlider);
  panContainer.appendChild(panValue);
  strip.appendChild(panContainer);
  
  // Transport controls (mute/solo/arm)
  const transportContainer = document.createElement('div');
  transportContainer.className = 'mixer-transport-controls';
  
  const muteBtn = createToggleButton('M', track.mute, 'Mute', () => {
    if (config.onMuteToggle) {
      config.onMuteToggle(track.id);
    }
  });
  
  const soloBtn = createToggleButton('S', track.solo, 'Solo', () => {
    if (config.onSoloToggle) {
      config.onSoloToggle(track.id);
    }
  });
  
  const armBtn = createToggleButton('R', track.arm, 'Arm', () => {
    if (config.onArmToggle) {
      config.onArmToggle(track.id);
    }
  });
  
  transportContainer.appendChild(muteBtn);
  transportContainer.appendChild(soloBtn);
  transportContainer.appendChild(armBtn);
  strip.appendChild(transportContainer);
  
  return strip;
}

function createToggleButton(
  label: string,
  active: boolean,
  ariaLabel: string,
  onClick: () => void
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'mixer-toggle-button';
  btn.textContent = label;
  btn.setAttribute('aria-label', ariaLabel);
  btn.setAttribute('aria-pressed', active.toString());
  
  if (active) {
    btn.classList.add('mixer-toggle-button--active');
  }
  
  btn.addEventListener('click', onClick);
  
  return btn;
}

// ============================================================================
// STYLES
// ============================================================================

let stylesInjected = false;

function injectMixerStyles(): void {
  if (stylesInjected) return;
  stylesInjected = true;
  
  const style = document.createElement('style');
  style.textContent = `
    .mixer-panel {
      width: 100%;
      height: 100%;
      background: var(--surface-base, #1a1a1a);
      overflow-x: auto;
      overflow-y: hidden;
      padding: 8px;
    }
    
    .mixer-tracks {
      display: flex;
      gap: 8px;
      height: 100%;
      min-width: min-content;
    }
    
    .mixer-empty {
      padding: 32px;
      color: var(--text-secondary, #666);
      font-size: 0.875rem;
    }
    
    .mixer-track-strip {
      --track-color: #4a9eff;
      width: 80px;
      height: 100%;
      background: var(--surface-raised, #2a2a2a);
      border: 1px solid var(--border-base, #444);
      border-top: 3px solid var(--track-color);
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      padding: 8px;
      gap: 8px;
    }
    
    .mixer-track-header {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-primary, #fff);
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: pointer;
      padding: 4px;
      border-radius: 2px;
      transition: background 0.15s ease;
    }
    
    .mixer-track-header:hover {
      background: var(--surface-hover, #333);
    }
    
    .mixer-meter-container {
      flex: 1;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      min-height: 100px;
    }
    
    .mixer-meter-bg {
      flex: 1;
      background: var(--surface-sunken, #0a0a0a);
      border: 1px solid var(--border-base, #333);
      border-radius: 2px;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }
    
    .mixer-meter-bar {
      width: 100%;
      background: linear-gradient(to top, 
        #00ff00 0%, 
        #ffff00 70%, 
        #ff0000 90%);
      transition: height 0.05s ease;
    }
    
    .mixer-meter-clip {
      position: absolute;
      top: 2px;
      left: 2px;
      right: 2px;
      height: 3px;
      background: transparent;
      border-radius: 1px;
      transition: background 0.3s ease;
    }
    
    .mixer-meter-clip--active {
      background: #ff0000;
    }
    
    .mixer-control-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .mixer-control-label {
      font-size: 0.625rem;
      color: var(--text-secondary, #999);
      text-transform: uppercase;
      text-align: center;
    }
    
    .mixer-slider {
      width: 100%;
      height: 4px;
      -webkit-appearance: none;
      appearance: none;
      background: var(--surface-sunken, #0a0a0a);
      border-radius: 2px;
      outline: none;
    }
    
    .mixer-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 12px;
      height: 16px;
      background: var(--accent-primary, #00ff88);
      cursor: pointer;
      border-radius: 2px;
    }
    
    .mixer-slider::-moz-range-thumb {
      width: 12px;
      height: 16px;
      background: var(--accent-primary, #00ff88);
      cursor: pointer;
      border: none;
      border-radius: 2px;
    }
    
    .mixer-slider:focus-visible {
      outline: 2px solid var(--accent-primary, #00ff88);
      outline-offset: 2px;
    }
    
    .mixer-control-value {
      font-size: 0.625rem;
      color: var(--text-primary, #fff);
      text-align: center;
      font-variant-numeric: tabular-nums;
    }
    
    .mixer-transport-controls {
      display: flex;
      gap: 4px;
    }
    
    .mixer-toggle-button {
      flex: 1;
      height: 24px;
      padding: 0;
      background: var(--surface-base, #1a1a1a);
      border: 1px solid var(--border-base, #444);
      border-radius: 2px;
      color: var(--text-secondary, #999);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .mixer-toggle-button:hover {
      background: var(--surface-raised, #2a2a2a);
      border-color: var(--border-hover, #666);
    }
    
    .mixer-toggle-button--active {
      background: var(--accent-primary, #00ff88);
      color: var(--text-on-accent, #000);
      border-color: var(--accent-primary, #00ff88);
    }
    
    .mixer-toggle-button:focus-visible {
      outline: 2px solid var(--accent-primary, #00ff88);
      outline-offset: 2px;
    }
    
    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .mixer-track-header,
      .mixer-meter-bar,
      .mixer-meter-clip,
      .mixer-toggle-button {
        transition: none;
      }
    }
  `;
  
  document.head.appendChild(style);
}

// ============================================================================
// EXPORTS
// ============================================================================

// Types exported at top of file

// ============================================================================
// STREAM/CLIP INTEGRATION (E046)
// ============================================================================

/**
 * Derives mixer tracks from SharedEventStore streams.
 * 
 * E046: Mixer panel deriving strips from streams/clips consistently.
 */
export function deriveMixerTracksFromStreams(
  streams: ReadonlyMap<string, { id: string; name?: string }>,
  options?: {
    defaultVolume?: number;
    defaultPan?: number;
  }
): MixerTrack[] {
  const tracks: MixerTrack[] = [];
  
  for (const [streamId, stream] of streams) {
    const track: MixerTrack = {
      id: streamId,
      name: stream.name ?? `Track ${tracks.length + 1}`,
      volume: options?.defaultVolume ?? 0.8,
      pan: options?.defaultPan ?? 0,
      mute: false,
      solo: false,
      arm: false,
      meterLevel: 0,
      clipLevel: 0,
    };
    tracks.push(track);
  }
  
  return tracks;
}

/**
 * Derives mixer tracks from ClipRegistry clips.
 * Groups clips by track and creates a mixer strip per track.
 * 
 * E046: Mixer panel deriving strips from streams/clips consistently.
 */
export function deriveMixerTracksFromClips(
  clips: ReadonlyArray<{
    id: string;
    name: string;
    streamId?: string;
    trackId?: string;
    color?: string;
  }>,
  options?: {
    defaultVolume?: number;
    defaultPan?: number;
  }
): MixerTrack[] {
  // Group clips by track ID (or use clip's streamId as track ID)
  const trackMap = new Map<string, { name: string; color: string | undefined }>();
  
  for (const clip of clips) {
    const trackId = clip.trackId ?? clip.streamId ?? clip.id;
    if (!trackMap.has(trackId)) {
      trackMap.set(trackId, {
        name: clip.name,
        color: clip.color ?? undefined,
      });
    }
  }
  
  const tracks: MixerTrack[] = [];
  for (const [trackId, trackInfo] of trackMap) {
    const track: MixerTrack = {
      id: trackId,
      name: trackInfo.name,
      ...(trackInfo.color !== undefined && { color: trackInfo.color }),
      volume: options?.defaultVolume ?? 0.8,
      pan: options?.defaultPan ?? 0,
      mute: false,
      solo: false,
      arm: false,
      meterLevel: 0,
      clipLevel: 0,
    };
    tracks.push(track);
  }
  
  return tracks;
}

/**
 * Updates mixer track meters from audio engine state.
 * 
 * E046: Mixer panel meters integration.
 */
export function updateMixerTrackMeters(
  tracks: MixerTrack[],
  meterData: Map<string, { level: number; clip: number }>
): MixerTrack[] {
  return tracks.map(track => {
    const data = meterData.get(track.id);
    if (!data) return track;
    
    return {
      ...track,
      meterLevel: data.level,
      clipLevel: data.clip,
    };
  });
}
