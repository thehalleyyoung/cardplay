/**
 * @fileoverview Performance Monitoring for CardPlay
 * 
 * Tracks app performance metrics and provides debugging tools for
 * ensuring smooth 60fps rendering and responsive interactions.
 * 
 * @module @cardplay/ui/performance/monitor
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'render' | 'audio' | 'interaction' | 'memory' | 'load';
}

interface PerformanceBudget {
  name: string;
  budget: number;
  unit: 'ms' | 'bytes' | 'count';
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private marks: Map<string, number> = new Map();
  private budgets: Map<string, PerformanceBudget> = new Map();
  private frameTimestamps: number[] = [];
  private maxFrameHistory = 60;
  private enabled = false;
  
  enable(): void {
    this.enabled = true;
    this.startFrameTracking();
  }
  
  disable(): void {
    this.enabled = false;
  }
  
  isEnabled(): boolean {
    return this.enabled;
  }
  
  mark(name: string): void {
    if (!this.enabled) return;
    this.marks.set(name, performance.now());
  }
  
  measure(name: string, category: PerformanceMetric['category']): number {
    if (!this.enabled) return 0;
    
    const startTime = this.marks.get(name);
    if (startTime === undefined) {
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.marks.delete(name);
    
    this.recordMetric({
      name,
      value: duration,
      timestamp: Date.now(),
      category
    });
    
    return duration;
  }
  
  recordMetric(metric: PerformanceMetric): void {
    if (!this.enabled) return;
    
    this.metrics.push(metric);
    
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
  }
  
  setBudget(name: string, budget: number, unit: PerformanceBudget['unit']): void {
    this.budgets.set(name, { name, budget, unit });
  }
  
  getCurrentFPS(): number {
    if (this.frameTimestamps.length < 2) return 0;
    
    const recentFrames = this.frameTimestamps.slice(-10);
    const last = recentFrames[recentFrames.length - 1];
    const first = recentFrames[0];
    if (last === undefined || first === undefined) return 0;
    
    const totalTime = last - first;
    const avgFrameTime = totalTime / (recentFrames.length - 1);
    
    return avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
  }
  
  getSummary(): {
    fps: number;
    renderTime: number;
    memoryMB: number;
  } {
    const memory = ('memory' in performance && (performance as any).memory)
      ? (performance as any).memory
      : null;
    
    return {
      fps: this.getCurrentFPS(),
      renderTime: 0,
      memoryMB: memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0
    };
  }
  
  private startFrameTracking(): void {
    const trackFrame = () => {
      if (!this.enabled) return;
      
      this.frameTimestamps.push(performance.now());
      
      if (this.frameTimestamps.length > this.maxFrameHistory) {
        this.frameTimestamps.shift();
      }
      
      requestAnimationFrame(trackFrame);
    };
    
    requestAnimationFrame(trackFrame);
  }
}

let monitorInstance: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!monitorInstance) {
    monitorInstance = new PerformanceMonitor();
  }
  return monitorInstance;
}

export function createPerformanceHUD(): HTMLElement {
  const monitor = getPerformanceMonitor();
  monitor.enable();
  
  const hud = document.createElement('div');
  hud.id = 'performance-hud';
  hud.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    padding: 12px;
    background: rgba(0,0,0,0.85);
    color: #fff;
    font-family: monospace;
    font-size: 11px;
    z-index: 10000;
    border-radius: 4px;
    min-width: 200px;
    pointer-events: none;
  `;
  
  const updateHUD = () => {
    const summary = monitor.getSummary();
    const fpsColor = summary.fps >= 55 ? '#10b981' : summary.fps >= 30 ? '#f59e0b' : '#ef4444';
    
    hud.innerHTML = `
      <div style="margin-bottom:8px;font-weight:bold;border-bottom:1px solid #444;padding-bottom:4px;">
        Performance Monitor
      </div>
      <div style="display:grid;grid-template-columns:auto 1fr;gap:4px 8px;">
        <span>FPS:</span>
        <span style="color:${fpsColor};font-weight:bold;">${summary.fps.toFixed(1)}</span>
        <span>Memory:</span>
        <span>${summary.memoryMB}MB</span>
      </div>
    `;
    
    requestAnimationFrame(updateHUD);
  };
  
  updateHUD();
  return hud;
}
