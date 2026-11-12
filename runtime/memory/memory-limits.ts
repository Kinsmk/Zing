/**
 * Memory Limits - Limites de memoire pour Zinga
 * 
 * Ce module definit et gere les limites de memoire pour le runtime Zinga.
 * Il permet de controler l'utilisation de la memoire et de prevenir
 * les debordements.
 */

import { MemoryAllocator, AllocatorStats } from './allocator';
import { MemoryException, OutOfMemoryException } from '../errors/exceptions';
import { getEnvironment } from '../environment';

/**
 * Limites de memoire
 */
export interface MemoryLimits {
  // Limite de memoire totale (en octets)
  totalLimit: number;
  // Limite de memoire par allocation (en octets)
  allocationLimit: number;
  // Limite de memoire pour la pile (en octets)
  stackLimit: number;
  // Limite de memoire pour le tas (en octets)
  heapLimit: number;
  // Limite du nombre d'allocations
  allocationCountLimit: number;
  // Limite de la taille totale des allocations
  totalAllocationLimit: number;
  // Seuil d'avertissement (en pourcentage)
  warningThreshold: number;
  // Seuil critique (en pourcentage)
  criticalThreshold: number;
}

/**
 * Limites par defaut
 */
export const DEFAULT_MEMORY_LIMITS: MemoryLimits = {
  totalLimit: 256 * 1024 * 1024, // 256 MB
  allocationLimit: 16 * 1024 * 1024, // 16 MB
  stackLimit: 8 * 1024 * 1024, // 8 MB
  heapLimit: 256 * 1024 * 1024, // 256 MB
  allocationCountLimit: 1000000, // 1 million
  totalAllocationLimit: 256 * 1024 * 1024, // 256 MB
  warningThreshold: 0.75, // 75%
  criticalThreshold: 0.90, // 90%
};

/**
 * Etat de la memoire
 */
export interface MemoryState {
  // Memoire totale disponible
  totalAvailable: number;
  // Memoire utilisee
  used: number;
  // Memoire libre
  free: number;
  // Pourcentage d'utilisation
  usagePercentage: number;
  // Nombre d'allocations
  allocationCount: number;
  // Taille moyenne des allocations
  averageAllocationSize: number;
  // Taille maximale des allocations
  maxAllocationSize: number;
  // Est-ce que la memoire est en etat d'avertissement
  isWarning: boolean;
  // Est-ce que la memoire est en etat critique
  isCritical: boolean;
}

/**
 * Gestionnaire des limites de memoire
 */
export class MemoryLimitManager {
  private limits: MemoryLimits;
  private allocator: MemoryAllocator;
  private stats: AllocatorStats;
  private maxAllocationSize: number = 0;
  private allocationCount: number = 0;
  private totalAllocated: number = 0;
  
  constructor(
    allocator: MemoryAllocator,
    limits: Partial<MemoryLimits> = {}
  ) {
    this.allocator = allocator;
    this.limits = { ...DEFAULT_MEMORY_LIMITS, ...limits };
    this.stats = allocator.getStats();
  }
  
  /**
   * Verifier les limites avant une allocation
   */
  checkBeforeAllocation(size: number): void {
    // Verifier la limite par allocation
    if (size > this.limits.allocationLimit) {
      throw new MemoryException(
        `Allocation size ${size} exceeds limit ${this.limits.allocationLimit}`
      );
    }
    
    // Verifier la limite totale
    if (this.stats.usedSize + size > this.limits.totalLimit) {
      throw new OutOfMemoryException(size, this.limits.totalLimit - this.stats.usedSize);
    }
    
    // Verifier la limite du nombre d'allocations
    if (this.allocationCount >= this.limits.allocationCountLimit) {
      throw new MemoryException(
        `Allocation count limit ${this.limits.allocationCountLimit} exceeded`
      );
    }
    
    // Verifier la limite de la taille totale des allocations
    if (this.totalAllocated + size > this.limits.totalAllocationLimit) {
      throw new MemoryException(
        `Total allocation size limit ${this.limits.totalAllocationLimit} exceeded`
      );
    }
  }
  
  /**
   * Notifier une allocation
   */
  notifyAllocation(size: number): void {
    this.allocationCount++;
    this.totalAllocated += size;
    this.maxAllocationSize = Math.max(this.maxAllocationSize, size);
    this.stats = this.allocator.getStats();
  }
  
  /**
   * Notifier une liberation
   */
  notifyFree(size: number): void {
    this.totalAllocated -= size;
    this.stats = this.allocator.getStats();
  }
  
  /**
   * Obtenir l'etat de la memoire
   */
  getState(): MemoryState {
    const used = this.stats.usedSize;
    const total = this.stats.totalSize;
    const usagePercentage = total > 0 ? used / total : 0;
    
    return {
      totalAvailable: total,
      used,
      free: total - used,
      usagePercentage,
      allocationCount: this.allocationCount,
      averageAllocationSize: this.allocationCount > 0 ? 
        this.totalAllocated / this.allocationCount : 0,
      maxAllocationSize: this.maxAllocationSize,
      isWarning: usagePercentage >= this.limits.warningThreshold,
      isCritical: usagePercentage >= this.limits.criticalThreshold,
    };
  }
  
  /**
   * Verifier si la memoire est en etat d'avertissement
   */
  isWarning(): boolean {
    return this.getState().isWarning;
  }
  
  /**
   * Verifier si la memoire est en etat critique
   */
  isCritical(): boolean {
    return this.getState().isCritical;
  }
  
  /**
   * Obtenir les limites
   */
  getLimits(): MemoryLimits {
    return { ...this.limits };
  }
  
  /**
   * Mettre a jour les limites
   */
  updateLimits(limits: Partial<MemoryLimits>): void {
    this.limits = { ...this.limits, ...limits };
  }
  
  /**
   * Reinitialiser les statistiques
   */
  resetStats(): void {
    this.allocationCount = 0;
    this.totalAllocated = 0;
    this.maxAllocationSize = 0;
    this.stats = this.allocator.getStats();
  }
  
  /**
   * Verifier l'integrite de la memoire
   */
  checkIntegrity(): boolean {
    return this.allocator.checkIntegrity();
  }
  
  /**
   * Defragmenter la memoire
   */
  defragment(): void {
    this.allocator.defragment();
  }
  
  /**
   * Obtenir le pourcentage d'utilisation
   */
  getUsagePercentage(): number {
    return this.getState().usagePercentage;
  }
  
  /**
   * Obtenir la memoire utilisee
   */
  getUsedMemory(): number {
    return this.getState().used;
  }
  
  /**
   * Obtenir la memoire libre
   */
  getFreeMemory(): number {
    return this.getState().free;
  }
  
  /**
   * Obtenir la memoire totale
   */
  getTotalMemory(): number {
    return this.getState().totalAvailable;
  }
  
  /**
   * Verifier si une allocation est possible
   */
  canAllocate(size: number): boolean {
    try {
      this.checkBeforeAllocation(size);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Obtenir la taille maximale possible pour une allocation
   */
  getMaxAllocationSize(): number {
    return Math.min(
      this.limits.allocationLimit,
      this.limits.totalLimit - this.stats.usedSize
    );
  }
}

/**
 * Gestionnaire global des limites de memoire
 */
let globalMemoryLimitManager: MemoryLimitManager | null = null;

/**
 * Obtenir le gestionnaire global des limites de memoire
 */
export function getMemoryLimitManager(limits?: Partial<MemoryLimits>): MemoryLimitManager {
  if (!globalMemoryLimitManager) {
    const allocator = require('./allocator').getAllocator();
    globalMemoryLimitManager = new MemoryLimitManager(allocator, limits);
  }
  return globalMemoryLimitManager;
}

/**
 * Creer un gestionnaire des limites de memoire
 */
export function createMemoryLimitManager(
  allocator: MemoryAllocator,
  limits?: Partial<MemoryLimits>
): MemoryLimitManager {
  return new MemoryLimitManager(allocator, limits);
}

/**
 * Verifier les limites avant une allocation
 */
export function checkMemoryBeforeAllocation(size: number): void {
  getMemoryLimitManager().checkBeforeAllocation(size);
}

/**
 * Notifier une allocation
 */
export function notifyMemoryAllocation(size: number): void {
  getMemoryLimitManager().notifyAllocation(size);
}

/**
 * Notifier une liberation
 */
export function notifyMemoryFree(size: number): void {
  getMemoryLimitManager().notifyFree(size);
}

/**
 * Obtenir l'etat de la memoire
 */
export function getMemoryState(): MemoryState {
  return getMemoryLimitManager().getState();
}

/**
 * Verifier si la memoire est en etat d'avertissement
 */
export function isMemoryWarning(): boolean {
  return getMemoryLimitManager().isWarning();
}

/**
 * Verifier si la memoire est en etat critique
 */
export function isMemoryCritical(): boolean {
  return getMemoryLimitManager().isCritical();
}

/**
 * Obtenir le pourcentage d'utilisation de la memoire
 */
export function getMemoryUsagePercentage(): number {
  return getMemoryLimitManager().getUsagePercentage();
}

/**
 * Obtenir la memoire utilisee
 */
export function getUsedMemory(): number {
  return getMemoryLimitManager().getUsedMemory();
}

/**
 * Obtenir la memoire libre
 */
export function getFreeMemory(): number {
  return getMemoryLimitManager().getFreeMemory();
}

/**
 * Obtenir la memoire totale
 */
export function getTotalMemory(): number {
  return getMemoryLimitManager().getTotalMemory();
}
