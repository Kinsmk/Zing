/**
 * Zinga Security - Memory Guard
 * 
 * Protects against memory-related vulnerabilities and attacks.
 */

import { ZMap } from '../../runtime/values/maps';
import { ZString } from '../../runtime/values/strings';
import { ZArray } from '../../runtime/values/arrays';
import { ResourceQuotaManager, QuotaType } from './resource-quotas';

/**
 * Memory guard modes
 */
export enum MemoryGuardMode {
  DISABLED = 'DISABLED',
  MONITOR = 'MONITOR',
  ENFORCE = 'ENFORCE',
  STRICT = 'STRICT'
}

/**
 * Memory allocation types
 */
export enum AllocationType {
  OBJECT = 'OBJECT',
  ARRAY = 'ARRAY',
  STRING = 'STRING',
  BUFFER = 'BUFFER',
  FUNCTION = 'FUNCTION',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Memory allocation info
 */
export interface AllocationInfo {
  id: string;
  type: AllocationType;
  size: number;
  timestamp: number;
  stackTrace?: string[];
  context?: string;
}

/**
 * Memory snapshot
 */
export interface MemorySnapshot {
  timestamp: number;
  totalAllocated: number;
  totalFreed: number;
  currentUsage: number;
  peakUsage: number;
  allocations: number;
  frees: number;
  byType: Record<AllocationType, number>;
}

/**
 * Memory leak detection result
 */
export interface MemoryLeakResult {
  detected: boolean;
  leakedObjects: AllocationInfo[];
  leakedSize: number;
  leakRate: number;
}

/**
 * Memory guard error
 */
export class MemoryGuardError extends Error {
  constructor(
    message: string,
    public readonly type: MemoryGuardErrorType,
    public readonly size?: number,
    public readonly limit?: number
  ) {
    super(message);
    this.name = 'MemoryGuardError';
  }
}

/**
 * Memory guard error types
 */
export enum MemoryGuardErrorType {
  MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',
  ALLOCATION_LIMIT_EXCEEDED = 'ALLOCATION_LIMIT_EXCEEDED',
  LEAK_DETECTED = 'LEAK_DETECTED',
  INVALID_FREE = 'INVALID_FREE',
  DOUBLE_FREE = 'DOUBLE_FREE'
}

/**
 * Memory Guard
 * 
 * Monitors and protects memory allocations.
 */
export class MemoryGuard {
  private mode: MemoryGuardMode;
  private quotaManager: ResourceQuotaManager;
  private allocations: ZMap<string, AllocationInfo>;
  private freed: Set<string>;
  private totalAllocated: number;
  private totalFreed: number;
  private peakUsage: number;
  private allocationCount: number;
  private freeCount: number;
  private byType: ZMap<AllocationType, number>;
  private snapshots: ZArray<MemorySnapshot>;
  private maxAllocationSize: number;
  private leakDetectionInterval: number;
  private leakDetectionEnabled: boolean;
  private leakThreshold: number;

  constructor(mode: MemoryGuardMode = MemoryGuardMode.MONITOR) {
    this.mode = mode;
    this.quotaManager = new ResourceQuotaManager();
    this.allocations = new ZMap();
    this.freed = new Set();
    this.totalAllocated = 0;
    this.totalFreed = 0;
    this.peakUsage = 0;
    this.allocationCount = 0;
    this.freeCount = 0;
    this.byType = new ZMap();
    this.snapshots = new ZArray();
    this.maxAllocationSize = 1024 * 1024 * 1024; // 1GB
    this.leakDetectionInterval = 60000; // 1 minute
    this.leakDetectionEnabled = false;
    this.leakThreshold = 10; // 10 allocations
  }

  /**
   * Set memory guard mode
   */
  setMode(mode: MemoryGuardMode): void {
    this.mode = mode;
  }

  /**
   * Get memory guard mode
   */
  getMode(): MemoryGuardMode {
    return this.mode;
  }

  /**
   * Set memory limit
   */
  setMemoryLimit(limit: number): void {
    this.quotaManager.setQuota({
      type: QuotaType.MEMORY,
      limit,
      unit: 'bytes',
      description: 'Memory limit'
    });
  }

  /**
   * Set maximum allocation size
   */
  setMaxAllocationSize(size: number): void {
    this.maxAllocationSize = size;
  }

  /**
   * Enable leak detection
   */
  enableLeakDetection(interval: number = 60000, threshold: number = 10): void {
    this.leakDetectionEnabled = true;
    this.leakDetectionInterval = interval;
    this.leakThreshold = threshold;
    
    // Start leak detection timer
    this.startLeakDetection();
  }

  /**
   * Disable leak detection
   */
  disableLeakDetection(): void {
    this.leakDetectionEnabled = false;
  }

  /**
   * Allocate memory
   */
  allocate(
    size: number,
    type: AllocationType = AllocationType.UNKNOWN,
    context?: string,
    stackTrace?: string[]
  ): string {
    // Check mode
    if (this.mode === MemoryGuardMode.DISABLED) {
      return this.generateId();
    }

    // Check size
    if (size > this.maxAllocationSize) {
      throw new MemoryGuardError(
        `Allocation size exceeds maximum: ${size} > ${this.maxAllocationSize}`,
        MemoryGuardErrorType.ALLOCATION_LIMIT_EXCEEDED,
        size,
        this.maxAllocationSize
      );
    }

    // Check memory limit
    if (this.mode !== MemoryGuardMode.DISABLED) {
      const currentUsage = this.totalAllocated - this.totalFreed;
      const newUsage = currentUsage + size;
      
      const quota = this.quotaManager.getQuota(QuotaType.MEMORY);
      if (quota && newUsage > quota.limit) {
        throw new MemoryGuardError(
          `Memory limit exceeded: ${newUsage} > ${quota.limit}`,
          MemoryGuardErrorType.MEMORY_LIMIT_EXCEEDED,
          newUsage,
          quota.limit
        );
      }
    }

    // Create allocation info
    const id = this.generateId();
    const allocation: AllocationInfo = {
      id,
      type,
      size,
      timestamp: Date.now(),
      stackTrace,
      context
    };

    this.allocations.set(id, allocation);
    this.totalAllocated += size;
    this.allocationCount++;
    
    // Update by type
    const currentTypeUsage = this.byType.get(type) || 0;
    this.byType.set(type, currentTypeUsage + size);
    
    // Update peak usage
    const currentUsage = this.totalAllocated - this.totalFreed;
    if (currentUsage > this.peakUsage) {
      this.peakUsage = currentUsage;
    }

    // Update quota
    this.quotaManager.consume(QuotaType.MEMORY, size);

    return id;
  }

  /**
   * Free memory
   */
  free(id: string): void {
    // Check mode
    if (this.mode === MemoryGuardMode.DISABLED) {
      return;
    }

    const allocation = this.allocations.get(id);
    
    if (!allocation) {
      throw new MemoryGuardError(
        `Invalid free: allocation ${id} not found`,
        MemoryGuardErrorType.INVALID_FREE
      );
    }

    if (this.freed.has(id)) {
      throw new MemoryGuardError(
        `Double free: allocation ${id} already freed`,
        MemoryGuardErrorType.DOUBLE_FREE
      );
    }

    this.freed.add(id);
    this.totalFreed += allocation.size;
    this.freeCount++;
    
    // Update by type
    const currentTypeUsage = this.byType.get(allocation.type) || 0;
    this.byType.set(allocation.type, Math.max(0, currentTypeUsage - allocation.size));
    
    // Update quota
    this.quotaManager.release(QuotaType.MEMORY, allocation.size);
  }

  /**
   * Track an object allocation
   */
  trackObject(obj: object, type: AllocationType = AllocationType.OBJECT, context?: string): string {
    // Estimate object size
    const size = this.estimateObjectSize(obj);
    return this.allocate(size, type, context);
  }

  /**
   * Track an array allocation
   */
  trackArray(arr: any[], context?: string): string {
    // Estimate array size
    let size = 56; // Base array size in V8
    for (const item of arr) {
      if (item && typeof item === 'object') {
        size += this.estimateObjectSize(item);
      } else {
        size += 8; // Pointer size
      }
    }
    return this.allocate(size, AllocationType.ARRAY, context);
  }

  /**
   * Track a string allocation
   */
  trackString(str: string, context?: string): string {
    const size = str.length * 2; // UTF-16 encoding
    return this.allocate(size, AllocationType.STRING, context);
  }

  /**
   * Track a buffer allocation
   */
  trackBuffer(buffer: ArrayBuffer | Uint8Array, context?: string): string {
    const size = buffer.byteLength;
    return this.allocate(size, AllocationType.BUFFER, context);
  }

  /**
   * Take a memory snapshot
   */
  takeSnapshot(): MemorySnapshot {
    const byType: Record<AllocationType, number> = {};
    for (const [type, size] of this.byType) {
      byType[type] = size;
    }

    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      totalAllocated: this.totalAllocated,
      totalFreed: this.totalFreed,
      currentUsage: this.totalAllocated - this.totalFreed,
      peakUsage: this.peakUsage,
      allocations: this.allocationCount,
      frees: this.freeCount,
      byType
    };

    this.snapshots.push(snapshot);
    return snapshot;
  }

  /**
   * Get current memory usage
   */
  getCurrentUsage(): {
    allocated: number;
    freed: number;
    current: number;
    peak: number;
    allocations: number;
    frees: number;
  } {
    return {
      allocated: this.totalAllocated,
      freed: this.totalFreed,
      current: this.totalAllocated - this.totalFreed,
      peak: this.peakUsage,
      allocations: this.allocationCount,
      frees: this.freeCount
    };
  }

  /**
   * Get memory usage by type
   */
  getUsageByType(): ZMap<AllocationType, number> {
    return new ZMap(this.byType);
  }

  /**
   * Detect memory leaks
   */
  detectLeaks(): MemoryLeakResult {
    const now = Date.now();
    const thresholdTime = now - this.leakDetectionInterval;
    const leakedObjects: AllocationInfo[] = [];
    let leakedSize = 0;

    for (const [id, allocation] of this.allocations) {
      if (!this.freed.has(id) && allocation.timestamp < thresholdTime) {
        leakedObjects.push(allocation);
        leakedSize += allocation.size;
      }
    }

    const leakRate = leakedObjects.length / (this.leakDetectionInterval / 1000);

    return {
      detected: leakedObjects.length >= this.leakThreshold,
      leakedObjects,
      leakedSize,
      leakRate
    };
  }

  /**
   * Get allocation info
   */
  getAllocation(id: string): AllocationInfo | undefined {
    return this.allocations.get(id);
  }

  /**
   * Get all allocations
   */
  getAllocations(): ZArray<AllocationInfo> {
    return new ZArray([...this.allocations.values()]);
  }

  /**
   * Get active allocations (not freed)
   */
  getActiveAllocations(): ZArray<AllocationInfo> {
    const active: AllocationInfo[] = [];
    for (const [id, allocation] of this.allocations) {
      if (!this.freed.has(id)) {
        active.push(allocation);
      }
    }
    return new ZArray(active);
  }

  /**
   * Get freed allocations
   */
  getFreedAllocations(): ZArray<AllocationInfo> {
    const freed: AllocationInfo[] = [];
    for (const id of this.freed) {
      const allocation = this.allocations.get(id);
      if (allocation) {
        freed.push(allocation);
      }
    }
    return new ZArray(freed);
  }

  /**
   * Get memory snapshots
   */
  getSnapshots(): ZArray<MemorySnapshot> {
    return this.snapshots;
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.allocations.clear();
    this.freed.clear();
    this.totalAllocated = 0;
    this.totalFreed = 0;
    this.peakUsage = 0;
    this.allocationCount = 0;
    this.freeCount = 0;
    this.byType.clear();
    this.snapshots = new ZArray();
  }

  /**
   * Reset statistics
   */
  reset(): void {
    this.totalAllocated = 0;
    this.totalFreed = 0;
    this.peakUsage = 0;
    this.allocationCount = 0;
    this.freeCount = 0;
    this.byType.clear();
    this.allocations.clear();
    this.freed.clear();
  }

  /**
   * Start leak detection timer
   */
  private startLeakDetection(): void {
    if (!this.leakDetectionEnabled) {
      return;
    }

    setInterval(() => {
      const result = this.detectLeaks();
      if (result.detected) {
        console.warn(`Memory leak detected: ${result.leakedSize} bytes, ${result.leakRate} objects/sec`);
      }
    }, this.leakDetectionInterval);
  }

  /**
   * Estimate object size
   */
  private estimateObjectSize(obj: object): number {
    // This is a simplified estimation
    // In a real implementation, we would use a more accurate method
    if (obj instanceof Array) {
      return 56 + (obj.length * 8);
    }
    if (obj instanceof Date) {
      return 48;
    }
    if (obj instanceof RegExp) {
      return 48;
    }
    if (obj instanceof Map || obj instanceof Set) {
      return 48 + (Object.keys(obj).length * 8);
    }
    
    // Estimate based on number of properties
    const keys = Object.keys(obj);
    return 48 + (keys.length * 8);
  }

  /**
   * Generate unique allocation ID
   */
  private generateId(): string {
    return `alloc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Global memory guard instance
 */
export const globalMemoryGuard = new MemoryGuard(MemoryGuardMode.MONITOR);

export type MemoryGuardValue = MemoryGuard;
