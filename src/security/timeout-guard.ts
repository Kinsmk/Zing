/**
 * Zinga Security - Timeout Guard
 * 
 * Protects against infinite loops and long-running operations.
 */

import { ZMap } from '../../runtime/values/maps';
import { ZString } from '../../runtime/values/strings';
import { ZArray } from '../../runtime/values/arrays';
import { TimeoutManager } from '../../runtime/execution/limits';

/**
 * Timeout guard modes
 */
export enum TimeoutGuardMode {
  DISABLED = 'DISABLED',
  MONITOR = 'MONITOR',
  ENFORCE = 'ENFORCE',
  STRICT = 'STRICT'
}

/**
 * Timeout types
 */
export enum TimeoutType {
  EXECUTION = 'EXECUTION',
  CPU = 'CPU',
  WALL_CLOCK = 'WALL_CLOCK',
  IDLE = 'IDLE',
  OPERATION = 'OPERATION',
  CUSTOM = 'CUSTOM'
}

/**
 * Timeout configuration
 */
export interface TimeoutConfig {
  type: TimeoutType | string;
  duration: number;
  warningThreshold?: number;
  checkInterval?: number;
  action: 'WARN' | 'THROW' | 'TERMINATE' | 'IGNORE';
  message?: string;
}

/**
 * Timeout info
 */
export interface TimeoutInfo {
  id: string;
  type: TimeoutType | string;
  startTime: number;
  duration: number;
  elapsed: number;
  remaining: number;
  state: 'RUNNING' | 'EXPIRED' | 'CANCELLED';
}

/**
 * Timeout violation
 */
export interface TimeoutViolation {
  id: string;
  type: TimeoutType | string;
  duration: number;
  elapsed: number;
  timestamp: number;
  action: 'WARN' | 'THROW' | 'TERMINATE' | 'IGNORE';
}

/**
 * Timeout error
 */
export class TimeoutError extends Error {
  constructor(
    message: string,
    public readonly type: TimeoutType | string,
    public readonly elapsed: number,
    public readonly duration: number
  ) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Timeout Guard
 * 
 * Monitors and enforces timeouts for operations.
 */
export class TimeoutGuard {
  private mode: TimeoutGuardMode;
  private timeouts: ZMap<string, TimeoutInfo>;
  private timeoutManager: TimeoutManager;
  private configs: ZMap<string, TimeoutConfig>;
  private violations: ZArray<TimeoutViolation>;
  private running: boolean;
  private checkInterval: number;

  constructor(mode: TimeoutGuardMode = TimeoutGuardMode.MONITOR) {
    this.mode = mode;
    this.timeouts = new ZMap();
    this.timeoutManager = new TimeoutManager();
    this.configs = new ZMap();
    this.violations = new ZArray();
    this.running = false;
    this.checkInterval = 100; // ms
  }

  /**
   * Set timeout guard mode
   */
  setMode(mode: TimeoutGuardMode): void {
    this.mode = mode;
  }

  /**
   * Get timeout guard mode
   */
  getMode(): TimeoutGuardMode {
    return this.mode;
  }

  /**
   * Start the timeout guard
   */
  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.startCheckTimer();
  }

  /**
   * Stop the timeout guard
   */
  stop(): void {
    this.running = false;
  }

  /**
   * Set a timeout configuration
   */
  setConfig(config: TimeoutConfig): void {
    this.configs.set(config.type, config);
  }

  /**
   * Get a timeout configuration
   */
  getConfig(type: TimeoutType | string): TimeoutConfig | undefined {
    return this.configs.get(type);
  }

  /**
   * Remove a timeout configuration
   */
  removeConfig(type: TimeoutType | string): boolean {
    return this.configs.delete(type);
  }

  /**
   * Start a timeout
   */
  startTimeout(
    type: TimeoutType | string,
    duration?: number
  ): TimeoutInfo {
    const config = this.configs.get(type) || this.getDefaultConfig(type);
    const actualDuration = duration || config.duration;

    const timeout: TimeoutInfo = {
      id: this.generateId(),
      type,
      startTime: Date.now(),
      duration: actualDuration,
      elapsed: 0,
      remaining: actualDuration,
      state: 'RUNNING'
    };

    this.timeouts.set(timeout.id, timeout);
    
    // Set up actual timeout
    const timeoutId = setTimeout(() => {
      this.handleTimeout(timeout);
    }, actualDuration);

    this.timeoutManager.setTimeout(timeout.id, () => {
      this.handleTimeout(timeout);
    }, actualDuration);

    return timeout;
  }

  /**
   * Stop a timeout
   */
  stopTimeout(id: string): boolean {
    const timeout = this.timeouts.get(id);
    if (timeout) {
      timeout.state = 'CANCELLED';
      this.timeouts.delete(id);
      this.timeoutManager.clearTimeout(id);
      return true;
    }
    return false;
  }

  /**
   * Stop all timeouts
   */
  stopAllTimeouts(): number {
    const count = this.timeouts.size();
    for (const [id] of this.timeouts) {
      this.stopTimeout(id);
    }
    return count;
  }

  /**
   * Check if a timeout has expired
   */
  isExpired(id: string): boolean {
    const timeout = this.timeouts.get(id);
    if (!timeout) {
      return true;
    }
    return timeout.state === 'EXPIRED';
  }

  /**
   * Get timeout info
   */
  getTimeout(id: string): TimeoutInfo | undefined {
    return this.timeouts.get(id);
  }

  /**
   * Get all timeouts
   */
  getTimeouts(): ZArray<TimeoutInfo> {
    return new ZArray([...this.timeouts.values()]);
  }

  /**
   * Get active timeouts
   */
  getActiveTimeouts(): ZArray<TimeoutInfo> {
    const active: TimeoutInfo[] = [];
    for (const [, timeout] of this.timeouts) {
      if (timeout.state === 'RUNNING') {
        active.push(timeout);
      }
    }
    return new ZArray(active);
  }

  /**
   * Get expired timeouts
   */
  getExpiredTimeouts(): ZArray<TimeoutInfo> {
    const expired: TimeoutInfo[] = [];
    for (const [, timeout] of this.timeouts) {
      if (timeout.state === 'EXPIRED') {
        expired.push(timeout);
      }
    }
    return new ZArray(expired);
  }

  /**
   * Get timeout violations
   */
  getViolations(): ZArray<TimeoutViolation> {
    return this.violations;
  }

  /**
   * Clear timeout violations
   */
  clearViolations(): void {
    this.violations = new ZArray();
  }

  /**
   * Execute with timeout
   */
  async executeWithTimeout<T>(
    operation: () => Promise<T> | T,
    type: TimeoutType | string,
    duration?: number
  ): Promise<T> {
    const timeout = this.startTimeout(type, duration);
    
    try {
      const result = await operation();
      this.stopTimeout(timeout.id);
      return result;
    } catch (error) {
      this.stopTimeout(timeout.id);
      throw error;
    }
  }

  /**
   * Execute with CPU timeout (simulated)
   */
  async executeWithCPUTimeout<T>(
    operation: () => Promise<T> | T,
    limit: number
  ): Promise<T> {
    const start = Date.now();
    
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const elapsed = Date.now() - start;
        if (elapsed > limit) {
          clearInterval(checkInterval);
          reject(new TimeoutError(
            `CPU timeout exceeded: ${elapsed}ms > ${limit}ms`,
            TimeoutType.CPU,
            elapsed,
            limit
          ));
        }
      }, 100);

      Promise.resolve(operation())
        .then(result => {
          clearInterval(checkInterval);
          resolve(result);
        })
        .catch(error => {
          clearInterval(checkInterval);
          reject(error);
        });
    });
  }

  /**
   * Execute with wall clock timeout
   */
  async executeWithWallClockTimeout<T>(
    operation: () => Promise<T> | T,
    limit: number
  ): Promise<T> {
    const timeout = setTimeout(() => {
      throw new TimeoutError(
        `Wall clock timeout exceeded: ${limit}ms`,
        TimeoutType.WALL_CLOCK,
        limit,
        limit
      );
    }, limit);

    try {
      const result = await operation();
      clearTimeout(timeout);
      return result;
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }

  /**
   * Get timeout statistics
   */
  getStats(): {
    totalTimeouts: number;
    activeTimeouts: number;
    expiredTimeouts: number;
    totalViolations: number;
  } {
    let active = 0, expired = 0;
    
    for (const [, timeout] of this.timeouts) {
      if (timeout.state === 'RUNNING') {
        active++;
      } else if (timeout.state === 'EXPIRED') {
        expired++;
      }
    }

    return {
      totalTimeouts: this.timeouts.size(),
      activeTimeouts: active,
      expiredTimeouts: expired,
      totalViolations: this.violations.size()
    };
  }

  /**
   * Start the check timer
   */
  private startCheckTimer(): void {
    setInterval(() => {
      if (!this.running) {
        return;
      }

      const now = Date.now();
      for (const [id, timeout] of this.timeouts) {
        timeout.elapsed = now - timeout.startTime;
        timeout.remaining = Math.max(0, timeout.duration - timeout.elapsed);
        
        // Check for warnings
        const config = this.configs.get(timeout.type) || this.getDefaultConfig(timeout.type);
        const threshold = config.warningThreshold || timeout.duration * 0.8;
        
        if (timeout.elapsed >= threshold && timeout.elapsed < timeout.duration) {
          // Warning threshold reached
          console.warn(`Timeout warning: ${timeout.type} will expire in ${timeout.remaining}ms`);
        }
      }
    }, this.checkInterval);
  }

  /**
   * Handle timeout expiration
   */
  private handleTimeout(timeout: TimeoutInfo): void {
    timeout.state = 'EXPIRED';
    
    const config = this.configs.get(timeout.type) || this.getDefaultConfig(timeout.type);
    
    const violation: TimeoutViolation = {
      id: timeout.id,
      type: timeout.type,
      duration: timeout.duration,
      elapsed: timeout.elapsed,
      timestamp: Date.now(),
      action: config.action
    };
    
    this.violations.push(violation);

    // Take action based on mode and config
    if (this.mode !== TimeoutGuardMode.DISABLED) {
      switch (config.action) {
        case 'THROW':
          throw new TimeoutError(
            config.message || `Timeout exceeded: ${timeout.type}`,
            timeout.type,
            timeout.elapsed,
            timeout.duration
          );
        case 'TERMINATE':
          // In a real implementation, we would terminate the process
          console.error(`Timeout terminated: ${timeout.type}`);
          break;
        case 'WARN':
        default:
          console.warn(`Timeout warning: ${timeout.type}`);
          break;
      }
    }
  }

  /**
   * Get default timeout configuration
   */
  private getDefaultConfig(type: TimeoutType | string): TimeoutConfig {
    switch (type) {
      case TimeoutType.EXECUTION:
        return {
          type,
          duration: 5000,
          warningThreshold: 4000,
          action: 'THROW',
          message: 'Execution timeout exceeded'
        };
      case TimeoutType.CPU:
        return {
          type,
          duration: 5000,
          warningThreshold: 4000,
          action: 'THROW',
          message: 'CPU timeout exceeded'
        };
      case TimeoutType.WALL_CLOCK:
        return {
          type,
          duration: 10000,
          warningThreshold: 8000,
          action: 'THROW',
          message: 'Wall clock timeout exceeded'
        };
      default:
        return {
          type,
          duration: 5000,
          warningThreshold: 4000,
          action: 'THROW',
          message: 'Timeout exceeded'
        };
    }
  }

  /**
   * Generate unique timeout ID
   */
  private generateId(): string {
    return `timeout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Global timeout guard instance
 */
export const globalTimeoutGuard = new TimeoutGuard(TimeoutGuardMode.MONITOR);

export type TimeoutGuardValue = TimeoutGuard;
