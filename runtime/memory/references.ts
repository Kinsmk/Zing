/**
 * References - Gestion des references pour Zinga
 * 
 * Ce module definit les different types de references utilisees par
 * le systeme de gestion de memoire de Zinga.
 */

import { GCObject } from './garbage-collector';

/**
 * Type de reference
 */
export enum ReferenceType {
  // Reference forte (empêche la collection)
  Strong = 'Strong',
  // Reference faible (n'empêche pas la collection)
  Weak = 'Weak',
  // Reference fantôme (pour la notification de collection)
  Phantom = 'Phantom',
  // Reference soft (collection si memoire faible)
  Soft = 'Soft',
}

/**
 * Reference de base
 */
export abstract class MemoryReference<T = any> {
  protected address: number;
  protected type: ReferenceType;
  protected target?: T;
  
  constructor(address: number, type: ReferenceType) {
    this.address = address;
    this.type = type;
  }
  
  /**
   * Obtenir l'adresse
   */
  getAddress(): number {
    return this.address;
  }
  
  /**
   * Obtenir le type
   */
  getType(): ReferenceType {
    return this.type;
  }
  
  /**
   * Obtenir la cible
   */
  get(): T | undefined {
    return this.target;
  }
  
  /**
   * Verifier si la reference est valide
   */
  abstract isValid(): boolean;
  
  /**
   * Liberer la reference
   */
  abstract release(): void;
  
  /**
   * Convertir en chaine
   */
  toString(): string {
    return `${this.type}Reference(${this.address})`;
  }
}

/**
 * Reference forte
 */
export class StrongReference<T = any> extends MemoryReference<T> {
  private gcObject?: GCObject;
  
  constructor(address: number, target?: T, gcObject?: GCObject) {
    super(address, ReferenceType.Strong);
    this.target = target;
    this.gcObject = gcObject;
  }
  
  /**
   * Verifier si la reference est valide
   */
  isValid(): boolean {
    return this.target !== undefined;
  }
  
  /**
   * Liberer la reference
   */
  release(): void {
    this.target = undefined;
    if (this.gcObject) {
      // Pour une reference forte, on ne libère pas l'objet
      // car il peut y avoir d'autres references
    }
  }
  
  /**
   * Mettre a jour la cible
   */
  setTarget(target: T, gcObject?: GCObject): void {
    this.target = target;
    this.gcObject = gcObject;
  }
}

/**
 * Reference faible
 */
export class WeakReference<T = any> extends MemoryReference<T> {
  private finalizer?: () => void;
  
  constructor(address: number, target?: T, finalizer?: () => void) {
    super(address, ReferenceType.Weak);
    this.target = target;
    this.finalizer = finalizer;
  }
  
  /**
   * Verifier si la reference est valide
   */
  isValid(): boolean {
    return this.target !== undefined;
  }
  
  /**
   * Liberer la reference
   */
  release(): void {
    if (this.finalizer) {
      this.finalizer();
    }
    this.target = undefined;
  }
  
  /**
   * Mettre a jour la cible
   */
  setTarget(target: T, finalizer?: () => void): void {
    this.target = target;
    this.finalizer = finalizer;
  }
}

/**
 * Reference fantôme
 */
export class PhantomReference<T = any> extends MemoryReference<T> {
  private callback?: (address: number) => void;
  
  constructor(address: number, callback?: (address: number) => void) {
    super(address, ReferenceType.Phantom);
    this.callback = callback;
  }
  
  /**
   * Verifier si la reference est valide
   * Une reference fantôme est toujours "invalide" car elle ne retient pas l'objet
   */
  isValid(): boolean {
    return false;
  }
  
  /**
   * Liberer la reference
   */
  release(): void {
    if (this.callback) {
      this.callback(this.address);
    }
  }
  
  /**
   * Notifier que l'objet a ete collecte
   */
  notifyCollected(): void {
    if (this.callback) {
      this.callback(this.address);
    }
  }
}

/**
 * Reference soft
 */
export class SoftReference<T = any> extends MemoryReference<T> {
  private timestamp: number;
  
  constructor(address: number, target?: T) {
    super(address, ReferenceType.Soft);
    this.target = target;
    this.timestamp = Date.now();
  }
  
  /**
   * Verifier si la reference est valide
   */
  isValid(): boolean {
    return this.target !== undefined;
  }
  
  /**
   * Liberer la reference
   */
  release(): void {
    this.target = undefined;
  }
  
  /**
   * Obtenir le timestamp
   */
  getTimestamp(): number {
    return this.timestamp;
  }
  
  /**
   * Mettre a jour le timestamp
   */
  updateTimestamp(): void {
    this.timestamp = Date.now();
  }
}

/**
 * Gestionnaire de references
 */
export class ReferenceManager {
  private references: Map<number, MemoryReference[]> = new Map();
  
  /**
   * Ajouter une reference
   */
  addReference(ref: MemoryReference): void {
    const address = ref.getAddress();
    
    if (!this.references.has(address)) {
      this.references.set(address, []);
    }
    
    this.references.get(address)!.push(ref);
  }
  
  /**
   * Supprimer une reference
   */
  removeReference(ref: MemoryReference): void {
    const address = ref.getAddress();
    const refs = this.references.get(address);
    
    if (refs) {
      const index = refs.indexOf(ref);
      if (index !== -1) {
        refs.splice(index, 1);
      }
      
      if (refs.length === 0) {
        this.references.delete(address);
      }
    }
  }
  
  /**
   * Obtenir les references pour une adresse
   */
  getReferences(address: number): MemoryReference[] {
    return this.references.get(address) || [];
  }
  
  /**
   * Verifier si une adresse a des references
   */
  hasReferences(address: number): boolean {
    return this.references.has(address) && 
           this.references.get(address)!.length > 0;
  }
  
  /**
   * Obtenir le nombre de references pour une adresse
   */
  getReferenceCount(address: number): number {
    return this.references.get(address)?.length || 0;
  }
  
  /**
   * Obtenir le nombre total de references
   */
  getTotalReferenceCount(): number {
    let count = 0;
    for (const refs of this.references.values()) {
      count += refs.length;
    }
    return count;
  }
  
  /**
   * Liberer toutes les references pour une adresse
   */
  releaseAll(address: number): void {
    const refs = this.references.get(address);
    
    if (refs) {
      for (const ref of refs) {
        ref.release();
      }
      this.references.delete(address);
    }
  }
  
  /**
   * Liberer toutes les references
   */
  releaseAllReferences(): void {
    for (const refs of this.references.values()) {
      for (const ref of refs) {
        ref.release();
      }
    }
    this.references.clear();
  }
  
  /**
   * Reinitialiser
   */
  clear(): void {
    this.references.clear();
  }
}

/**
 * Fabrique de references
 */
export class ReferenceFactory {
  private manager: ReferenceManager;
  
  constructor(manager?: ReferenceManager) {
    this.manager = manager || new ReferenceManager();
  }
  
  /**
   * Creer une reference forte
   */
  createStrong<T>(address: number, target?: T, gcObject?: GCObject): StrongReference<T> {
    const ref = new StrongReference(address, target, gcObject);
    this.manager.addReference(ref);
    return ref;
  }
  
  /**
   * Creer une reference faible
   */
  createWeak<T>(address: number, target?: T, finalizer?: () => void): WeakReference<T> {
    const ref = new WeakReference(address, target, finalizer);
    this.manager.addReference(ref);
    return ref;
  }
  
  /**
   * Creer une reference fantôme
   */
  createPhantom(address: number, callback?: (address: number) => void): PhantomReference {
    const ref = new PhantomReference(address, callback);
    this.manager.addReference(ref);
    return ref;
  }
  
  /**
   * Creer une reference soft
   */
  createSoft<T>(address: number, target?: T): SoftReference<T> {
    const ref = new SoftReference(address, target);
    this.manager.addReference(ref);
    return ref;
  }
  
  /**
   * Obtenir le gestionnaire de references
   */
  getManager(): ReferenceManager {
    return this.manager;
  }
}

/**
 * Gestionnaire global de references
 */
let globalReferenceManager: ReferenceManager | null = null;

/**
 * Obtenir le gestionnaire global de references
 */
export function getReferenceManager(): ReferenceManager {
  if (!globalReferenceManager) {
    globalReferenceManager = new ReferenceManager();
  }
  return globalReferenceManager;
}

/**
 * Creer une reference forte
 */
export function createStrongReference<T>(
  address: number,
  target?: T,
  gcObject?: GCObject
): StrongReference<T> {
  return new ReferenceFactory().createStrong(address, target, gcObject);
}

/**
 * Creer une reference faible
 */
export function createWeakReference<T>(
  address: number,
  target?: T,
  finalizer?: () => void
): WeakReference<T> {
  return new ReferenceFactory().createWeak(address, target, finalizer);
}

/**
 * Creer une reference fantôme
 */
export function createPhantomReference(
  address: number,
  callback?: (address: number) => void
): PhantomReference {
  return new ReferenceFactory().createPhantom(address, callback);
}

/**
 * Creer une reference soft
 */
export function createSoftReference<T>(
  address: number,
  target?: T
): SoftReference<T> {
  return new ReferenceFactory().createSoft(address, target);
}
