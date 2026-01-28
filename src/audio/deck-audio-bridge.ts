/**
 * @fileoverview Deck-to-Audio-Graph Bridge
 * 
 * Connects the deck layout system to the low-latency audio graph:
 * - Maps deck card positions to audio graph nodes
 * - Routes connections through the audio/MIDI graph
 * - Syncs deck state with real-time audio processing
 * - Manages voice allocation across multiple instruments
 * - Handles transport synchronization
 * 
 * @module @cardplay/core/audio/deck-audio-bridge
 */

import { 
  Deck, 
  Card, 
} from './instrument-cards';
import { 
  LayoutManager, 
} from '../ui/deck-layouts';
import { 
  PerformanceEngine,
  BufferSize,
  SampleRateOption,
  SIMDOperations,
} from './performance-engine';
import { DeckRevealController, SyncVisualization } from '../ui/deck-reveal';

// ============================================================================
// AUDIO GRAPH TYPES
// ============================================================================

/** Node type in audio graph */
export type AudioNodeType = 
  | 'instrument'
  | 'effect'
  | 'mixer'
  | 'send'
  | 'return'
  | 'master'
  | 'analyzer'
  | 'midi_processor';

/** Audio graph node */
export interface AudioGraphNode {
  id: string;
  cardId: string;
  type: AudioNodeType;
  
  // Processing
  process: (inputL: Float32Array, inputR: Float32Array, outputL: Float32Array, outputR: Float32Array) => void;
  processMIDI?: (data: Uint8Array, timestamp: number) => void;
  
  // Routing
  inputNodes: string[];
  outputNodes: string[];
  midiInputNodes: string[];
  midiOutputNodes: string[];
  
  // State
  enabled: boolean;
  bypassed: boolean;
  soloSafe: boolean;
  
  // Parameters
  gain: number;
  pan: number;
  mute: boolean;
  solo: boolean;
}

/** Audio graph connection */
export interface AudioGraphConnection {
  id: string;
  sourceNodeId: string;
  sourcePort: number;
  targetNodeId: string;
  targetPort: number;
  type: 'audio' | 'midi' | 'sidechain' | 'modulation';
  gain: number;
}

/** MIDI route */
export interface MIDIRoute {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  channel: number;      // -1 = all channels
  transform?: MIDITransform;
}

/** MIDI transform */
export interface MIDITransform {
  transpose: number;
  velocityScale: number;
  velocityOffset: number;
  channelRemap: number;
  filterNoteRange: { min: number; max: number } | null;
  filterVelocityRange: { min: number; max: number } | null;
}

/** Transport state */
export interface TransportState {
  isPlaying: boolean;
  isPaused: boolean;
  isRecording: boolean;
  position: number;       // seconds
  tempo: number;          // BPM
  timeSignature: { numerator: number; denominator: number };
  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;
  metronomeEnabled: boolean;
  countIn: number;
}

/** Sync mode for tempo */
export type SyncMode = 'internal' | 'midi_clock' | 'link' | 'host';

// ============================================================================
// AUDIO GRAPH
// ============================================================================

/**
 * Low-latency audio graph
 */
export class AudioGraph {
  private nodes: Map<string, AudioGraphNode> = new Map();
  private connections: Map<string, AudioGraphConnection> = new Map();
  private midiRoutes: Map<string, MIDIRoute> = new Map();
  
  // Processing order (topologically sorted)
  private processingOrder: string[] = [];
  private orderDirty = true;
  
  // Buffers
  private nodeBuffers: Map<string, { left: Float32Array; right: Float32Array }> = new Map();
  private bufferSize: number;
  // @ts-ignore -- reserved for future use
  private _sampleRate: number;
  
  // Master output
  private masterNodeId = 'master';
  private masterGain = 1;
  private masterLimiterEnabled = true;
  
  // Solo state
  private soloedNodes: Set<string> = new Set();
  private hasSolo = false;
  
  constructor(bufferSize = 512, sampleRate = 44100) {
    this.bufferSize = bufferSize;
    this._sampleRate = sampleRate;
    
    // Create master node
    this.createMasterNode();
  }
  
  /**
   * Create master output node
   */
  private createMasterNode(): void {
    const masterNode: AudioGraphNode = {
      id: this.masterNodeId,
      cardId: 'master',
      type: 'master',
      process: (inputL, inputR, outputL, outputR) => {
        // Apply master gain and limiting
        for (let i = 0; i < inputL.length; i++) {
          let l = (inputL[i] ?? 0) * this.masterGain;
          let r = (inputR[i] ?? 0) * this.masterGain;
          
          // Simple limiter
          if (this.masterLimiterEnabled) {
            l = Math.tanh(l);
            r = Math.tanh(r);
          }
          
          outputL[i] = l;
          outputR[i] = r;
        }
      },
      inputNodes: [],
      outputNodes: [],
      midiInputNodes: [],
      midiOutputNodes: [],
      enabled: true,
      bypassed: false,
      soloSafe: true,
      gain: 1,
      pan: 0,
      mute: false,
      solo: false,
    };
    
    this.nodes.set(this.masterNodeId, masterNode);
    this.allocateNodeBuffer(this.masterNodeId);
  }
  
  /**
   * Add node to graph
   */
  addNode(node: AudioGraphNode): void {
    this.nodes.set(node.id, node);
    this.allocateNodeBuffer(node.id);
    this.orderDirty = true;
  }
  
  /**
   * Remove node from graph
   */
  removeNode(nodeId: string): void {
    if (nodeId === this.masterNodeId) return;
    
    // Remove connections
    for (const [connId, conn] of this.connections) {
      if (conn.sourceNodeId === nodeId || conn.targetNodeId === nodeId) {
        this.connections.delete(connId);
      }
    }
    
    // Remove MIDI routes
    for (const [routeId, route] of this.midiRoutes) {
      if (route.sourceNodeId === nodeId || route.targetNodeId === nodeId) {
        this.midiRoutes.delete(routeId);
      }
    }
    
    this.nodes.delete(nodeId);
    this.nodeBuffers.delete(nodeId);
    this.soloedNodes.delete(nodeId);
    this.orderDirty = true;
  }
  
  /**
   * Connect two nodes
   */
  connect(
    sourceNodeId: string,
    targetNodeId: string,
    type: 'audio' | 'midi' | 'sidechain' | 'modulation' = 'audio',
    gain = 1
  ): string {
    const id = `conn_${sourceNodeId}_${targetNodeId}_${Date.now()}`;
    
    const connection: AudioGraphConnection = {
      id,
      sourceNodeId,
      sourcePort: 0,
      targetNodeId,
      targetPort: 0,
      type,
      gain,
    };
    
    this.connections.set(id, connection);
    
    // Update node references
    const sourceNode = this.nodes.get(sourceNodeId);
    const targetNode = this.nodes.get(targetNodeId);
    
    if (sourceNode && targetNode) {
      if (type === 'midi') {
        if (!sourceNode.midiOutputNodes.includes(targetNodeId)) {
          sourceNode.midiOutputNodes.push(targetNodeId);
        }
        if (!targetNode.midiInputNodes.includes(sourceNodeId)) {
          targetNode.midiInputNodes.push(sourceNodeId);
        }
      } else {
        if (!sourceNode.outputNodes.includes(targetNodeId)) {
          sourceNode.outputNodes.push(targetNodeId);
        }
        if (!targetNode.inputNodes.includes(sourceNodeId)) {
          targetNode.inputNodes.push(sourceNodeId);
        }
      }
    }
    
    this.orderDirty = true;
    return id;
  }
  
  /**
   * Disconnect two nodes
   */
  disconnect(connectionId: string): void {
    const conn = this.connections.get(connectionId);
    if (!conn) return;
    
    const sourceNode = this.nodes.get(conn.sourceNodeId);
    const targetNode = this.nodes.get(conn.targetNodeId);
    
    if (sourceNode) {
      const idx = sourceNode.outputNodes.indexOf(conn.targetNodeId);
      if (idx >= 0) sourceNode.outputNodes.splice(idx, 1);
    }
    
    if (targetNode) {
      const idx = targetNode.inputNodes.indexOf(conn.sourceNodeId);
      if (idx >= 0) targetNode.inputNodes.splice(idx, 1);
    }
    
    this.connections.delete(connectionId);
    this.orderDirty = true;
  }
  
  /**
   * Add MIDI route
   */
  addMIDIRoute(route: Omit<MIDIRoute, 'id'>): string {
    const id = `midi_${route.sourceNodeId}_${route.targetNodeId}_${Date.now()}`;
    this.midiRoutes.set(id, { ...route, id });
    return id;
  }
  
  /**
   * Process audio for one buffer
   */
  process(outputL: Float32Array, outputR: Float32Array): void {
    // Update processing order if needed
    if (this.orderDirty) {
      this.updateProcessingOrder();
    }
    
    // Clear all buffers
    for (const buffer of this.nodeBuffers.values()) {
      buffer.left.fill(0);
      buffer.right.fill(0);
    }
    
    // Process nodes in order
    for (const nodeId of this.processingOrder) {
      const node = this.nodes.get(nodeId);
      if (!node || !node.enabled || node.mute) continue;
      
      // Check solo state
      if (this.hasSolo && !node.solo && !node.soloSafe) continue;
      
      const buffer = this.nodeBuffers.get(nodeId);
      if (!buffer) continue;
      
      // Gather inputs
      const inputL = new Float32Array(this.bufferSize);
      const inputR = new Float32Array(this.bufferSize);
      
      for (const inputNodeId of node.inputNodes) {
        const inputBuffer = this.nodeBuffers.get(inputNodeId);
        if (inputBuffer) {
          // Find connection gain
          let gain = 1;
          for (const conn of this.connections.values()) {
            if (conn.sourceNodeId === inputNodeId && conn.targetNodeId === nodeId) {
              gain = conn.gain;
              break;
            }
          }
          
          SIMDOperations.accumulate(inputBuffer.left, inputL, this.bufferSize, gain);
          SIMDOperations.accumulate(inputBuffer.right, inputR, this.bufferSize, gain);
        }
      }
      
      // Process node
      if (node.bypassed) {
        buffer.left.set(inputL);
        buffer.right.set(inputR);
      } else {
        node.process(inputL, inputR, buffer.left, buffer.right);
      }
      
      // Apply node gain/pan
      if (node.gain !== 1 || node.pan !== 0) {
        const leftGain = node.gain * (node.pan <= 0 ? 1 : 1 - node.pan);
        const rightGain = node.gain * (node.pan >= 0 ? 1 : 1 + node.pan);
        
        SIMDOperations.applyGain(buffer.left, this.bufferSize, leftGain);
        SIMDOperations.applyGain(buffer.right, this.bufferSize, rightGain);
      }
    }
    
    // Copy master output
    const masterBuffer = this.nodeBuffers.get(this.masterNodeId);
    if (masterBuffer) {
      outputL.set(masterBuffer.left);
      outputR.set(masterBuffer.right);
    }
  }
  
  /**
   * Process MIDI event
   */
  processMIDI(data: Uint8Array, timestamp: number): void {
    // Route MIDI through graph
    for (const route of this.midiRoutes.values()) {
      const targetNode = this.nodes.get(route.targetNodeId);
      if (!targetNode || !targetNode.processMIDI) continue;
      
      // Apply transform
      let processedData: Uint8Array | null = data;
      if (route.transform) {
        processedData = this.applyMIDITransform(data, route.transform);
        if (!processedData) continue; // Filtered out
      }
      
      // Check channel filter
      if (route.channel >= 0) {
        const channel = (data[0] ?? 0) & 0x0f;
        if (channel !== route.channel) continue;
      }
      
      targetNode.processMIDI(processedData, timestamp);
    }
  }
  
  /**
   * Set solo state for node
   */
  setSolo(nodeId: string, solo: boolean): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;
    
    node.solo = solo;
    
    if (solo) {
      this.soloedNodes.add(nodeId);
    } else {
      this.soloedNodes.delete(nodeId);
    }
    
    this.hasSolo = this.soloedNodes.size > 0;
  }
  
  /**
   * Set mute state for node
   */
  setMute(nodeId: string, mute: boolean): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.mute = mute;
    }
  }
  
  /**
   * Set bypass state for node
   */
  setBypass(nodeId: string, bypass: boolean): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.bypassed = bypass;
    }
  }
  
  /**
   * Get node
   */
  getNode(nodeId: string): AudioGraphNode | undefined {
    return this.nodes.get(nodeId);
  }
  
  /**
   * Get all nodes
   */
  getAllNodes(): AudioGraphNode[] {
    return Array.from(this.nodes.values());
  }
  
  /**
   * Get connections for node
   */
  getConnectionsForNode(nodeId: string): AudioGraphConnection[] {
    return Array.from(this.connections.values()).filter(
      conn => conn.sourceNodeId === nodeId || conn.targetNodeId === nodeId
    );
  }
  
  // ===========================================================================
  // PRIVATE
  // ===========================================================================
  
  private allocateNodeBuffer(nodeId: string): void {
    this.nodeBuffers.set(nodeId, {
      left: new Float32Array(this.bufferSize),
      right: new Float32Array(this.bufferSize),
    });
  }
  
  private updateProcessingOrder(): void {
    // Topological sort using Kahn's algorithm
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();
    
    for (const node of this.nodes.values()) {
      inDegree.set(node.id, 0);
      adjacency.set(node.id, []);
    }
    
    for (const node of this.nodes.values()) {
      for (const outputId of node.outputNodes) {
        adjacency.get(node.id)?.push(outputId);
        inDegree.set(outputId, (inDegree.get(outputId) ?? 0) + 1);
      }
    }
    
    const queue: string[] = [];
    for (const [id, degree] of inDegree) {
      if (degree === 0) {
        queue.push(id);
      }
    }
    
    this.processingOrder = [];
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      this.processingOrder.push(nodeId);
      
      for (const neighbor of adjacency.get(nodeId) ?? []) {
        const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }
    
    this.orderDirty = false;
  }
  
  private applyMIDITransform(data: Uint8Array, transform: MIDITransform): Uint8Array | null {
    const status = (data[0] ?? 0) & 0xf0;
    // _channel is unused but computed for clarity
    // const _channel = (data[0] ?? 0) & 0x0f;
    
    // Filter by note range
    if (transform.filterNoteRange && (status === 0x90 || status === 0x80)) {
      const note = data[1];
      if (note !== undefined && (note < transform.filterNoteRange.min || note > transform.filterNoteRange.max)) {
        return null;
      }
    }
    
    // Filter by velocity range
    if (transform.filterVelocityRange && status === 0x90) {
      const velocity = data[2];
      if (velocity !== undefined && (velocity < transform.filterVelocityRange.min || velocity > transform.filterVelocityRange.max)) {
        return null;
      }
    }
    
    const result = new Uint8Array(data.length);
    result.set(data);
    
    // Remap channel
    if (transform.channelRemap >= 0) {
      result[0] = (status | transform.channelRemap);
    }
    
    // Transpose
    if (transform.transpose !== 0 && (status === 0x90 || status === 0x80)) {
      result[1] = Math.max(0, Math.min(127, (data[1] ?? 0) + transform.transpose));
    }
    
    // Scale/offset velocity
    if (status === 0x90 && (data[2] ?? 0) > 0) {
      let velocity = (data[2] ?? 0) * transform.velocityScale + transform.velocityOffset;
      result[2] = Math.max(1, Math.min(127, Math.round(velocity)));
    }
    
    return result;
  }
}

// ============================================================================
// DECK-AUDIO BRIDGE
// ============================================================================

/**
 * Bridges deck layout to audio graph
 */
export class DeckAudioBridge {
  private deck: Deck | null = null;
  private layoutManager: LayoutManager;
  private audioGraph: AudioGraph;
  private performanceEngine: PerformanceEngine;
  private revealController: DeckRevealController;
  
  // Card-to-node mapping
  private cardToNode: Map<string, string> = new Map();
  private nodeToCard: Map<string, string> = new Map();
  
  // Transport
  private transport: TransportState;
  // @ts-ignore -- reserved for future use
  private syncMode: SyncMode = 'internal';
  // @ts-ignore -- reserved for future use  
  private sampleRate = 44100;
  
  // Processing
  private isProcessing = false;
  private processInterval: number | null = null;
  private lastProcessTime = 0;
  
  // Buffers
  private outputL: Float32Array;
  private outputR: Float32Array;
  private bufferSize = 512;
  
  // Meters
  private peakL = 0;
  private peakR = 0;
  private rmsL = 0;
  private rmsR = 0;
  
  constructor(bufferSize = 512, sampleRate = 44100) {
    this.bufferSize = bufferSize;
    this.sampleRate = sampleRate;
    
    this.layoutManager = new LayoutManager();
    this.audioGraph = new AudioGraph(bufferSize, sampleRate);
    this.performanceEngine = new PerformanceEngine({ bufferSize: bufferSize as BufferSize, sampleRate: sampleRate as SampleRateOption });
    this.revealController = new DeckRevealController();
    
    this.outputL = new Float32Array(bufferSize);
    this.outputR = new Float32Array(bufferSize);
    
    this.transport = {
      isPlaying: false,
      isPaused: false,
      isRecording: false,
      position: 0,
      tempo: 120,
      timeSignature: { numerator: 4, denominator: 4 },
      loopEnabled: false,
      loopStart: 0,
      loopEnd: 16,
      metronomeEnabled: false,
      countIn: 0,
    };
  }
  
  // ===========================================================================
  // DECK MANAGEMENT
  // ===========================================================================
  
  /**
   * Connect a deck
   */
  connectDeck(deck: Deck): void {
    this.deck = deck;
    this.revealController.connectDeck(deck);
    this.syncDeckToGraph();
  }
  
  /**
   * Disconnect deck
   */
  disconnectDeck(): void {
    this.stopProcessing();
    
    // Remove all card nodes
    for (const nodeId of this.cardToNode.values()) {
      this.audioGraph.removeNode(nodeId);
    }
    
    this.cardToNode.clear();
    this.nodeToCard.clear();
    this.deck = null;
    this.revealController.disconnectDeck();
  }
  
  /**
   * Sync deck state to audio graph
   */
  syncDeckToGraph(): void {
    if (!this.deck) return;
    
    // Get all cards
    const cards = this.deck.getAllCards();
    
    // Track existing nodes for cleanup
    const activeCardIds = new Set<string>();
    
    for (const card of cards) {
      activeCardIds.add(card.id);
      
      // Check if node exists
      if (!this.cardToNode.has(card.id)) {
        this.createNodeForCard(card);
      }
      
      // Update node state
      this.updateNodeFromCard(card);
    }
    
    // Remove nodes for removed cards
    for (const [cardId, nodeId] of this.cardToNode) {
      if (!activeCardIds.has(cardId)) {
        this.audioGraph.removeNode(nodeId);
        this.cardToNode.delete(cardId);
        this.nodeToCard.delete(nodeId);
      }
    }
    
    // Sync connections from layout
    this.syncConnectionsFromLayout();
    
    // Sync tempo
    this.transport.tempo = this.deck.getTempo();
  }
  
  /**
   * Create audio graph node for card
   */
  private createNodeForCard(card: Card): void {
    const nodeId = `node_${card.id}`;
    
    let nodeType: AudioNodeType = 'effect';
    if (card.category === 'sampler' || card.category === 'wavetable' || card.category === 'hybrid') {
      nodeType = 'instrument';
    } else if (card.category === 'midi') {
      nodeType = 'midi_processor';
    }
    
    const node: AudioGraphNode = {
      id: nodeId,
      cardId: card.id,
      type: nodeType,
      process: (inputL, inputR, outputL, outputR) => {
        card.processAudio(inputL, inputR, outputL, outputR);
      },
      processMIDI: (data, timestamp) => {
        card.processMIDI(data, timestamp);
      },
      inputNodes: [],
      outputNodes: [],
      midiInputNodes: [],
      midiOutputNodes: [],
      enabled: true,
      bypassed: card.getState() === 'bypassed',
      soloSafe: false,
      gain: 1,
      pan: 0,
      mute: card.getState() === 'muted',
      solo: card.getState() === 'soloed',
    };
    
    this.audioGraph.addNode(node);
    this.cardToNode.set(card.id, nodeId);
    this.nodeToCard.set(nodeId, card.id);
    
    // Connect instruments to master by default
    if (nodeType === 'instrument') {
      this.audioGraph.connect(nodeId, 'master', 'audio');
    }
  }
  
  /**
   * Update node state from card
   */
  private updateNodeFromCard(card: Card): void {
    const nodeId = this.cardToNode.get(card.id);
    if (!nodeId) return;
    
    const node = this.audioGraph.getNode(nodeId);
    if (!node) return;
    
    const state = card.getState();
    node.bypassed = state === 'bypassed';
    node.mute = state === 'muted';
    node.solo = state === 'soloed';
    
    if (state === 'soloed') {
      this.audioGraph.setSolo(nodeId, true);
    }
  }
  
  /**
   * Sync connections from layout manager
   */
  private syncConnectionsFromLayout(): void {
    const connections = this.layoutManager.getConnections();
    
    for (const conn of connections) {
      const sourceNodeId = this.cardToNode.get(conn.sourceCardId);
      const targetNodeId = this.cardToNode.get(conn.targetCardId);
      
      if (sourceNodeId && targetNodeId) {
        this.audioGraph.connect(
          sourceNodeId,
          targetNodeId,
          conn.connectionType === 'midi' ? 'midi' : 'audio'
        );
      }
    }
  }
  
  // ===========================================================================
  // TRANSPORT
  // ===========================================================================
  
  /**
   * Start playback
   */
  play(): void {
    this.transport.isPlaying = true;
    this.transport.isPaused = false;
    this.startProcessing();
    this.revealController.updateTransport(true, this.transport.position);
  }
  
  /**
   * Stop playback
   */
  stop(): void {
    this.transport.isPlaying = false;
    this.transport.isPaused = false;
    this.transport.position = 0;
    this.stopProcessing();
    this.revealController.updateTransport(false, 0);
  }
  
  /**
   * Pause playback
   */
  pause(): void {
    this.transport.isPlaying = false;
    this.transport.isPaused = true;
    this.stopProcessing();
    this.revealController.updateTransport(false, this.transport.position);
  }
  
  /**
   * Set tempo
   */
  setTempo(bpm: number): void {
    this.transport.tempo = Math.max(20, Math.min(300, bpm));
    this.deck?.setTempo(this.transport.tempo);
    this.revealController.updateTempo(this.transport.tempo);
  }
  
  /**
   * Get transport state
   */
  getTransport(): TransportState {
    return { ...this.transport };
  }
  
  /**
   * Seek to position
   */
  seek(seconds: number): void {
    this.transport.position = Math.max(0, seconds);
    this.revealController.updateTransport(this.transport.isPlaying, this.transport.position);
  }
  
  // ===========================================================================
  // PROCESSING
  // ===========================================================================
  
  /**
   * Start audio processing loop
   */
  startProcessing(): void {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.lastProcessTime = performance.now();
    
    const processLoop = () => {
      if (!this.isProcessing) return;
      
      const now = performance.now();
      const deltaTime = (now - this.lastProcessTime) / 1000;
      this.lastProcessTime = now;
      
      // Update transport position
      if (this.transport.isPlaying) {
        this.transport.position += deltaTime;
        
        // Handle loop
        if (this.transport.loopEnabled && this.transport.position >= this.transport.loopEnd) {
          this.transport.position = this.transport.loopStart;
        }
      }
      
      // Process audio
      this.processAudio();
      
      // Update visualizations
      this.updateMeters();
      this.revealController.updateTransport(this.transport.isPlaying, this.transport.position);
      this.revealController.updateLevels(this.peakL, this.peakR, this.rmsL, this.rmsR);
      this.revealController.decayMIDIActivity(deltaTime);
      
      // Schedule next frame
      this.processInterval = requestAnimationFrame(processLoop);
    };
    
    processLoop();
  }
  
  /**
   * Stop audio processing loop
   */
  stopProcessing(): void {
    this.isProcessing = false;
    if (this.processInterval) {
      cancelAnimationFrame(this.processInterval);
      this.processInterval = null;
    }
  }
  
  /**
   * Process one buffer of audio
   */
  private processAudio(): void {
    this.outputL.fill(0);
    this.outputR.fill(0);
    
    this.audioGraph.process(this.outputL, this.outputR);
  }
  
  /**
   * Update level meters
   */
  private updateMeters(): void {
    let sumL = 0;
    let sumR = 0;
    let maxL = 0;
    let maxR = 0;
    
    for (let i = 0; i < this.bufferSize; i++) {
      const l = Math.abs(this.outputL[i] ?? 0);
      const r = Math.abs(this.outputR[i] ?? 0);
      
      sumL += l * l;
      sumR += r * r;
      maxL = Math.max(maxL, l);
      maxR = Math.max(maxR, r);
    }
    
    this.rmsL = Math.sqrt(sumL / this.bufferSize);
    this.rmsR = Math.sqrt(sumR / this.bufferSize);
    
    // Peak with decay
    this.peakL = Math.max(this.peakL * 0.95, maxL);
    this.peakR = Math.max(this.peakR * 0.95, maxR);
  }
  
  // ===========================================================================
  // MIDI
  // ===========================================================================
  
  /**
   * Process incoming MIDI
   */
  processMIDI(data: Uint8Array): void {
    this.audioGraph.processMIDI(data, performance.now());
    this.revealController.processMIDI(data);
  }
  
  /**
   * Send note on to specific card
   */
  noteOn(cardId: string, note: number, velocity: number): void {
    const nodeId = this.cardToNode.get(cardId);
    if (!nodeId) return;
    
    const node = this.audioGraph.getNode(nodeId);
    if (node?.processMIDI) {
      const data = new Uint8Array([0x90, note, velocity]);
      node.processMIDI(data, performance.now());
    }
    
    this.revealController.processMIDI(new Uint8Array([0x90, note, velocity]));
  }
  
  /**
   * Send note off to specific card
   */
  noteOff(cardId: string, note: number): void {
    const nodeId = this.cardToNode.get(cardId);
    if (!nodeId) return;
    
    const node = this.audioGraph.getNode(nodeId);
    if (node?.processMIDI) {
      const data = new Uint8Array([0x80, note, 0]);
      node.processMIDI(data, performance.now());
    }
    
    this.revealController.processMIDI(new Uint8Array([0x80, note, 0]));
  }
  
  // ===========================================================================
  // ACCESSORS
  // ===========================================================================
  
  getDeck(): Deck | null {
    return this.deck;
  }
  
  getLayoutManager(): LayoutManager {
    return this.layoutManager;
  }
  
  getAudioGraph(): AudioGraph {
    return this.audioGraph;
  }
  
  getRevealController(): DeckRevealController {
    return this.revealController;
  }
  
  getPerformanceEngine(): PerformanceEngine {
    return this.performanceEngine;
  }
  
  getSyncState(): SyncVisualization {
    return this.revealController.getSyncState();
  }
  
  getMetrics(): {
    peakL: number;
    peakR: number;
    rmsL: number;
    rmsR: number;
    nodeCount: number;
    connectionCount: number;
  } {
    return {
      peakL: this.peakL,
      peakR: this.peakR,
      rmsL: this.rmsL,
      rmsR: this.rmsR,
      nodeCount: this.audioGraph.getAllNodes().length,
      connectionCount: this.audioGraph.getAllNodes().reduce(
        (sum, node) => sum + node.outputNodes.length, 0
      ),
    };
  }
  
  // ===========================================================================
  // DISPOSAL
  // ===========================================================================
  
  dispose(): void {
    this.stopProcessing();
    this.disconnectDeck();
    this.revealController.dispose();
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createDeckAudioBridge(bufferSize = 512, sampleRate = 44100): DeckAudioBridge {
  return new DeckAudioBridge(bufferSize, sampleRate);
}

export function createAudioGraph(bufferSize = 512, sampleRate = 44100): AudioGraph {
  return new AudioGraph(bufferSize, sampleRate);
}
