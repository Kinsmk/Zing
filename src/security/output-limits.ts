/**
 * Zinga Security - Output Limits
 * 
 * Protects against excessive output generation.
 */

import { ZMap } from '../../runtime/values/maps';
import { ZString } from '../../runtime/values/strings';
import { ZArray } from '../../runtime/values/arrays';
import { ResourceQuotaManager, QuotaType } from './resource-quotas';

/**
 * Output types
 */
export enum OutputType {
  CONSOLE = 'CONSOLE',
  FILE = 'FILE',
  NETWORK = 'NETWORK',
  LOG = 'LOG',
  STDOUT = 'STDOUT',
  STDERR = 'STDERR',
  CUSTOM = 'CUSTOM'
}

/**
 * Output configuration
 */
export interface OutputConfig {
  type: OutputType | string;
  limit: number;
  warningThreshold?: number;
  rateLimit?: number; // per second
  bufferSize?: number;
  action: 'WARN' | 'THROW' | 'TRUNCATE' | 'TERMINATE' | 'IGNORE';
}

/**
 * Output info
 */
export interface OutputInfo {
  type: OutputType | string;
  size: number;
  count: number;
  lastOutput: number;
  rate: number; // per second
}

/**
 * Output buffer
 */
export interface OutputBuffer {
  type: OutputType | string;
  data: Uint8Array[];
  size: number;
  timestamp: number;
}

/**
 * Output violation
 */
export interface OutputViolation {
  type: OutputType | string;
  size: number;
  limit: number;
  timestamp: number;
  action: 'WARN' | 'THROW' | 'TRUNCATE' | 'TERMINATE' | 'IGNORE';
}

/**
 * Output limit error
 */
export class OutputLimitError extends Error {
  constructor(
    message: string,
    public readonly type: OutputType | string,
    public readonly size: number,
    public readonly limit: number
  ) {
    super(message);
    this.name = 'OutputLimitError';
  }
}

/**
 * Output Limits Manager
 * 
 * Monitors and enforces output limits.
 */
export class OutputLimitsManager {
  private configs: ZMap<string, OutputConfig>;
  private usage: ZMap<string, OutputInfo>;
  private buffers: ZMap<string, OutputBuffer>;
  private quotaManager: ResourceQuotaManager;
  private violations: ZArray<OutputViolation>;
  private monitors: ZMap<string, (violation: OutputViolation) => void>;
  private rateTrackers: ZMap<string, { timestamps: number[]; sizes: number[] }>;

  constructor() {
    this.configs = new ZMap();
    this.usage = new ZMap();
    this.buffers = new ZMap();
    this.quotaManager = new ResourceQuotaManager();
    this.violations = new ZArray();
    this.monitors = new ZMap();
    this.rateTrackers = new ZMap();

    // Set default output limit
    this.setConfig({
      type: OutputType.CONSOLE,
      limit: 1024 * 1024, // 1MB
      warningThreshold: 800 * 1024, // 800KB
      rateLimit: 1024, // 1KB per second
      action: 'TRUNCATE'
    });
  }

  /**
   * Set output configuration
   */
  setConfig(config: OutputConfig): void {
    this.configs.set(config.type, config);
    this.usage.set(config.type, {
      type: config.type,
      size: 0,
      count: 0,
      lastOutput: Date.now(),
      rate: 0
    });
    this.buffers.set(config.type, {
      type: config.type,
      data: [],
      size: 0,
      timestamp: Date.now()
    });
    this.rateTrackers.set(config.type, { timestamps: [], sizes: [] });
  }

  /**
   * Set multiple output configurations
   */
  setConfigs(configs: OutputConfig[]): void {
    for (const config of configs) {
      this.setConfig(config);
    }
  }

  /**
   * Remove output configuration
   */
  removeConfig(type: OutputType | string): boolean {
    return this.configs.delete(type) && 
           this.usage.delete(type) && 
           this.buffers.delete(type) &&
           this.rateTrackers.delete(type);
  }

  /**
   * Remove all output configurations
   */
  removeAllConfigs(): void {
    this.configs.clear();
    this.usage.clear();
    this.buffers.clear();
    this.rateTrackers.clear();
  }

  /**
   * Get output configuration
   */
  getConfig(type: OutputType | string): OutputConfig | undefined {
    return this.configs.get(type);
  }

  /**
   * Get all output configurations
   */
  getConfigs(): ZArray<OutputConfig> {
    return new ZArray([...this.configs.values()]);
  }

  /**
   * Write output
   */
  write(
    type: OutputType | string,
    data: string | Uint8Array,
    flush: boolean = false
  ): string | Uint8Array {
    const config = this.configs.get(type);
    if (!config) {
      // No limit configured, allow
      return data;
    }

    const size = typeof data === 'string' ? 
      new TextEncoder().encode(data).length : data.length;

    // Check rate limit
    if (config.rateLimit) {
      this.checkRateLimit(type, size, config);
    }

    // Check size limit
    const usage = this.usage.get(type);
    if (usage) {
      const newSize = usage.size + size;
      const limit = config.limit;
      
      if (newSize > limit) {
        const violation = this.recordViolation(type, size, limit, config);
        
        switch (config.action) {
          case 'THROW':
            throw new OutputLimitError(
              `Output limit exceeded: ${newSize} > ${limit}`,
              type,
              newSize,
              limit
            );
          case 'TRUNCATE':
            // Truncate the data
            const allowedSize = limit - usage.size;
            if (allowedSize > 0) {
              if (typeof data === 'string') {
                const encoder = new TextEncoder();
                const bytes = encoder.encode(data);
                const truncated = bytes.slice(0, allowedSize);
                const result = new TextDecoder().decode(truncated);
                this.updateUsage(type, allowedSize);
                return result;
              } else {
                const truncated = data.slice(0, allowedSize);
                this.updateUsage(type, allowedSize);
                return truncated;
              }
            }
            return typeof data === 'string' ? '' : new Uint8Array();
          case 'TERMINATE':
            // In a real implementation, we would terminate
            throw new OutputLimitError(
              `Output limit terminated: ${newSize} > ${limit}`,
              type,
              newSize,
              limit
            );
          default:
            // WARN or IGNORE
            this.updateUsage(type, size);
            return data;
        }
      }
    }

    // Buffer the data
    this.bufferData(type, data, config);
    this.updateUsage(type, size);

    if (flush) {
      return this.flush(type);
    }

    return data;
  }

  /**
   * Flush output buffer
   */
  flush(type: OutputType | string): string | Uint8Array {
    const buffer = this.buffers.get(type);
    if (!buffer) {
      return typeof type === 'string' ? '' : new Uint8Array();
    }

    const config = this.configs.get(type);
    if (!config) {
      return typeof type === 'string' ? '' : new Uint8Array();
    }

    // Combine buffered data
    let combined: Uint8Array;
    if (buffer.data.length === 0) {
      combined = new Uint8Array();
    } else if (buffer.data.length === 1) {
      combined = buffer.data[0];
    } else {
      const totalLength = buffer.data.reduce((sum, chunk) => sum + chunk.length, 0);
      combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of buffer.data) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
    }

    // Clear buffer
    buffer.data = [];
    buffer.size = 0;
    buffer.timestamp = Date.now();

    return combined;
  }

  /**
   * Get output usage
   */
  getUsage(type: OutputType | string): OutputInfo | undefined {
    return this.usage.get(type);
  }

  /**
   * Get all output usages
   */
  getUsages(): ZArray<OutputInfo> {
    return new ZArray([...this.usage.values()]);
  }

  /**
   * Get output buffer
   */
  getBuffer(type: OutputType | string): OutputBuffer | undefined {
    return this.buffers.get(type);
  }

  /**
   * Get output violations
   */
  getViolations(): ZArray<OutputViolation> {
    return this.violations;
  }

  /**
   * Clear output violations
   */
  clearViolations(): void {
    this.violations = new ZArray();
  }

  /**
   * Register an output monitor
   */
  addMonitor(id: string, callback: (violation: OutputViolation) => void): void {
    this.monitors.set(id, callback);
  }

  /**
   * Remove an output monitor
   */
  removeMonitor(id: string): boolean {
    return this.monitors.delete(id);
  }

  /**
   * Reset output usage
   */
  resetUsage(type: OutputType | string): void {
    const usage = this.usage.get(type);
    if (usage) {
      usage.size = 0;
      usage.count = 0;
    }
  }

  /**
   * Reset all output usages
   */
  resetAllUsages(): void {
    for (const [, usage] of this.usage) {
      usage.size = 0;
      usage.count = 0;
    }
  }

  /**
   * Clear output buffer
   */
  clearBuffer(type: OutputType | string): void {
    const buffer = this.buffers.get(type);
    if (buffer) {
      buffer.data = [];
      buffer.size = 0;
    }
  }

  /**
   * Clear all output buffers
   */
  clearAllBuffers(): void {
    for (const [, buffer] of this.buffers) {
      buffer.data = [];
      buffer.size = 0;
    }
  }

  /**
   * Get output statistics
   */
  getStats(): {
    totalTypes: number;
    totalSize: number;
    totalCount: number;
    totalViolations: number;
  } {
    let totalSize = 0, totalCount = 0;
    
    for (const [, usage] of this.usage) {
      totalSize += usage.size;
      totalCount += usage.count;
    }

    return {
      totalTypes: this.configs.size(),
      totalSize,
      totalCount,
      totalViolations: this.violations.size()
    };
  }

  /**
   * Record an output violation
   */
  private recordViolation(
    type: OutputType | string,
    size: number,
    limit: number,
    config: OutputConfig
  ): OutputViolation {
    const violation: OutputViolation = {
      type,
      size,
      limit,
      timestamp: Date.now(),
      action: config.action
    };

    this.violations.push(violation);
    this.notifyMonitors(violation);

    return violation;
  }

  /**
   * Notify monitors about a violation
   */
  private notifyMonitors(violation: OutputViolation): void {
    for (const [, callback] of this.monitors) {
      try {
        callback(violation);
      } catch (error) {
        console.error('Error in output monitor:', error);
      }
    }
  }

  /**
   * Update output usage
   */
  private updateUsage(type: OutputType | string, size: number): void {
    const usage = this.usage.get(type);
    if (usage) {
      usage.size += size;
      usage.count++;
      usage.lastOutput = Date.now();
      
      // Update rate
      const tracker = this.rateTrackers.get(type);
      if (tracker) {
        const now = Date.now();
        tracker.timestamps.push(now);
        tracker.sizes.push(size);
        
        // Keep only the last second of data
        const oneSecondAgo = now - 1000;
        while (tracker.timestamps.length > 0 && tracker.timestamps[0] < oneSecondAgo) {
          tracker.timestamps.shift();
          tracker.sizes.shift();
        }
        
        // Calculate rate (bytes per second)
        const totalSize = tracker.sizes.reduce((sum, s) => sum + s, 0);
        usage.rate = totalSize;
      }
    }
  }

  /**
   * Buffer output data
   */
  private bufferData(
    type: OutputType | string,
    data: string | Uint8Array,
    config: OutputConfig
  ): void {
    const buffer = this.buffers.get(type);
    if (!buffer) {
      return;
    }

    const chunk = typeof data === 'string' ? 
      new TextEncoder().encode(data) : data;

    // Check buffer size limit
    if (config.bufferSize && buffer.size + chunk.length > config.bufferSize) {
      // Flush the buffer
      this.flush(type);
    }

    buffer.data.push(chunk);
    buffer.size += chunk.length;
    buffer.timestamp = Date.now();
  }

  /**
   * Check rate limit
   */
  private checkRateLimit(type: OutputType | string, size: number, config: OutputConfig): void {
    if (!config.rateLimit) {
      return;
    }

    const tracker = this.rateTrackers.get(type);
    if (!tracker) {
      return;
    }

    const now = Date.now();
    tracker.timestamps.push(now);
    tracker.sizes.push(size);

    // Keep only the last second of data
    const oneSecondAgo = now - 1000;
    while (tracker.timestamps.length > 0 && tracker.timestamps[0] < oneSecondAgo) {
      tracker.timestamps.shift();
      tracker.sizes.shift();
    }

    // Calculate current rate
    const totalSize = tracker.sizes.reduce((sum, s) => sum + s, 0);
    const currentRate = totalSize;

    if (currentRate > config.rateLimit!) {
      // Rate limit exceeded
      const violation = this.recordViolation(type, size, config.rateLimit!, config);
      
      switch (config.action) {
        case 'THROW':
          throw new OutputLimitError(
            `Output rate limit exceeded: ${currentRate} > ${config.rateLimit}`,
            type,
            currentRate,
            config.rateLimit!
          );
        case 'TRUNCATE':
          // Don't write this data
          tracker.timestamps.pop();
          tracker.sizes.pop();
          break;
        case 'TERMINATE':
          throw new OutputLimitError(
            `Output rate limit terminated: ${currentRate} > ${config.rateLimit}`,
            type,
            currentRate,
            config.rateLimit!
          );
        default:
          // WARN or IGNORE
          break;
      }
    }
  }
}

/**
 * Default output configurations
 */
export const DefaultOutputConfigs: OutputConfig[] = [
  {
    type: OutputType.CONSOLE,
    limit: 1024 * 1024, // 1MB
    warningThreshold: 800 * 1024, // 800KB
    rateLimit: 1024, // 1KB per second
    action: 'TRUNCATE'
  },
  {
    type: OutputType.FILE,
    limit: 10 * 1024 * 1024, // 10MB
    warningThreshold: 8 * 1024 * 1024, // 8MB
    rateLimit: 10 * 1024, // 10KB per second
    action: 'THROW'
  },
  {
    type: OutputType.NETWORK,
    limit: 100 * 1024 * 1024, // 100MB
    warningThreshold: 80 * 1024 * 1024, // 80MB
    rateLimit: 100 * 1024, // 100KB per second
    action: 'THROW'
  },
  {
    type: OutputType.LOG,
    limit: 1024 * 1024, // 1MB
    warningThreshold: 800 * 1024, // 800KB
    rateLimit: 1024, // 1KB per second
    action: 'TRUNCATE'
  },
  {
    type: OutputType.STDOUT,
    limit: 1024 * 1024, // 1MB
    warningThreshold: 800 * 1024, // 800KB
    rateLimit: 1024, // 1KB per second
    action: 'TRUNCATE'
  },
  {
    type: OutputType.STDERR,
    limit: 1024 * 1024, // 1MB
    warningThreshold: 800 * 1024, // 800KB
    rateLimit: 1024, // 1KB per second
    action: 'TRUNCATE'
  }
];

/**
 * Global output limits manager instance
 */
export const globalOutputLimitsManager = new OutputLimitsManager();

export type OutputLimitsValue = OutputLimitsManager;
