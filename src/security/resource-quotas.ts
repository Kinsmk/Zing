/**
 * Zinga Security - Resource Quotas
 * 
 * Manages resource quotas and limits for secure execution.
 */

import { ZMap } from '../../runtime/values/maps';
import { ZString } from '../../runtime/values/strings';
import { ZArray } from '../../runtime/values/arrays';
import { ResourceQuota } from '../../runtime/execution/isolation';

/**
 * Quota types
 */
export enum QuotaType {
  MEMORY = 'MEMORY',
  CPU_TIME = 'CPU_TIME',
  EXECUTION_TIME = 'EXECUTION_TIME',
  FILE_DESCRIPTORS = 'FILE_DESCRIPTORS',
  NETWORK_CONNECTIONS = 'NETWORK_CONNECTIONS',
  THREADS = 'THREADS',
  STORAGE = 'STORAGE',
  BANDWIDTH = 'BANDWIDTH',
  REQUESTS = 'REQUESTS',
  CUSTOM = 'CUSTOM'
}

/**
 * Quota configuration
 */
export interface QuotaConfig {
  type: QuotaType | string;
  limit: number;
  warningThreshold?: number;
  softLimit?: number;
  hardLimit?: number;
  unit?: string;
  description?: string;
}

/**
 * Quota usage
 */
export interface QuotaUsage {
  type: QuotaType | string;
  used: number;
  limit: number;
  percentage: number;
  warning?: boolean;
  exceeded?: boolean;
}

/**
 * Quota violation
 */
export interface QuotaViolation {
  type: QuotaType | string;
  used: number;
  limit: number;
  timestamp: number;
  action: 'WARN' | 'THROW' | 'TERMINATE' | 'IGNORE';
}

/**
 * Quota exceeded error
 */
export class QuotaExceededError extends Error {
  constructor(
    message: string,
    public readonly type: QuotaType | string,
    public readonly used: number,
    public readonly limit: number
  ) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

/**
 * Resource Quota Manager
 * 
 * Tracks and enforces resource quotas.
 */
export class ResourceQuotaManager {
  private quotas: ZMap<string, QuotaConfig>;
  private usage: ZMap<string, number>;
  private violations: ZArray<QuotaViolation>;
  private monitors: ZMap<string, (violation: QuotaViolation) => void>;

  constructor() {
    this.quotas = new ZMap();
    this.usage = new ZMap();
    this.violations = new ZArray();
    this.monitors = new ZMap();
  }

  /**
   * Set a quota
   */
  setQuota(config: QuotaConfig): void {
    this.quotas.set(config.type, config);
    this.usage.set(config.type, 0);
  }

  /**
   * Set multiple quotas
   */
  setQuotas(configs: QuotaConfig[]): void {
    for (const config of configs) {
      this.setQuota(config);
    }
  }

  /**
   * Remove a quota
   */
  removeQuota(type: QuotaType | string): boolean {
    return this.quotas.delete(type) && this.usage.delete(type);
  }

  /**
   * Remove all quotas
   */
  removeAllQuotas(): void {
    this.quotas.clear();
    this.usage.clear();
  }

  /**
   * Get a quota configuration
   */
  getQuota(type: QuotaType | string): QuotaConfig | undefined {
    return this.quotas.get(type);
  }

  /**
   * Get all quotas
   */
  getQuotas(): ZArray<QuotaConfig> {
    return new ZArray([...this.quotas.values()]);
  }

  /**
   * Get quota usage
   */
  getUsage(type: QuotaType | string): number {
    return this.usage.get(type) || 0;
  }

  /**
   * Get all quota usages
   */
  getUsages(): ZArray<QuotaUsage> {
    const usages: QuotaUsage[] = [];
    
    for (const [type, config] of this.quotas) {
      const used = this.usage.get(type) || 0;
      const limit = config.limit;
      const percentage = (used / limit) * 100;
      const warningThreshold = config.warningThreshold || limit * 0.8;
      
      usages.push({
        type,
        used,
        limit,
        percentage,
        warning: used >= warningThreshold,
        exceeded: used > limit
      });
    }
    
    return new ZArray(usages);
  }

  /**
   * Check if a quota is exceeded
   */
  isExceeded(type: QuotaType | string): boolean {
    const config = this.quotas.get(type);
    if (!config) {
      return false;
    }
    
    const used = this.usage.get(type) || 0;
    return used > config.limit;
  }

  /**
   * Check if a quota warning is triggered
   */
  isWarning(type: QuotaType | string): boolean {
    const config = this.quotas.get(type);
    if (!config) {
      return false;
    }
    
    const used = this.usage.get(type) || 0;
    const threshold = config.warningThreshold || config.limit * 0.8;
    return used >= threshold && used <= config.limit;
  }

  /**
   * Check if a quota is within soft limit
   */
  isWithinSoftLimit(type: QuotaType | string): boolean {
    const config = this.quotas.get(type);
    if (!config) {
      return true;
    }
    
    const used = this.usage.get(type) || 0;
    const softLimit = config.softLimit || config.limit;
    return used <= softLimit;
  }

  /**
   * Check if a quota is within hard limit
   */
  isWithinHardLimit(type: QuotaType | string): boolean {
    const config = this.quotas.get(type);
    if (!config) {
      return true;
    }
    
    const used = this.usage.get(type) || 0;
    const hardLimit = config.hardLimit || config.limit;
    return used <= hardLimit;
  }

  /**
   * Consume quota
   */
  consume(type: QuotaType | string, amount: number = 1): boolean {
    const config = this.quotas.get(type);
    if (!config) {
      return true; // No quota configured, allow
    }
    
    const used = (this.usage.get(type) || 0) + amount;
    const limit = config.limit;
    
    if (used > limit) {
      this.recordViolation(type, used, limit);
      return false;
    }
    
    this.usage.set(type, used);
    return true;
  }

  /**
   * Release quota
   */
  release(type: QuotaType | string, amount: number = 1): void {
    const used = (this.usage.get(type) || 0) - amount;
    this.usage.set(type, Math.max(0, used));
  }

  /**
   * Check and consume quota
   */
  checkAndConsume(type: QuotaType | string, amount: number = 1): boolean {
    const config = this.quotas.get(type);
    if (!config) {
      return true;
    }
    
    const used = (this.usage.get(type) || 0) + amount;
    const limit = config.limit;
    
    if (used > limit) {
      this.recordViolation(type, used, limit);
      return false;
    }
    
    return this.consume(type, amount);
  }

  /**
   * Check all quotas
   */
  checkAll(): QuotaViolation[] {
    const violations: QuotaViolation[] = [];
    
    for (const [type, config] of this.quotas) {
      const used = this.usage.get(type) || 0;
      const limit = config.limit;
      
      if (used > limit) {
        violations.push(this.recordViolation(type, used, limit));
      }
    }
    
    return violations;
  }

  /**
   * Record a quota violation
   */
  private recordViolation(type: string, used: number, limit: number): QuotaViolation {
    const config = this.quotas.get(type);
    const violation: QuotaViolation = {
      type,
      used,
      limit,
      timestamp: Date.now(),
      action: config?.hardLimit ? 'TERMINATE' : 'THROW'
    };
    
    this.violations.push(violation);
    this.notifyMonitors(violation);
    
    return violation;
  }

  /**
   * Get quota violations
   */
  getViolations(): ZArray<QuotaViolation> {
    return this.violations;
  }

  /**
   * Clear quota violations
   */
  clearViolations(): void {
    this.violations = new ZArray();
  }

  /**
   * Register a quota monitor
   */
  addMonitor(id: string, callback: (violation: QuotaViolation) => void): void {
    this.monitors.set(id, callback);
  }

  /**
   * Remove a quota monitor
   */
  removeMonitor(id: string): boolean {
    return this.monitors.delete(id);
  }

  /**
   * Notify monitors about a violation
   */
  private notifyMonitors(violation: QuotaViolation): void {
    for (const [, callback] of this.monitors) {
      try {
        callback(violation);
      } catch (error) {
        console.error('Error in quota monitor:', error);
      }
    }
  }

  /**
   * Reset all quota usages
   */
  resetUsages(): void {
    for (const [type] of this.quotas) {
      this.usage.set(type, 0);
    }
  }

  /**
   * Reset a specific quota usage
   */
  resetUsage(type: QuotaType | string): void {
    this.usage.set(type, 0);
  }

  /**
   * Get quota statistics
   */
  getStats(): {
    totalQuotas: number;
    exceededQuotas: number;
    warningQuotas: number;
    totalViolations: number;
  } {
    let exceeded = 0, warning = 0;
    
    for (const [type] of this.quotas) {
      if (this.isExceeded(type)) {
        exceeded++;
      } else if (this.isWarning(type)) {
        warning++;
      }
    }

    return {
      totalQuotas: this.quotas.size(),
      exceededQuotas: exceeded,
      warningQuotas: warning,
      totalViolations: this.violations.size()
    };
  }

  /**
   * Import quotas from a ResourceQuota object
   */
  importFromResourceQuota(quota: ResourceQuota): void {
    if (quota.maxMemory !== undefined) {
      this.setQuota({
        type: QuotaType.MEMORY,
        limit: quota.maxMemory,
        unit: 'bytes',
        description: 'Maximum memory usage'
      });
    }
    
    if (quota.maxCPUTime !== undefined) {
      this.setQuota({
        type: QuotaType.CPU_TIME,
        limit: quota.maxCPUTime,
        unit: 'milliseconds',
        description: 'Maximum CPU time'
      });
    }
    
    if (quota.maxExecutionTime !== undefined) {
      this.setQuota({
        type: QuotaType.EXECUTION_TIME,
        limit: quota.maxExecutionTime,
        unit: 'milliseconds',
        description: 'Maximum execution time'
      });
    }
    
    if (quota.maxFileDescriptors !== undefined) {
      this.setQuota({
        type: QuotaType.FILE_DESCRIPTORS,
        limit: quota.maxFileDescriptors,
        unit: 'descriptors',
        description: 'Maximum file descriptors'
      });
    }
    
    if (quota.maxNetworkConnections !== undefined) {
      this.setQuota({
        type: QuotaType.NETWORK_CONNECTIONS,
        limit: quota.maxNetworkConnections,
        unit: 'connections',
        description: 'Maximum network connections'
      });
    }
  }

  /**
   * Export quotas to a ResourceQuota object
   */
  exportToResourceQuota(): ResourceQuota {
    const quota: ResourceQuota = {};
    
    const memory = this.getQuota(QuotaType.MEMORY);
    if (memory) {
      quota.maxMemory = memory.limit;
    }
    
    const cpuTime = this.getQuota(QuotaType.CPU_TIME);
    if (cpuTime) {
      quota.maxCPUTime = cpuTime.limit;
    }
    
    const executionTime = this.getQuota(QuotaType.EXECUTION_TIME);
    if (executionTime) {
      quota.maxExecutionTime = executionTime.limit;
    }
    
    const fileDescriptors = this.getQuota(QuotaType.FILE_DESCRIPTORS);
    if (fileDescriptors) {
      quota.maxFileDescriptors = fileDescriptors.limit;
    }
    
    const networkConnections = this.getQuota(QuotaType.NETWORK_CONNECTIONS);
    if (networkConnections) {
      quota.maxNetworkConnections = networkConnections.limit;
    }
    
    return quota;
  }
}

/**
 * Default quota configurations
 */
export const DefaultQuotas: QuotaConfig[] = [
  {
    type: QuotaType.MEMORY,
    limit: 128 * 1024 * 1024,
    warningThreshold: 100 * 1024 * 1024,
    unit: 'bytes',
    description: 'Maximum memory usage'
  },
  {
    type: QuotaType.CPU_TIME,
    limit: 5000,
    warningThreshold: 4000,
    unit: 'milliseconds',
    description: 'Maximum CPU time'
  },
  {
    type: QuotaType.EXECUTION_TIME,
    limit: 5000,
    warningThreshold: 4000,
    unit: 'milliseconds',
    description: 'Maximum execution time'
  },
  {
    type: QuotaType.FILE_DESCRIPTORS,
    limit: 100,
    warningThreshold: 80,
    unit: 'descriptors',
    description: 'Maximum file descriptors'
  },
  {
    type: QuotaType.NETWORK_CONNECTIONS,
    limit: 50,
    warningThreshold: 40,
    unit: 'connections',
    description: 'Maximum network connections'
  },
  {
    type: QuotaType.THREADS,
    limit: 4,
    warningThreshold: 3,
    unit: 'threads',
    description: 'Maximum threads'
  }
];

/**
 * Global resource quota manager instance
 */
export const globalResourceQuotaManager = new ResourceQuotaManager();

export type ResourceQuotaValue = ResourceQuotaManager;
