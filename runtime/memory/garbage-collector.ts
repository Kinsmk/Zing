/**
 * Garbage Collector - Collecteur de dechets pour Zinga
 * 
 * Ce module implemente un collecteur de dechets (Garbage Collector) pour
 * le runtime Zinga. Il gere automatiquement la liberation de la memoire
 * des objets qui ne sont plus references.
 */

import { MemoryAllocator, getAllocator } from './allocator';
import { MemoryReference, ReferenceType } from './references';

/**
 * Type de collecteur de dechets
 */
export enum GCType {
  // Collecteur de dechets par comptage de references
  ReferenceCounting = 'ReferenceCounting',
  // Collecteur de dechets par marquage et balayage
  MarkAndSweep = 'MarkAndSweep',
  // Collecteur de dechets generationnel
  Generational = 'Generational',
}

/**
 * Etat du collecteur de dechets
 */
export enum GCState {
  Idle = 'Idle',
  Running = 'Running',
  Paused = 'Paused',
}

/**
 * Statistiques du collecteur de dechets
 */
export interface GCStats {
  // Nombre de collections
  collections: number;
  // Nombre d'objets collects
  collectedObjects: number;
  // Memoire liberee
  freedMemory: number;
  // Temps total passe en collection
  totalTime: number;
  // Temps de la derniere collection
  lastTime: number;
  // Nombre d'objets vivants
  liveObjects: number;
  // Nombre d'objets a collecter
  objectsToCollect: number;
}

/**
 * Configuration du collecteur de dechets
 */
export interface GCConfig {
  // Type de collecteur
  type: GCType;
  // Seuil de collection (en octets)
  threshold: number;
  // Intervalle entre les collections (en millisecondes)
  interval: number;
  // Collecteur actif
  enabled: boolean;
  // Collection automatique
  autoCollect: boolean;
  // Seuil de memoire pour la collection automatique
  memoryThreshold: number;
  // Nombre de generations (pour le GC generationnel)
  generations: number;
  // Taille maximale du tas
  maxHeapSize: number;
}

/**
 * Objet gerable par le collecteur de dechets
 */
export interface GCObject {
  // Adresse de l'objet
  address: number;
  // Taille de l'objet
  size: number;
  // Type de l'objet
  type: string;
  // Compteur de references (pour ReferenceCounting)
  refCount?: number;
  // Generation (pour Generational)
  generation?: number;
  // Marque (pour MarkAndSweep)
  marked?: boolean;
  // References vers d'autres objets
  references?: number[];
  // Finaliseur
  finalizer?: () => void;
}

/**
 * Collecteur de dechets
 */
export class GarbageCollector {
  private allocator: MemoryAllocator;
  private config: GCConfig;
  private state: GCState = GCState.Idle;
  private stats: GCStats;
  private objects: Map<number, GCObject> = new Map();
  private roots: Set<number> = new Set();
  private timer?: NodeJS.Timeout;
  private collectionInterval?: NodeJS.Timeout;
  
  constructor(allocator?: MemoryAllocator, config: Partial<GCConfig> = {}) {
    this.allocator = allocator || getAllocator();
    this.config = {
      type: GCType.MarkAndSweep,
      threshold: 1024 * 1024, // 1 MB
      interval: 1000, // 1 seconde
      enabled: true,
      autoCollect: true,
      memoryThreshold: 0.75, // 75%
      generations: 3,
      maxHeapSize: 256 * 1024 * 1024, // 256 MB
      ...config,
    };
    
    this.stats = {
      collections: 0,
      collectedObjects: 0,
      freedMemory: 0,
      totalTime: 0,
      lastTime: 0,
      liveObjects: 0,
      objectsToCollect: 0,
    };
    
    // Demarrer la collection automatique si activee
    if (this.config.autoCollect) {
      this.startAutoCollection();
    }
  }
  
  /**
   * Demarrer la collection automatique
   */
  startAutoCollection(): void {
    if (this.collectionInterval) {
      return;
    }
    
    this.collectionInterval = setInterval(() => {
      if (this.config.enabled && this.state === GCState.Idle) {
        const memoryUsage = this.allocator.getUsedSize() / this.allocator.getTotalSize();
        if (memoryUsage >= this.config.memoryThreshold) {
          this.collect();
        }
      }
    }, this.config.interval);
  }
  
  /**
   * Arreter la collection automatique
   */
  stopAutoCollection(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = undefined;
    }
  }
  
  /**
   * Enregistrer un objet
   */
  registerObject(object: GCObject): void {
    this.objects.set(object.address, object);
    this.stats.liveObjects++;
  }
  
  /**
   * Supprimer un objet
   */
  unregisterObject(address: number): void {
    this.objects.delete(address);
    this.stats.liveObjects--;
  }
  
  /**
   * Enregistrer une racine
   */
  registerRoot(address: number): void {
    this.roots.add(address);
  }
  
  /**
   * Supprimer une racine
   */
  unregisterRoot(address: number): void {
    this.roots.delete(address);
  }
  
  /**
   * Creer un objet avec gestion automatique
   */
  allocate(size: number, type: string = 'object', finalizer?: () => void): GCObject {
    const address = this.allocator.allocate(size);
    
    const object: GCObject = {
      address,
      size,
      type,
      finalizer,
    };
    
    // Ajouter selon le type de GC
    switch (this.config.type) {
      case GCType.ReferenceCounting:
        object.refCount = 0;
        break;
      case GCType.Generational:
        object.generation = 0;
        break;
      case GCType.MarkAndSweep:
        object.marked = false;
        break;
    }
    
    this.registerObject(object);
    
    return object;
  }
  
  /**
   * Liberer un objet
   */
  free(object: GCObject): void {
    // Appeler le finaliseur
    if (object.finalizer) {
      object.finalizer();
    }
    
    // Liberer la memoire
    this.allocator.free(object.address);
    
    // Supprimer de la liste des objets
    this.unregisterObject(object.address);
  }
  
  /**
   * Augmenter le compteur de references
   */
  incrementRefCount(address: number): void {
    if (this.config.type !== GCType.ReferenceCounting) {
      return;
    }
    
    const object = this.objects.get(address);
    if (object) {
      object.refCount = (object.refCount || 0) + 1;
    }
  }
  
  /**
   * Diminuer le compteur de references
   */
  decrementRefCount(address: number): void {
    if (this.config.type !== GCType.ReferenceCounting) {
      return;
    }
    
    const object = this.objects.get(address);
    if (object && object.refCount !== undefined) {
      object.refCount--;
      
      if (object.refCount <= 0) {
        this.free(object);
      }
    }
  }
  
  /**
   * Ajouter une reference
   */
  addReference(from: number, to: number): void {
    const fromObject = this.objects.get(from);
    const toObject = this.objects.get(to);
    
    if (!fromObject || !toObject) {
      return;
    }
    
    if (!fromObject.references) {
      fromObject.references = [];
    }
    
    fromObject.references.push(to);
    
    // Pour le comptage de references
    if (this.config.type === GCType.ReferenceCounting) {
      this.incrementRefCount(to);
    }
  }
  
  /**
   * Supprimer une reference
   */
  removeReference(from: number, to: number): void {
    const fromObject = this.objects.get(from);
    
    if (!fromObject || !fromObject.references) {
      return;
    }
    
    const index = fromObject.references.indexOf(to);
    if (index !== -1) {
      fromObject.references.splice(index, 1);
    }
    
    // Pour le comptage de references
    if (this.config.type === GCType.ReferenceCounting) {
      this.decrementRefCount(to);
    }
  }
  
  /**
   * Executer une collection
   */
  collect(): GCStats {
    if (this.state !== GCState.Idle) {
      return this.stats;
    }
    
    this.state = GCState.Running;
    const startTime = Date.now();
    
    try {
      switch (this.config.type) {
        case GCType.ReferenceCounting:
          this.collectReferenceCounting();
          break;
        case GCType.MarkAndSweep:
          this.collectMarkAndSweep();
          break;
        case GCType.Generational:
          this.collectGenerational();
          break;
      }
    } finally {
      this.state = GCState.Idle;
    }
    
    const endTime = Date.now();
    this.stats.lastTime = endTime - startTime;
    this.stats.totalTime += this.stats.lastTime;
    
    return this.stats;
  }
  
  /**
   * Collection par comptage de references
   */
  private collectReferenceCounting(): void {
    // Le comptage de references est gere automatiquement
    // lors de l'incrementation et de la decrementation des compteurs
    // Cette methode peut etre utilisee pour nettoyer les objets cycliques
  }
  
  /**
   * Collection par marquage et balayage
   */
  private collectMarkAndSweep(): void {
    // Phase 1: Marquage
    this.markPhase();
    
    // Phase 2: Balayage
    this.sweepPhase();
  }
  
  /**
   * Phase de marquage
   */
  private markPhase(): void {
    // Marquer toutes les racines
    for (const root of this.roots) {
      this.mark(root);
    }
  }
  
  /**
   * Marquer un objet et ses references
   */
  private mark(address: number): void {
    const object = this.objects.get(address);
    
    if (!object || object.marked) {
      return;
    }
    
    object.marked = true;
    
    // Marquer les references
    if (object.references) {
      for (const ref of object.references) {
        this.mark(ref);
      }
    }
  }
  
  /**
   * Phase de balayage
   */
  private sweepPhase(): void {
    const toCollect: number[] = [];
    
    // Trouver les objets non marques
    for (const [address, object] of this.objects) {
      if (!object.marked) {
        toCollect.push(address);
      } else {
        // Reinitialiser le marquage
        object.marked = false;
      }
    }
    
    // Collecter les objets
    this.stats.objectsToCollect = toCollect.length;
    
    for (const address of toCollect) {
      const object = this.objects.get(address);
      if (object) {
        this.free(object);
        this.stats.collectedObjects++;
        this.stats.freedMemory += object.size;
      }
    }
    
    this.stats.collections++;
  }
  
  /**
   * Collection generationnelle
   */
  private collectGenerational(): void {
    // Implémentation simplifiée
    // Une collection generationnelle complete necessiterait
    // de gerer plusieurs generations de maniere independante
    
    // Collecter la generation la plus jeune
    this.collectGeneration(0);
  }
  
  /**
   * Collecter une generation specifique
   */
  private collectGeneration(generation: number): void {
    // Implémentation simplifiée
    // Marquer et balayer les objets de cette generation
    
    const toCollect: number[] = [];
    
    for (const [address, object] of this.objects) {
      if (object.generation === generation) {
        toCollect.push(address);
      }
    }
    
    for (const address of toCollect) {
      const object = this.objects.get(address);
      if (object) {
        // Promouvoir les objets survivants
        if (object.generation! < this.config.generations - 1) {
          object.generation!++;
        } else {
          this.free(object);
          this.stats.collectedObjects++;
          this.stats.freedMemory += object.size;
        }
      }
    }
    
    this.stats.collections++;
  }
  
  /**
   * Forcer une collection
   */
  forceCollect(): GCStats {
    return this.collect();
  }
  
  /**
   * Obtenir les statistiques
   */
  getStats(): GCStats {
    return { ...this.stats };
  }
  
  /**
   * Reinitialiser les statistiques
   */
  resetStats(): void {
    this.stats.collections = 0;
    this.stats.collectedObjects = 0;
    this.stats.freedMemory = 0;
    this.stats.totalTime = 0;
    this.stats.lastTime = 0;
  }
  
  /**
   * Obtenir l'etat
   */
  getState(): GCState {
    return this.state;
  }
  
  /**
   * Obtenir la configuration
   */
  getConfig(): GCConfig {
    return { ...this.config };
  }
  
  /**
   * Mettre a jour la configuration
   */
  updateConfig(config: Partial<GCConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Reconfigurer la collection automatique
    this.stopAutoCollection();
    if (this.config.autoCollect) {
      this.startAutoCollection();
    }
  }
  
  /**
   * Activer le collecteur
   */
  enable(): void {
    this.config.enabled = true;
  }
  
  /**
   * Desactiver le collecteur
   */
  disable(): void {
    this.config.enabled = false;
  }
  
  /**
   * Verifier si le collecteur est actif
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }
  
  /**
   * Reinitialiser le collecteur
   */
  reset(): void {
    this.objects.clear();
    this.roots.clear();
    this.stats.liveObjects = 0;
    this.resetStats();
  }
  
  /**
   * Obtenir le nombre d'objets geres
   */
  getObjectCount(): number {
    return this.objects.size;
  }
  
  /**
   * Obtenir le nombre de racines
   */
  getRootCount(): number {
    return this.roots.size;
  }
}

/**
 * Collecteur de dechets global
 */
let globalGC: GarbageCollector | null = null;

/**
 * Obtenir le collecteur de dechets global
 */
export function getGarbageCollector(config?: Partial<GCConfig>): GarbageCollector {
  if (!globalGC) {
    globalGC = new GarbageCollector(undefined, config);
  }
  return globalGC;
}

/**
 * Creer un nouveau collecteur de dechets
 */
export function createGarbageCollector(
  allocator?: MemoryAllocator,
  config?: Partial<GCConfig>
): GarbageCollector {
  return new GarbageCollector(allocator, config);
}

/**
 * Executer une collection de dechets
 */
export function collectGarbage(): GCStats {
  return getGarbageCollector().collect();
}

/**
 * Forcer une collection de dechets
 */
export function forceGarbageCollection(): GCStats {
  return getGarbageCollector().forceCollect();
}

/**
 * Obtenir les statistiques du collecteur de dechets
 */
export function getGCStats(): GCStats {
  return getGarbageCollector().getStats();
}

/**
 * Allouer un objet avec gestion automatique
 */
export function gcAllocate(size: number, type?: string, finalizer?: () => void): GCObject {
  return getGarbageCollector().allocate(size, type, finalizer);
}

/**
 * Liberer un objet
 */
export function gcFree(object: GCObject): void {
  getGarbageCollector().free(object);
}
