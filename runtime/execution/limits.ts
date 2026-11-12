/**
 * Zinga Runtime - Execution Limits
 * 
 * Manages execution limits, timeouts, and resource quotas.
 */

import { ZMap } from '../values/maps';
import { ZString } from '../values/strings';
import { ZArray } from '../values/arrays';

/**
 * Limit types
 */
export enum LimitType {
  MEMORY = 'MEMORY',
  TIME = 'TIME',
  CPU = 'CPU',
  STACK = 'STACK',
  RECURSION = 'RECURSION',
  OUTPUT = 'OUTPUT',
  INPUT = 'INPUT',
  FILE_DESCRIPTORS = 'FILE_DESCRIPTORS',
  NETWORK = 'NETWORK',
  THREADS = 'THREADS'
}

/**
 * Limit configuration
 */
export interface LimitConfig {
  type: LimitType;
  value: number;
  warningThreshold?: number;
  action: 'WARN' | 'THROW' | 'TERMINATE' | 'IGNORE';
  message?: string;
}

/**
 * Resource limits for execution
 */
export interface ExecutionLimits {
  memory?: LimitConfig;
  time?: LimitConfig;
  cpu?: LimitConfig;
  stack?: LimitConfig;
  recursion?: LimitConfig;
  output?: LimitConfig;
  input?: LimitConfig;
  fileDescriptors?: LimitConfig;
  network?: LimitConfig;
  threads?: LimitConfig;
}

/**
 * Default execution limits
 */
export const DefaultLimits: ExecutionLimits = {
  memory: {
    type: LimitType.MEMORY,
    value: 128 * 1024 * 1024, // 128MB
    warningThreshold: 100 * 1024 * 1024, // 100MB
    action: 'THROW',
    message: 'Memory limit exceeded'
  },
  time: {
    type: LimitType.TIME,
    value: 5000, // 5 seconds
    warningThreshold: 4000, // 4 seconds
    action: 'THROW',
    message: 'Execution time limit exceeded'
  },
  cpu: {
    type: LimitType.CPU,
    value: 5000, // 5 seconds
    warningThreshold: 4000, // 4 seconds
    action: 'THROW',
    message: 'CPU time limit exceeded'
  },
  stack: {
    type: LimitType.STACK,
    value: 1000, // 1000 stack frames
    warningThreshold: 800, // 800 stack frames
    action: 'THROW',
    message: 'Stack overflow'
  },
  recursion: {
    type: LimitType.RECURSION,
    value: 100, // 100 recursive calls
    warningThreshold: 80, // 80 recursive calls
    action: 'THROW',
    message: 'Maximum recursion depth exceeded'
  },
  output: {
    type: LimitType.OUTPUT,
    value: 1024 * 1024, // 1MB
    warningThreshold: 800 * 1024, // 800KB
    action: 'TERMINATE',
    message: 'Output limit exceeded'
  }
};

/**
 * Limit violation event
 */
export interface LimitViolation {
  type: LimitType;
  limit: number;
  current: number;
  threshold?: number;
  timestamp: number;
  action: 'WARN' | 'THROW' | 'TERMINATE';
}

/**
 * Limit monitor callback
 */
export type LimitMonitorCallback = (violation: LimitViolation) => void;

/**
 * Execution Limits Manager
 * 
 * Tracks and enforces execution limits.
 */
export class LimitsManager {
  private limits: ExecutionLimits;
  private monitors: ZMap<string, LimitMonitorCallback>;
  private violations: ZArray<LimitViolation>;
  private memoryUsage: number;
  private cpuTime: number;
  private executionStart: number;
  private stackDepth: number;
  private recursionDepth: number;
  private outputSize: number;
  private inputSize: number;

  constructor(limits: ExecutionLimits = DefaultLimits) {
    this.limits = limits;
    this.monitors = new ZMap();
    this.violations = new ZArray();
    this.memoryUsage = 0;
    this.cpuTime = 0;
    this.executionStart = Date.now();
    this.stackDepth = 0;
    this.recursionDepth = 0;
    this.outputSize = 0;
    this.inputSize = 0;
  }

  /**
   * Start execution tracking
   */
  start(): void {
    this.executionStart = Date.now();
    this.cpuTime = 0;
    this.memoryUsage = 0;
    this.stackDepth = 0;
    this.recursionDepth = 0;
    this.outputSize = 0;
    this.inputSize = 0;
  }

  /**
   * Stop execution tracking
   */
  stop(): void {
    // Nothing to do for now
  }

  /**
   * Check all limits
   */
  checkAll(): LimitViolation[] {
    const violations: LimitViolation[] = [];
    const now = Date.now();
    const elapsed = now - this.executionStart;

    // Check memory
    if (this.limits.memory) {
      const violation = this.checkLimit(
        LimitType.MEMORY,
        this.memoryUsage,
        this.limits.memory,
        now
      );
      if (violation) violations.push(violation);
    }

    // Check time
    if (this.limits.time) {
      const violation = this.checkLimit(
        LimitType.TIME,
        elapsed,
        this.limits.time,
        now
      );
      if (violation) violations.push(violation);
    }

    // Check CPU
    if (this.limits.cpu) {
      const violation = this.checkLimit(
        LimitType.CPU,
        this.cpuTime,
        this.limits.cpu,
        now
      );
      if (violation) violations.push(violation);
    }

    // Check stack
    if (this.limits.stack) {
      const violation = this.checkLimit(
        LimitType.STACK,
        this.stackDepth,
        this.limits.stack,
        now
      );
      if (violation) violations.push(violation);
    }

    // Check recursion
    if (this.limits.recursion) {
      const violation = this.checkLimit(
        LimitType.RECURSION,
        this.recursionDepth,
        this.limits.recursion,
        now
      );
      if (violation) violations.push(violation);
    }

    // Check output
    if (this.limits.output) {
      const violation = this.checkLimit(
        LimitType.OUTPUT,
        this.outputSize,
        this.limits.output,
        now
      );
      if (violation) violations.push(violation);
    }

    // Check input
    if (this.limits.input) {
      const violation = this.checkLimit(
        LimitType.INPUT,
        this.inputSize,
        this.limits.input,
        now
      );
      if (violation) violations.push(violation);
    }

    // Record violations
    for (const violation of violations) {
      this.violations.push(violation);
      this.notifyMonitors(violation);
    }

    return violations;
  }

  /**
   * Check a specific limit
   */
  checkLimit(
    type: LimitType,
    current: number,
    config: LimitConfig,
    timestamp: number
  ): LimitViolation | null {
    if (current > config.value) {
      return {
        type,
        limit: config.value,
        current,
        threshold: config.warningThreshold,
        timestamp,
        action: config.action
      };
    }
    return null;
  }

  /**
   * Update memory usage
   */
  updateMemory(delta: number): void {
    this.memoryUsage += delta;
    if (this.memoryUsage < 0) {
      this.memoryUsage = 0;
    }
  }

  /**
   * Update CPU time
   */
  updateCPUTime(delta: number): void {
    this.cpuTime += delta;
    if (this.cpuTime < 0) {
      this.cpuTime = 0;
    }
  }

  /**
   * Update stack depth
   */
  pushStack(): void {
    this.stackDepth++;
  }

  popStack(): void {
    this.stackDepth--;
    if (this.stackDepth < 0) {
      this.stackDepth = 0;
    }
  }

  /**
   * Update recursion depth
   */
  enterRecursion(): void {
    this.recursionDepth++;
  }

  exitRecursion(): void {
    this.recursionDepth--;
    if (this.recursionDepth < 0) {
      this.recursionDepth = 0;
    }
  }

  /**
   * Update output size
   */
  addOutput(size: number): void {
    this.outputSize += size;
    if (this.outputSize < 0) {
      this.outputSize = 0;
    }
  }

  /**
   * Update input size
   */
  addInput(size: number): void {
    this.inputSize += size;
    if (this.inputSize < 0) {
      this.inputSize = 0;
    }
  }

  /**
   * Get current usage
   */
  getUsage(): {
    memory: number;
    cpu: number;
    time: number;
    stack: number;
    recursion: number;
    output: number;
    input: number;
  } {
    return {
      memory: this.memoryUsage,
      cpu: this.cpuTime,
      time: Date.now() - this.executionStart,
      stack: this.stackDepth,
      recursion: this.recursionDepth,
      output: this.outputSize,
      input: this.inputSize
    };
  }

  /**
   * Get limit configuration
   */
  getLimit(type: LimitType): LimitConfig | undefined {
    switch (type) {
      case LimitType.MEMORY: return this.limits.memory;
      case LimitType.TIME: return this.limits.time;
      case LimitType.CPU: return this.limits.cpu;
      case LimitType.STACK: return this.limits.stack;
      case LimitType.RECURSION: return this.limits.recursion;
      case LimitType.OUTPUT: return this.limits.output;
      case LimitType.INPUT: return this.limits.input;
      default: return undefined;
    }
  }

  /**
   * Set limit configuration
   */
  setLimit(type: LimitType, config: LimitConfig): void {
    switch (type) {
      case LimitType.MEMORY: this.limits.memory = config; break;
      case LimitType.TIME: this.limits.time = config; break;
      case LimitType.CPU: this.limits.cpu = config; break;
      case LimitType.STACK: this.limits.stack = config; break;
      case LimitType.RECURSION: this.limits.recursion = config; break;
      case LimitType.OUTPUT: this.limits.output = config; break;
      case LimitType.INPUT: this.limits.input = config; break;
    }
  }

  /**
   * Remove limit configuration
   */
  removeLimit(type: LimitType): void {
    switch (type) {
      case LimitType.MEMORY: delete this.limits.memory; break;
      case LimitType.TIME: delete this.limits.time; break;
      case LimitType.CPU: delete this.limits.cpu; break;
      case LimitType.STACK: delete this.limits.stack; break;
      case LimitType.RECURSION: delete this.limits.recursion; break;
      case LimitType.OUTPUT: delete this.limits.output; break;
      case LimitType.INPUT: delete this.limits.input; break;
    }
  }

  /**
   * Register a limit monitor
   */
  addMonitor(id: string, callback: LimitMonitorCallback): void {
    this.monitors.set(id, callback);
  }

  /**
   * Remove a limit monitor
   */
  removeMonitor(id: string): boolean {
    return this.monitors.delete(id);
  }

  /**
   * Get all violations
   */
  getViolations(): ZArray<LimitViolation> {
    return this.violations;
  }

  /**
   * Clear violations
   */
  clearViolations(): void {
    this.violations = new ZArray();
  }

  /**
   * Notify monitors about a violation
   */
  private notifyMonitors(violation: LimitViolation): void {
    for (const [, callback] of this.monitors) {
      try {
        callback(violation);
      } catch (error) {
        console.error('Error in limit monitor:', error);
      }
    }
  }

  /**
   * Reset all counters
   */
  reset(): void {
    this.memoryUsage = 0;
    this.cpuTime = 0;
    this.stackDepth = 0;
    this.recursionDepth = 0;
    this.outputSize = 0;
    this.inputSize = 0;
    this.violations = new ZArray();
  }
}

/**
 * Timeout manager for execution timeouts
 */
export class TimeoutManager {
  private timeouts: ZMap<string, NodeJS.Timeout>;
  private timers: ZMap<string, number>;

  constructor() {
    this.timeouts = new ZMap();
    this.timers = new ZMap();
  }

  /**
   * Set a timeout
   */
  setTimeout(
    id: string,
    callback: () => void,
    delay: number
  ): void {
    this.clearTimeout(id);
    
    const timeout = setTimeout(() => {
      this.timers.delete(id);
      this.timeouts.delete(id);
      callback();
    }, delay);

    this.timeouts.set(id, timeout);
    this.timers.set(id, Date.now());
  }

  /**
   * Clear a timeout
   */
  clearTimeout(id: string): boolean {
    const timeout = this.timeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(id);
      this.timers.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Check if a timeout exists
   */
  hasTimeout(id: string): boolean {
    return this.timeouts.has(id);
  }

  /**
   * Get remaining time for a timeout
   */
  getRemainingTime(id: string): number | undefined {
    const start = this.timers.get(id);
    const timeout = this.timeouts.get(id);
    
    if (start && timeout) {
      // This is a simplified calculation
      // In a real implementation, we would track the actual delay
      return 0;
    }
    
    return undefined;
  }

  /**
   * Clear all timeouts
   */
  clearAll(): number {
    const count = this.timeouts.size();
    for (const [, timeout] of this.timeouts) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
    this.timers.clear();
    return count;
  }
}

/**
 * Rate limiter for controlling execution rate
 */
export class RateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number; // tokens per second
  private lastRefill: number;
  private waiting: Array<() => void>;

  constructor(tokens: number, refillRate: number) {
    this.tokens = tokens;
    this.maxTokens = tokens;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
    this.waiting = [];
  }

  /**
   * Acquire a token
   */
  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens > 0) {
      this.tokens--;
      return;
    }

    return new Promise(resolve => {
      this.waiting.push(resolve);
    });
  }

  /**
   * Acquire multiple tokens
   */
  async acquireN(count: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.acquire();
    }
  }

  /**
   * Try to acquire a token immediately
   */
  tryAcquire(): boolean {
    this.refill();
    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }
    return false;
  }

  /**
   * Get available tokens
   */
  getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // seconds
    const tokensToAdd = Math.floor(elapsed * this.refillRate);
    
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;

    // Process waiting requests
    while (this.tokens > 0 && this.waiting.length > 0) {
      const resolve = this.waiting.shift()!;
      this.tokens--;
      resolve();
    }
  }
}

/**
 * Global limits manager instance
 */
export const globalLimitsManager = new LimitsManager();

export type LimitsValue = LimitsManager | TimeoutManager | RateLimiter;
